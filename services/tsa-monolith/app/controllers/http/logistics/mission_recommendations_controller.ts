import type { HttpContext } from '@adonisjs/core/http'
import AIService from '#services/ai_service'
import Mission, { MissionStatus } from '#models/mission'
import { UserRole } from '#models/user'

export default class MissionRecommendationsController {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  /**
   * Get personalized mission recommendations for a transporter
   * GET /api/transporteur/mission-recommendations
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Verify user is a transporter
      if (user.role !== UserRole.TRANSPORTEUR) {
        return response.status(403).json({
          success: false,
          message: 'Only transporters can access mission recommendations',
        })
      }

      const { limit = 10, method = 'rule_based' } = request.qs()

      // Charger les véhicules du transporteur
      await user.load('vehicles')
      const vehicles = user.vehicles || []

      // 🔍 PROFIL MINIMAL : L'inférence se fait côté Python
      // On envoie juste l'ID et les véhicules, le reste est inféré depuis l'historique
      const aiTransporterProfile = {
        transporter_id: user.id,
        // Données véhicules (physiques, non inférables)
        vehicles: vehicles.map((v) => ({
          type: v.type,
          capacite: v.capacite,
        })),
        // Le reste sera inféré automatiquement côté Python depuis l'historique :
        // - preferred_merchandise_types (depuis taux de succès)
        // - known_cities (depuis routes fréquentes)
        // - max_distance (depuis diversité routes)
        // - experience_years (depuis nombre missions)
        // - reputation_score (depuis ratings)
      }

      // Log pour monitoring
      console.log(
        `[RECOMMENDATIONS] Transporter ${user.id}: ${vehicles.length} vehicle(s), profile will be inferred from history`
      )

      // Get available missions (published and not assigned)
      const availableMissions = await Mission.query()
        .where('status', MissionStatus.PUBLISHED)
        .whereNull('transporteurId')
        .preload('adresseDepart')
        .preload('adresseArrivee')
        .limit(100)

      if (availableMissions.length === 0) {
        return response.json({
          success: true,
          message: 'No available missions at the moment',
          data: {
            missions: [],
            strategy: 'no_missions_available',
            total: 0,
            transporter_profile: aiTransporterProfile,
          },
        })
      }

      // Format missions for AI avec vraies données
      const formattedMissions = availableMissions.map((m) => {
        const departCity = m.adresseDepart?.city || 'Douala'
        const arrivalCity = m.adresseArrivee?.city || 'Yaoundé'
        
        // Calculer budget - gérer les Decimal PostgreSQL et null
        const budgetMin = m.budgetMin ? Number(m.budgetMin) : 0
        const budgetMax = m.budgetMax ? Number(m.budgetMax) : 0
        const budget = budgetMin > 0 || budgetMax > 0 ? (budgetMin + budgetMax) / 2 : 100000 // Défaut 100k FCFA
        
        // Convertir weight en nombre
        const weight = m.poids ? Number(m.poids) : 0

        return {
          mission_id: m.id,
          weight: weight,
          budget: budget,
          delay_days: this._calculateDelayDays(m.dateDepartEstime?.toJSDate() || null, m.dateArriveePrevue?.toJSDate() || null),
          depart_city: departCity,
          arrival_city: arrivalCity,
          merchandise_type: this._normalizeMerchandiseType(m.typeMarchandise),
          description: m.description || '',
          urgency_level: this._calculateUrgency(m.dateDepartEstime?.toJSDate() || null),
        }
      })

      // Get recommendations from AI service
      const aiResponse = await this.aiService.getMissionRecommendations({
        transporterProfile: aiTransporterProfile,
        availableMissions: formattedMissions,
        method: method as 'rule_based' | 'ml_based' | 'both',
        maxRecommendations: Number(limit),
      })

      // Fallback: if AI fails or returns no recommendations
      if (!aiResponse.recommendations || aiResponse.recommendations.length === 0) {
        const fallbackMissions = availableMissions
          .sort((a, b) => (b.budgetMax || 0) - (a.budgetMax || 0))
          .slice(0, Number(limit))

        return response.json({
          success: true,
          message: 'Mission recommendations retrieved (fallback to highest budget)',
          data: {
            missions: fallbackMissions.map((m) => m.serialize()),
            strategy: 'fallback_highest_budget',
            total: fallbackMissions.length,
          },
        })
      }

      // Extract mission IDs from AI response
      const missionIds = aiResponse.recommendations.map((r) => r.mission_id)

      // Fetch full mission details
      const missions = await Mission.query().whereIn('id', missionIds)

      // Sort missions according to AI scores
      const sortedMissions = missionIds
        .map((id) => missions.find((m) => m.id === id))
        .filter((m) => m !== undefined)

      // Enrich with AI scores and reasons
      const enrichedMissions = sortedMissions.map((mission) => {
        const aiRec = aiResponse.recommendations.find((r) => r.mission_id === mission!.id)
        return {
          ...mission!.serialize(),
          affinity_score: aiRec?.affinity_score || 0,
          confidence: aiRec?.confidence || 0,
          reasons: aiRec?.reasons || [],
          estimated_profit: aiRec?.estimated_profit || 0,
          estimated_cost: aiRec?.estimated_cost || 0,
          profit_margin: aiRec?.profit_margin || 0,
        }
      })

      return response.json({
        success: true,
        message: 'Personalized mission recommendations retrieved successfully',
        data: {
          missions: enrichedMissions,
          strategy: aiResponse.strategy_used || 'rule_based',
          total: enrichedMissions.length,
          transporter_stats: aiResponse.transporter_stats || {},
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve mission recommendations',
        errors: [error.message],
      })
    }
  }

  /**
   * Get transporter profile for recommendations
   * GET /api/transporteur/mission-recommendations/profile
   */
  async profile({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (user.role !== UserRole.TRANSPORTEUR) {
        return response.status(403).json({
          success: false,
          message: 'Only transporters can access this endpoint',
        })
      }

      // Charger le profil et véhicules
      await user.load('transporterProfile')
      await user.load('vehicles')

      const transporterProfile = user.transporterProfile
      const vehicles = user.vehicles || []

      if (!transporterProfile) {
        return response.status(404).json({
          success: false,
          message: 'Transporter profile not found',
          action_required: 'complete_profile',
        })
      }

      // Calculer les stats
      const stats = await this._getTransporterStats(user.id)

      // Construire le profil AI
      const aiProfile = {
        transporter_id: user.id,
        max_weight: transporterProfile.maxWeight || this._getMaxWeightFromVehicles(vehicles),
        max_distance: transporterProfile.maxDistance || 1000,
        min_budget: transporterProfile.minBudget || 50000,
        experience_years: stats.experience_years,
        reputation_score: stats.reputation_score,
        preferred_merchandise_types: transporterProfile.preferredMerchandiseTypes || [],
        known_cities: transporterProfile.knownCities || [],
        preferred_delay_days: transporterProfile.preferredDelayDays || 7,
        vehicle_type: this._getPrimaryVehicleType(vehicles),
      }

      // Validation du profil
      const validation = this._validateTransporterProfile(aiProfile)

      return response.json({
        success: true,
        message: 'Transporter profile retrieved successfully',
        data: {
          profile: aiProfile,
          stats: stats,
          vehicles: vehicles.map((v) => ({
            id: v.id,
            type: v.type,
            capacity: v.capacite,
            registration: v.immatriculation,
          })),
          validation: validation,
          ready_for_recommendations: validation.is_valid,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve transporter profile',
        errors: [error.message],
      })
    }
  }

  /**
   * Get missions similar to a specific mission
   * GET /api/transporteur/mission-recommendations/similar/:id
   */
  async similar({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (user.role !== UserRole.TRANSPORTEUR) {
        return response.status(403).json({
          success: false,
          message: 'Only transporters can access mission recommendations',
        })
      }

      const { limit = 10 } = request.qs()
      const missionId = params.id

      // Verify mission exists
      const baseMission = await Mission.findOrFail(missionId)

      // Get similar missions (same merchandise type)
      const similarMissions = await Mission.query()
        .whereNull('transporteurId')
        .whereNot('id', missionId)
        .where('status', MissionStatus.PUBLISHED)
        .where('typeMarchandise', baseMission.typeMarchandise || '')
        .limit(Number(limit))

      if (similarMissions.length === 0) {
        return response.json({
          success: true,
          message: 'No similar missions found',
          data: {
            base_mission: baseMission.serialize(),
            missions: [],
            strategy: 'no_similar_missions',
            total: 0,
          },
        })
      }

      return response.json({
        success: true,
        message: 'Similar missions retrieved successfully',
        data: {
          base_mission: baseMission.serialize(),
          missions: similarMissions.map((m) => m.serialize()),
          strategy: 'similar_merchandise_type',
          total: similarMissions.length,
        },
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: 'Mission not found or failed to retrieve similar missions',
        errors: [error.message],
      })
    }
  }

  /**
   * Récupère les statistiques du transporteur depuis l'historique
   */
  private async _getTransporterStats(transporterId: string) {
    try {
      // Récupérer les missions complétées
      const completedMissions = await Mission.query()
        .where('transporteurId', transporterId)
        .whereIn('status', [MissionStatus.COMPLETED, MissionStatus.DELIVERED])

      const totalMissions = completedMissions.length

      // Calculer années d'expérience (depuis première mission ou inscription)
      let experienceYears = 1 // Minimum 1 an
      if (totalMissions > 0) {
        const oldestMission = completedMissions.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        )[0]
        const yearsSinceFirst =
          (Date.now() - oldestMission.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365)
        experienceYears = Math.max(1, Math.ceil(yearsSinceFirst))
      }

      // Calculer score de réputation basé sur performance
      let reputationScore = 70 // Score de base

      if (totalMissions >= 50) {
        reputationScore = 90
      } else if (totalMissions >= 20) {
        reputationScore = 85
      } else if (totalMissions >= 10) {
        reputationScore = 80
      } else if (totalMissions >= 5) {
        reputationScore = 75
      }

      // Ajuster selon taux de succès
      const successRate = totalMissions > 0 ? completedMissions.length / totalMissions : 1
      reputationScore = Math.round(reputationScore * successRate)

      return {
        experience_years: experienceYears,
        reputation_score: Math.max(50, Math.min(100, reputationScore)),
        total_missions: totalMissions,
        success_rate: successRate,
      }
    } catch (error) {
      console.error('[STATS ERROR]', error)
      // Valeurs par défaut en cas d'erreur
      return {
        experience_years: 1,
        reputation_score: 70,
        total_missions: 0,
        success_rate: 1.0,
      }
    }
  }

  /**
   * Obtient la capacité maximale depuis les véhicules
   */
  private _getMaxWeightFromVehicles(vehicles: any[]): number {
    if (vehicles.length === 0) return 5000 // Défaut 5 tonnes

    const maxCapacity = Math.max(...vehicles.map((v) => v.capacite || 5000))
    return maxCapacity
  }

  /**
   * Obtient le type de véhicule principal
   */
  private _getPrimaryVehicleType(vehicles: any[]): string {
    if (vehicles.length === 0) return 'Camion'

    // Prendre le véhicule avec la plus grande capacité
    const primaryVehicle = vehicles.sort((a, b) => (b.capacite || 0) - (a.capacite || 0))[0]

    return primaryVehicle?.type || 'Camion'
  }

  /**
   * Calcule le délai en jours entre deux dates
   */
  private _calculateDelayDays(dateDepart: Date | null, dateArrivee: Date | null): number {
    if (!dateDepart || !dateArrivee) return 7 // Défaut 7 jours

    const diffMs = dateArrivee.getTime() - dateDepart.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    return Math.max(1, diffDays)
  }

  /**
   * Normalise le type de marchandise pour l'IA
   */
  private _normalizeMerchandiseType(type: string | null): string {
    if (!type) return 'Général'

    const typeMap: Record<string, string> = {
      electronique: 'Électronique',
      alimentaire: 'Alimentaire',
      textile: 'Textile',
      construction: 'Construction',
      pharmaceutique: 'Pharmaceutique',
      mobilier: 'Mobilier',
      automobile: 'Automobile',
      agricole: 'Agricole',
    }

    const normalized = type.toLowerCase().trim()
    return typeMap[normalized] || type
  }

  /**
   * Calcule le niveau d'urgence basé sur la date de départ
   */
  private _calculateUrgency(dateDepart: Date | null): number {
    if (!dateDepart) return 2 // Urgence moyenne

    const now = new Date()
    const diffMs = dateDepart.getTime() - now.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays < 1) return 5 // Très urgent
    if (diffDays < 3) return 4 // Urgent
    if (diffDays < 7) return 3 // Moyennement urgent
    if (diffDays < 14) return 2 // Normal
    return 1 // Pas urgent
  }

  /**
   * Valide le profil du transporteur pour les recommandations
   */
  private _validateTransporterProfile(profile: any) {
    const errors: string[] = []
    const warnings: string[] = []

    if (!profile.max_weight || profile.max_weight < 100) {
      errors.push('max_weight must be at least 100 kg')
    }

    if (!profile.max_distance || profile.max_distance < 50) {
      errors.push('max_distance must be at least 50 km')
    }

    if (!profile.min_budget || profile.min_budget < 0) {
      errors.push('min_budget must be positive')
    }

    if (profile.experience_years < 1) {
      warnings.push('Low experience may affect recommendation quality')
    }

    if (profile.reputation_score < 60) {
      warnings.push('Low reputation score may limit available missions')
    }

    if (!profile.preferred_merchandise_types || profile.preferred_merchandise_types.length === 0) {
      warnings.push('No preferred merchandise types - recommendations will be generic')
    }

    if (!profile.known_cities || profile.known_cities.length === 0) {
      warnings.push('No known cities - route familiarity bonus will not apply')
    }

    if (!profile.vehicle_type) {
      errors.push('vehicle_type is required')
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      completeness: this._calculateProfileCompleteness(profile),
    }
  }

  /**
   * Calcule le taux de complétude du profil
   */
  private _calculateProfileCompleteness(profile: any): number {
    let score = 0
    const maxScore = 10

    if (profile.max_weight > 0) score++
    if (profile.max_distance > 0) score++
    if (profile.min_budget >= 0) score++
    if (profile.experience_years > 0) score++
    if (profile.reputation_score > 0) score++
    if (profile.preferred_merchandise_types?.length > 0) score++
    if (profile.known_cities?.length > 0) score++
    if (profile.preferred_delay_days > 0) score++
    if (profile.vehicle_type) score++
    if (profile.preferred_merchandise_types?.length >= 3) score++ // Bonus

    return Math.round((score / maxScore) * 100)
  }
}

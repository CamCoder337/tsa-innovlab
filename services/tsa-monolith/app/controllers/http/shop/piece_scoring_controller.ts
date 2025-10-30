import type { HttpContext } from '@adonisjs/core/http'
import AIService from '#services/ai_service'
import Product from '#models/product'

export default class PieceScoringController {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }

  /**
   * Score a single piece/product
   * POST /api/shop/pieces/score
   */
  async score({ request, response }: HttpContext) {
    try {
      const {
        productId,
        productName: providedProductName,
        pieceAgeMonths,
        estimatedLifetimeMonths,
        supplierRating,
        supplierYearsExperience,
        averageCustomerRating,
        numberOfReviews,
        physicalConditionScore,
        price: providedPrice,
        categoryCode,
        brandReputationScore,
      } = request.body()

      // Validation: Au moins productId OU (productName + price) requis
      if (!productId && (!providedProductName || providedPrice === undefined)) {
        return response.status(400).json({
          success: false,
          message:
            'Either productId OR (productName + price) is required for scoring',
          errors: [
            'Provide productId to score an existing product, or provide productName and price for a new product',
          ],
        })
      }

      // Récupération des données produit (simple validation)
      let product = null
      let productName = providedProductName || 'Unknown Product'
      let productPrice = providedPrice || 0
      let productCategoryId = null

      if (productId) {
        try {
          product = await Product.query()
            .where('id', productId)
            .preload('category')
            .first()

          if (product) {
            productName = product.name
            productPrice = providedPrice !== undefined ? providedPrice : product.price
            productCategoryId = product.categoryId

            console.log(`[SCORING] Product found: ${product.name} (${productId})`)
          } else {
            return response.status(404).json({
              success: false,
              message: 'Product not found',
              errors: [`No product found with ID: ${productId}`],
            })
          }
        } catch (error) {
          return response.status(500).json({
            success: false,
            message: 'Error fetching product',
            errors: [error.message],
          })
        }
      }

      // Validation des valeurs numériques
      const validatedData = this._validateScoringData({
        pieceAgeMonths,
        estimatedLifetimeMonths,
        supplierRating,
        supplierYearsExperience,
        averageCustomerRating,
        numberOfReviews,
        physicalConditionScore,
        price: productPrice,
        categoryCode,
        brandReputationScore,
      })

      // Déterminer le code catégorie
      const finalCategoryCode = this._getCategoryCode(
        categoryCode,
        productCategoryId,
        product?.category?.name
      )

      // Get score from AI service
      console.log('[SCORING] Calling AI service with data:', {
        piece_id: productId || `TEMP_${Date.now()}`,
        piece_name: productName,
        category_code: finalCategoryCode,
      })

      const aiResponse = await this.aiService.scorePiece({
        pieceInfo: {
          piece_id: productId || `TEMP_${Date.now()}`,
          piece_name: productName,
          piece_age_months: validatedData.pieceAgeMonths,
          estimated_lifetime_months: validatedData.estimatedLifetimeMonths,
          supplier_rating: validatedData.supplierRating,
          supplier_years_experience: validatedData.supplierYearsExperience,
          average_customer_rating: validatedData.averageCustomerRating,
          number_of_reviews: validatedData.numberOfReviews,
          physical_condition_score: validatedData.physicalConditionScore,
          price: validatedData.price,
          category_code: finalCategoryCode,
          brand_reputation_score: validatedData.brandReputationScore,
        },
        method: 'rule_based', // Use rule-based for production reliability
      })

      console.log('[SCORING] AI service response:', aiResponse)

      // Check if we have a valid score result
      if (!aiResponse.score_result) {
        console.error('[SCORING] AI service failed - no score_result:', aiResponse)
        return response.status(500).json({
          success: false,
          message: 'AI service failed to score piece',
          errors: ['The AI scoring service returned an invalid response'],
        })
      }

      // Extract score details
      const scoreResult = aiResponse.score_result

      // Log pour monitoring
      console.log(
        `[SCORING] ${productName}: ${scoreResult.final_score}/100 (${scoreResult.category})`
      )

      return response.json({
        success: true,
        message: 'Piece scored successfully',
        data: {
          product_id: productId || null,
          product_name: productName,
          final_score: scoreResult.final_score,
          category: scoreResult.category,
          details: scoreResult.details,
          method: scoreResult.method,
          recommendations: this._getRecommendationsFromScore(scoreResult),
          metadata: {
            has_product_data: !!product,
            category_code: finalCategoryCode,
            processing_time_ms: aiResponse.processing_time_ms,
          },
        },
      })
    } catch (error) {
      console.error('[SCORING ERROR]', error)
      console.error('[SCORING ERROR STACK]', error.stack)
      return response.status(500).json({
        success: false,
        message: 'Failed to score piece',
        errors: [error.message || 'Unknown error occurred'],
      })
    }
  }

  /**
   * Valide et normalise les données de scoring
   */
  private _validateScoringData(data: any) {
    return {
      pieceAgeMonths: this._validateNumber(data.pieceAgeMonths, 0, 0, 600),
      estimatedLifetimeMonths: this._validateNumber(data.estimatedLifetimeMonths, 120, 12, 600),
      supplierRating: this._validateNumber(data.supplierRating, 3.5, 0, 5),
      supplierYearsExperience: this._validateNumber(data.supplierYearsExperience, 3, 0, 50),
      averageCustomerRating: this._validateNumber(data.averageCustomerRating, 3.5, 0, 5),
      numberOfReviews: this._validateNumber(data.numberOfReviews, 0, 0, 10000),
      physicalConditionScore: this._validateNumber(data.physicalConditionScore, 80, 0, 100),
      price: this._validateNumber(data.price, 0, 0, 100000000),
      brandReputationScore: this._validateNumber(data.brandReputationScore, 70, 0, 100),
    }
  }

  /**
   * Valide un nombre avec min/max et valeur par défaut
   */
  private _validateNumber(
    value: any,
    defaultValue: number,
    min: number,
    max: number
  ): number {
    const num = parseFloat(value)
    if (isNaN(num)) return defaultValue
    return Math.max(min, Math.min(max, num))
  }

  /**
   * Détermine le code catégorie basé sur les données disponibles
   */
  private _getCategoryCode(
    providedCode: number | undefined,
    categoryId: string | null,
    categoryName: string | undefined
  ): number {
    // Si code fourni et valide, l'utiliser
    if (providedCode !== undefined && providedCode >= 1 && providedCode <= 8) {
      return providedCode
    }

    // Sinon, mapper depuis le nom de catégorie
    if (categoryName) {
      const categoryMap: Record<string, number> = {
        'Fournitures de Bureau': 1,
        'Mobilier': 2,
        'Équipements Industriels': 3,
        'Électronique': 4,
        'Véhicules et Transport': 5,
        'Construction': 6,
        'Alimentaire': 7,
        'Textile': 8,
      }

      for (const [name, code] of Object.entries(categoryMap)) {
        if (categoryName.toLowerCase().includes(name.toLowerCase())) {
          return code
        }
      }
    }

    // Valeur par défaut
    return 1
  }

  /**
   * Score multiple pieces in batch
   * POST /api/shop/pieces/score/batch
   */
  async scoreBatch({ request, response }: HttpContext) {
    try {
      const { pieces } = request.body()

      if (!Array.isArray(pieces) || pieces.length === 0) {
        return response.status(400).json({
          success: false,
          message: 'Pieces array is required and must not be empty',
        })
      }

      if (pieces.length > 100) {
        return response.status(400).json({
          success: false,
          message: 'Maximum 100 pieces per batch',
        })
      }

      // Get scores from AI service
      const aiResponse = await this.aiService.scorePieceBatch({
        pieces: pieces.map((p) => ({
          piece_id: p.productId,
          piece_name: p.productName || 'Unknown',
          piece_age_months: p.pieceAgeMonths || 0,
          estimated_lifetime_months: p.estimatedLifetimeMonths || 120,
          supplier_rating: p.supplierRating || 3.0,
          supplier_years_experience: p.supplierYearsExperience || 1,
          average_customer_rating: p.averageCustomerRating || 3.0,
          number_of_reviews: p.numberOfReviews || 0,
          physical_condition_score: p.physicalConditionScore || 70.0,
          price: p.price || 0,
          category_code: p.categoryCode || 1,
          brand_reputation_score: p.brandReputationScore || 70.0,
        })),
        method: 'rule_based',
      })

      if (!aiResponse.success) {
        return response.status(500).json({
          success: false,
          message: 'Failed to score pieces',
        })
      }

      return response.json({
        success: true,
        message: 'Pieces scored successfully',
        data: {
          results: aiResponse.results,
          total_pieces: aiResponse.total_pieces,
          processing_time_ms: aiResponse.processing_time_ms,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to score pieces',
        errors: [error.message],
      })
    }
  }

  /**
   * Get score categories and thresholds
   * GET /api/shop/pieces/score/categories
   */
  async categories({ response }: HttpContext) {
    try {
      const aiResponse = await this.aiService.getPieceScoringCategories()

      return response.json({
        success: true,
        message: 'Score categories retrieved successfully',
        data: aiResponse,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        errors: [error.message],
      })
    }
  }

  /**
   * Get scoring methods information
   * GET /api/shop/pieces/score/methods
   */
  async methods({ response }: HttpContext) {
    try {
      const aiResponse = await this.aiService.getPieceScoringMethods()

      return response.json({
        success: true,
        message: 'Scoring methods retrieved successfully',
        data: aiResponse,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to retrieve methods',
        errors: [error.message],
      })
    }
  }

  /**
   * Validate scoring data without actually scoring
   * POST /api/shop/pieces/score/validate
   */
  async validate({ request, response }: HttpContext) {
    try {
      const {
        productId,
        productName,
        pieceAgeMonths,
        estimatedLifetimeMonths,
        supplierRating,
        supplierYearsExperience,
        averageCustomerRating,
        numberOfReviews,
        physicalConditionScore,
        price,
        categoryCode,
        brandReputationScore,
      } = request.body()

      const errors: string[] = []
      const warnings: string[] = []

      // Validation productId OU (productName + price)
      if (!productId && (!productName || price === undefined)) {
        errors.push('Either productId OR (productName + price) is required')
      }

      // Vérifier si le produit existe
      let productExists = false
      if (productId) {
        const product = await Product.find(productId)
        productExists = !!product
        if (!productExists) {
          errors.push(`Product with ID ${productId} not found`)
        }
      }

      // Validation des ranges
      if (pieceAgeMonths !== undefined) {
        if (pieceAgeMonths < 0 || pieceAgeMonths > 600) {
          errors.push('pieceAgeMonths must be between 0 and 600')
        }
      }

      if (estimatedLifetimeMonths !== undefined) {
        if (estimatedLifetimeMonths < 12 || estimatedLifetimeMonths > 600) {
          errors.push('estimatedLifetimeMonths must be between 12 and 600')
        }
        if (pieceAgeMonths && pieceAgeMonths > estimatedLifetimeMonths) {
          errors.push('pieceAgeMonths cannot exceed estimatedLifetimeMonths')
        }
      }

      if (supplierRating !== undefined) {
        if (supplierRating < 0 || supplierRating > 5) {
          errors.push('supplierRating must be between 0 and 5')
        }
        if (supplierRating < 2.5) {
          warnings.push('Low supplier rating may result in poor score')
        }
      }

      if (supplierYearsExperience !== undefined) {
        if (supplierYearsExperience < 0 || supplierYearsExperience > 50) {
          errors.push('supplierYearsExperience must be between 0 and 50')
        }
        if (supplierYearsExperience < 1) {
          warnings.push('New supplier - score may be affected')
        }
      }

      if (averageCustomerRating !== undefined) {
        if (averageCustomerRating < 0 || averageCustomerRating > 5) {
          errors.push('averageCustomerRating must be between 0 and 5')
        }
      }

      if (numberOfReviews !== undefined) {
        if (numberOfReviews < 0) {
          errors.push('numberOfReviews must be >= 0')
        }
        if (numberOfReviews === 0) {
          warnings.push('No reviews - neutral score will be applied')
        }
      }

      if (physicalConditionScore !== undefined) {
        if (physicalConditionScore < 0 || physicalConditionScore > 100) {
          errors.push('physicalConditionScore must be between 0 and 100')
        }
        if (physicalConditionScore < 50) {
          warnings.push('Poor physical condition will significantly impact score')
        }
      }

      if (price !== undefined) {
        if (price < 0) {
          errors.push('price must be >= 0')
        }
      }

      if (categoryCode !== undefined) {
        if (categoryCode < 1 || categoryCode > 8) {
          errors.push('categoryCode must be between 1 and 8')
        }
      }

      if (brandReputationScore !== undefined) {
        if (brandReputationScore < 0 || brandReputationScore > 100) {
          errors.push('brandReputationScore must be between 0 and 100')
        }
      }

      const isValid = errors.length === 0

      return response.json({
        success: true,
        message: isValid ? 'Data is valid for scoring' : 'Validation failed',
        data: {
          valid: isValid,
          errors,
          warnings,
          product_exists: productExists,
          ready_to_score: isValid,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Validation failed',
        errors: [error.message],
      })
    }
  }

  /**
   * Get recommendations based on score
   */
  private _getRecommendationsFromScore(scoreResult: any): string[] {
    const recommendations: string[] = []
    const category = scoreResult.category

    if (category === 'excellent') {
      recommendations.push('✅ Pièce de très haute qualité')
      recommendations.push('💎 Recommandée pour usage intensif')
      recommendations.push('🛡️ Garantie étendue recommandée')
    } else if (category === 'bon') {
      recommendations.push('✅ Bonne qualité générale')
      recommendations.push('👍 Convient pour usage régulier')
      recommendations.push('🔧 Entretien standard recommandé')
    } else if (category === 'moyen') {
      recommendations.push('⚠️ Qualité acceptable')
      recommendations.push('🔍 Inspection recommandée avant achat')
      recommendations.push('📅 Garantie standard conseillée')
    } else {
      recommendations.push('❌ Qualité limitée')
      recommendations.push('⚠️ Usage occasionnel uniquement')
      recommendations.push('🔧 Entretien fréquent nécessaire')
    }

    // Recommendations based on details
    if (scoreResult.details) {
      if (scoreResult.details.age_score < 50) {
        recommendations.push('⏰ Pièce âgée - durée de vie limitée')
      }
      if (scoreResult.details.supplier_score < 60) {
        recommendations.push('🏪 Fournisseur peu expérimenté')
      }
      if (scoreResult.details.condition_score < 70) {
        recommendations.push('🔧 État physique à vérifier')
      }
    }

    return recommendations.slice(0, 5) // Max 5 recommendations
  }
}

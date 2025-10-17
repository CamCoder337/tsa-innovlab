import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, ThumbsUp, Award } from 'lucide-react';
import type { Mission } from '@/types/mission.types';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface MissionAppreciationProps {
  mission: Mission;
  onUpdate?: () => void;
}

interface AppreciationData {
  // Critères détaillés de notation
  ponctualite: number; // Livraison à l'heure, retards, respect des ETA
  fiabilite: number; // Est-ce qu'on peut compter sur lui ? Annulations, disponibilité, réactivité
  qualiteService: number; // Professionnalisme, État des colis, communication, preuves de livraison
  gestionIncidents: number; // Comment réagit-il aux problèmes ? Signalement proactif, résolution rapide

  // Note générale (calculée automatiquement)
  rating: number;
  comment: string;
  wouldRecommend: boolean;
}

export const MissionAppreciation: React.FC<MissionAppreciationProps> = ({ mission, onUpdate }) => {
  const { user } = useAuth();
  const [appreciation, setAppreciation] = useState<AppreciationData>({
    ponctualite: 0,
    fiabilite: 0,
    qualiteService: 0,
    gestionIncidents: 0,
    rating: 0,
    comment: '',
    wouldRecommend: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcul automatique de la note générale
  const calculateOverallRating = (
    ponctualite: number,
    fiabilite: number,
    qualiteService: number,
    gestionIncidents: number
  ) => {
    const ratings = [ponctualite, fiabilite, qualiteService, gestionIncidents].filter((r) => r > 0);
    return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  };

  const handleCriteriaRating = (
    criteria: keyof Pick<
      AppreciationData,
      'ponctualite' | 'fiabilite' | 'qualiteService' | 'gestionIncidents'
    >,
    rating: number
  ) => {
    setAppreciation((prev) => {
      const updated = { ...prev, [criteria]: rating };
      updated.rating = calculateOverallRating(
        updated.ponctualite,
        updated.fiabilite,
        updated.qualiteService,
        updated.gestionIncidents
      );
      return updated;
    });
  };

  const handleSubmitAppreciation = async () => {
    // Validation: au moins un critère doit être noté
    const hasRatings =
      appreciation.ponctualite > 0 ||
      appreciation.fiabilite > 0 ||
      appreciation.qualiteService > 0 ||
      appreciation.gestionIncidents > 0;

    if (!hasRatings) {
      toast.error('Veuillez noter au moins un critère avant de soumettre');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit appreciation with detailed criteria
      // await missionService.submitAppreciation(mission.id, {
      //   ponctualite: appreciation.ponctualite,
      //   fiabilite: appreciation.fiabilite,
      //   qualiteService: appreciation.qualiteService,
      //   gestionIncidents: appreciation.gestionIncidents,
      //   rating: appreciation.rating,
      //   comment: appreciation.comment,
      //   wouldRecommend: appreciation.wouldRecommend
      // });

      toast.success('Appréciation détaillée soumise avec succès');
      onUpdate?.();
    } catch {
      toast.error("Erreur lors de la soumission de l'appréciation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitAppreciation = () => {
    return user?.role === 'affreteur' || user?.role === 'admin';
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" />
            Métriques de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {mission.status === 'completed' ? '✓' : '⏳'}
              </div>
              <p className="text-sm text-gray-600 mt-1">Statut</p>
              <p className="font-medium capitalize">{mission.status}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {mission.dateFinReelle ? '100%' : '0%'}
              </div>
              <p className="text-sm text-gray-600 mt-1">Progression</p>
              <p className="font-medium">{mission.dateFinReelle ? 'Terminée' : 'En cours'}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">N/A</div>
              <p className="text-sm text-gray-600 mt-1">Note Moyenne</p>
              <p className="font-medium">Pas encore évaluée</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Résumé de la Mission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Transporteur</p>
              <p className="font-medium">
                {mission.transporteur?.fullName ||
                  `${mission.transporteur?.firstName} ${mission.transporteur?.lastName}` ||
                  'Non assigné'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durée</p>
              <p className="font-medium">
                {mission.dateFinReelle && mission.dateDebutReelle
                  ? `${Math.ceil((new Date(mission.dateFinReelle).getTime() - new Date(mission.dateDebutReelle).getTime()) / (1000 * 60 * 60 * 24))} jours`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-medium">{mission.budgetMax?.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="font-medium">N/A km</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appreciation Form */}
      {canSubmitAppreciation() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Évaluer cette Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Critères de notation détaillés */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Évaluation détaillée du transporteur
                </h3>
                <p className="text-sm text-gray-600 mt-1">Notez chaque critère de 1 à 5 étoiles</p>
              </div>

              {/* Ponctualité */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-blue-900">Ponctualité</h4>
                    <p className="text-sm text-blue-700">
                      Livraison à l'heure, respect des ETA, gestion des retards
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCriteriaRating('ponctualite', star)}
                        className={`p-1 rounded transition-colors ${
                          star <= appreciation.ponctualite
                            ? 'text-yellow-400 hover:text-yellow-500'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                {appreciation.ponctualite > 0 && (
                  <p className="text-xs text-blue-600 text-right">
                    {appreciation.ponctualite === 1 && 'Toujours en retard'}
                    {appreciation.ponctualite === 2 && 'Souvent en retard'}
                    {appreciation.ponctualite === 3 && 'Parfois en retard'}
                    {appreciation.ponctualite === 4 && 'Généralement ponctuel'}
                    {appreciation.ponctualite === 5 && 'Toujours ponctuel'}
                  </p>
                )}
              </div>

              {/* Fiabilité */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-green-900">Fiabilité</h4>
                    <p className="text-sm text-green-700">
                      Disponibilité, réactivité, respect des engagements
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCriteriaRating('fiabilite', star)}
                        className={`p-1 rounded transition-colors ${
                          star <= appreciation.fiabilite
                            ? 'text-yellow-400 hover:text-yellow-500'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                {appreciation.fiabilite > 0 && (
                  <p className="text-xs text-green-600 text-right">
                    {appreciation.fiabilite === 1 && 'Peu fiable'}
                    {appreciation.fiabilite === 2 && 'Parfois fiable'}
                    {appreciation.fiabilite === 3 && 'Moyennement fiable'}
                    {appreciation.fiabilite === 4 && 'Très fiable'}
                    {appreciation.fiabilite === 5 && 'Totalement fiable'}
                  </p>
                )}
              </div>

              {/* Qualité de service */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-purple-900">Qualité de service</h4>
                    <p className="text-sm text-purple-700">
                      Professionnalisme, état des colis, communication, preuves de livraison
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCriteriaRating('qualiteService', star)}
                        className={`p-1 rounded transition-colors ${
                          star <= appreciation.qualiteService
                            ? 'text-yellow-400 hover:text-yellow-500'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                {appreciation.qualiteService > 0 && (
                  <p className="text-xs text-purple-600 text-right">
                    {appreciation.qualiteService === 1 && 'Service décevant'}
                    {appreciation.qualiteService === 2 && 'Service insuffisant'}
                    {appreciation.qualiteService === 3 && 'Service correct'}
                    {appreciation.qualiteService === 4 && 'Bon service'}
                    {appreciation.qualiteService === 5 && 'Service excellent'}
                  </p>
                )}
              </div>

              {/* Gestion des incidents */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-orange-900">Gestion des incidents</h4>
                    <p className="text-sm text-orange-700">
                      Réaction aux problèmes, signalement proactif, résolution rapide
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCriteriaRating('gestionIncidents', star)}
                        className={`p-1 rounded transition-colors ${
                          star <= appreciation.gestionIncidents
                            ? 'text-yellow-400 hover:text-yellow-500'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                {appreciation.gestionIncidents > 0 && (
                  <p className="text-xs text-orange-600 text-right">
                    {appreciation.gestionIncidents === 1 && 'Gestion défaillante'}
                    {appreciation.gestionIncidents === 2 && 'Gestion lente'}
                    {appreciation.gestionIncidents === 3 && 'Gestion correcte'}
                    {appreciation.gestionIncidents === 4 && 'Bonne gestion'}
                    {appreciation.gestionIncidents === 5 && 'Gestion exemplaire'}
                  </p>
                )}
              </div>

              {/* Note générale calculée */}
              {appreciation.rating > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Note générale</h4>
                      <p className="text-sm text-gray-600">
                        Calculée automatiquement à partir de vos évaluations
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 ${
                              star <= appreciation.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {appreciation.rating}/5
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2">Commentaire</label>
              <Textarea
                placeholder="Partagez votre expérience avec ce transporteur..."
                value={appreciation.comment}
                onChange={(e) => setAppreciation((prev) => ({ ...prev, comment: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Recommendation */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={appreciation.wouldRecommend}
                  onChange={(e) =>
                    setAppreciation((prev) => ({ ...prev, wouldRecommend: e.target.checked }))
                  }
                  className="rounded"
                />
                <span className="text-sm">Je recommande ce transporteur</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitAppreciation}
              disabled={
                isSubmitting ||
                (appreciation.ponctualite === 0 &&
                  appreciation.fiabilite === 0 &&
                  appreciation.qualiteService === 0 &&
                  appreciation.gestionIncidents === 0)
              }
              className="w-full"
            >
              {isSubmitting ? 'Soumission...' : "Soumettre l'évaluation détaillée"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Appreciations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Appréciations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: Load and display existing appreciations */}
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune appréciation pour le moment</p>
            <p className="text-sm">Les appréciations apparaîtront ici une fois soumises</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, ThumbsUp, Award, Loader2, AlertTriangle } from 'lucide-react';
import type { Mission, MissionFeedback } from '@/types/mission.types';
import { useAuth } from '@/hooks/useAuth';
import { missionService } from '@/services/mission.service';
import { toast } from 'sonner';
import {
  useMissionsTranslation,
  useCommonTranslation,
  useErrorsTranslation,
  useFormsTranslation,
} from '@/hooks/useTranslation';
import { useUserSearch } from '@/hooks/useUserSearch';

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
  const { getUserName } = useUserSearch();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tCommon } = useCommonTranslation();
  const { t: tErrors } = useErrorsTranslation();
  const { t: tForms } = useFormsTranslation();
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
  const [existingFeedback, setExistingFeedback] = useState<MissionFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [transporteurName, setTransporteurName] = useState<string>('');
  const [affreteurName, setAffreteurName] = useState<string>('');

  useEffect(() => {
    const fetchExistingFeedback = async () => {
      setIsLoadingFeedback(true);
      setFeedbackError(null);

      try {
        const response = await missionService.getMissionFeedback(mission.id);

        if (response.error) {
          setFeedbackError(tErrors('missions.evaluationLoadingError'));
          return;
        }

        if (response.data) {
          setExistingFeedback(response.data);
          // Pre-fill form with existing feedback if available
          if (response.data && response.data.rating) {
            setAppreciation((prev) => ({
              ...prev,
              rating: response.data?.rating || 0,
              comment: response.data?.description || '',
            }));
          }
        }
      } catch {
        setFeedbackError(tErrors('missions.evaluationLoadingError'));
      } finally {
        setIsLoadingFeedback(false);
      }
    };

    fetchExistingFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id]);

  // Fetch user names
  useEffect(() => {
    const fetchUserNames = async () => {
      if (mission.transporteurId) {
        const name = await getUserName(mission.transporteurId);
        setTransporteurName(name);
      }
      if (mission.affreteurId) {
        const name = await getUserName(mission.affreteurId);
        setAffreteurName(name);
      }
    };

    fetchUserNames();
  }, [mission.transporteurId, mission.affreteurId, getUserName]);

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
      toast.error(tForms('validation.ratingRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit appreciation using mission service
      const feedbackData = {
        rating: appreciation.rating,
        description: appreciation.comment,
      };

      const response = await missionService.createMissionFeedback(mission.id, feedbackData);

      if (response.error) {
        toast.error(response.error.message || tErrors('missions.evaluationSubmitError'));
      }

      if (response.data) {
        toast.success(tMissions('appreciation.success.submitted'));
        setExistingFeedback(response.data);
        onUpdate?.();
      }
    } catch {
      toast.error(tErrors('missions.evaluationSubmitError'));
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
            {tMissions('appreciation.performanceMetrics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {mission.status === 'completed' ? '✓' : '⏳'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {tCommon('status.title')}
              </p>
              <p className="font-medium capitalize">{tCommon(`status.${mission.status}`)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-tsa-blue dark:text-tsa-white">
                {mission.dateArriveePrevue ? '100%' : '0%'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {tMissions('tracking.progress')}
              </p>
              <p className="font-medium">
                {mission.dateArriveePrevue
                  ? tCommon('status.completed')
                  : tCommon('status.in_progress')}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">N/A</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {tMissions('appreciation.averageRating')}
              </p>
              <p className="font-medium">{tMissions('appreciation.notYetRated')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {tMissions('missionSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {tCommon('roles.transporteur')}
              </p>
              <p className="font-medium">
                {transporteurName ||
                  mission.transporteur?.fullName ||
                  `${mission.transporteur?.firstName} ${mission.transporteur?.lastName}` ||
                  tCommon('status.notAssigned')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {tCommon('roles.affreteur')}
              </p>
              <p className="font-medium">
                {affreteurName ||
                  mission.affreteur?.fullName ||
                  `${mission.affreteur?.firstName} ${mission.affreteur?.lastName}` ||
                  tCommon('status.notAssigned')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{tMissions('duration')}</p>
              <p className="font-medium">
                {mission.dateArriveePrevue && mission.dateDepartEstime
                  ? `${Math.ceil((new Date(mission.dateArriveePrevue).getTime() - new Date(mission.dateDepartEstime).getTime()) / (1000 * 60 * 60 * 24))} jours`
                  : tCommon('status.notAvailable')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{tMissions('budget')}</p>
              <p className="font-medium">{mission.budgetMax?.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{tMissions('distance')}</p>
              <p className="font-medium">{tCommon('status.notAvailable')}</p>
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
              {tMissions('appreciation.evaluateThisMission')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Critères de notation détaillés */}
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tMissions('appreciation.detailedEvaluation')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {tMissions('appreciation.rateEachCriteria')}
                </p>
              </div>

              {/* Ponctualité */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {tMissions('appreciation.criteria.punctuality.title')}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {tMissions('appreciation.criteria.punctuality.description')}
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
                  <p className="text-xs text-tsa-blue dark:text-tsa-white text-right">
                    {appreciation.ponctualite === 1 &&
                      tMissions('appreciation.criteria.punctuality.ratings.1')}
                    {appreciation.ponctualite === 2 &&
                      tMissions('appreciation.criteria.punctuality.ratings.2')}
                    {appreciation.ponctualite === 3 &&
                      tMissions('appreciation.criteria.punctuality.ratings.3')}
                    {appreciation.ponctualite === 4 &&
                      tMissions('appreciation.criteria.punctuality.ratings.4')}
                    {appreciation.ponctualite === 5 &&
                      tMissions('appreciation.criteria.punctuality.ratings.5')}
                  </p>
                )}
              </div>

              {/* Fiabilité */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-green-900">
                      {tMissions('appreciation.criteria.reliability.title')}
                    </h4>
                    <p className="text-sm text-green-700">
                      {tMissions('appreciation.criteria.reliability.description')}
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
                    {appreciation.fiabilite === 1 &&
                      tMissions('appreciation.criteria.reliability.ratings.1')}
                    {appreciation.fiabilite === 2 &&
                      tMissions('appreciation.criteria.reliability.ratings.2')}
                    {appreciation.fiabilite === 3 &&
                      tMissions('appreciation.criteria.reliability.ratings.3')}
                    {appreciation.fiabilite === 4 &&
                      tMissions('appreciation.criteria.reliability.ratings.4')}
                    {appreciation.fiabilite === 5 &&
                      tMissions('appreciation.criteria.reliability.ratings.5')}
                  </p>
                )}
              </div>

              {/* Qualité de service */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-purple-900">
                      {tMissions('appreciation.criteria.serviceQuality.title')}
                    </h4>
                    <p className="text-sm text-purple-700">
                      {tMissions('appreciation.criteria.serviceQuality.description')}
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
                    {appreciation.qualiteService === 1 &&
                      tMissions('appreciation.criteria.serviceQuality.ratings.1')}
                    {appreciation.qualiteService === 2 &&
                      tMissions('appreciation.criteria.serviceQuality.ratings.2')}
                    {appreciation.qualiteService === 3 &&
                      tMissions('appreciation.criteria.serviceQuality.ratings.3')}
                    {appreciation.qualiteService === 4 &&
                      tMissions('appreciation.criteria.serviceQuality.ratings.4')}
                    {appreciation.qualiteService === 5 &&
                      tMissions('appreciation.criteria.serviceQuality.ratings.5')}
                  </p>
                )}
              </div>

              {/* Gestion des incidents */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-orange-900">
                      {tMissions('appreciation.criteria.incidentManagement.title')}
                    </h4>
                    <p className="text-sm text-orange-700">
                      {tMissions('appreciation.criteria.incidentManagement.description')}
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
                    {appreciation.gestionIncidents === 1 &&
                      tMissions('appreciation.criteria.incidentManagement.ratings.1')}
                    {appreciation.gestionIncidents === 2 &&
                      tMissions('appreciation.criteria.incidentManagement.ratings.2')}
                    {appreciation.gestionIncidents === 3 &&
                      tMissions('appreciation.criteria.incidentManagement.ratings.3')}
                    {appreciation.gestionIncidents === 4 &&
                      tMissions('appreciation.criteria.incidentManagement.ratings.4')}
                    {appreciation.gestionIncidents === 5 &&
                      tMissions('appreciation.criteria.incidentManagement.ratings.5')}
                  </p>
                )}
              </div>

              {/* Note générale calculée */}
              {appreciation.rating > 0 && (
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg border dark:border-gray-800-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {tMissions('appreciation.overallRating')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tMissions('appreciation.calculatedAutomatically')}
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
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {appreciation.rating}/5
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {tMissions('appreciation.comments')}
              </label>
              <Textarea
                placeholder={tMissions('appreciation.commentsPlaceholder')}
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
                <span className="text-sm">{tMissions('appreciation.recommendTransporter')}</span>
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
              {isSubmitting ? tCommon('submitting') : tMissions('appreciation.submitEvaluation')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Appreciations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {tMissions('appreciation.title2')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFeedback ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">{tMissions('appreciation.loading')}</span>
            </div>
          ) : feedbackError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-muted-foreground">{feedbackError}</p>
            </div>
          ) : existingFeedback ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{tMissions('appreciation.success.submitted')}</h4>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (existingFeedback.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-medium">{existingFeedback.rating}/5</span>
                  </div>
                </div>
                {existingFeedback.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {existingFeedback.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tMissions('appreciation.submittedOn')}{' '}
                  {new Date(existingFeedback.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tMissions('appreciation.noAppreciations')}</p>
              <p className="text-sm">{tMissions('appreciation.appreciationsWillAppear')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

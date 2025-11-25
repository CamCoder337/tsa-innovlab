import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, MapPin, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import missionTrackingService, { type MissionIssue } from '@/services/mission-tracking.service';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MissionIssuesListProps {
  missionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
}

const issueTypeLabels = {
  breakdown: 'Panne',
  delay: 'Retard',
  accident: 'Accident',
  traffic: 'Embouteillage',
  other: 'Autre',
};

const issueStatusLabels = {
  reported: 'Signalé',
  acknowledged: 'Reconnu',
  resolved: 'Résolu',
};

const issueStatusColors = {
  reported: 'destructive',
  acknowledged: 'default',
  resolved: 'secondary',
} as const;

const issueStatusIcons = {
  reported: AlertCircle,
  acknowledged: Clock,
  resolved: CheckCircle2,
};

export default function MissionIssuesList({
  missionId,
  autoRefresh = true,
  refreshInterval = 30000,
}: MissionIssuesListProps) {
  const [issues, setIssues] = useState<MissionIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchIssues = async () => {
    try {
      const response = await missionTrackingService.getIssues(missionId);
      setIssues(response.issues);
    } catch (error: any) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();

    if (autoRefresh) {
      const interval = setInterval(fetchIssues, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [missionId, autoRefresh, refreshInterval]);

  const handleAcknowledge = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      await missionTrackingService.acknowledgeIssue(missionId, issueId);
      toast.success('Problème reconnu');
      await fetchIssues();
    } catch (error: any) {
      toast.error('Erreur lors de la reconnaissance du problème', {
        description: error.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      await missionTrackingService.resolveIssue(missionId, issueId);
      toast.success('Problème résolu');
      await fetchIssues();
    } catch (error: any) {
      toast.error('Erreur lors de la résolution du problème', {
        description: error.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Problèmes Signalés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Problèmes Signalés</CardTitle>
          <CardDescription>Aucun problème signalé pour cette mission</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Tout se passe bien ! Aucun incident n'a été signalé pour le moment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Problèmes Signalés ({issues.length})</span>
          <Badge variant="destructive" className="font-normal">
            {issues.filter((i) => i.status === 'reported').length} non traités
          </Badge>
        </CardTitle>
        <CardDescription>Incidents signalés par le chauffeur</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.map((issue) => {
            const StatusIcon = issueStatusIcons[issue.status];

            return (
              <div key={issue.id} className="rounded-lg border p-4 space-y-3">
                {/* En-tête */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={issueStatusColors[issue.status]}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {issueStatusLabels[issue.status]}
                      </Badge>
                      <Badge variant="outline">{issueTypeLabels[issue.type]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Signalé {formatDistanceToNow(new Date(issue.createdAt), { locale: fr, addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {issue.status === 'reported' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(issue.id)}
                        disabled={actionLoading === issue.id}
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Reconnaître
                      </Button>
                    )}
                    {issue.status === 'acknowledged' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleResolve(issue.id)}
                        disabled={actionLoading === issue.id}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Marquer résolu
                      </Button>
                    )}
                    {issue.status === 'resolved' && issue.resolvedAt && (
                      <p className="text-xs text-muted-foreground">
                        Résolu {formatDistanceToNow(new Date(issue.resolvedAt), { locale: fr, addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm">{issue.description}</p>

                  {/* Position GPS */}
                  {issue.latitude && issue.longitude && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        Position : {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Voir sur la carte
                      </a>
                    </div>
                  )}

                  {/* Photos */}
                  {issue.photos && issue.photos.length > 0 && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {issue.photos.length} photo{issue.photos.length > 1 ? 's' : ''} jointe
                        {issue.photos.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

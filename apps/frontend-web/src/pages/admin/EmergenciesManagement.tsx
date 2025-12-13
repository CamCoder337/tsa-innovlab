import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  User,
  CheckCircle,
  PlayCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  emergencyService,
  type Emergency,
  type EmergencyStats,
  type EmergencyStatus,
  type EmergencyPriority,
} from '@/services/emergency.service';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const PRIORITY_CONFIG: Record<EmergencyPriority, { label: string; color: string; bgColor: string }> = {
  1: { label: 'CRITIQUE', color: 'text-red-700', bgColor: 'bg-red-100' },
  2: { label: 'HAUTE', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  3: { label: 'NORMALE', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

const STATUS_CONFIG: Record<EmergencyStatus, { label: string; color: string; bgColor: string }> = {
  reported: { label: 'Signalé', color: 'text-red-700', bgColor: 'bg-red-100' },
  acknowledged: { label: 'Pris en charge', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  in_progress: { label: 'En cours', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  resolved: { label: 'Résolu', color: 'text-green-700', bgColor: 'bg-green-100' },
};

const TYPE_ICONS: Record<string, string> = {
  accident: '💥',
  medical: '🏥',
  security: '🚨',
  breakdown: '⚙️',
  delay: '⏰',
  traffic: '🚗',
  other: '❓',
};

export default function EmergenciesManagement() {
  const navigate = useNavigate();
  
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [emergenciesRes, statsRes] = await Promise.all([
        emergencyService.getEmergencies({ status: filter, limit: 50 }),
        emergencyService.getEmergencyStats(),
      ]);

      if (emergenciesRes.data) {
        setEmergencies(emergenciesRes.data.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      toast.error('Impossible de charger les urgences');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcknowledge = async (emergency: Emergency) => {
    setActionLoading(true);
    try {
      const result = await emergencyService.acknowledgeEmergency(emergency.id);
      if (result.data) {
        toast.success('Urgence prise en charge - Le transporteur a été notifié');
        fetchData();
      } else {
        throw new Error(result.error?.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Impossible de prendre en charge');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkInProgress = async (emergency: Emergency) => {
    setActionLoading(true);
    try {
      const result = await emergencyService.markInProgress(emergency.id);
      if (result.data) {
        toast.success('Urgence marquée comme en cours de traitement');
        fetchData();
      } else {
        throw new Error(result.error?.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Impossible de mettre à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedEmergency) return;
    
    setActionLoading(true);
    try {
      const result = await emergencyService.resolveEmergency(
        selectedEmergency.id,
        resolutionNotes
      );
      if (result.data) {
        toast.success('Urgence résolue - Toutes les parties ont été notifiées');
        setResolveDialogOpen(false);
        setSelectedEmergency(null);
        setResolutionNotes('');
        fetchData();
      } else {
        throw new Error(result.error?.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Impossible de résoudre');
    } finally {
      setActionLoading(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold">Urgences SOS</h1>
            <p className="text-muted-foreground">Gestion des alertes d'urgence</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className={stats.active > 0 ? 'border-red-500 border-2' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Urgences Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.active > 0 ? 'text-red-600' : ''}`}>
                {stats.active}
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.critical > 0 ? 'border-red-500' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.critical > 0 ? 'text-red-600' : ''}`}>
                {stats.critical}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Haute Priorité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Résolues Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.resolvedToday}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Temps Réponse Moy.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgResponseTimeMinutes} min</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Actives
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Toutes
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Signalé</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emergencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {loading ? 'Chargement...' : 'Aucune urgence'}
                  </TableCell>
                </TableRow>
              ) : (
                emergencies.map((emergency) => (
                  <TableRow
                    key={emergency.id}
                    className={emergency.priority === 1 ? 'bg-red-50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{TYPE_ICONS[emergency.type] || '❓'}</span>
                        <span className="capitalize">{emergency.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${PRIORITY_CONFIG[emergency.priority].bgColor} ${PRIORITY_CONFIG[emergency.priority].color}`}
                      >
                        {PRIORITY_CONFIG[emergency.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{emergency.mission?.title || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {emergency.missionId.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      {emergency.reportedBy ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {emergency.reportedBy.firstName} {emergency.reportedBy.lastName}
                            </div>
                            {emergency.reportedBy.phone && (
                              <a
                                href={`tel:${emergency.reportedBy.phone}`}
                                className="text-sm text-blue-600 flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {emergency.reportedBy.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${STATUS_CONFIG[emergency.status].bgColor} ${STATUS_CONFIG[emergency.status].color}`}
                      >
                        {STATUS_CONFIG[emergency.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(emergency.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* Localisation */}
                        {emergency.latitude && emergency.longitude && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGoogleMaps(emergency.latitude!, emergency.longitude!)}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Chat */}
                        {emergency.emergencyConversationId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/app/chat?conversation=${emergency.emergencyConversationId}`)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Actions selon statut */}
                        {emergency.status === 'reported' && (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledge(emergency)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Prendre en charge
                          </Button>
                        )}
                        
                        {emergency.status === 'acknowledged' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleMarkInProgress(emergency)}
                            disabled={actionLoading}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            En cours
                          </Button>
                        )}
                        
                        {['acknowledged', 'in_progress'].includes(emergency.status) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedEmergency(emergency);
                              setResolveDialogOpen(true);
                            }}
                            disabled={actionLoading}
                          >
                            Résoudre
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre l'urgence</DialogTitle>
            <DialogDescription>
              Ajoutez des notes sur la résolution de cette urgence.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Notes de résolution (optionnel)..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleResolve}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'En cours...' : 'Confirmer la résolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

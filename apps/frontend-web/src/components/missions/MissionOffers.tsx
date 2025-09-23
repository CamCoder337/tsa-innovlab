import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
// import { missionService } from '@/services/mission.service';
import { DollarSign, Clock, Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import type { Mission } from '@/types/mission.types';

interface Offer {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  message?: string;
  estimatedDeliveryDate: string;
  transporteur: {
    id: string;
    name: string;
    rating: number;
    completedMissions: number;
  };
  createdAt: string;
  updatedAt: string;
  counterOffer?: {
    amount: number;
    message?: string;
  };
}

interface MissionOffersProps {
  mission: Mission;
  userRole?: string;
  onRefresh: () => void;
}

export function MissionOffers({ mission, userRole, onRefresh }: MissionOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<'accept' | 'reject' | 'counter' | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [message, setMessage] = useState('');

  // Fetch offers for the mission
  const fetchOffers = async () => {
    try {
      // TODO: Replace with actual API call to fetch offers
      // const response = await missionService.getMissionOffers(mission.id);
      // setOffers(response.data);

      // Mock data for now
      setOffers([
        {
          id: '1',
          amount: 120000,
          status: 'pending',
          message: 'Je peux effectuer cette mission dans les délais impartis.',
          estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          transporteur: {
            id: 't1',
            name: 'Transport Express',
            rating: 4.5,
            completedMissions: 42,
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        // Add more mock offers as needed
      ]);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [mission.id]);

  const handleAction = (offer: Offer, actionType: 'accept' | 'reject' | 'counter') => {
    setSelectedOffer(offer);
    setAction(actionType);
    setCounterAmount(offer.amount.toString());
    setMessage('');
    setIsDialogOpen(true);
  };

  const submitAction = async () => {
    if (!selectedOffer) return;

    try {
      if (action === 'accept') {
        // TODO: Implement accept offer
        // await missionService.acceptOffer(mission.id, selectedOffer.id, { message });
        toast.success('Offer accepted successfully');
      } else if (action === 'reject') {
        // TODO: Implement reject offer
        // await missionService.rejectOffer(mission.id, selectedOffer.id, { message });
        toast.success('Offer rejected');
      } else if (action === 'counter') {
        // TODO: Implement counter offer
        // await missionService.counterOffer(mission.id, selectedOffer.id, {
        //   amount: parseFloat(counterAmount),
        //   message,
        // });
        toast.success('Counter offer sent');
      }

      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Acceptée</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejetée</Badge>;
      case 'countered':
        return <Badge className="bg-yellow-100 text-yellow-800">Contre-offre</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  if (loading) {
    return <div>Loading offers...</div>;
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Aucune offre pour le moment</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Offres reçues</span>
            <span className="text-sm font-normal text-muted-foreground">
              {offers.length} offre{offers.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transporteur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Livraison prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{offer.transporteur.name}</span>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="text-yellow-500 mr-1">★ {offer.transporteur.rating}</span>
                        <span>• {offer.transporteur.completedMissions} missions</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                      {offer.amount.toLocaleString()} FCFA
                    </div>
                    {offer.counterOffer && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Contre-offre: {offer.counterOffer.amount.toLocaleString()} FCFA
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-blue-500" />
                      {new Date(offer.estimatedDeliveryDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(offer.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {userRole === 'affreteur' && offer.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleAction(offer, 'accept')}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Accepter
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => handleAction(offer, 'counter')}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Contre-offre
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleAction(offer, 'reject')}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Rejeter
                          </span>
                        </Button>
                      </>
                    )}
                    {userRole === 'transporteur' && (
                      <Button variant="outline" size="sm" className="h-8">
                        Voir détails
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'accept' && 'Accepter cette offre'}
              {action === 'reject' && 'Rejeter cette offre'}
              {action === 'counter' && 'Faire une contre-offre'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedOffer && (
              <div className="space-y-2">
                <div className="font-medium">Transporteur: {selectedOffer.transporteur.name}</div>
                <div>Montant proposé: {selectedOffer.amount.toLocaleString()} FCFA</div>
                {selectedOffer.message && (
                  <div className="text-sm text-muted-foreground">"{selectedOffer.message}"</div>
                )}
              </div>
            )}

            {action === 'counter' && (
              <div className="space-y-2">
                <Label htmlFor="counterAmount">Votre contre-offre (FCFA)</Label>
                <Input
                  id="counterAmount"
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Montant de la contre-offre"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">
                {action === 'accept' && 'Message (optionnel)'}
                {action === 'reject' && 'Raison du rejet (recommandé)'}
                {action === 'counter' && 'Message accompagnant votre contre-offre'}
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  action === 'accept'
                    ? 'Ajoutez un message au transporteur...'
                    : action === 'reject'
                      ? 'Expliquez pourquoi vous rejetez cette offre...'
                      : 'Détaillez votre contre-offre...'
                }
                rows={4}
              />
            </div>

            {action === 'reject' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Attention</p>
                  <p>
                    Le transporteur sera notifié de votre décision. Cette action est irréversible.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={submitAction}
              variant={action === 'reject' ? 'destructive' : 'default'}
            >
              {action === 'accept' && "Confirmer l'acceptation"}
              {action === 'reject' && 'Confirmer le rejet'}
              {action === 'counter' && 'Envoyer la contre-offre'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// import { useCallback, useEffect, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { toast } from 'react-hot-toast';
// // import { missionService } from '@/services/mission.service';
// import { DollarSign, Clock, Check, X } from 'lucide-react';
// import type { Mission } from '@/types/mission.types';
// import { missionService } from '@/services/mission.service';
// import { getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/mission-utils';
// import { PropositionForm } from '../forms/PropositionForm';
// import { useMissions } from '@/hooks/useMissions';

// interface MissionOffersProps {
//   mission: Mission;
//   userRole?: string;
//   onRefresh: () => void;
// }

// export function MissionOffers({ mission, userRole, onRefresh }: MissionOffersProps) {
//   const { updateMission, setCurrentMission } = useMissions();
//   const { myPropositions, setMyPropositions, updateProposition } = usePropositions();
//   const [loading, setLoading] = useState(true);
//   const [selectedOffer, setSelectedOffer] = useState<Proposition | null>(null);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [action, setAction] = useState<'accept' | 'reject' | null>(null);

//   // Fetch offers for the mission
//   const fetchOffers = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await missionService.getMissionPropositions(mission.id);

//       if (response.error) {
//         console.log(response.error);
//         toast.error(response.error.message || 'Erreur lors de la récupération des propositions');
//         return;
//       }

//       if (response.data) {
//         console.log(response.data);
//         setMyPropositions(response.data.propositions.data);
//       }
//     } catch (error) {
//       console.error('Error fetching offers:', error);
//       toast.error('Failed to load offers');
//     } finally {
//       setLoading(false);
//     }
//   }, [mission.id, setMyPropositions]);

//   useEffect(() => {
//     fetchOffers();
//   }, [fetchOffers, mission.id]);

//   const handleAction = (proposition: Proposition, actionType: 'accept' | 'reject') => {
//     setSelectedOffer(proposition);
//     setAction(actionType);
//     setIsDialogOpen(true);
//   };

//   const submitAction = async (data: { message: string }) => {
//     if (!selectedOffer) return;

//     try {
//       if (action === 'accept') {
//         const response = await missionService.acceptProposition(mission.id, selectedOffer.id, {
//           commentaire: data.message,
//         });
//         if (response.error) {
//           console.log(response.error);
//           toast.error(response.error.message || "Erreur lors de l'acceptation de la proposition");
//           return;
//         }
//         if (response.data) {
//           updateMission(mission.id, response.data.mission);
//           updateProposition(selectedOffer.id, response.data.proposition);
//           toast.success('Proposition accepté avec succès');
//         }
//       } else if (action === 'reject') {
//         const response = await missionService.rejectProposition(mission.id, selectedOffer.id, {
//           commentaire: data.message,
//         });
//         if (response.error) {
//           console.log(response.error);
//           toast.error(response.error.message || 'Erreur lors de la rejet de la proposition');
//           return;
//         }
//         if (response.data) {
//           updateProposition(selectedOffer.id, response.data);
//           toast.success('Proposition rejeté avec succès');
//         }
//       }

//       setIsDialogOpen(false);
//       setCurrentMission(null);
//       onRefresh();
//     } catch (error) {
//       console.error('Error performing action:', error);
//       toast.error('Failed to perform action');
//     }
//   };

//   if (loading) {
//     return <div>Loading offers...</div>;
//   }

//   if (myPropositions.length === 0) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Offres</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="text-center py-8 text-muted-foreground">Aucune offre pour le moment</div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-1">
//             <span>Offres reçues</span>
//             <span className="text-sm font-normal text-muted-foreground">
//               {`(${myPropositions.length})`}
//             </span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="px-0">
//           <Table>
//             <TableHeader>
//               <TableRow className="text-center">
//                 <TableHead className="text-center">Transporteur</TableHead>
//                 <TableHead className="text-center">Montant</TableHead>
//                 <TableHead className="text-center">Date de Livraison</TableHead>
//                 <TableHead className="text-center">Statut</TableHead>
//                 <TableHead className="text-center">Date</TableHead>
//                 <TableHead className="text-center">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {myPropositions.map((proposition) => (
//                 <TableRow key={proposition.id}>
//                   <TableCell className="font-medium text-center p-0">
//                     <div className="flex flex-col">
//                       <span>
//                         {proposition.transporteur?.firstName} {proposition.transporteur?.lastName}
//                       </span>
//                       {/* <div className="flex items-center text-sm text-muted-foreground">
//                         <span className="text-yellow-500 mr-1">★ {proposition.transporteur?.rating}</span>
//                         <span>• {proposition.transporteur?.completedMissions} missions</span>
//                       </div> */}
//                     </div>
//                   </TableCell>

//                   <TableCell className="font-medium text-center p-2">
//                     <div className="flex flex-1 justify-center items-center">
//                       <DollarSign className="h-4 w-4 mr-1 text-green-500" />
//                       {new Intl.NumberFormat('fr-FR', {
//                         style: 'currency',
//                         currency: 'XAF',
//                       }).format(proposition.prixPropose)}
//                     </div>
//                     {mission?.budgetMin && proposition.prixPropose !== mission.budgetMin && (
//                       <div className="mt-1 text-muted-foreground">
//                         {new Intl.NumberFormat('fr-FR', {
//                           style: 'currency',
//                           currency: 'XAF',
//                         }).format(mission?.budgetMin || 0)}
//                       </div>
//                     )}
//                   </TableCell>

//                   <TableCell className="font-medium text-center p-2">
//                     <div className="flex flex-1 justify-center items-center">
//                       <Clock className="h-4 w-4 mr-1 text-text" />
//                       {(() => {
//                         const missionDate = new Date(mission.dateArriveePrevue);
//                         const arrivalDate = new Date(missionDate);
//                         arrivalDate.setDate(
//                           missionDate.getDate() + (proposition.delaiPropose || 0)
//                         );
//                         return arrivalDate.toLocaleDateString('fr-FR', {
//                           day: '2-digit',
//                           month: '2-digit',
//                           year: 'numeric',
//                         });
//                       })()}
//                     </div>
//                     {(() => {
//                       if (!mission?.dateArriveePrevue) return null;

//                       const missionDate = new Date(mission.dateArriveePrevue);
//                       const arrivalDate = new Date(missionDate);
//                       arrivalDate.setDate(missionDate.getDate() + (proposition.delaiPropose || 0));

//                       // Only show the original date if it's different from the calculated arrival date
//                       if (missionDate.getTime() !== arrivalDate.getTime()) {
//                         return (
//                           <div className="mt-1 text-muted-foreground text-xs">
//                             <span className="relative">
//                               {missionDate.toLocaleDateString('fr-FR', {
//                                 day: '2-digit',
//                                 month: '2-digit',
//                                 year: 'numeric',
//                               })}
//                               <span className="absolute top-1/2 left-0 w-full h-0.5 bg-muted-foreground transform -translate-y-1/2"></span>
//                             </span>
//                           </div>
//                         );
//                       }
//                       return null;
//                     })()}
//                   </TableCell>

//                   <TableCell className="font-medium text-center">
//                     <Badge className={getStatusColor(proposition.status)}>
//                       {getStatusIcon(proposition.status)} {getStatusLabel(proposition.status)}
//                     </Badge>
//                   </TableCell>

//                   <TableCell className="font-medium text-center">
//                     <div className="">{new Date(proposition.createdAt).toLocaleDateString()}</div>
//                   </TableCell>

//                   <TableCell className="text-center space-x-2">
//                     {userRole === 'affreteur' && proposition.status === 'pending' && (
//                       <>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50"
//                           onClick={() => handleAction(proposition, 'accept')}
//                         >
//                           <Check className="h-3.5 w-3.5" />
//                           <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
//                             {(() => {
//                               const missionDate = new Date(mission.dateArriveePrevue);
//                               const arrivalDate = new Date(missionDate);
//                               arrivalDate.setDate(
//                                 missionDate.getDate() + (proposition.delaiPropose || 0)
//                               );

//                               const hasDateDifference =
//                                 missionDate.getTime() !== arrivalDate.getTime();
//                               const hasPriceDifference =
//                                 mission.budgetMin !== proposition.prixPropose;

//                               return hasDateDifference || hasPriceDifference
//                                 ? 'Accepter'
//                                 : 'Valider';
//                             })()}
//                           </span>
//                         </Button>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50"
//                           onClick={() => handleAction(proposition, 'reject')}
//                         >
//                           <X className="h-3.5 w-3.5" />
//                           <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
//                             Rejeter
//                           </span>
//                         </Button>
//                       </>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Action Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogDescription className="hidden">
//           Vous allez accepter ou rejeter cette offre
//         </DialogDescription>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>
//               {action === 'accept' && 'Accepter cette offre'}
//               {action === 'reject' && 'Rejeter cette offre'}
//             </DialogTitle>
//           </DialogHeader>

//           <PropositionForm
//             action={action}
//             mission={mission}
//             onSubmit={submitAction}
//             onCancel={() => setIsDialogOpen(false)}
//           />
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

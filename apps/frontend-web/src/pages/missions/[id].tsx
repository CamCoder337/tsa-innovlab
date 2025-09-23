import { useParams, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { missionService } from '@/services/mission.service';
import type { Mission, MissionStatus } from '@/types/mission.types';
import { MissionDetails } from '@/components/missions/MissionDetails';
import { MissionOffers } from '@/components/missions/MissionOffers';
import { MissionActions } from '@/components/missions/MissionActions';
import { MissionTimeline } from '@/components/missions/MissionTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMissions } from '@/hooks/useMissions';

export default function MissionDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { missions } = useMissions();

    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchMission = useCallback(async () => {
        if (!id) return;

        setLoading(true);

        const mission = missions.find((mission) => mission.id === id);
        if (mission) {
            setMission(mission);
            setLoading(false);
        } else {
            toast.error('Mission not found');
            navigate('/app/missions');
        }
        // try {
        //     const response = await (user?.role === 'admin'
        //         ? missionService.adminGetMission(id as string)
        //         : missionService.getAffreteurMission(id as string));

        //     if (response.data) {
        //         setMission(response.data);
        //     } else if (response.error) {
        //         toast.error(response.error.message || 'Failed to load mission');
        //     }
        // } catch (error) {
        //     console.error('Error fetching mission:', error);
        //     toast.error('An error occurred while fetching mission details');
        // } finally {
        //     setLoading(false);
        // }
    }, [id, missions, navigate]);

    useEffect(() => {
        if (id) {
            fetchMission();
        }
    }, [fetchMission, id, refreshKey]);

    const handleStatusUpdate = async (status: MissionStatus, comment?: string) => {
        if (!mission) return;

        try {
            const response = await missionService.updateMissionStatus(mission.id, status, comment);
            if (response.data) {
                toast.success(`Mission ${status} successfully`);
                setRefreshKey((prev) => prev + 1);
            }
        } catch (error) {
            console.error('Error updating mission status:', error);
            toast.error('Failed to update mission status');
        }
    };

    if (loading) {
        return <div className="container mx-auto py-8">Loading mission details...</div>;
    }

    if (!mission) {
        return <div className="container mx-auto py-8">Mission not found</div>;
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Mission: {mission.titre}</h1>
                <div className="ml-auto">
                    <MissionActions
                        mission={mission}
                        userRole={user?.role}
                        onStatusUpdate={handleStatusUpdate}
                        onRefresh={fetchMission}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="offers">Offers</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    {user?.role === 'admin' && <TabsTrigger value="admin">Admin</TabsTrigger>}
                </TabsList>

                <TabsContent value="details">
                    <MissionDetails mission={mission} />
                </TabsContent>

                <TabsContent value="offers">
                    <MissionOffers mission={mission} userRole={user?.role} onRefresh={fetchMission} />
                </TabsContent>

                <TabsContent value="timeline">
                    <MissionTimeline mission={mission} />
                </TabsContent>

                {user?.role === 'admin' && (
                    <TabsContent value="admin">
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Add admin-specific actions here */}
                                <div className="space-y-4">
                                    <Button variant="destructive">Delete Mission</Button>
                                    <Button variant="outline">Edit Mission</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

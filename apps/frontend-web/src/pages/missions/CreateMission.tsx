import CreateMissionForm from '@/components/forms/CreateMissionForm';
import type { CreateMissionDto } from '@/types/mission.types';
import { useAddresses } from '@/hooks/useAddresses';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';

export default function CreateMission() {
  const { addresses } = useAddresses();
  const { currentMission, error, createMission, updateMission, publishMission } = useMissions();
  const navigate = useNavigate();

  const handleCreateMission = async (data: CreateMissionDto, action: string, publish: boolean) => {
    // Format dates to ISO 8601 without milliseconds
    const formattedData = {
      ...data,
      dateDepartEstime: data.dateDepartEstime
        ? new Date(data.dateDepartEstime).toISOString().replace(/\.\d+Z$/, '')
        : '',
      dateArriveePrevue: data.dateArriveePrevue
        ? new Date(data.dateArriveePrevue).toISOString().replace(/\.\d+Z$/, '')
        : '',
    };

    let missionId: string | undefined;

    if (currentMission && action === 'update') {
      await updateMission(currentMission.id, formattedData);
      missionId = currentMission.id;
    } else {
      const newMission = await createMission(formattedData);
      missionId = newMission?.id;
    }

    if (error) {
      toast.error(error || 'Une erreur est survenue');
      return;
    }

    if (currentMission && action === 'update') {
      toast.success('Mission modifiée avec succès');
    } else {
      toast.success('Mission créée avec succès');
    }

    if (!publish) {
      setTimeout(() => {
        navigate('/app/missions');
      }, 2500);
      return;
    }

    // If publish is true and we have a mission ID, publish it
    if (publish && missionId) {
      await publishMission(missionId);

      if (error) {
        console.error(error);
        toast.error(error);
        return;
      }

      toast.success('Mission publiée avec succès');
      setTimeout(() => {
        navigate(`/app/missions/${missionId}`);
      }, 2500);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentMission ? 'Modifier une Mission' : 'Créer une Nouvelle Mission'}
        </h1>
        <p className="text-gray-600">
          {currentMission
            ? 'Modifiez les informations de votre mission'
            : 'Publiez vos besoins de transport et connectez-vous avec des transporteurs fiables'}
        </p>
      </div>

      <CreateMissionForm onSubmit={handleCreateMission} addresses={addresses} />
    </div>
  );
}

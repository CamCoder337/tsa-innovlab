import CreateMissionForm from '@/components/forms/CreateMissionForm';
import type { CreateMissionDto } from '@/types/mission.types';
import { useAddresses } from '@/hooks/useAddresses';
import { missionService } from '@/services/mission.service';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';

export default function CreateMission() {
  const { addresses } = useAddresses();
  const { currentMission, addMission, updateMission } = useMissions();
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

    let response;
    if (currentMission && action === 'update') {
      response = await missionService.updateMission(currentMission.id, formattedData);
    } else {
      response = await missionService.createMission(formattedData);
    }
    console.log('Server response:', response);

    if (response.error) {
      toast.error(response.error.message || 'Une erreur est survenue');
    }

    if (response.data) {
      if (currentMission && action === 'update') {
        updateMission(currentMission.id, response.data);
        toast.success('Mission modifiée avec succès');
      } else {
        addMission(response.data);
        toast.success('Mission créée avec succès');
      }

      if (!publish) {
        navigate('/app/missions');
      }

      if (publish) {
        const id = response.data.id;
        const response1 = await missionService.publishMission(id);
        console.log(response1);

        if (response1.error) {
          toast.error(response1.error.message || 'Une erreur est survenue');
        }

        if (response1.data) {
          updateMission(id, response1.data);
          toast.success('Mission publiée avec succès');
          setTimeout(() => {
            navigate(`/app/missions/${id}`);
          }, 2500);
        }
      }
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

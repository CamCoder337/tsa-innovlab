import CreateMissionForm from '@/components/forms/CreateMissionForm';
import type { CreateMissionDto } from '@/types/mission.types';
import { useAddresses } from '@/hooks/useAddresses';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useMissions } from '@/hooks/useMissions';
import { useErrorsTranslation, useMissionsTranslation } from '@/hooks/useTranslation';
import { useCallback } from 'react';
import { useMissionStore } from '@/stores/missionStore';

export default function CreateMission() {
  const { addresses } = useAddresses();
  const { currentMission, createMission, updateMission, publishMission, setError } = useMissions();
  const navigate = useNavigate();
  const { t: tMissions } = useMissionsTranslation();
  const { t: tErrors } = useErrorsTranslation();

  const handleCreateMission = useCallback(
    async (data: CreateMissionDto, action: string, publish: boolean) => {
      try {
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

        const { error } = useMissionStore.getState();

        // Check if the operation failed
        if (error || !missionId) {
          toast.error(tErrors('general.somethingWentWrong'));
          return;
        }

        console.log('no Error');

        if (currentMission && action === 'update') {
          toast.success(tMissions('messages.modifiedSuccess'));
        } else {
          toast.success(tMissions('messages.createdSuccess'));
        }

        if (!publish) {
          setTimeout(() => {
            setError(null);
            navigate('/app/missions');
          }, 2500);
          return;
        }

        // If publish is true and we have a mission ID, publish it
        if (publish && missionId) {
          await publishMission(missionId);

          if (error) {
            toast.error(error || tErrors('general.somethingWentWrong'));
            return;
          }

          toast.success(tMissions('messages.publishedSuccess'));
          setTimeout(() => {
            navigate(`/app/missions/${missionId}`);
          }, 2500);
        }
      } catch (err) {
        console.error('Error in handleCreateMission:', err);
        toast.error(tErrors('general.somethingWentWrong'));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [currentMission, createMission]
  );

  return (
    <div className="flex-1 max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentMission ? tMissions('create.editTitle') : tMissions('create.title')}
        </h1>
        <p className="text-gray-600">
          {currentMission ? tMissions('create.editSubtitle') : tMissions('create.subtitle')}
        </p>
      </div>

      <CreateMissionForm onSubmit={handleCreateMission} addresses={addresses} />
    </div>
  );
}

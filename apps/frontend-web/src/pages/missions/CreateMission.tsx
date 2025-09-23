import CreateMissionForm from '@/components/forms/CreateMissionForm';
import type { CreateMissionDto } from '@/types/mission.types';

export default function CreateMission() {
  const handleSubmit = async (data: CreateMissionDto) => {
    console.log(data);
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer une Nouvelle Mission</h1>
        <p className="text-gray-600">
          Publiez vos besoins de transport et connectez-vous avec des transporteurs fiables
        </p>
      </div>

      <CreateMissionForm onSubmit={handleSubmit} addresses={[]} />
    </div>
  );
}

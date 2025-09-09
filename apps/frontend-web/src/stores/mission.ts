import { create } from 'zustand';
import type { Mission, MissionStatus, UrgencyLevel, CargoType } from '@/types/mission.types';
import type { MissionState, MissionActions } from '@/types/store.types';

export type MissionStore = MissionState & MissionActions;

// Mock missions data
const mockMissions: Mission[] = [
    {
        id: "TSA-001",
        title: "Transport Électronique Douala → Yaoundé",
        description: "Transport de matériel électronique de Douala à Yaoundé",
        origin: "Douala",
        destination: "Yaoundé",
        cargoType: "electronics",
        proposedPrice: 450000,
        finalPrice: 420000,
        deadline: "2025-01-25",
        bids: 8,
        distance: 243,
        weight: 800,
        urgency: "medium",
        specialRequirements: {
            refrigerated: false,
            fragile: true,
            hazardous: false,
            insurance: true,
        },
        missionItems: [
            {
                id: "1",
                description: "Ordinateurs portables",
                weight: "50",
                volume: "2",
                value: "5000000"
            }
        ],
        shipper: {
            id: "user-aff-1",
            name: "Alice Doe",
            rating: 4.8,
            phone: "+237 696 123 456",
            company: "Agro-Export SARL",
        },
        status: "en_transit",
        createdAt: "2025-01-20",
        updatedAt: "2025-01-22",
    },
    {
        id: "TSA-002",
        title: "Matériaux de Construction Bafoussam → Bamenda",
        description: "Transport de matériaux de construction de Bafoussam à Bamenda",
        origin: "Bafoussam",
        destination: "Bamenda",
        cargoType: "construction",
        proposedPrice: 280000,
        deadline: "2025-01-28",
        bids: 12,
        distance: 368,
        weight: 2500,
        urgency: "low",
        specialRequirements: {
            refrigerated: false,
            fragile: false,
            hazardous: false,
            insurance: false,
        },
        missionItems: [
            {
                id: "2",
                description: "Ciment et briques",
                weight: "2500",
                volume: "15",
                value: "2000000"
            }
        ],
        shipper: {
            id: "user-aff-1",
            name: "Alice Doe",
            rating: 4.8,
            phone: "+237 696 123 456",
            company: "Agro-Export SARL",
        },
        status: "en_negociation",
        createdAt: "2025-01-21",
    },
    {
        id: "TSA-003",
        title: "Export Produits Alimentaires vers le Tchad",
        description: "Export de produits alimentaires de Garoua à N'Djamena",
        origin: "Garoua",
        destination: "N'Djamena",
        cargoType: "food",
        proposedPrice: 680000,
        deadline: "2025-01-30",
        bids: 3,
        distance: 450,
        weight: 1200,
        urgency: "high",
        specialRequirements: {
            refrigerated: true,
            fragile: false,
            hazardous: false,
            insurance: true,
        },
        missionItems: [
            {
                id: "3",
                description: "Produits alimentaires frais",
                weight: "1200",
                volume: "8",
                value: "3500000"
            }
        ],
        shipper: {
            id: "user-aff-1",
            name: "Alice Doe",
            rating: 4.8,
            phone: "+237 696 123 456",
            company: "Agro-Export SARL",
        },
        status: "ouverte",
        createdAt: "2025-01-22",
    },
    {
        id: "TSA-004",
        title: "Transport Matériel Médical Yaoundé → Garoua",
        description: "Transport de matériel médical de Yaoundé à Garoua",
        origin: "Yaoundé",
        destination: "Garoua",
        cargoType: "machinery",
        proposedPrice: 850000,
        deadline: "2025-01-30",
        bids: 3,
        distance: 692,
        weight: 2500,
        urgency: "high",
        specialRequirements: {
            refrigerated: false,
            fragile: true,
            hazardous: false,
            insurance: true,
        },
        missionItems: [
            {
                id: "4",
                description: "Équipements médicaux",
                weight: "2500",
                volume: "12",
                value: "15000000"
            }
        ],
        shipper: {
            id: "user-aff-1",
            name: "Alice Doe",
            rating: 4.8,
            phone: "+237 696 123 456",
            company: "Agro-Export SARL",
        },
        status: "assignee",
        createdAt: "2025-01-23",
    },
    {
        id: "TSA-005",
        title: "Livraison Produits Alimentaires Douala → Bamenda",
        description: "Livraison de produits alimentaires de Douala à Bamenda",
        origin: "Douala",
        destination: "Bamenda",
        cargoType: "food",
        proposedPrice: 320000,
        deadline: "2025-01-27",
        bids: 2,
        distance: 368,
        weight: 1800,
        urgency: "medium",
        specialRequirements: {
            refrigerated: false,
            fragile: false,
            hazardous: false,
            insurance: false,
        },
        missionItems: [
            {
                id: "5",
                description: "Produits alimentaires secs",
                weight: "1800",
                volume: "10",
                value: "2500000"
            }
        ],
        shipper: {
            id: "user-aff-1",
            name: "Alice Doe",
            rating: 4.8,
            phone: "+237 696 123 456",
            company: "Agro-Export SARL",
        },
        status: "assignee",
        createdAt: "2025-01-22",
    },
    {
        id: "TSA-006",
        title: "Transport Textiles Kribi → Bertoua",
        description: "Transport de textiles de Kribi à Bertoua",
        origin: "Kribi",
        destination: "Bertoua",
        cargoType: "textiles",
        proposedPrice: 250000,
        finalPrice: 240000,
        deadline: "2025-01-20",
        bids: 2,
        distance: 320,
        weight: 500,
        urgency: "low",
        specialRequirements: {
            refrigerated: false,
            fragile: false,
            hazardous: false,
            insurance: false,
        },
        missionItems: [
            {
                id: "6",
                description: "Tissus et vêtements",
                weight: "500",
                volume: "6",
                value: "1800000"
            }
        ],
        shipper: {
            id: "user-aff-1",
            name: "Alice Doe",
            rating: 4.8,
            phone: "+237 696 123 456",
            company: "Agro-Export SARL",
        },
        status: "terminee",
        createdAt: "2025-01-15",
        updatedAt: "2025-01-20",
    },
];

// Helper functions
function generateMissionId(): string {
    const count = mockMissions.length + 1;
    return `TSA-${count.toString().padStart(3, '0')}`;
}

function persistMissionsToLocalStorage(missions: Mission[]) {
    try {
        localStorage.setItem('missions', JSON.stringify(missions));
    } catch (error) {
        console.error('Failed to persist missions to localStorage:', error);
    }
}

function loadMissionsFromLocalStorage(): Mission[] {
    try {
        const raw = localStorage.getItem('missions');
        if (raw) {
            const missions = JSON.parse(raw);
            // Convert date strings back to Date objects
            return missions.map((mission: any) => ({
                ...mission,
                createdAt: mission.createdAt,
                updatedAt: mission.updatedAt,
            }));
        }
    } catch (error) {
        console.error('Failed to load missions from localStorage:', error);
    }
    return mockMissions;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
    missions: loadMissionsFromLocalStorage(),
    currentMission: null,
    isLoading: false,
    error: null,

    setMissions: (missions: Mission[]) => {
        persistMissionsToLocalStorage(missions);
        set({ missions });
    },

    addMission: (mission: Mission) => {
        const missions = get().missions;
        const newMission = {
            ...mission,
            id: mission.id || generateMissionId(),
            createdAt: mission.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updatedMissions = [...missions, newMission];
        persistMissionsToLocalStorage(updatedMissions);
        set({ missions: updatedMissions });
    },

    updateMission: (id: string, updates: Partial<Mission>) => {
        const missions = get().missions;
        const updatedMissions = missions.map(mission =>
            mission.id === id
                ? { ...mission, ...updates, updatedAt: new Date().toISOString() }
                : mission
        );
        persistMissionsToLocalStorage(updatedMissions);
        set({ missions: updatedMissions });
    },

    deleteMission: (id: string) => {
        const missions = get().missions;
        const updatedMissions = missions.filter(mission => mission.id !== id);
        persistMissionsToLocalStorage(updatedMissions);
        set({ missions: updatedMissions });
    },

    setCurrentMission: (mission: Mission | null) => {
        set({ currentMission: mission });
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setError: (error: string | null) => {
        set({ error });
    },
}));

// Selector hooks for common use cases
export const useMissionsByStatus = (status: MissionStatus) => {
    return useMissionStore(state =>
        state.missions.filter(mission => mission.status === status)
    );
};

export const useMissionsByUser = (userId: string) => {
    return useMissionStore(state =>
        state.missions.filter(mission => mission.shipper?.id === userId)
    );
};

export const useMissionsByUrgency = (urgency: UrgencyLevel) => {
    return useMissionStore(state =>
        state.missions.filter(mission => mission.urgency === urgency)
    );
};

export const useMissionsByCargoType = (cargoType: CargoType) => {
    return useMissionStore(state =>
        state.missions.filter(mission => mission.cargoType === cargoType)
    );
};

export const useAvailableMissions = () => {
    return useMissionStore(state =>
        state.missions.filter(mission =>
            ['ouverte', 'en_negociation'].includes(mission.status)
        )
    );
};

export const useAssignedMissions = () => {
    return useMissionStore(state =>
        state.missions.filter(mission =>
            ['assignee', 'en_transit'].includes(mission.status)
        )
    );
};

export const useCompletedMissions = () => {
    return useMissionStore(state =>
        state.missions.filter(mission => mission.status === 'terminee')
    );
};


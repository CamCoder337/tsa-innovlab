// ============================================================================
// MISSION TYPES
// ============================================================================

export type MissionStatus = "brouillon" | "ouverte" | "en_negociation" | "assignee" | "en_transit" | "terminee" | "annulee";
export type UrgencyLevel = "low" | "medium" | "high";
export type CargoType = "" | "electronics" | "construction" | "food" | "medical" | "textiles" | "machinery" | "chemicals" | "other";

export interface MissionItem {
    id: string;
    description: string;
    weight: string;
    volume: string;
    value: string;
}

export interface SpecialRequirements {
    refrigerated: boolean;
    fragile: boolean;
    hazardous: boolean;
    insurance: boolean;
}

export interface Shipper {
    id: string;
    name: string;
    rating: number;
    phone: string;
    company: string;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    origin: string;
    destination: string;
    cargoType: CargoType;
    proposedPrice: number;
    finalPrice?: number;
    deadline: string;
    bids: number;
    distance?: number;
    weight?: number;
    urgency?: UrgencyLevel;
    specialRequirements: SpecialRequirements;
    missionItems: MissionItem[];
    shipper?: Shipper;
    status: MissionStatus;
    createdAt: string;
    updatedAt?: string;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface FilterOptions {
    status?: MissionStatus[];
    urgency?: UrgencyLevel[];
    cargoType?: CargoType[];
    origin?: string[];
    destination?: string[];
}

export interface SortOptions {
    field: keyof Mission;
    direction: 'asc' | 'desc';
}



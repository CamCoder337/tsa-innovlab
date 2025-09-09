// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'Affreteur' | 'Affréteur' | 'Transporteur' | 'Admin' | 'Client';

export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    company?: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateUserRequest {
    id: string;
    nom?: string;
    prenom?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    avatar?: string;
}



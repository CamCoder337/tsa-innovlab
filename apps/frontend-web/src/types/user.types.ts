// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'admin' | 'transporteur' | 'affreteur';

export type UserStatus = 'pending' | 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  fullName: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserAbilities {
  manage_users?: boolean;
  view_reports?: boolean;
  edit_settings?: boolean;
  view_missions?: boolean;
  update_status?: boolean;
  create_mission?: boolean;
  view_status?: boolean;
}

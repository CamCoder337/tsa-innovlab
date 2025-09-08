// User role types for the logistics platform
export type UserRole = 'Affréteur' | 'Transporteur' | 'Client';

// User interface
export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Registration form data
export interface RegisterFormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | '';
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Forgot password form data
export interface ForgotPasswordFormData {
  email: string;
}

// Form validation errors
export interface FormErrors {
  [key: string]: string;
}

// API response types
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

// Registration request payload
export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: UserRole;
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
}

// Forgot password request payload
export interface ForgotPasswordRequest {
  email: string;
}
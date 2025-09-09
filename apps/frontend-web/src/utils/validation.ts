import type { RegisterFormData, LoginFormData, ForgotPasswordFormData, FormErrors, UserRole } from '../types/auth.types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation rules
const PASSWORD_MIN_LENGTH = 8;

// Validation messages in French
export const VALIDATION_MESSAGES = {
    REQUIRED_FIELD: 'Ce champ est requis',
    INVALID_EMAIL: 'Adresse email invalide',
    PASSWORD_TOO_SHORT: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
    PASSWORDS_NOT_MATCH: 'Les mots de passe ne correspondent pas',
    INVALID_ROLE: 'Veuillez sélectionner un rôle valide',
    REQUIRED_NAME: 'Le nom est requis',
    REQUIRED_FIRSTNAME: 'Le prénom est requis',
    REQUIRED_EMAIL: 'L\'adresse email est requise',
    REQUIRED_PASSWORD: 'Le mot de passe est requis',
    REQUIRED_ROLE: 'Veuillez sélectionner un rôle'
} as const;

// Validate email format
export const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email.trim());
};

// Validate password strength
export const validatePassword = (password: string): boolean => {
    return password.length >= PASSWORD_MIN_LENGTH;
};

// Validate user role
export const validateRole = (role: string): role is UserRole => {
    return ['Affréteur', 'Transporteur', 'Client'].includes(role);
};

// Registration form validation
export const validateRegisterForm = (data: RegisterFormData): FormErrors => {
    const errors: FormErrors = {};

    // Validate nom
    if (!data.nom.trim()) {
        errors.nom = VALIDATION_MESSAGES.REQUIRED_NAME;
    }

    // Validate prenom
    if (!data.prenom.trim()) {
        errors.prenom = VALIDATION_MESSAGES.REQUIRED_FIRSTNAME;
    }

    // Validate email
    if (!data.email.trim()) {
        errors.email = VALIDATION_MESSAGES.REQUIRED_EMAIL;
    } else if (!validateEmail(data.email)) {
        errors.email = VALIDATION_MESSAGES.INVALID_EMAIL;
    }

    // Validate password
    if (!data.password) {
        errors.password = VALIDATION_MESSAGES.REQUIRED_PASSWORD;
    } else if (!validatePassword(data.password)) {
        errors.password = VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
    }

    // Validate confirm password
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = VALIDATION_MESSAGES.PASSWORDS_NOT_MATCH;
    }

    // Validate role
    if (!data.role) {
        errors.role = VALIDATION_MESSAGES.REQUIRED_ROLE;
    } else if (!validateRole(data.role)) {
        errors.role = VALIDATION_MESSAGES.INVALID_ROLE;
    }

    return errors;
};

// Login form validation
export const validateLoginForm = (data: LoginFormData): FormErrors => {
    const errors: FormErrors = {};

    // Validate email
    if (!data.email.trim()) {
        errors.email = VALIDATION_MESSAGES.REQUIRED_EMAIL;
    } else if (!validateEmail(data.email)) {
        errors.email = VALIDATION_MESSAGES.INVALID_EMAIL;
    }

    // Validate password
    if (!data.password) {
        errors.password = VALIDATION_MESSAGES.REQUIRED_PASSWORD;
    }

    return errors;
};

// Forgot password form validation
export const validateForgotPasswordForm = (data: ForgotPasswordFormData): FormErrors => {
    const errors: FormErrors = {};

    // Validate email
    if (!data.email.trim()) {
        errors.email = VALIDATION_MESSAGES.REQUIRED_EMAIL;
    } else if (!validateEmail(data.email)) {
        errors.email = VALIDATION_MESSAGES.INVALID_EMAIL;
    }

    return errors;
};
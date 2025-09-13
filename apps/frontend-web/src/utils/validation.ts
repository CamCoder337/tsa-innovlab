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
  REQUIRED_EMAIL: "L'adresse email est requise",
  REQUIRED_PASSWORD: 'Le mot de passe est requis',
  REQUIRED_PHONE: 'Le numéro de téléphone est requis',
  INVALID_PHONE: 'Le numéro de téléphone est invalide',
  REQUIRED_ROLE: 'Veuillez sélectionner un rôle',
} as const;

import React from 'react';

interface TokenManagerProviderProps {
  children: React.ReactNode;
}

/**
 * Composant provider qui initialise la gestion automatique des tokens
 * Doit être placé au niveau racine de l'application, après le AuthProvider
 */
export const TokenManagerProvider: React.FC<TokenManagerProviderProps> = ({ children }) => {
  return <>{children}</>;
};

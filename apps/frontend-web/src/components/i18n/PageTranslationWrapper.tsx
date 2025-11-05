import React from 'react';
import { useTranslation } from 'react-i18next';

interface PageTranslationWrapperProps {
  children: React.ReactNode;
  namespace?: string;
}

export const PageTranslationWrapper: React.FC<PageTranslationWrapperProps> = ({
  children,
  namespace = 'common',
}) => {
  const { ready } = useTranslation(namespace);

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tsa-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageTranslationWrapper;

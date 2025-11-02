import { Globe } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageDropdownProps {
  className?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  className = '',
  position = 'bottom-right',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'left-0 top-full mt-2';
      case 'bottom-right':
        return 'right-0 top-full mt-2';
      case 'top-left':
        return 'left-0 bottom-full mb-2';
      case 'top-right':
        return 'right-0 bottom-full mb-2';
      default:
        return 'right-0 top-full mt-2';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-tsa-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span className="flex items-center space-x-1">
          <span>{currentLanguage.code.slice(0, 2).toUpperCase()}</span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown menu */}
          <div
            className={`absolute z-20 w-48 bg-white border border-gray-200 rounded-md shadow-lg ${getPositionClasses()}`}
          >
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors duration-150 ${
                    currentLanguage.code === language.code
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLanguage.code === language.code && (
                    <span className="ml-auto">
                      <svg
                        className="w-4 h-4 text-tsa-blue dark:text-tsa-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageDropdown;

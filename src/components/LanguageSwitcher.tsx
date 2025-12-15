import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'zh-TW', label: '繁中' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            i18n.language === code
              ? 'bg-teal-500 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

'use client';

import { useLanguage } from '@/lib/context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-amber-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'es'
            ? 'bg-amber-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        ES
      </button>
    </div>
  );
}

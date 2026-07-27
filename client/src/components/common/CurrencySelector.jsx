import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

const CURRENCY_OPTIONS = [
  { code: 'INR', country: 'India', flag: '🇮🇳' },
  { code: 'USD', country: 'United States', flag: '🇺🇸' },
  { code: 'GBP', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'EUR', country: 'Euro', flag: '🇪🇺' },
  { code: 'JPY', country: 'Japan', flag: '🇯🇵' },
  { code: 'AUD', country: 'Australia', flag: '🇦🇺' },
  { code: 'CAD', country: 'Canada', flag: '🇨🇦' },
];

const CurrencySelector = ({ className = "" }) => {
  const { currency, setCurrency } = useCurrency();

  // currency is exported by useCurrency() as the active currency code string ("INR", "USD", "EUR", etc.)
  const currentCode = typeof currency === 'string' ? currency : (currency?.code || 'INR');

  const handleChange = (e) => {
    const code = e.target.value;
    setCurrency(code);
  };

  return (
    <div className={`relative inline-flex items-center space-x-2 ${className}`}>
      <select
        value={currentCode}
        onChange={handleChange}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer h-10"
        aria-label="Select Currency & Region"
      >
        {CURRENCY_OPTIONS.map(option => (
          <option key={option.code} value={option.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {option.country} ({option.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;

import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

const CURRENCY_OPTIONS = [
  { code: 'USD', country: 'United States', flag: '🇺🇸' },
  { code: 'INR', country: 'India', flag: '🇮🇳' },
  { code: 'GBP', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'EUR', country: 'Germany', flag: '🇩🇪' },
  { code: 'JPY', country: 'Japan', flag: '🇯🇵' },
  { code: 'AUD', country: 'Australia', flag: '🇦🇺' },
  { code: 'CAD', country: 'Canada', flag: '🇨🇦' },
];

const CurrencySelector = ({ className = "" }) => {
  const { currency, setCurrency } = useCurrency();

  const handleChange = (e) => {
    const code = e.target.value;
    const option = CURRENCY_OPTIONS.find(opt => opt.code === code);
    if (option) {
      setCurrency(option);
    }
  };

  return (
    <div className={`relative inline-flex items-center space-x-2 ${className}`}>
      <select
        value={currency?.code || 'USD'}
        onChange={handleChange}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
      >
        {CURRENCY_OPTIONS.map(option => (
          <option key={option.code} value={option.code}>
            {option.flag} {option.country} ({option.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;

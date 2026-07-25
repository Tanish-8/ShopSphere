import React, { createContext, useContext, useState, useEffect } from 'react';
import { convertPrice, formatCurrency } from '../utils/currencyUtils';

const CurrencyContext = createContext();

const CURRENCY_OPTIONS = [
  { code: 'USD', country: 'United States', symbol: '$', locale: 'en-US' },
  { code: 'INR', country: 'India', symbol: '?', locale: 'en-IN' },
  { code: 'GBP', country: 'United Kingdom', symbol: '£', locale: 'en-GB' },
  { code: 'EUR', country: 'Germany', symbol: '€', locale: 'de-DE' },
  { code: 'JPY', country: 'Japan', symbol: '¥', locale: 'ja-JP' },
  { code: 'AUD', country: 'Australia', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', country: 'Canada', symbol: 'C$', locale: 'en-CA' },
];

const getStoredCurrency = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('selectedCurrency');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    // Try to detect from browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const supported = CURRENCY_OPTIONS.find(opt => opt.locale.startsWith(browserLang.split('-')[0]));
    if (supported) return supported;
  }
  // Default to USD
  return CURRENCY_OPTIONS.find(opt => opt.code === 'USD');
};

const fetchExchangeRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=USD');
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    return data.rates; // object with currency codes as keys and rates as values
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using cached or defaults', error);
    return null;
  }
};

const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(getStoredCurrency());
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRates = async () => {
      // Try to get from localStorage
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        const { timestamp, rates } = JSON.parse(cached);
        const now = Date.now();
        // Cache for 24 hours
        if (now - timestamp < 24 * 60 * 60 * 1000) {
          setRates(rates);
          setLoading(false);
          return;
        }
      }
      // Fetch from API
      const fetchedRates = await fetchExchangeRates();
      if (fetchedRates) {
        setRates(fetchedRates);
        localStorage.setItem('exchangeRates', JSON.stringify({
          timestamp: Date.now(),
          rates: fetchedRates,
        }));
      } else {
        // Fallback to static rates (approximate)
        const fallback = {
          USD: 1,
          INR: 83.2, // approximate
          GBP: 0.79,
          EUR: 0.92,
          JPY: 151.34,
          AUD: 1.53,
          CAD: 1.36,
        };
        setRates(fallback);
      }
      setLoading(false);
    };

    loadRates();
  }, []);

  const rate = rates[currency.code] || 1;

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('selectedCurrency', JSON.stringify(newCurrency));
  };

  const value = {
    currency: currency.code,
    country: currency.country,
    symbol: currency.symbol,
    locale: currency.locale,
    rate,
    setCurrency,
    convertPrice: (priceUSD) => convertPrice(priceUSD, rate),
    formatCurrency: (amount) => formatCurrency(amount, currency.locale, currency.code),
    loading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyProvider;

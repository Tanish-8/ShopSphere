import React, { createContext, useContext, useState, useEffect } from 'react';
import { convertPrice, formatCurrency } from '../utils/currencyUtils';

const CurrencyContext = createContext();

const CURRENCY_OPTIONS = [
  { code: 'INR', country: 'India', symbol: '₹', locale: 'en-IN' },
  { code: 'USD', country: 'United States', symbol: '$', locale: 'en-US' },
  { code: 'GBP', country: 'United Kingdom', symbol: '£', locale: 'en-GB' },
  { code: 'EUR', country: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'JPY', country: 'Japan', symbol: '¥', locale: 'ja-JP' },
  { code: 'AUD', country: 'Australia', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', country: 'Canada', symbol: 'C$', locale: 'en-CA' },
];

const getStoredCurrency = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('selectedCurrency');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.code) {
          const match = CURRENCY_OPTIONS.find(opt => opt.code === parsed.code);
          if (match) return match;
        }
      } catch (e) {
        // Fallback
      }
    }
    const browserLang = navigator.language || navigator.userLanguage || '';
    const supported = CURRENCY_OPTIONS.find(opt => opt.locale.startsWith(browserLang.split('-')[0]));
    if (supported) return supported;
  }
  return CURRENCY_OPTIONS.find(opt => opt.code === 'INR') || CURRENCY_OPTIONS[0];
};

const fetchExchangeRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=USD');
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using cached or defaults', error);
    return null;
  }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(getStoredCurrency());
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRates = async () => {
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        try {
          const { timestamp, rates } = JSON.parse(cached);
          const now = Date.now();
          if (now - timestamp < 24 * 60 * 60 * 1000 && rates) {
            setRates(rates);
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore
        }
      }
      const fetchedRates = await fetchExchangeRates();
      if (fetchedRates) {
        setRates(fetchedRates);
        localStorage.setItem('exchangeRates', JSON.stringify({
          timestamp: Date.now(),
          rates: fetchedRates,
        }));
      } else {
        const fallback = {
          USD: 1,
          INR: 83.2,
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
    let target = newCurrency;
    if (typeof newCurrency === 'string') {
      target = CURRENCY_OPTIONS.find(opt => opt.code === newCurrency) || currency;
    }
    setCurrencyState(target);
    localStorage.setItem('selectedCurrency', JSON.stringify(target));
  };

  const value = {
    currency: currency.code,
    currencyObj: currency,
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

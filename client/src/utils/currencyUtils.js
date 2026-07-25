export const convertPrice = (priceUSD, rate) => {
  if (typeof priceUSD !== 'number' || isNaN(priceUSD)) return 0;
  return priceUSD * rate;
};

export const formatCurrency = (amount, locale, currency) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

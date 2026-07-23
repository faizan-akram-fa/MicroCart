export const formatPrice = (
  baseAmountPKR: number | string,
  targetCurrency: string,
  exchangeRates: Record<string, number>
) => {
  const amount = Number(baseAmountPKR);
  if (isNaN(amount)) return '0.00';

  // Fallback if rates aren't loaded yet
  if (!exchangeRates || !exchangeRates[targetCurrency]) {
    return `${targetCurrency} ${amount.toLocaleString()}`;
  }

  // Convert PKR to target currency
  const convertedAmount = amount * exchangeRates[targetCurrency];
  
  // Format based on currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: targetCurrency === 'PKR' ? 0 : 2,
    maximumFractionDigits: targetCurrency === 'PKR' ? 0 : 2,
  }).format(convertedAmount);
};

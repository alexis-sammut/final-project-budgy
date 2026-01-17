export const DAYS_PER_FREQUENCY = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  '4-week': 28,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

export const FREQUENCY_CODES = {
  daily: 'D',
  weekly: 'W',
  biweekly: 'B',
  '4-week': '4',
  monthly: 'M',
  quarterly: 'Q',
  yearly: 'Y',
};

export function convertAmount(amount, fromFreq, toFreq) {
  if (fromFreq === toFreq) {
    return parseFloat(amount);
  }
  
  const amountNum = parseFloat(amount);
  const fromDays = DAYS_PER_FREQUENCY[fromFreq];
  const toDays = DAYS_PER_FREQUENCY[toFreq];
  
  const dailyRate = amountNum / fromDays;
  const result = dailyRate * toDays;
  
  return result;
}

export function formatAmountDisplay(amount) {
  const num = parseFloat(amount);
  const rounded = Math.round(num * 100) / 100;
  
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }
  
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

export function calculatePocketInFrequency(pocketAmount, pocketFreq, items, targetFreq) {
  let total = convertAmount(pocketAmount, pocketFreq, targetFreq);
  
  items.forEach(item => {
    if (!item.is_other) {
      const itemConverted = convertAmount(item.amount, item.frequency, targetFreq);
      total += itemConverted;
    }
  });
  
  return total;
}

export function hasMixedFrequencies(pocketFreq, items) {
  if (pocketFreq === 'monthly' && items.every(item => item.frequency === 'monthly' || item.is_other)) {
    return false;
  }
  
  return items.some(item => !item.is_other && item.frequency !== pocketFreq);
}
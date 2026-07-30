import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(priceInYerOld: number) {
  let selected = 'YER';
  let usdToYerOld = 533;
  let sarToYerOld = 140;
  
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('currencyData');
      if (data) {
        const parsed = JSON.parse(data);
        selected = parsed.selected || 'YER';
        usdToYerOld = parsed.usdToYerOld || 533;
        sarToYerOld = parsed.sarToYerOld || 140;
      }
    } catch (e) {}
  }

  if (typeof priceInYerOld !== 'number') return '';
  
  let finalValue = priceInYerOld;
  let suffix = 'ريال (قديم)';

  if (selected === 'SAR') {
    finalValue = priceInYerOld / sarToYerOld;
    suffix = 'ر.س';
  } else if (selected === 'USD') {
    finalValue = priceInYerOld / usdToYerOld;
    suffix = '$';
  }

  return `${finalValue.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ${suffix}`;
}

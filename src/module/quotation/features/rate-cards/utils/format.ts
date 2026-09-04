import type { TermType, Seniority, ClientTier, Discipline } from '../types';

export function formatIDR(value: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatNumber(value: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
}

export function formatCurrencyValue(value: number, currency: string = 'IDR'): string {
  if (currency.toUpperCase() === 'IDR') {
    return formatIDR(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function getClientTierColor(
  tier: ClientTier | string
): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'default' {
  switch (tier) {
    case 'commercial_national':
      return 'info';
    case 'government_bumn':
      return 'warning';
    case 'international':
      return 'success';
    default:
      return 'default';
  }
}

export function getDisciplineColor(
  discipline: Discipline | string
): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'default' {
  switch (discipline?.toUpperCase()) {
    case 'ENGINEERING':
      return 'primary';
    case 'QA':
      return 'info';
    case 'PRODUCT':
      return 'secondary';
    case 'DATA':
      return 'success';
    case 'INFRASTRUCTURE':
      return 'warning';
    case 'SUPPORT':
      return 'default';
    default:
      return 'default';
  }
}

export function getSeniorityColor(
  seniority: Seniority | string
): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'default' | 'error' {
  switch (seniority?.toLowerCase()) {
    case 'senior':
      return 'error';
    case 'intermediate':
      return 'warning';
    case 'associate':
      return 'info';
    default:
      return 'default';
  }
}

export function getTermTypeColor(
  termType: TermType | string
): 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'default' {
  switch (termType) {
    case 'long_term':
      return 'success';
    case 'short_term':
      return 'warning';
    default:
      return 'default';
  }
}

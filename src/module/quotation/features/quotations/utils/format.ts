import type { QuotationStatus } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function toTitleCase(str: string): string {
  return str
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatCommercialScheme(
  scheme?: string | null,
  solutionType?: string | null,
  t?: (key: string) => string
): string {
  if (scheme && t) {
    const key = `commercialSchemes.${scheme}`;
    const translated = t(key);
    if (translated && translated !== key) {
      return translated;
    }
  }

  if (solutionType && t) {
    const key = `commercialSchemes.${solutionType}`;
    const translatedScheme = t(key);
    if (translatedScheme && translatedScheme !== key) {
      return translatedScheme;
    }

    const ptKey = `projectTypes.${solutionType}`;
    const translatedPt = t(ptKey);
    if (translatedPt && translatedPt !== ptKey) {
      return translatedPt;
    }
  }

  const raw = scheme || solutionType || '—';
  if (raw === '—') return '—';

  return toTitleCase(raw);
}

export function statusColor(status: QuotationStatus): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'published':
      return 'info';
    case 'signed':
      return 'success';
    case 'failed':
      return 'error';
    case 'queued':
      return 'warning';
    case 'shared':
      return 'info';
    case 'contract_created':
      return 'warning';
    case 'draft':
    default:
      return 'default';
  }
}

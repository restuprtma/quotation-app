import type { QuotationStatus } from '../types';

import i18n from 'i18next';

export function formatCurrency(value: number) {
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'id-ID';
  const currency = i18n.resolvedLanguage === 'en' ? 'USD' : 'IDR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'id-ID';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export function statusColor(status: QuotationStatus) {
  switch (status) {
    case 'draft':
      return 'default';
    case 'shared':
      return 'info';
    case 'signed':
      return 'success';
    case 'contract_created':
      return 'warning';
    default:
      return 'default';
  }
}

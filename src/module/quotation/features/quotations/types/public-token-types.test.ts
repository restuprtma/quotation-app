import type { Quotation } from './index';
import type { QuotationGenerationDetail } from './generation';

import { it, expect, describe } from 'vitest';

import idQuotation from '../../../../../locales/langs/id/quotation.json';
import enQuotation from '../../../../../locales/langs/en/quotation.json';

describe('Public Token Types', () => {
  it('Quotation type contains public_token field', () => {
    const item: Partial<Quotation> = {
      id: 'quo-1',
      public_token: '123e4567-e89b-12d3-a456-426614174000',
    };
    expect(item.public_token).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('QuotationGenerationDetail contains public_token field', () => {
    const detail: Partial<QuotationGenerationDetail> = {
      quotation_id: 'quo-1',
      public_token: '123e4567-e89b-12d3-a456-426614174000',
    };
    expect(detail.public_token).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('contains public link i18n keys in id and en', () => {
    expect((idQuotation.editor as any).copyPublicLink).toBe('Salin Link Publik');
    expect((idQuotation.editor as any).openPublicLink).toBe('Buka Link Publik');
    expect((idQuotation.editor as any).publicLinkCopied).toBe(
      'Link publik berhasil disalin ke clipboard!'
    );
    expect((idQuotation.editor as any).publicLink).toBe('Link Publik');
    expect((idQuotation.rowActions as any).copyPublicLink).toBe('Salin Link Publik');
    expect((idQuotation.rowActions as any).openPublicLink).toBe('Buka Link Publik');

    expect((enQuotation.editor as any).copyPublicLink).toBe('Copy Public Link');
    expect((enQuotation.editor as any).openPublicLink).toBe('Open Public Link');
    expect((enQuotation.editor as any).publicLinkCopied).toBe('Public link copied to clipboard!');
    expect((enQuotation.editor as any).publicLink).toBe('Public Link');
    expect((enQuotation.rowActions as any).copyPublicLink).toBe('Copy Public Link');
    expect((enQuotation.rowActions as any).openPublicLink).toBe('Open Public Link');
  });
});

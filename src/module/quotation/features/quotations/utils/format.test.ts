import { describe, expect, it } from 'vitest';

import { formatCommercialScheme, formatCurrency, statusColor } from './format';

describe('Quotation Formatters', () => {
  describe('formatCurrency', () => {
    it('always formats in IDR Rupiah format', () => {
      const formatted = formatCurrency(150000000);
      expect(formatted).toMatch(/Rp/);
      expect(formatted).toMatch(/150\.000\.000/);
    });

    it('formats 0 as Rp 0', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toMatch(/Rp/);
      expect(formatted).toMatch(/0/);
    });
  });

  describe('formatCommercialScheme', () => {
    const mockT = (key: string) => {
      const map: Record<string, string> = {
        'commercialSchemes.dedicated_squad': 'Dedicated Squad',
        'commercialSchemes.custom_development': 'Custom Software',
        'projectTypes.product_based': 'Product Based',
      };
      return map[key] || key;
    };

    it('translates known commercial scheme', () => {
      expect(formatCommercialScheme('dedicated_squad', 'custom_software', mockT)).toBe('Dedicated Squad');
    });

    it('translates known project type when scheme is missing', () => {
      expect(formatCommercialScheme(null, 'product_based', mockT)).toBe('Product Based');
    });

    it('humanizes solution_type in Title Case when unmapped', () => {
      expect(formatCommercialScheme(null, 'custom_software', mockT)).toBe('Custom Software');
      expect(formatCommercialScheme(null, 'Web Application', mockT)).toBe('Web Application');
    });

    it('never outputs raw translation keys', () => {
      const result = formatCommercialScheme('unknown_scheme', 'unknown_type', mockT);
      expect(result).not.toContain('commercialSchemes.');
      expect(result).not.toContain('projectTypes.');
      expect(result).toBe('Unknown Scheme');
    });
  });

  describe('statusColor', () => {
    it('returns error for failed', () => {
      expect(statusColor('failed')).toBe('error');
    });
    it('returns info for published', () => {
      expect(statusColor('published')).toBe('info');
    });
    it('returns warning for queued', () => {
      expect(statusColor('queued')).toBe('warning');
    });
    it('returns success for signed', () => {
      expect(statusColor('signed')).toBe('success');
    });
    it('returns default for draft', () => {
      expect(statusColor('draft')).toBe('default');
    });
  });
});

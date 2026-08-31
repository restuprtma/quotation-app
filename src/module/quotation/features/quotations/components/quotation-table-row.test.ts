import { it, expect, describe } from 'vitest';

import { paths } from 'src/routes/paths';

import { formatCurrency } from '../utils/format';

describe('QuotationTableRow & List Navigation Specification', () => {
  describe('Routing paths contract', () => {
    it('paths.dashboard.quotation.edit generates correct TipTap Editor URL', () => {
      const quotationId = '123e4567-e89b-12d3-a456-426614174000';
      expect(paths.dashboard.quotation.edit(quotationId)).toBe(`/quotation/${quotationId}/edit`);
    });

    it('paths.dashboard.quotation.prompt generates correct Prompt URL', () => {
      expect(paths.dashboard.quotation.prompt).toBe('/quotation');
      expect(paths.dashboard.quotation.root).toBe('/quotation');
    });
  });

  describe('Budget Column Graceful Null & Number Handling', () => {
    function resolveDisplayBudget(row: {
      budget_maximum?: number | null;
      revision?: { budget: number } | null;
    }) {
      const rawBudget = row.budget_maximum ?? row.revision?.budget;
      const budget = typeof rawBudget === 'number' && !Number.isNaN(rawBudget) ? rawBudget : null;
      return budget !== null ? formatCurrency(budget) : '—';
    }

    it('formats positive budget_maximum safely', () => {
      const result = resolveDisplayBudget({ budget_maximum: 50000000 });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
      expect(result).toMatch(/50[,.]000[,.]000/);
    });

    it('formats 0 budget_maximum safely without falling back to dash', () => {
      const result = resolveDisplayBudget({ budget_maximum: 0 });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
      expect(result).toMatch(/0/);
    });

    it('gracefully returns "—" when budget_maximum is null and no revision exists', () => {
      const result = resolveDisplayBudget({ budget_maximum: null, revision: null });
      expect(result).toBe('—');
    });

    it('gracefully returns "—" when budget_maximum is undefined and no revision exists', () => {
      const result = resolveDisplayBudget({});
      expect(result).toBe('—');
    });

    it('falls back to revision.budget when budget_maximum is null', () => {
      const result = resolveDisplayBudget({
        budget_maximum: null,
        revision: { budget: 25000000 },
      });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
      expect(result).toMatch(/25[,.]000[,.]000/);
    });
  });
});

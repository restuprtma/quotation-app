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

  describe('QuotationTableRow Display Logic', () => {
    function resolveDisplayInvestment(row: {
      total_investment?: number | null;
      budget_maximum?: number | null;
      revision?: { budget: number } | null;
    }) {
      const rawAmount = row.total_investment ?? row.budget_maximum ?? row.revision?.budget;
      const amount = typeof rawAmount === 'number' && !Number.isNaN(rawAmount) && rawAmount > 0
        ? rawAmount
        : null;
      return amount !== null ? formatCurrency(amount) : '—';
    }

    function resolveDisplayClient(row: { client_name?: string | null; pic_name?: string | null }) {
      const client = row.client_name?.trim();
      const pic = row.pic_name?.trim();
      const primary = client || pic || '—';
      const secondary = client && pic && client !== pic ? pic : null;
      return { primary, secondary };
    }

    it('prefers total_investment over budget_maximum', () => {
      const res = resolveDisplayInvestment({ total_investment: 120000000, budget_maximum: 150000000 });
      expect(res).toMatch(/120\.000\.000/);
    });

    it('falls back to budget_maximum when total_investment is null', () => {
      const res = resolveDisplayInvestment({ total_investment: null, budget_maximum: 80000000 });
      expect(res).toMatch(/80\.000\.000/);
    });

    it('returns dash when total is 0 or null', () => {
      expect(resolveDisplayInvestment({ total_investment: 0 })).toBe('—');
      expect(resolveDisplayInvestment({})).toBe('—');
    });

    it('resolves primary organization and secondary PIC', () => {
      const res = resolveDisplayClient({
        client_name: 'PT Citra Niaga Perkasa',
        pic_name: 'Bapak Reza Mahardika',
      });
      expect(res.primary).toBe('PT Citra Niaga Perkasa');
      expect(res.secondary).toBe('Bapak Reza Mahardika');
    });

    it('does not duplicate subtitle if client_name and pic_name are identical', () => {
      const res = resolveDisplayClient({
        client_name: 'Bapak Reza Mahardika',
        pic_name: 'Bapak Reza Mahardika',
      });
      expect(res.primary).toBe('Bapak Reza Mahardika');
      expect(res.secondary).toBeNull();
    });

    it('falls back to dash when both client_name and pic_name are empty', () => {
      const res = resolveDisplayClient({ client_name: null, pic_name: null });
      expect(res.primary).toBe('—');
      expect(res.secondary).toBeNull();
    });
  });
});


import type { TalentOutsourcingInput } from '../types';

import { it, expect, describe } from 'vitest';

import {
  talentCostLineTotal,
  calculateTalentDraftTotals,
  normalizeTalentOutsourcing,
} from './talent-outsourcing';

const bpjs: TalentOutsourcingInput = {
  engagement_mode: 'manpower_supply',
  document_number: ' BPJS/1 ',
  service_name: ' Data ',
  quotation_date: '2026-09-09',
  tax_treatment: 'bpjs_dpp_ppn_12',
  cost_groups: [
    {
      category: 'personnel',
      title: ' Personil ',
      items: [
        {
          name: 'Project Manager',
          quantity: 1,
          quantity_unit: 'Orang',
          period_count: 32,
          period_unit: 'workday',
          unit_rate: 25_000_000,
        },
        {
          name: 'Engineer',
          quantity: 1,
          quantity_unit: 'Orang',
          period_count: 1,
          period_unit: 'month',
          unit_rate: 532_240_000,
        },
      ],
    },
    {
      category: 'non_personnel',
      title: 'Non',
      items: [
        {
          name: 'Laporan',
          quantity: 1,
          quantity_unit: 'Laporan',
          period_count: 1,
          period_unit: 'month',
          unit_rate: 36_000_000,
        },
      ],
    },
  ],
  preparation_items: [],
  preparation_discount_amount: 0,
  show_preparation_discount_row: false,
  squad_items: [],
  scope_blocks: [{ title: 'Scope', timeline: '1 bulan' }],
  payment_schedule: [
    {
      work_period: '1',
      terms: 'DP',
      invoice_date_label: 'now',
      due_date_label: 'H+14',
      nominal: 675_146_400,
    },
  ],
  payment_due_days: 14,
  limitation_codes: ['out_of_pocket'],
};
describe('talent outsourcing pure rules', () => {
  it('calculates workday and BPJS DPP/PPN integer totals', () => {
    expect(talentCostLineTotal(bpjs.cost_groups![0].items[0])).toBe(40_000_000);
    expect(calculateTalentDraftTotals(bpjs)).toMatchObject({
      total_before_tax: 608_240_000,
      dpp_amount: 557_553_333,
      tax_amount: 66_906_400,
      grand_total: 675_146_400,
      payment_total: 675_146_400,
      is_balanced: true,
    });
  });
  it('rejects fractional workdays and preserves ordered normalized rows', () => {
    expect(
      talentCostLineTotal({
        ...bpjs.cost_groups![0].items[0],
        period_count: 1,
        unit_rate: 25_000_001,
      })
    ).toBeNull();
    const normalized = normalizeTalentOutsourcing(bpjs);
    expect(normalized.document_number).toBe('BPJS/1');
    expect(normalized.cost_groups?.map((g) => g.category)).toEqual(['personnel', 'non_personnel']);
  });
  it('clears hidden mode-specific values', () => {
    const normalized = normalizeTalentOutsourcing({
      ...bpjs,
      engagement_mode: 'managed_squad',
      cost_groups: bpjs.cost_groups,
      preparation_items: [],
      squad_items: [{ role: 'Developer', monthly_rate: 1, headcount: 1, period_months: 1 }],
    });
    expect(normalized.cost_groups).toEqual([]);
  });
});

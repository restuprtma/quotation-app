import { it, expect, describe } from 'vitest';

import { isModeBlank } from './standalone-maintenance-generation-form';
import { LIPUTAN6_SAMPLE_TASKS } from './maintenance-hourly-task-editor';
import { reorderItems, NEX_HEALTH_SAMPLE_DEFECT_GROUPS } from './defect-matrix-editor';
import { defectItemSchema, defectGroupSchema } from './standalone-maintenance-form-model';

describe('defect-matrix-editor and maintenance editors logic', () => {
  describe('Nex Health sample blueprint', () => {
    it('contains exactly the 4 blueprint rows (1.1, 1.2, 1.3, 4.1) from resume doc', () => {
      expect(NEX_HEALTH_SAMPLE_DEFECT_GROUPS).toHaveLength(2);

      const patientGroup = NEX_HEALTH_SAMPLE_DEFECT_GROUPS[0];
      expect(patientGroup.title).toBe('Modul Pasien');
      expect(patientGroup.items).toHaveLength(3);

      const item11 = patientGroup.items[0];
      expect(item11.item_number).toBe('1.1');
      expect(item11.priority).toBe('P0');
      expect(item11.function).toBe('Melihat riwayat medis pasien');
      expect(item11.screen_flow).toBe('Pasien > Medical History');
      expect(item11.existing).toBe('Hanya mencantumkan catatan registrasi awal');
      expect(item11.improvement).toBe(
        'Mencantumkan seluruh riwayat SOAP (Dokter, Terapis, Perawat)'
      );
      expect(item11.reference).toBe('Ref 1.01');

      const item12 = patientGroup.items[1];
      expect(item12.item_number).toBe('1.2');
      expect(item12.priority).toBe('P0');
      expect(item12.reference).toBe('Ref 1.02');

      const item13 = patientGroup.items[2];
      expect(item13.item_number).toBe('1.3');
      expect(item13.priority).toBe('P1');
      expect(item13.reference).toBe('Ref 1.03');

      const treatmentGroup = NEX_HEALTH_SAMPLE_DEFECT_GROUPS[1];
      expect(treatmentGroup.title).toBe('Modul Treatment');
      expect(treatmentGroup.items).toHaveLength(1);

      const item41 = treatmentGroup.items[0];
      expect(item41.item_number).toBe('4.1');
      expect(item41.priority).toBe('P0');
      expect(item41.function).toBe('Akses harga COGS');
      expect(item41.screen_flow).toBe('Treatment > Edit Treatment');
      expect(item41.existing).toBe('Melekat pada hak akses edit treatment');
      expect(item41.improvement).toBe('Dibuat hak akses terpisah khusus role tertentu');
      expect(item41.reference).toBe('Ref 4.01');
    });

    it('passes defectGroupSchema validation for all Nex sample groups', () => {
      for (const group of NEX_HEALTH_SAMPLE_DEFECT_GROUPS) {
        const parsed = defectGroupSchema.safeParse(group);
        expect(parsed.success).toBe(true);
      }
    });

    it('handles blank reference as optional and valid', () => {
      const itemWithoutRef = {
        item_number: '2.1',
        priority: 'P2' as const,
        function: 'Pencarian Obat',
        screen_flow: 'Farmasi > Resep',
        existing: 'Pencarian lambat',
        improvement: 'Indeks pencarian nama generik',
        reference: '',
      };

      const parsed = defectItemSchema.safeParse(itemWithoutRef);
      expect(parsed.success).toBe(true);

      const itemWithUndefinedRef = {
        item_number: '2.2',
        priority: 'P0' as const,
        function: 'Fungsi Test',
        screen_flow: 'Menu Test',
        existing: 'Error',
        improvement: 'Fix error',
      };

      const parsed2 = defectItemSchema.safeParse(itemWithUndefinedRef);
      expect(parsed2.success).toBe(true);
    });

    it('strictly restricts priority to P0, P1, P2 without severity descriptions', () => {
      const validP0 = defectItemSchema.safeParse({
        item_number: '1.1',
        priority: 'P0',
        function: 'Func',
        screen_flow: 'Screen',
        existing: 'Exist',
        improvement: 'Impr',
      });
      expect(validP0.success).toBe(true);

      const invalidPriority = defectItemSchema.safeParse({
        item_number: '1.1',
        priority: 'P0 - Critical',
        function: 'Func',
        screen_flow: 'Screen',
        existing: 'Exist',
        improvement: 'Impr',
      });
      expect(invalidPriority.success).toBe(false);
    });
  });

  describe('nested reorderItems helper', () => {
    it('moves item up and down cleanly without mutating input', () => {
      const items = ['1.1', '1.2', '1.3', '1.4'];

      // Move 1.2 up (index 1 to index 0)
      const movedUp = reorderItems(items, 1, 0);
      expect(movedUp).toEqual(['1.2', '1.1', '1.3', '1.4']);
      expect(items).toEqual(['1.1', '1.2', '1.3', '1.4']); // immutable

      // Move 1.1 down (index 0 to index 2)
      const movedDown = reorderItems(items, 0, 2);
      expect(movedDown).toEqual(['1.2', '1.3', '1.1', '1.4']);
    });
  });

  describe('Liputan6 sample tasks', () => {
    it('loads exactly the 5 sheet tasks with proper platforms and half-unit hours', () => {
      expect(LIPUTAN6_SAMPLE_TASKS).toHaveLength(5);

      expect(LIPUTAN6_SAMPLE_TASKS[0].description).toBe('fix app link');
      expect(LIPUTAN6_SAMPLE_TASKS[0].platform).toBe('Android / iOS');
      expect(LIPUTAN6_SAMPLE_TASKS[0].hours_half_units).toBe(16); // 8 hours

      expect(LIPUTAN6_SAMPLE_TASKS[1].description).toBe('update deep link parser');
      expect(LIPUTAN6_SAMPLE_TASKS[1].platform).toBe('Android');
      expect(LIPUTAN6_SAMPLE_TASKS[1].hours_half_units).toBe(8); // 4 hours

      expect(LIPUTAN6_SAMPLE_TASKS[2].description).toBe('fix iOS share URL');
      expect(LIPUTAN6_SAMPLE_TASKS[2].platform).toBe('iOS');
      expect(LIPUTAN6_SAMPLE_TASKS[2].hours_half_units).toBe(8); // 4 hours

      expect(LIPUTAN6_SAMPLE_TASKS[3].description).toBe('testing Android/iOS');
      expect(LIPUTAN6_SAMPLE_TASKS[3].platform).toBe('QA Test');
      expect(LIPUTAN6_SAMPLE_TASKS[3].hours_half_units).toBe(4); // 2 hours

      expect(LIPUTAN6_SAMPLE_TASKS[4].description).toBe('upload Play Store/App Store');
      expect(LIPUTAN6_SAMPLE_TASKS[4].platform).toBe('Mobile DevOps');
      expect(LIPUTAN6_SAMPLE_TASKS[4].hours_half_units).toBe(4); // 2 hours
    });
  });

  describe('isModeBlank helper for safe mode switch', () => {
    it('detects blank vs non-blank retainer data', () => {
      // Completely blank initial retainer
      const blankRetainer = {
        retainer_items: [{ name: '', monthly_rate: 0, fte_quarters: 4, period_months: 1 }],
        defect_groups: [
          {
            title: '',
            items: [
              {
                item_number: '',
                priority: 'P0' as const,
                function: '',
                screen_flow: '',
                existing: '',
                improvement: '',
                reference: '',
              },
            ],
          },
        ],
      };
      expect(isModeBlank('retainer', blankRetainer)).toBe(true);

      // Non-blank retainer role name
      const withRole = {
        ...blankRetainer,
        retainer_items: [
          { name: 'Senior Dev', monthly_rate: 0, fte_quarters: 4, period_months: 1 },
        ],
      };
      expect(isModeBlank('retainer', withRole)).toBe(false);

      // Non-blank defect function
      const withDefect = {
        ...blankRetainer,
        defect_groups: [
          {
            title: 'Group 1',
            items: [
              {
                item_number: '1.1',
                priority: 'P0' as const,
                function: 'Fix login',
                screen_flow: 'Auth',
                existing: 'Broken',
                improvement: 'Fixed',
                reference: '',
              },
            ],
          },
        ],
      };
      expect(isModeBlank('retainer', withDefect)).toBe(false);
    });

    it('detects blank vs non-blank hourly data', () => {
      // Blank hourly
      const blankHourly = {
        hourly_cost_items: [],
        hourly_tasks: [],
      };
      expect(isModeBlank('hourly_task', blankHourly)).toBe(true);

      // Non-blank hourly cost item
      const withCost = {
        hourly_cost_items: [
          {
            name: 'QA Engineer',
            display_monthly_rate: 10_000_000,
            headcount: 1,
            hours_half_units: 4,
            quoted_line_total: 500_000,
          },
        ],
        hourly_tasks: [],
      };
      expect(isModeBlank('hourly_task', withCost)).toBe(false);

      // Non-blank hourly task
      const withTask = {
        hourly_cost_items: [],
        hourly_tasks: [
          {
            description: 'fix app link',
            platform: 'Android',
            hours_half_units: 16,
          },
        ],
      };
      expect(isModeBlank('hourly_task', withTask)).toBe(false);
    });
  });
});

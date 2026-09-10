import type {
  KioskQueueExpertInput,
  KioskQueueScopePhaseInput,
  KioskQueueTimelineRowInput,
} from '../types';

import { it, expect, describe } from 'vitest';

import {
  addScopePhase,
  reorderPhases,
  addTimelineRow,
  addDeliverable,
  removeScopePhase,
  removeTimelineRow,
  removeDeliverable,
  reorderTimelineRows,
  addExpertRequirement,
  removeExpertRequirement,
  reorderExpertRequirements,
} from './kiosk-queue-scope-editor';

describe('kiosk-queue-scope-editor data manipulations and contracts', () => {
  describe('Government Scope Phases', () => {
    it('appends a new phase without mutating existing phases', () => {
      const phases: KioskQueueScopePhaseInput[] = [
        { title: 'Fase 1: Analisis', deliverables: ['Dokumen SRS'] },
      ];

      const next = addScopePhase(phases);
      expect(next).toHaveLength(2);
      expect(next[0]).toEqual({ title: 'Fase 1: Analisis', deliverables: ['Dokumen SRS'] });
      expect(next[1].title).toBe('');
      expect(next[1].deliverables).toEqual(['']);
      expect(phases).toHaveLength(1); // immutability
    });

    it('removes phase by index cleanly', () => {
      const phases: KioskQueueScopePhaseInput[] = [
        { title: 'Fase 1', deliverables: ['D1'] },
        { title: 'Fase 2', deliverables: ['D2'] },
        { title: 'Fase 3', deliverables: ['D3'] },
      ];

      const next = removeScopePhase(phases, 1);
      expect(next).toHaveLength(2);
      expect(next[0].title).toBe('Fase 1');
      expect(next[1].title).toBe('Fase 3');
    });

    it('reorders phases without losing text or deliverables', () => {
      const phases: KioskQueueScopePhaseInput[] = [
        { title: 'Fase 1: Persiapan', deliverables: ['Dokumen 1A', 'Dokumen 1B'] },
        { title: 'Fase 2: Instalasi Kiosk', deliverables: ['Unit Kiosk Terpasang'] },
      ];

      const swapped = reorderPhases(phases, 0, 1);
      expect(swapped[0].title).toBe('Fase 2: Instalasi Kiosk');
      expect(swapped[0].deliverables).toEqual(['Unit Kiosk Terpasang']);
      expect(swapped[1].title).toBe('Fase 1: Persiapan');
      expect(swapped[1].deliverables).toEqual(['Dokumen 1A', 'Dokumen 1B']);
    });

    it('adds and removes deliverables inside a phase while preserving multiline newlines', () => {
      let deliverables = ['Baris 1\nBaris 2 dengan rincian\nBaris 3'];

      deliverables = addDeliverable(deliverables);
      expect(deliverables).toHaveLength(2);
      expect(deliverables[0]).toBe('Baris 1\nBaris 2 dengan rincian\nBaris 3');
      expect(deliverables[1]).toBe('');

      deliverables = removeDeliverable(deliverables, 0);
      expect(deliverables).toHaveLength(1);
      expect(deliverables[0]).toBe('');
    });
  });

  describe('Government Expert Requirements', () => {
    it('appends expert requirement row with valid defaults', () => {
      const experts: KioskQueueExpertInput[] = [
        {
          role: 'Project Manager',
          headcount: 1,
          duration_label: '3 Bulan',
          minimum_qualification: 'S1 Sistem Informasi',
        },
      ];

      const next = addExpertRequirement(experts);
      expect(next).toHaveLength(2);
      expect(next[1].role).toBe('');
      expect(next[1].headcount).toBe(1);
      expect(next[1].duration_label).toBe('');
      expect(next[1].minimum_qualification).toBe('');
    });

    it('removes and reorders expert requirement rows without data loss', () => {
      const experts: KioskQueueExpertInput[] = [
        { role: 'Role A', headcount: 1, duration_label: '1 Bulan', minimum_qualification: 'Q-A' },
        { role: 'Role B', headcount: 2, duration_label: '2 Bulan', minimum_qualification: 'Q-B' },
      ];

      const swapped = reorderExpertRequirements(experts, 0, 1);
      expect(swapped[0].role).toBe('Role B');
      expect(swapped[0].headcount).toBe(2);
      expect(swapped[1].role).toBe('Role A');

      const removed = removeExpertRequirement(swapped, 1);
      expect(removed).toHaveLength(1);
      expect(removed[0].role).toBe('Role B');
    });
  });

  describe('Private Timeline Rows', () => {
    it('appends, removes, and reorders private timeline rows with multiline text', () => {
      const rows: KioskQueueTimelineRowInput[] = [
        {
          description: 'Spesifikasi & Desain Kiosk:\n- Wireframe UI\n- Flow antrian',
          timeline: 'Bulan 1',
        },
        {
          description: 'Integrasi Hardware Printer & Barcode Scanner',
          timeline: 'Bulan 2',
        },
      ];

      const next = addTimelineRow(rows);
      expect(next).toHaveLength(3);
      expect(next[2].description).toBe('');
      expect(next[2].timeline).toBe('');

      const swapped = reorderTimelineRows(next, 0, 1);
      expect(swapped[0].timeline).toBe('Bulan 2');
      expect(swapped[1].description).toContain('Wireframe UI\n- Flow antrian');

      const removed = removeTimelineRow(swapped, 0);
      expect(removed).toHaveLength(2);
      expect(removed[0].timeline).toBe('Bulan 1');
    });
  });
});

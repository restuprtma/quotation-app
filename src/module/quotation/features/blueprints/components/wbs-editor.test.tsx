// @vitest-environment happy-dom
import type { WBS, CrossReference } from '../types/bundle';

import React from 'react';
import { it, vi, expect, describe, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { WbsEditor } from './wbs-editor';

// ----------------------------------------------------------------------
// Mock ResizeObserver & Happy-DOM CSS Selector Polyfill for MUI X Tree View
// ----------------------------------------------------------------------

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  const origQuerySelectorAll = Element.prototype.querySelectorAll;
  Element.prototype.querySelectorAll = function polyfillQuerySelectorAll(selectors: string) {
    if (typeof selectors === 'string' && selectors.includes('[role="treeitem"]:not(')) {
      const match = selectors.match(/\*\[id="([^"]+)"\]/);
      const targetId = match ? match[1] : null;
      const allTreeItems = Array.from(
        origQuerySelectorAll.call(this, '[role="treeitem"]')
      ) as HTMLElement[];

      if (targetId) {
        return allTreeItems.filter((el) => {
          const parentItem = el.parentElement?.closest('[role="treeitem"]');
          return parentItem != null && parentItem.id === targetId;
        }) as any;
      }
      return allTreeItems.filter((el) => {
        const parentItem = el.parentElement?.closest('[role="treeitem"]');
        return parentItem == null;
      }) as any;
    }
    return origQuerySelectorAll.call(this, selectors);
  };
});

afterEach(() => {
  cleanup();
});

// ----------------------------------------------------------------------
// Test Fixtures
// ----------------------------------------------------------------------

const mockWbs: WBS = {
  modules: [
    {
      id: 'mod-queue-core',
      name: 'Modul Core Queue Engine',
      description: 'Mesin utama alokasi nomor antrian dan state transition',
      priority: 'high',
      dependencies: [],
      references: ['journey.activity.act-ambil-nomor', 'architecture.node.node-redis-queue'],
      features: [
        {
          id: 'feat-alokasi-nomor',
          name: 'Alokasi Nomor Tiket',
          description: 'Menerbitkan nomor antrian berurutan per kategori',
          acceptance_criteria: [
            'Nomor antrian unik per tanggal dan kategori layanan',
            'Sistem menolak alokasi nomor jika kuota harian habis',
          ],
        },
        {
          id: 'feat-status-monitoring',
          name: 'Monitoring Status Antrian Realtime',
          description: 'Sinkronisasi status antrian ke display dan kiosk',
          acceptance_criteria: ['Perubahan status tiket terpancar via WebSocket < 500ms'],
        },
      ],
    },
    {
      id: 'mod-counter-operator',
      name: 'Modul Operator Loket',
      description: 'Interface petugas loket untuk memanggil dan melayani nomor antrian',
      priority: 'medium',
      dependencies: ['mod-queue-core'],
      references: ['journey.activity.act-panggil-loket'],
      features: [
        {
          id: 'feat-panggil-berikutnya',
          name: 'Panggil Nomor Berikutnya',
          description: 'Tombol panggil antrian terdepan sesuai prioritas',
          acceptance_criteria: [
            'Memanggil nomor urut teratas yang berstatus WAITING',
            'Mengubah status tiket menjadi CALLING',
          ],
        },
      ],
    },
    {
      id: 'mod-analytics-reporting',
      name: 'Modul Analitik & Rekapitulasi',
      description: 'Laporan waktu tunggu, SLA layanan, dan beban kerja loket',
      priority: 'low',
      dependencies: ['mod-queue-core', 'mod-counter-operator'],
      references: [],
      features: [
        {
          id: 'feat-rekap-harian',
          name: 'Ekspor Rekap Harian',
          description: 'Mengunduh laporan rekapitulasi harian dalam format Excel/PDF',
          acceptance_criteria: [
            'Laporan mencakup total tiket, rata-rata waktu layan, dan tiket batal',
          ],
        },
      ],
    },
  ],
};

const mockCrossRefs: CrossReference[] = [
  {
    id: 'xref-1',
    source_ref: 'wbs.module.mod-queue-core',
    target_ref: 'architecture.node.node-redis-queue',
    relation_type: 'implements',
    description: 'Core Queue Engine diimplementasikan pada cluster Redis Queue',
  },
  {
    id: 'xref-2',
    source_ref: 'wbs.module.mod-counter-operator',
    target_ref: 'journey.activity.act-panggil-loket',
    relation_type: 'interacts_with',
    description: 'Operator loket berinteraksi langsung dengan aktivitas panggil loket',
  },
];

const mockReferenceOptions = [
  {
    value: 'journey.activity.act-ambil-nomor',
    label: '[Journey Activity] Ambil Nomor (act-ambil-nomor)',
    section: 'journey' as const,
    id: 'act-ambil-nomor',
  },
  {
    value: 'journey.activity.act-panggil-loket',
    label: '[Journey Activity] Panggil Loket (act-panggil-loket)',
    section: 'journey' as const,
    id: 'act-panggil-loket',
  },
  {
    value: 'architecture.node.node-redis-queue',
    label: '[Architecture Node] Redis Queue (node-redis-queue)',
    section: 'architecture' as const,
    id: 'node-redis-queue',
  },
];

// ----------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------

describe('WbsEditor (Task 8.01)', () => {
  it('renders modules, features, acceptance criteria, priorities, and cross references', () => {
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={vi.fn()}
        referenceOptions={mockReferenceOptions}
      />
    );

    // Header metrics
    expect(screen.getByTestId('wbs-editor')).toBeTruthy();
    expect(screen.getByText('Modul Core Queue Engine')).toBeTruthy();
    expect(screen.getByText('Modul Operator Loket')).toBeTruthy();
    expect(screen.getByText('Modul Analitik & Rekapitulasi')).toBeTruthy();

    // Priority badges
    expect(screen.getByText(/Prioritas: high/i)).toBeTruthy();
    expect(screen.getByText(/Prioritas: medium/i)).toBeTruthy();
    expect(screen.getByText(/Prioritas: low/i)).toBeTruthy();

    // Cross references
    expect(screen.getByText(/Cross-References/i)).toBeTruthy();
    expect(
      screen.getByText('Core Queue Engine diimplementasikan pada cluster Redis Queue')
    ).toBeTruthy();
  });

  it('allows adding a new WBS module with high priority, dependencies, and references', () => {
    const handleChange = vi.fn();
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={handleChange}
        referenceOptions={mockReferenceOptions}
      />
    );

    const addModBtn = screen.getByRole('button', { name: /Tambah Module/i });
    fireEvent.click(addModBtn);

    // Dialog appears
    expect(screen.getByRole('heading', { name: /Tambah Module WBS/i })).toBeTruthy();

    const nameInput = screen.getByLabelText(/Nama Module/i);
    fireEvent.change(nameInput, { target: { value: 'Modul Integrasi SMS Notifikasi' } });

    const descInput = screen.getByLabelText(/Deskripsi Module/i);
    fireEvent.change(descInput, {
      target: { value: 'Mengirimkan notifikasi SMS reminder antrian' },
    });

    const saveBtn = screen.getByRole('button', { name: /Simpan Module/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWbs: WBS = handleChange.mock.calls[0][0];
    const updatedRefs: CrossReference[] = handleChange.mock.calls[0][1];

    expect(updatedWbs.modules).toHaveLength(4);
    const newMod = updatedWbs.modules[3];
    expect(newMod.name).toBe('Modul Integrasi SMS Notifikasi');
    expect(newMod.id).toMatch(/^mod-/);
    expect(updatedRefs).toEqual(mockCrossRefs);
  });

  it('allows editing an existing module name, description, priority, and dependencies', () => {
    const handleChange = vi.fn();
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={handleChange}
        referenceOptions={mockReferenceOptions}
      />
    );

    const editModBtn = screen.getByRole('button', {
      name: /Edit Module Modul Core Queue Engine/i,
    });
    fireEvent.click(editModBtn);

    expect(screen.getByRole('heading', { name: /Edit Module WBS/i })).toBeTruthy();

    const nameInput = screen.getByLabelText(/Nama Module/i);
    fireEvent.change(nameInput, { target: { value: 'Modul Core Queue Engine (Updated)' } });

    const saveBtn = screen.getByRole('button', { name: /Simpan Module/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWbs: WBS = handleChange.mock.calls[0][0];
    expect(updatedWbs.modules[0].name).toBe('Modul Core Queue Engine (Updated)');
    expect(updatedWbs.modules[0].id).toBe('mod-queue-core'); // Stable ID preserved
  });

  it('allows reordering modules up and down while preserving stable IDs and dependencies', () => {
    const handleChange = vi.fn();
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={handleChange}
        referenceOptions={mockReferenceOptions}
      />
    );

    // Reorder second module up
    const moveUpBtn = screen.getByRole('button', {
      name: /Geser Atas Module Modul Operator Loket/i,
    });
    fireEvent.click(moveUpBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWbs: WBS = handleChange.mock.calls[0][0];
    expect(updatedWbs.modules[0].id).toBe('mod-counter-operator');
    expect(updatedWbs.modules[1].id).toBe('mod-queue-core');
  });

  it('allows adding, editing, and deleting a feature within a module', () => {
    const handleChange = vi.fn();
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={handleChange}
        referenceOptions={mockReferenceOptions}
      />
    );

    // Add feature to first module
    const addFeatBtn = screen.getByRole('button', {
      name: /Tambah Feature ke Module Modul Core Queue Engine/i,
    });
    fireEvent.click(addFeatBtn);

    expect(screen.getByRole('heading', { name: /Tambah Feature/i })).toBeTruthy();

    const featNameInput = screen.getByLabelText(/Nama Feature/i);
    fireEvent.change(featNameInput, { target: { value: 'Fitur Prioritas Lansia' } });

    const saveFeatBtn = screen.getByRole('button', { name: /Simpan Feature/i });
    fireEvent.click(saveFeatBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWbs: WBS = handleChange.mock.calls[0][0];
    const mod1Features = updatedWbs.modules[0].features;
    expect(mod1Features).toHaveLength(3);
    expect(mod1Features[2].name).toBe('Fitur Prioritas Lansia');
    expect(mod1Features[2].id).toMatch(/^feat-/);
  });

  it('allows adding and editing acceptance criteria inside a feature', () => {
    const handleChange = vi.fn();
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={handleChange}
        referenceOptions={mockReferenceOptions}
      />
    );

    // Edit feature that has acceptance criteria
    const editFeatBtn = screen.getByRole('button', {
      name: /Edit Feature Alokasi Nomor Tiket/i,
    });
    fireEvent.click(editFeatBtn);

    expect(screen.getByRole('heading', { name: /Edit Feature/i })).toBeTruthy();

    // Add new criterion in dialog
    const critInput = screen.getByLabelText(/Input Kriteria/i);
    fireEvent.change(critInput, { target: { value: 'Sistem mencetak barcode pada tiket fisik' } });

    const addCritBtn = screen.getByRole('button', { name: /Tambah Kriteria/i });
    fireEvent.click(addCritBtn);

    const saveFeatBtn = screen.getByRole('button', { name: /Simpan Feature/i });
    fireEvent.click(saveFeatBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWbs: WBS = handleChange.mock.calls[0][0];
    const updatedCriteria = updatedWbs.modules[0].features[0].acceptance_criteria;
    expect(updatedCriteria).toHaveLength(3);
    expect(updatedCriteria[2]).toBe('Sistem mencetak barcode pada tiket fisik');
  });

  it('prevents deleting a module that is used as dependency by another module or referenced in cross_references', () => {
    const handleChange = vi.fn();
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={handleChange}
        referenceOptions={mockReferenceOptions}
      />
    );

    // mod-queue-core is dependency for mod-counter-operator AND referenced in xref-1
    const delModBtn = screen.getByRole('button', {
      name: /Hapus Module Modul Core Queue Engine/i,
    });
    fireEvent.click(delModBtn);

    // Error alert is shown, onChange is NOT called
    expect(handleChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/tidak dapat dihapus karena menjadi dependency bagi module lain/i)
    ).toBeTruthy();
  });

  it('detects cyclic dependencies (A -> B -> A) and renders prominent cycle warning alert', () => {
    const cyclicWbs: WBS = {
      modules: [
        {
          id: 'mod-a',
          name: 'Modul Alpha',
          description: 'Desc A',
          priority: 'high',
          dependencies: ['mod-b'],
          references: [],
          features: [
            { id: 'feat-a', name: 'Fitur A', description: '', acceptance_criteria: ['Crit A'] },
          ],
        },
        {
          id: 'mod-b',
          name: 'Modul Beta',
          description: 'Desc B',
          priority: 'medium',
          dependencies: ['mod-a'],
          references: [],
          features: [
            { id: 'feat-b', name: 'Fitur B', description: '', acceptance_criteria: ['Crit B'] },
          ],
        },
      ],
    };

    render(
      <WbsEditor
        wbs={cyclicWbs}
        crossReferences={[]}
        onChange={vi.fn()}
        referenceOptions={mockReferenceOptions}
      />
    );

    // Prominent cycle alert is visible
    expect(screen.getAllByText(/Terdeteksi Siklus Dependensi/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/mod-a/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/mod-b/i).length).toBeGreaterThan(0);
  });

  it('allows adding, editing, and deleting cross-references', () => {
    const handleChange = vi.fn();
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={handleChange}
        referenceOptions={mockReferenceOptions}
      />
    );

    const addXrefBtn = screen.getByRole('button', { name: /Tambah Cross Reference/i });
    fireEvent.click(addXrefBtn);

    expect(screen.getByRole('heading', { name: /Tambah Cross Reference/i })).toBeTruthy();

    const descInput = screen.getByLabelText(/Deskripsi Cross Reference/i);
    fireEvent.change(descInput, { target: { value: 'Relasi baru test QA' } });

    const saveXrefBtn = screen.getByRole('button', { name: /Simpan Cross Reference/i });
    fireEvent.click(saveXrefBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedRefs: CrossReference[] = handleChange.mock.calls[0][1];
    expect(updatedRefs).toHaveLength(3);
    expect(updatedRefs[2].id).toMatch(/^xref-/);
    expect(updatedRefs[2].description).toBe('Relasi baru test QA');
  });

  it('hides edit and mutation actions when readOnly is true (mobile/read-only mode)', () => {
    render(
      <WbsEditor
        wbs={mockWbs}
        crossReferences={mockCrossRefs}
        onChange={vi.fn()}
        referenceOptions={mockReferenceOptions}
        readOnly
      />
    );

    // Mutation buttons should not be in document
    expect(screen.queryByRole('button', { name: /Tambah Module/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Tambah Cross Reference/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Edit Module/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Hapus Module/i })).toBeNull();
  });
});

// @vitest-environment happy-dom
import type { StateMachine } from '../types/bundle';

import React from 'react';
import { it, vi, expect, describe, afterEach, beforeAll } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';

import { StateMachineEditor } from './state-machine-editor';

// ----------------------------------------------------------------------
// Mock ResizeObserver for happy-dom
// ----------------------------------------------------------------------

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

// ----------------------------------------------------------------------
// Test Fixtures
// ----------------------------------------------------------------------

const mockStateMachine: StateMachine = {
  entity: 'Tiket Antrean Layanan',
  initial_state: 'state-menunggu-verifikasi',
  states: [
    {
      id: 'state-menunggu-verifikasi',
      label: 'Menunggu Verifikasi',
      type: 'normal',
      layout: { x: 100, y: 150 },
    },
    {
      id: 'state-dalam-pelayanan',
      label: 'Dalam Pelayanan',
      type: 'normal',
      layout: { x: 400, y: 150 },
    },
    {
      id: 'state-selesai',
      label: 'Pelayanan Selesai',
      type: 'terminal',
      layout: { x: 700, y: 100 },
    },
    {
      id: 'state-batal',
      label: 'Tiket Dibatalkan',
      type: 'exception',
      layout: { x: 700, y: 250 },
    },
  ],
  transitions: [
    {
      id: 'trans-panggil-loket',
      source: 'state-menunggu-verifikasi',
      target: 'state-dalam-pelayanan',
      event: 'Panggil Nomor Antrean',
      actor: 'Petugas Loket',
      guard: 'Loket dalam keadaan siap',
      actions: ['Catat waktu panggilan', 'Kirim sinyal audio display'],
    },
    {
      id: 'trans-selesaikan-layanan',
      source: 'state-dalam-pelayanan',
      target: 'state-selesai',
      event: 'Konfirmasi Selesai',
      actor: 'Petugas Loket',
      guard: 'Dokumen layanan telah diserahkan',
      actions: ['Cetak bukti pelayanan', 'Update status antrean selesai'],
    },
    {
      id: 'trans-batalkan-antrean',
      source: 'state-menunggu-verifikasi',
      target: 'state-batal',
      event: 'Batal oleh Pemohon',
      actor: 'Pemohon Layanan',
      guard: 'Belum dipanggil oleh petugas',
      actions: ['Kirim notifikasi pembatalan'],
    },
  ],
};

describe('StateMachineEditor (Task 6.01 RED Model & UI Tests)', () => {
  it('renders state machine entity, initial state selector, states, transitions and canvas toolbar', () => {
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={vi.fn()} />);

    // Container exists
    expect(screen.getByTestId('state-machine-editor')).toBeTruthy();

    // Canvas exists
    expect(screen.getByTestId('blueprint-flow-canvas')).toBeTruthy();

    // Entity and Initial State fields render
    expect(screen.getByDisplayValue('Tiket Antrean Layanan')).toBeTruthy();

    // States render
    expect(screen.getAllByText('Menunggu Verifikasi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dalam Pelayanan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pelayanan Selesai').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tiket Dibatalkan').length).toBeGreaterThan(0);

    // Transitions render
    expect(screen.getAllByText('Panggil Nomor Antrean').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Konfirmasi Selesai').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Batal oleh Pemohon').length).toBeGreaterThan(0);

    // Toolbar buttons
    expect(screen.getAllByRole('button', { name: /tambah state/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /tambah transition/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /auto-layout/i })).toBeTruthy();
  });

  it('updates entity name correctly', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    const entityInput = screen.getByLabelText(/nama entity/i);
    fireEvent.change(entityInput, { target: { value: 'Siklus Hidup Permohonan KTP' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.entity).toBe('Siklus Hidup Permohonan KTP');
    // States and transitions are unchanged
    expect(updatedSm.states).toHaveLength(4);
    expect(updatedSm.transitions).toHaveLength(3);
  });

  it('enforces single initial state invariant and updates initial_state', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    // Select different initial state
    const initialStateSelect = screen.getByLabelText(/initial state/i);
    fireEvent.mouseDown(initialStateSelect);

    const targetMenuItem = screen.getByRole('option', { name: /dalam pelayanan/i });
    fireEvent.click(targetMenuItem);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.initial_state).toBe('state-dalam-pelayanan');
  });

  it('adds a new state with stable ID state-xxx, default type normal, label and layout', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    const addStateBtn = screen.getAllByRole('button', { name: /tambah state/i })[0];
    fireEvent.click(addStateBtn);

    const labelInput = screen.getByLabelText(/label state/i);
    fireEvent.change(labelInput, { target: { value: 'Menunggu Persetujuan Supervisor' } });

    const saveBtn = screen.getByRole('button', { name: /simpan state/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.states).toHaveLength(5);
    const newState = updatedSm.states[4];
    expect(newState.id).toMatch(/^state-[a-z0-9-]+$/);
    expect(newState.label).toBe('Menunggu Persetujuan Supervisor');
    expect(newState.type).toBe('normal');
    // existing states retain exact IDs
    expect(updatedSm.states[0].id).toBe('state-menunggu-verifikasi');
    expect(updatedSm.states[1].id).toBe('state-dalam-pelayanan');
  });

  it('edits an existing state label and type while keeping exact ID and layout', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    const editStateBtn = screen.getByRole('button', {
      name: /edit state menunggu verifikasi/i,
    });
    fireEvent.click(editStateBtn);

    const labelInput = screen.getByDisplayValue('Menunggu Verifikasi');
    fireEvent.change(labelInput, { target: { value: 'Verifikasi Berkas Dokumen' } });

    const saveBtn = screen.getByRole('button', { name: /simpan state/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.states[0].id).toBe('state-menunggu-verifikasi');
    expect(updatedSm.states[0].label).toBe('Verifikasi Berkas Dokumen');
    expect(updatedSm.states[0].layout).toEqual({ x: 100, y: 150 });
  });

  it('deletes state with safety confirmation modal listing all impacted transitions', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    // Delete state-menunggu-verifikasi which is connected to 2 transitions (panggil-loket & batalkan-antrean)
    const deleteStateBtn = screen.getByRole('button', {
      name: /hapus state menunggu verifikasi/i,
    });
    fireEvent.click(deleteStateBtn);

    // Safety Confirmation dialog should appear listing affected transitions
    expect(screen.getByText(/konfirmasi hapus state/i)).toBeTruthy();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/panggil nomor antrean/i)).toBeTruthy();
    expect(within(dialog).getByText(/batal oleh pemohon/i)).toBeTruthy();

    const confirmBtn = screen.getByRole('button', { name: /hapus state beserta transition/i });
    fireEvent.click(confirmBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.states).toHaveLength(3);
    expect(updatedSm.states.some((s) => s.id === 'state-menunggu-verifikasi')).toBe(false);
    // Impacted transitions are safely purged
    expect(updatedSm.transitions.some((t) => t.source === 'state-menunggu-verifikasi')).toBe(false);
    expect(updatedSm.transitions.some((t) => t.id === 'trans-panggil-loket')).toBe(false);
    expect(updatedSm.transitions.some((t) => t.id === 'trans-batalkan-antrean')).toBe(false);
    // Non-impacted transition remains
    expect(updatedSm.transitions.some((t) => t.id === 'trans-selesaikan-layanan')).toBe(true);
    // Initial state is reset to next available state
    expect(updatedSm.initial_state).toBe('state-dalam-pelayanan');
  });

  it('adds a new transition with stable ID trans-xxx, source, target, event, actor, guard, and actions', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    const addTransBtn = screen.getAllByRole('button', { name: /tambah transition/i })[0];
    fireEvent.click(addTransBtn);

    const eventInput = screen.getByLabelText(/event transition/i);
    fireEvent.change(eventInput, { target: { value: 'Eskalasi ke Supervisor' } });

    const actorInput = screen.getByLabelText(/actor transition/i);
    fireEvent.change(actorInput, { target: { value: 'Petugas Loket' } });

    const guardInput = screen.getByLabelText(/guard transition/i);
    fireEvent.change(guardInput, { target: { value: 'Layanan membutuhkan verifikasi manual' } });

    const saveBtn = screen.getByRole('button', { name: /simpan transition/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.transitions).toHaveLength(4);
    const newTrans = updatedSm.transitions[3];
    expect(newTrans.id).toMatch(/^trans-[a-z0-9-]+$/);
    expect(newTrans.event).toBe('Eskalasi ke Supervisor');
    expect(newTrans.actor).toBe('Petugas Loket');
    expect(newTrans.guard).toBe('Layanan membutuhkan verifikasi manual');
    expect(newTrans.source).toBe('state-menunggu-verifikasi');
    expect(newTrans.target).toBe('state-dalam-pelayanan');
  });

  it('edits an existing transition while keeping exact ID and updating event/actor/guard/actions', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    const editTransBtn = screen.getByRole('button', {
      name: /edit transition panggil nomor antrean/i,
    });
    fireEvent.click(editTransBtn);

    const eventInput = screen.getByDisplayValue('Panggil Nomor Antrean');
    fireEvent.change(eventInput, { target: { value: 'Panggil Nomor Antrean (Display & Audio)' } });

    const saveBtn = screen.getByRole('button', { name: /simpan transition/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.transitions[0].id).toBe('trans-panggil-loket');
    expect(updatedSm.transitions[0].event).toBe('Panggil Nomor Antrean (Display & Audio)');
    expect(updatedSm.transitions[0].actor).toBe('Petugas Loket');
  });

  it('deletes a transition directly while keeping states intact', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    const deleteTransBtn = screen.getByRole('button', {
      name: /hapus transition batal oleh pemohon/i,
    });
    fireEvent.click(deleteTransBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.transitions).toHaveLength(2);
    expect(updatedSm.transitions.some((t) => t.id === 'trans-batalkan-antrean')).toBe(false);
    expect(updatedSm.states).toHaveLength(4);
  });

  it('applies auto-layout LR and TB while preserving all domain IDs, entity, initial state, and connections', () => {
    const handleChange = vi.fn();
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={handleChange} />);

    const autoLayoutBtn = screen.getByRole('button', { name: /auto-layout/i });
    fireEvent.click(autoLayoutBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSm: StateMachine = handleChange.mock.calls[0][0];
    expect(updatedSm.entity).toBe('Tiket Antrean Layanan');
    expect(updatedSm.initial_state).toBe('state-menunggu-verifikasi');
    expect(updatedSm.states).toHaveLength(4);
    expect(updatedSm.transitions).toHaveLength(3);

    // Verify all domain IDs remain exact
    expect(updatedSm.states.map((s) => s.id)).toEqual([
      'state-menunggu-verifikasi',
      'state-dalam-pelayanan',
      'state-selesai',
      'state-batal',
    ]);
    expect(updatedSm.transitions.map((t) => t.id)).toEqual([
      'trans-panggil-loket',
      'trans-selesaikan-layanan',
      'trans-batalkan-antrean',
    ]);

    // Positions should be finite numbers
    updatedSm.states.forEach((s) => {
      expect(Number.isFinite(s.layout.x)).toBe(true);
      expect(Number.isFinite(s.layout.y)).toBe(true);
    });
  });

  it('highlights focused state or transition when focusTargetId is provided', () => {
    render(
      <StateMachineEditor
        stateMachine={mockStateMachine}
        onChange={vi.fn()}
        focusTargetId="state-dalam-pelayanan"
        issues={[
          {
            code: 'STATE_DANGLING_TRANSITION',
            severity: 'error',
            section: 'state_machine',
            path: '/state_machine/states/1',
            target_id: 'state-dalam-pelayanan',
            message: 'State has dangling transition issues',
            blocking: true,
          },
        ]}
      />
    );

    expect(screen.getByTestId('state-machine-editor')).toBeTruthy();
  });

  it('respects read-only mode by disabling mutating actions', () => {
    render(<StateMachineEditor stateMachine={mockStateMachine} onChange={vi.fn()} readOnly />);

    const addStateBtns = screen.queryAllByRole('button', { name: /tambah state/i });
    addStateBtns.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    const addTransBtns = screen.queryAllByRole('button', { name: /tambah transition/i });
    addTransBtns.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    const entityInput = screen.getByLabelText(/nama entity/i);
    expect((entityInput as HTMLInputElement).disabled).toBe(true);
  });
});

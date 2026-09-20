import type { CanonicalIssue } from '../types';
// @vitest-environment happy-dom
import type { Journey } from '../types/bundle';

import React from 'react';
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';

import { JourneyEditor } from './journey-editor';

const mockJourney: Journey = {
  phases: [
    { id: 'phase-1', label: 'Pendaftaran', order: 1 },
    { id: 'phase-2', label: 'Pelayanan', order: 2 },
  ],
  actors: [
    { id: 'actor-1', label: 'Pemohon', order: 1 },
    { id: 'actor-2', label: 'Petugas', order: 2 },
  ],
  activities: [
    {
      id: 'act-1',
      phase_id: 'phase-1',
      actor_id: 'actor-1',
      label: 'Isi Formulir Online',
      description: 'Pemohon mengisi form pendaftaran',
      touchpoints: ['Web Portal'],
      references: ['wbs.module.mod-portal'],
    },
    {
      id: 'act-2',
      phase_id: 'phase-2',
      actor_id: 'actor-2',
      label: 'Verifikasi Berkas',
      description: 'Petugas memeriksa berkas fisik',
      touchpoints: ['Loket'],
      references: [],
    },
  ],
};

describe('JourneyEditor (Task 3.01 Model & UI Tests)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders phases, actors, and activities in matrix layout', () => {
    render(<JourneyEditor journey={mockJourney} onChange={vi.fn()} />);

    expect(screen.getByText('Pendaftaran')).toBeTruthy();
    expect(screen.getByText('Pelayanan')).toBeTruthy();
    expect(screen.getByText('Pemohon')).toBeTruthy();
    expect(screen.getByText('Petugas')).toBeTruthy();
    expect(screen.getByText('Isi Formulir Online')).toBeTruthy();
    expect(screen.getByText('Verifikasi Berkas')).toBeTruthy();
    expect(screen.getByText('Web Portal')).toBeTruthy();
  });

  it('adds a new phase with stable ID and incremented order', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const addPhaseBtn = screen.getByRole('button', { name: /tambah fase/i });
    fireEvent.click(addPhaseBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.phases).toHaveLength(3);
    const newPhase = updatedJourney.phases[2];
    expect(newPhase.id).toMatch(/^phase-[a-z0-9-]+$/);
    expect(newPhase.order).toBe(3);
    // existing phases keep exact IDs
    expect(updatedJourney.phases[0].id).toBe('phase-1');
    expect(updatedJourney.phases[1].id).toBe('phase-2');
  });

  it('edits phase label while keeping exact ID and order', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const editPhaseBtn = screen.getByRole('button', { name: /edit phase pendaftaran/i });
    fireEvent.click(editPhaseBtn);

    const input = screen.getByDisplayValue('Pendaftaran');
    fireEvent.change(input, { target: { value: 'Registrasi Baru' } });

    const saveBtn = screen.getByRole('button', { name: /simpan phase/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.phases[0].id).toBe('phase-1');
    expect(updatedJourney.phases[0].label).toBe('Registrasi Baru');
    expect(updatedJourney.phases[0].order).toBe(1);
  });

  it('reorders phases and preserves stable IDs and activity mappings', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const moveRightBtn = screen.getByRole('button', { name: /geser kanan phase pendaftaran/i });
    fireEvent.click(moveRightBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.phases[0].id).toBe('phase-2');
    expect(updatedJourney.phases[0].order).toBe(1);
    expect(updatedJourney.phases[1].id).toBe('phase-1');
    expect(updatedJourney.phases[1].order).toBe(2);

    // activities still point to stable phase IDs
    expect(updatedJourney.activities[0].phase_id).toBe('phase-1');
    expect(updatedJourney.activities[1].phase_id).toBe('phase-2');
  });

  it('deletes phase with confirmation of affected activities', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    // phase-1 has act-1 inside it
    const deletePhaseBtn = screen.getByRole('button', { name: /hapus phase pendaftaran/i });
    fireEvent.click(deletePhaseBtn);

    // Confirmation dialog should appear listing affected activity
    const phaseDialog = screen.getByRole('dialog');
    expect(phaseDialog).toBeTruthy();
    expect(within(phaseDialog).getByText(/konfirmasi hapus phase/i)).toBeTruthy();
    expect(within(phaseDialog).getByText(/isi formulir online/i)).toBeTruthy();

    const confirmBtn = within(phaseDialog).getByRole('button', { name: /konfirmasi hapus/i });
    fireEvent.click(confirmBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.phases).toHaveLength(1);
    expect(updatedJourney.phases[0].id).toBe('phase-2');
    expect(updatedJourney.phases[0].order).toBe(1);
    // affected activity act-1 removed, act-2 preserved
    expect(updatedJourney.activities).toHaveLength(1);
    expect(updatedJourney.activities[0].id).toBe('act-2');
  });

  it('adds a new actor with stable ID and incremented order', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const addActorBtn = screen.getByRole('button', { name: /tambah aktor/i });
    fireEvent.click(addActorBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.actors).toHaveLength(3);
    const newActor = updatedJourney.actors[2];
    expect(newActor.id).toMatch(/^actor-[a-z0-9-]+$/);
    expect(newActor.order).toBe(3);
    expect(updatedJourney.actors[0].id).toBe('actor-1');
  });

  it('edits actor label while maintaining ID and order', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const editActorBtn = screen.getByRole('button', { name: /edit actor pemohon/i });
    fireEvent.click(editActorBtn);

    const input = screen.getByDisplayValue('Pemohon');
    fireEvent.change(input, { target: { value: 'Warga / Pemohon' } });

    const saveBtn = screen.getByRole('button', { name: /simpan actor/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.actors[0].id).toBe('actor-1');
    expect(updatedJourney.actors[0].label).toBe('Warga / Pemohon');
  });

  it('deletes actor with confirmation of affected activities', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const deleteActorBtn = screen.getByRole('button', { name: /hapus actor pemohon/i });
    fireEvent.click(deleteActorBtn);

    const actorDialog = screen.getByRole('dialog');
    expect(actorDialog).toBeTruthy();
    expect(within(actorDialog).getByText(/konfirmasi hapus actor/i)).toBeTruthy();
    expect(within(actorDialog).getByText(/isi formulir online/i)).toBeTruthy();

    const confirmBtn = within(actorDialog).getByRole('button', { name: /konfirmasi hapus/i });
    fireEvent.click(confirmBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.actors).toHaveLength(1);
    expect(updatedJourney.actors[0].id).toBe('actor-2');
    expect(updatedJourney.actors[0].order).toBe(1);
    expect(updatedJourney.activities).toHaveLength(1);
    expect(updatedJourney.activities[0].id).toBe('act-2');
  });

  it('adds an activity to a specific matrix cell with stable ID and references preserved', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const addActBtn = screen.getByRole('button', {
      name: /tambah aktivitas di phase 1 actor 2/i,
    });
    fireEvent.click(addActBtn);

    expect(screen.getByRole('dialog')).toBeTruthy();
    const labelInput = screen.getByLabelText(/label aktivitas/i);
    fireEvent.change(labelInput, { target: { value: 'Pemberian Nomor Antrean' } });

    const saveBtn = screen.getByRole('button', { name: /simpan aktivitas/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.activities).toHaveLength(3);
    const newAct = updatedJourney.activities[2];
    expect(newAct.id).toMatch(/^act-[a-z0-9-]+$/);
    expect(newAct.label).toBe('Pemberian Nomor Antrean');
    expect(newAct.phase_id).toBe('phase-1');
    expect(newAct.actor_id).toBe('actor-2');
  });

  it('edits activity touchpoints, description, and references while keeping ID intact', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const editBtn = screen.getByRole('button', { name: /edit aktivitas isi formulir online/i });
    fireEvent.click(editBtn);

    const descInput = screen.getByLabelText(/deskripsi aktivitas/i);
    fireEvent.change(descInput, { target: { value: 'Deskripsi diperbarui' } });

    // Add touchpoint via Enter key
    const tpInput = screen.getByPlaceholderText(/tambah touchpoint/i);
    fireEvent.change(tpInput, { target: { value: 'Mobile App' } });
    fireEvent.keyDown(tpInput, { key: 'Enter', code: 'Enter' });

    const saveBtn = screen.getByRole('button', { name: /simpan aktivitas/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    const editedAct = updatedJourney.activities.find((a) => a.id === 'act-1');
    expect(editedAct).toBeDefined();
    expect(editedAct?.id).toBe('act-1');
    expect(editedAct?.description).toBe('Deskripsi diperbarui');
    expect(editedAct?.touchpoints).toContain('Mobile App');
    expect(editedAct?.touchpoints).toContain('Web Portal');
    expect(editedAct?.references).toEqual(['wbs.module.mod-portal']);
  });

  it('moves activity to another cell (change phase & actor) preserving ID and references', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const editBtn = screen.getByRole('button', { name: /edit aktivitas isi formulir online/i });
    fireEvent.click(editBtn);

    const phaseSelect = screen.getByTestId('phase-select-input');
    fireEvent.change(phaseSelect, { target: { value: 'phase-2' } });

    const actorSelect = screen.getByTestId('actor-select-input');
    fireEvent.change(actorSelect, { target: { value: 'actor-2' } });

    const saveBtn = screen.getByRole('button', { name: /simpan aktivitas/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    const movedAct = updatedJourney.activities.find((a) => a.id === 'act-1');
    expect(movedAct?.id).toBe('act-1');
    expect(movedAct?.phase_id).toBe('phase-2');
    expect(movedAct?.actor_id).toBe('actor-2');
    expect(movedAct?.references).toEqual(['wbs.module.mod-portal']);
  });

  it('deletes activity from journey', () => {
    const handleChange = vi.fn();
    render(<JourneyEditor journey={mockJourney} onChange={handleChange} />);

    const deleteBtn = screen.getByRole('button', { name: /hapus aktivitas isi formulir online/i });
    fireEvent.click(deleteBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedJourney: Journey = handleChange.mock.calls[0][0];
    expect(updatedJourney.activities).toHaveLength(1);
    expect(updatedJourney.activities[0].id).toBe('act-2');
  });

  it('displays inline validation issues for journey elements', () => {
    const issues: CanonicalIssue[] = [
      {
        code: 'MISSING_TOUCHPOINT',
        severity: 'warning',
        section: 'journey',
        path: 'activities.1.touchpoints',
        target_id: 'act-2',
        message: 'Aktivitas verifikasi berkas belum memiliki touchpoint saluran.',
        blocking: false,
      },
    ];

    render(<JourneyEditor journey={mockJourney} onChange={vi.fn()} issues={issues} />);

    expect(
      screen.getByText(/aktivitas verifikasi berkas belum memiliki touchpoint saluran/i)
    ).toBeTruthy();
  });

  it('supports read-only mode for mobile and disabled states', () => {
    render(<JourneyEditor journey={mockJourney} onChange={vi.fn()} readOnly />);

    expect(screen.queryByRole('button', { name: /tambah fase/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /tambah aktor/i })).toBeNull();
    expect(
      screen.queryByRole('button', { name: /hapus aktivitas isi formulir online/i })
    ).toBeNull();
    expect(screen.getByText('Pendaftaran')).toBeTruthy();
    expect(screen.getByText('Isi Formulir Online')).toBeTruthy();
  });
});

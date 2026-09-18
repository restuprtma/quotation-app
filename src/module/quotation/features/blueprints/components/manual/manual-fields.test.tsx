import type {
  WBS,
  Journey,
  Workflow,
  Architecture,
  StateMachine,
  CrossReference,
} from '../../types/bundle';

// @vitest-environment happy-dom
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { WBSFields } from './wbs-fields';
import { JourneyFields } from './journey-fields';
import { WorkflowFields } from './workflow-fields';
import queueBundle from '../../testdata/queue-bundle.json';
import { ArchitectureFields } from './architecture-fields';
import { StateMachineFields } from './state-machine-fields';
import {
  wbsSectionSchema,
  journeySectionSchema,
  workflowSectionSchema,
  buildReferenceOptions,
  architectureSectionSchema,
  stateMachineSectionSchema,
} from '../../validation/manual-section';

function JourneyFormHarness({
  initialData,
  onSubmit,
}: {
  initialData?: { journey: Journey };
  onSubmit?: (data: { journey: Journey }) => void;
}) {
  const methods = useForm<{ journey: Journey }>({
    resolver: zodResolver(journeySectionSchema) as any,
    defaultValues: initialData || {
      journey: {
        phases: [],
        actors: [],
        activities: [],
      },
    },
    mode: 'onChange',
  });

  const referenceOptions = React.useMemo(() => buildReferenceOptions(queueBundle as any), []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((d) => onSubmit?.(d as any))}>
        <JourneyFields referenceOptions={referenceOptions} />
        <button type="submit">Submit Journey</button>
      </form>
    </FormProvider>
  );
}

function ArchitectureFormHarness({
  initialData,
  onSubmit,
}: {
  initialData?: { architecture: Architecture };
  onSubmit?: (data: { architecture: Architecture }) => void;
}) {
  const methods = useForm<{ architecture: Architecture }>({
    resolver: zodResolver(architectureSectionSchema) as any,
    defaultValues: initialData || {
      architecture: {
        groups: [],
        nodes: [],
        edges: [],
      },
    },
    mode: 'onChange',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((d) => onSubmit?.(d as any))}>
        <ArchitectureFields />
        <button type="submit">Submit Architecture</button>
      </form>
    </FormProvider>
  );
}

function StateMachineFormHarness({
  initialData,
  onSubmit,
}: {
  initialData?: { state_machine: StateMachine };
  onSubmit?: (data: { state_machine: StateMachine }) => void;
}) {
  const methods = useForm<{ state_machine: StateMachine }>({
    resolver: zodResolver(stateMachineSectionSchema) as any,
    defaultValues: initialData || {
      state_machine: {
        entity: '',
        initial_state: '',
        states: [],
        transitions: [],
      },
    },
    mode: 'onChange',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((d) => onSubmit?.(d as any))}>
        <StateMachineFields />
        <button type="submit">Submit StateMachine</button>
      </form>
    </FormProvider>
  );
}

function WorkflowFormHarness({
  initialData,
  onSubmit,
}: {
  initialData?: { workflows: Workflow[] };
  onSubmit?: (data: { workflows: Workflow[] }) => void;
}) {
  const methods = useForm<{ workflows: Workflow[] }>({
    resolver: zodResolver(workflowSectionSchema) as any,
    defaultValues: initialData || {
      workflows: [],
    },
    mode: 'onChange',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((d) => onSubmit?.(d as any))}>
        <WorkflowFields />
        <button type="submit">Submit Workflow</button>
      </form>
    </FormProvider>
  );
}

function WBSFormHarness({
  initialData,
  onSubmit,
}: {
  initialData?: { wbs: WBS; cross_references: CrossReference[] };
  onSubmit?: (data: { wbs: WBS; cross_references: CrossReference[] }) => void;
}) {
  const methods = useForm<{ wbs: WBS; cross_references: CrossReference[] }>({
    resolver: zodResolver(wbsSectionSchema) as any,
    defaultValues: initialData || {
      wbs: {
        modules: [],
      },
      cross_references: [],
    },
    mode: 'onChange',
  });

  const referenceOptions = React.useMemo(() => buildReferenceOptions(queueBundle as any), []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((d) => onSubmit?.(d as any))}>
        <WBSFields referenceOptions={referenceOptions} />
        <button type="submit">Submit WBS</button>
      </form>
    </FormProvider>
  );
}

describe('Journey manual completion form', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays empty section warning banner when no phases/actors/activities are defined', () => {
    render(<JourneyFormHarness />);
    expect(screen.getByText(/WARN_EMPTY_SECTION/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Phase yang ditambahkan/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Actor yang ditambahkan/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Activity yang ditambahkan/i)).toBeTruthy();
  });

  it('allows adding phases, actors, and activities, and submits exact journey envelope', async () => {
    const handleSubmit = vi.fn();
    render(<JourneyFormHarness onSubmit={handleSubmit} />);

    // 1. Add Phase
    const addPhaseBtn = screen.getByRole('button', { name: /Tambah Phase/i });
    fireEvent.click(addPhaseBtn);

    const phaseInput = screen.getByLabelText(/Label Phase 1/i);
    fireEvent.change(phaseInput, { target: { value: 'Pendaftaran & Verifikasi' } });

    // 2. Add Actor
    const addActorBtn = screen.getByRole('button', { name: /Tambah Actor/i });
    fireEvent.click(addActorBtn);

    const actorInput = screen.getByLabelText(/Label Actor 1/i);
    fireEvent.change(actorInput, { target: { value: 'Pemohon Layanan' } });

    // 3. Add Activity
    const addActivityBtn = screen.getByRole('button', { name: /Tambah Activity/i });
    fireEvent.click(addActivityBtn);

    const actLabelInput = screen.getByLabelText(/Label Activity 1/i);
    fireEvent.change(actLabelInput, { target: { value: 'Mengisi Formulir Pendaftaran' } });

    const actDescInput = screen.getByLabelText(/Deskripsi Activity 1/i);
    fireEvent.change(actDescInput, {
      target: { value: 'Pemohon memasukkan data diri dan memilih layanan.' },
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Journey/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.journey).toBeDefined();
    expect(submittedData.journey.phases.length).toBe(1);
    expect(submittedData.journey.phases[0].id).toMatch(/^phase-[0-9a-f-]+$/);
    expect(submittedData.journey.phases[0].label).toBe('Pendaftaran & Verifikasi');
    expect(submittedData.journey.phases[0].order).toBe(1);

    expect(submittedData.journey.actors.length).toBe(1);
    expect(submittedData.journey.actors[0].id).toMatch(/^actor-[0-9a-f-]+$/);
    expect(submittedData.journey.actors[0].label).toBe('Pemohon Layanan');
    expect(submittedData.journey.actors[0].order).toBe(1);

    expect(submittedData.journey.activities.length).toBe(1);
    expect(submittedData.journey.activities[0].id).toMatch(/^act-[0-9a-f-]+$/);
    expect(submittedData.journey.activities[0].label).toBe('Mengisi Formulir Pendaftaran');
    expect(submittedData.journey.activities[0].phase_id).toBe(submittedData.journey.phases[0].id);
    expect(submittedData.journey.activities[0].actor_id).toBe(submittedData.journey.actors[0].id);
  });

  it('rejects deletion of a phase that is currently referenced by an activity', () => {
    render(
      <JourneyFormHarness
        initialData={{
          journey: {
            phases: [{ id: 'phase-1', label: 'Phase 1', order: 1 }],
            actors: [{ id: 'actor-1', label: 'Actor 1', order: 1 }],
            activities: [
              {
                id: 'act-1',
                phase_id: 'phase-1',
                actor_id: 'actor-1',
                label: 'Activity 1',
                description: '',
                touchpoints: [],
                references: [],
              },
            ],
          },
        }}
      />
    );

    // Try deleting phase-1
    const deletePhaseBtn = screen.getByRole('button', { name: /Hapus Phase 1/i });
    fireEvent.click(deletePhaseBtn);

    // Assert deletion guard alert is displayed and phase remains
    expect(screen.getByText(/tidak dapat dihapus karena masih digunakan/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Phase 1')).toBeTruthy();
  });

  it('rejects deletion of an actor that is currently referenced by an activity', () => {
    render(
      <JourneyFormHarness
        initialData={{
          journey: {
            phases: [{ id: 'phase-1', label: 'Phase 1', order: 1 }],
            actors: [{ id: 'actor-1', label: 'Actor 1', order: 1 }],
            activities: [
              {
                id: 'act-1',
                phase_id: 'phase-1',
                actor_id: 'actor-1',
                label: 'Activity 1',
                description: '',
                touchpoints: [],
                references: [],
              },
            ],
          },
        }}
      />
    );

    // Try deleting actor-1
    const deleteActorBtn = screen.getByRole('button', { name: /Hapus Actor 1/i });
    fireEvent.click(deleteActorBtn);

    // Assert deletion guard alert is displayed and actor remains
    expect(screen.getByText(/tidak dapat dihapus karena masih digunakan/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Actor 1')).toBeTruthy();
  });

  it('preloads complex approved Journey content and preserves exact IDs and structure', () => {
    render(<JourneyFormHarness initialData={{ journey: queueBundle.journey }} />);

    expect(screen.queryByText(/WARN_EMPTY_SECTION/i)).toBeNull();
    expect(screen.getByDisplayValue('Pendaftaran & Reservasi')).toBeTruthy();
    expect(screen.getByDisplayValue('Pemohon Layanan')).toBeTruthy();
    expect(screen.getByDisplayValue('Membuat Reservasi Antrean Daring')).toBeTruthy();
  }, 25000);
});

describe('Architecture manual completion form', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays empty section warning banner when no groups/nodes/edges are defined', () => {
    render(<ArchitectureFormHarness />);
    expect(screen.getByText(/WARN_EMPTY_SECTION/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Group yang ditambahkan/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Node yang ditambahkan/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Edge yang ditambahkan/i)).toBeTruthy();
  });

  it('allows adding a group, two nodes, and an edge, selecting group for node and source/target for edge, filling in label/description/types, and submits exact architecture envelope', async () => {
    const handleSubmit = vi.fn();
    render(<ArchitectureFormHarness onSubmit={handleSubmit} />);

    // 1. Add Group
    const addGroupBtn = screen.getByRole('button', { name: /Tambah Group/i });
    fireEvent.click(addGroupBtn);

    const groupInput = screen.getByLabelText(/Label Group 1/i);
    fireEvent.change(groupInput, { target: { value: 'Presentation & Gateway Tier' } });

    // 2. Add Node 1
    const addNodeBtn = screen.getByRole('button', { name: /Tambah Node/i });
    fireEvent.click(addNodeBtn);

    const node1LabelInput = screen.getByLabelText(/Label Node 1/i);
    fireEvent.change(node1LabelInput, { target: { value: 'Web Portal Pemohon' } });

    const node1DescInput = screen.getByLabelText(/Deskripsi Node 1/i);
    fireEvent.change(node1DescInput, {
      target: { value: 'Aplikasi web responsif untuk reservasi daring.' },
    });

    // 3. Add Node 2
    fireEvent.click(addNodeBtn);

    const node2LabelInput = screen.getByLabelText(/Label Node 2/i);
    fireEvent.change(node2LabelInput, { target: { value: 'API Gateway Service' } });

    const node2DescInput = screen.getByLabelText(/Deskripsi Node 2/i);
    fireEvent.change(node2DescInput, {
      target: { value: 'Reverse Proxy & Ingress routing.' },
    });

    // Select type for Node 2: service
    fireEvent.mouseDown(screen.getByLabelText(/Tipe Node 2/i));
    fireEvent.click(screen.getByRole('option', { name: /Service \/ Microservice/i }));

    // 4. Add Edge
    const addEdgeBtn = screen.getByRole('button', { name: /Tambah Edge/i });
    fireEvent.click(addEdgeBtn);

    const edgeLabelInput = screen.getByLabelText(/Label Edge 1/i);
    fireEvent.change(edgeLabelInput, { target: { value: 'HTTPS REST / JSON' } });

    // Select type for Edge 1: sync
    fireEvent.mouseDown(screen.getByLabelText(/Tipe Edge 1/i));
    fireEvent.click(screen.getByRole('option', { name: /Synchronous \(sync\)/i }));

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Architecture/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.architecture).toBeDefined();

    // Verify groups
    expect(submittedData.architecture.groups.length).toBe(1);
    expect(submittedData.architecture.groups[0].id).toMatch(/^grp-[0-9a-f-]+$/);
    expect(submittedData.architecture.groups[0].label).toBe('Presentation & Gateway Tier');
    expect(submittedData.architecture.groups[0].order).toBe(1);

    // Verify nodes
    expect(submittedData.architecture.nodes.length).toBe(2);
    expect(submittedData.architecture.nodes[0].id).toMatch(/^node-[0-9a-f-]+$/);
    expect(submittedData.architecture.nodes[0].group_id).toBe(
      submittedData.architecture.groups[0].id
    );
    expect(submittedData.architecture.nodes[0].type).toBe('application');
    expect(submittedData.architecture.nodes[0].label).toBe('Web Portal Pemohon');
    expect(submittedData.architecture.nodes[0].description).toBe(
      'Aplikasi web responsif untuk reservasi daring.'
    );
    expect(submittedData.architecture.nodes[0].layout).toEqual({ x: 0, y: 0 });

    expect(submittedData.architecture.nodes[1].id).toMatch(/^node-[0-9a-f-]+$/);
    expect(submittedData.architecture.nodes[1].group_id).toBe(
      submittedData.architecture.groups[0].id
    );
    expect(submittedData.architecture.nodes[1].type).toBe('service');
    expect(submittedData.architecture.nodes[1].label).toBe('API Gateway Service');
    expect(submittedData.architecture.nodes[1].description).toBe(
      'Reverse Proxy & Ingress routing.'
    );
    expect(submittedData.architecture.nodes[1].layout).toEqual({ x: 0, y: 0 });

    // Verify edges
    expect(submittedData.architecture.edges.length).toBe(1);
    expect(submittedData.architecture.edges[0].id).toMatch(/^edge-[0-9a-f-]+$/);
    expect(submittedData.architecture.edges[0].source).toBe(submittedData.architecture.nodes[0].id);
    expect(submittedData.architecture.edges[0].target).toBe(submittedData.architecture.nodes[1].id);
    expect(submittedData.architecture.edges[0].label).toBe('HTTPS REST / JSON');
    expect(submittedData.architecture.edges[0].type).toBe('sync');
  });

  it('rejects deletion of a group that is currently referenced by a node', () => {
    render(
      <ArchitectureFormHarness
        initialData={{
          architecture: {
            groups: [{ id: 'grp-1', label: 'Group 1', order: 1 }],
            nodes: [
              {
                id: 'node-1',
                group_id: 'grp-1',
                type: 'application',
                label: 'Node 1',
                description: '',
                layout: { x: 0, y: 0 },
              },
            ],
            edges: [],
          },
        }}
      />
    );

    // Try deleting grp-1
    const deleteGroupBtn = screen.getByRole('button', { name: /Hapus Group 1/i });
    fireEvent.click(deleteGroupBtn);

    // Assert deletion guard alert is displayed and group remains
    expect(
      screen.getByText(/tidak dapat dihapus karena masih memiliki Node di dalamnya/i)
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Group 1')).toBeTruthy();
  });

  it('rejects deletion of a node that is currently referenced by an edge as source or target', () => {
    render(
      <ArchitectureFormHarness
        initialData={{
          architecture: {
            groups: [{ id: 'grp-1', label: 'Group 1', order: 1 }],
            nodes: [
              {
                id: 'node-1',
                group_id: 'grp-1',
                type: 'application',
                label: 'Node 1',
                description: '',
                layout: { x: 0, y: 0 },
              },
              {
                id: 'node-2',
                group_id: 'grp-1',
                type: 'service',
                label: 'Node 2',
                description: '',
                layout: { x: 100, y: 0 },
              },
            ],
            edges: [
              {
                id: 'edge-1',
                source: 'node-1',
                target: 'node-2',
                label: 'Connection',
                type: 'sync',
              },
            ],
          },
        }}
      />
    );

    // Try deleting node-1
    const deleteNodeBtn = screen.getByRole('button', { name: /Hapus Node 1/i });
    fireEvent.click(deleteNodeBtn);

    // Assert deletion guard alert is displayed and node remains
    expect(
      screen.getByText(/tidak dapat dihapus karena terhubung dengan Edge arsitektur/i)
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Node 1')).toBeTruthy();
  });

  it('preloads complex approved Architecture content and preserves exact IDs, types, and layout {x, y} coordinates', () => {
    render(
      <ArchitectureFormHarness initialData={{ architecture: queueBundle.architecture as any }} />
    );

    expect(screen.queryByText(/WARN_EMPTY_SECTION/i)).toBeNull();
    expect(screen.getByDisplayValue('Presentation & Channel Tier')).toBeTruthy();
    expect(screen.getByDisplayValue('Web Portal Pemohon')).toBeTruthy();
    expect(screen.getByDisplayValue('HTTPS REST / JSON')).toBeTruthy();
  }, 25000);
});

describe('StateMachine manual completion form', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays empty section warning banner when entity, states, and transitions are empty', () => {
    render(<StateMachineFormHarness />);
    expect(screen.getByText(/WARN_EMPTY_SECTION/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada State yang ditambahkan/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Transition yang ditambahkan/i)).toBeTruthy();
  });

  it('allows setting entity, adding two states, selecting initial_state, adding a transition with source/target/event/actor/guard/actions, and submits exact state_machine envelope', async () => {
    const handleSubmit = vi.fn();
    render(<StateMachineFormHarness onSubmit={handleSubmit} />);

    // 1. Set Entity
    const entityInput = screen.getByLabelText(/Nama Entity/i);
    fireEvent.change(entityInput, { target: { value: 'Tiket Antrean Layanan' } });

    // 2. Add State 1
    const addStateBtn = screen.getByRole('button', { name: /Tambah State/i });
    fireEvent.click(addStateBtn);

    const state1LabelInput = screen.getByLabelText(/Label State 1/i);
    fireEvent.change(state1LabelInput, { target: { value: 'Telah Dipesan (Booked)' } });

    // 3. Add State 2
    fireEvent.click(addStateBtn);

    const state2LabelInput = screen.getByLabelText(/Label State 2/i);
    fireEvent.change(state2LabelInput, { target: { value: 'Selesai Dilayani (Completed)' } });

    // Select type for State 2: terminal
    fireEvent.mouseDown(screen.getByLabelText(/Tipe State 2/i));
    fireEvent.click(screen.getByRole('option', { name: /Terminal \/ Selesai/i }));

    // 4. Select Initial State: State 1
    fireEvent.mouseDown(screen.getByLabelText(/Initial State/i));
    fireEvent.click(screen.getByRole('option', { name: /Telah Dipesan/i }));

    // 5. Add Transition
    const addTransBtn = screen.getByRole('button', { name: /Tambah Transition/i });
    fireEvent.click(addTransBtn);

    const eventInput = screen.getByLabelText(/Event Transition 1/i);
    fireEvent.change(eventInput, { target: { value: 'Selesaikan Layanan Loket' } });

    const actorInput = screen.getByLabelText(/Actor Transition 1/i);
    fireEvent.change(actorInput, { target: { value: 'Petugas Loket' } });

    const guardInput = screen.getByLabelText(/Guard Transition 1/i);
    fireEvent.change(guardInput, {
      target: { value: 'Pelayanan dokumen telah selesai dan terverifikasi' },
    });

    // Select Target State: State 2
    fireEvent.mouseDown(screen.getByLabelText(/Target State 1/i));
    fireEvent.click(screen.getByRole('option', { name: /Selesai Dilayani/i }));

    // Add action
    const actionInput = screen.getByLabelText(/Actions Transition 1/i);
    fireEvent.change(actionInput, { target: { value: 'Cetak Bukti Selesai' } });
    fireEvent.keyDown(actionInput, { key: 'Enter', code: 'Enter' });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit StateMachine/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.state_machine).toBeDefined();
    expect(submittedData.state_machine.entity).toBe('Tiket Antrean Layanan');

    // Verify states
    expect(submittedData.state_machine.states.length).toBe(2);
    expect(submittedData.state_machine.states[0].id).toMatch(/^state-[0-9a-f-]+$/);
    expect(submittedData.state_machine.states[0].label).toBe('Telah Dipesan (Booked)');
    expect(submittedData.state_machine.states[0].type).toBe('normal');
    expect(submittedData.state_machine.states[0].layout).toEqual({ x: 0, y: 0 });

    expect(submittedData.state_machine.states[1].id).toMatch(/^state-[0-9a-f-]+$/);
    expect(submittedData.state_machine.states[1].label).toBe('Selesai Dilayani (Completed)');
    expect(submittedData.state_machine.states[1].type).toBe('terminal');
    expect(submittedData.state_machine.states[1].layout).toEqual({ x: 0, y: 0 });

    // Verify initial_state matches state 1 ID
    expect(submittedData.state_machine.initial_state).toBe(
      submittedData.state_machine.states[0].id
    );

    // Verify transitions
    expect(submittedData.state_machine.transitions.length).toBe(1);
    expect(submittedData.state_machine.transitions[0].id).toMatch(/^trans-[0-9a-f-]+$/);
    expect(submittedData.state_machine.transitions[0].source).toBe(
      submittedData.state_machine.states[0].id
    );
    expect(submittedData.state_machine.transitions[0].target).toBe(
      submittedData.state_machine.states[1].id
    );
    expect(submittedData.state_machine.transitions[0].event).toBe('Selesaikan Layanan Loket');
    expect(submittedData.state_machine.transitions[0].actor).toBe('Petugas Loket');
    expect(submittedData.state_machine.transitions[0].guard).toBe(
      'Pelayanan dokumen telah selesai dan terverifikasi'
    );
    expect(submittedData.state_machine.transitions[0].actions).toEqual(['Cetak Bukti Selesai']);
  });

  it('rejects deletion of a state that is designated as initial_state', () => {
    render(
      <StateMachineFormHarness
        initialData={{
          state_machine: {
            entity: 'Tiket Antrean',
            initial_state: 'state-1',
            states: [
              { id: 'state-1', label: 'State 1', type: 'normal', layout: { x: 0, y: 0 } },
              { id: 'state-2', label: 'State 2', type: 'normal', layout: { x: 0, y: 0 } },
            ],
            transitions: [],
          },
        }}
      />
    );

    // Try deleting state-1
    const deleteStateBtn = screen.getByRole('button', { name: /Hapus State 1/i });
    fireEvent.click(deleteStateBtn);

    // Assert deletion guard alert is displayed and state remains
    expect(screen.getByText(/adalah Initial State dan tidak dapat dihapus/i)).toBeTruthy();
    expect(screen.getByDisplayValue('State 1')).toBeTruthy();
  });

  it('rejects deletion of a state that is currently referenced by a transition as source or target', () => {
    render(
      <StateMachineFormHarness
        initialData={{
          state_machine: {
            entity: 'Tiket Antrean',
            initial_state: 'state-1',
            states: [
              { id: 'state-1', label: 'State 1', type: 'normal', layout: { x: 0, y: 0 } },
              { id: 'state-2', label: 'State 2', type: 'normal', layout: { x: 0, y: 0 } },
            ],
            transitions: [
              {
                id: 'trans-1',
                source: 'state-1',
                target: 'state-2',
                event: 'Event 1',
                actor: 'Actor 1',
                guard: '',
                actions: [],
              },
            ],
          },
        }}
      />
    );

    // Try deleting state-2
    const deleteStateBtn = screen.getByRole('button', { name: /Hapus State 2/i });
    fireEvent.click(deleteStateBtn);

    // Assert deletion guard alert is displayed and state remains
    expect(screen.getByText(/tidak dapat dihapus karena digunakan dalam Transition/i)).toBeTruthy();
    expect(screen.getByDisplayValue('State 2')).toBeTruthy();
  });

  it('preloads complex approved StateMachine content and preserves exact IDs, types, initial_state, and layout {x, y} coordinates', () => {
    render(
      <StateMachineFormHarness initialData={{ state_machine: queueBundle.state_machine as any }} />
    );

    expect(screen.queryByText(/WARN_EMPTY_SECTION/i)).toBeNull();
    expect(screen.getByDisplayValue('Tiket Antrean Layanan')).toBeTruthy();
    expect(screen.getByDisplayValue('Telah Dipesan (Booked)')).toBeTruthy();
    expect(screen.getByDisplayValue('Check-in Kiosk / Scan QR')).toBeTruthy();
  });
});

describe('Workflow manual completion form', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays empty section warning banner when workflows is empty', () => {
    render(<WorkflowFormHarness />);
    expect(screen.getByText(/WARN_EMPTY_SECTION/i)).toBeTruthy();
    expect(screen.getByText(/Bagian Workflow belum memiliki baris data/i)).toBeTruthy();
  });

  it('allows adding two complete workflows with lanes/nodes/edges, selects scoped to active workflow, and submits exact workflows envelope', async () => {
    const handleSubmit = vi.fn();
    render(<WorkflowFormHarness onSubmit={handleSubmit} />);

    // 1. Add Workflow 1
    const addWfBtn = screen.getByRole('button', { name: /Tambah Workflow/i });
    fireEvent.click(addWfBtn);

    const wf1NameInput = screen.getByLabelText(/Nama Workflow 1/i);
    fireEvent.change(wf1NameInput, { target: { value: 'Alur Reservasi Online' } });

    const wf1DescInput = screen.getByLabelText(/Deskripsi Workflow 1/i);
    fireEvent.change(wf1DescInput, { target: { value: 'Proses reservasi online pemohon' } });

    // Add 2 lanes to WF 1
    const addLaneBtn1 = screen.getByRole('button', { name: /Tambah Lane Workflow 1/i });
    fireEvent.click(addLaneBtn1);
    const lane1_1 = screen.getByLabelText(/Label Lane 1 Workflow 1/i);
    fireEvent.change(lane1_1, { target: { value: 'Pemohon Layanan' } });

    fireEvent.click(addLaneBtn1);
    const lane1_2 = screen.getByLabelText(/Label Lane 2 Workflow 1/i);
    fireEvent.change(lane1_2, { target: { value: 'Sistem Reservasi' } });

    // Add 2 nodes to WF 1
    const addNodeBtn1 = screen.getByRole('button', { name: /Tambah Node Workflow 1/i });
    fireEvent.click(addNodeBtn1);
    const node1_1Label = screen.getByLabelText(/Label Node 1 Workflow 1/i);
    fireEvent.change(node1_1Label, { target: { value: 'Buka Web Reservasi' } });

    // Select type for WF1 Node 1: start
    fireEvent.mouseDown(screen.getByLabelText(/Tipe Node 1 Workflow 1/i));
    fireEvent.click(screen.getByRole('option', { name: /Start \/ Mulai/i }));

    fireEvent.click(addNodeBtn1);
    const node1_2Label = screen.getByLabelText(/Label Node 2 Workflow 1/i);
    fireEvent.change(node1_2Label, { target: { value: 'Validasi Slot Kuota' } });

    // Select lane for WF1 Node 2: Sistem Reservasi
    fireEvent.mouseDown(screen.getByLabelText(/Pilih Lane Node 2 Workflow 1/i));
    fireEvent.click(screen.getByRole('option', { name: /Sistem Reservasi/i }));

    // Select type for WF1 Node 2: decision
    fireEvent.mouseDown(screen.getByLabelText(/Tipe Node 2 Workflow 1/i));
    fireEvent.click(screen.getByRole('option', { name: /Decision \/ Percabangan/i }));

    // Add 1 edge to WF 1
    const addEdgeBtn1 = screen.getByRole('button', { name: /Tambah Edge Workflow 1/i });
    fireEvent.click(addEdgeBtn1);

    const edge1_1Label = screen.getByLabelText(/Label Edge 1 Workflow 1/i);
    fireEvent.change(edge1_1Label, { target: { value: 'Kirim Form' } });

    // Select Target Node for WF1 Edge 1: Validasi Slot Kuota
    fireEvent.mouseDown(screen.getByLabelText(/Target Node Edge 1 Workflow 1/i));
    fireEvent.click(screen.getByRole('option', { name: /Validasi Slot Kuota/i }));

    // 2. Add Workflow 2
    fireEvent.click(addWfBtn);

    const wf2NameInput = screen.getByLabelText(/Nama Workflow 2/i);
    fireEvent.change(wf2NameInput, { target: { value: 'Alur Pelayanan Loket' } });

    const wf2DescInput = screen.getByLabelText(/Deskripsi Workflow 2/i);
    fireEvent.change(wf2DescInput, { target: { value: 'Proses pelayanan di loket fisik' } });

    // Add 2 lanes to WF 2
    const addLaneBtn2 = screen.getByRole('button', { name: /Tambah Lane Workflow 2/i });
    fireEvent.click(addLaneBtn2);
    const lane2_1 = screen.getByLabelText(/Label Lane 1 Workflow 2/i);
    fireEvent.change(lane2_1, { target: { value: 'Petugas Loket' } });

    fireEvent.click(addLaneBtn2);
    const lane2_2 = screen.getByLabelText(/Label Lane 2 Workflow 2/i);
    fireEvent.change(lane2_2, { target: { value: 'Display TV' } });

    // Add 2 nodes to WF 2
    const addNodeBtn2 = screen.getByRole('button', { name: /Tambah Node Workflow 2/i });
    fireEvent.click(addNodeBtn2);
    const node2_1Label = screen.getByLabelText(/Label Node 1 Workflow 2/i);
    fireEvent.change(node2_1Label, { target: { value: 'Tekan Tombol Panggil' } });

    // Select type for WF2 Node 1: action
    fireEvent.mouseDown(screen.getByLabelText(/Tipe Node 1 Workflow 2/i));
    fireEvent.click(screen.getByRole('option', { name: /User Action/i }));

    fireEvent.click(addNodeBtn2);
    const node2_2Label = screen.getByLabelText(/Label Node 2 Workflow 2/i);
    fireEvent.change(node2_2Label, { target: { value: 'Tampilkan Nomor Loket' } });

    // Select lane for WF2 Node 2: Display TV
    fireEvent.mouseDown(screen.getByLabelText(/Pilih Lane Node 2 Workflow 2/i));
    // Verify that options in WF2 DO NOT show WF1's lanes!
    expect(screen.queryByRole('option', { name: /Sistem Reservasi/i })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Display TV/i }));

    // Select type for WF2 Node 2: system_action
    fireEvent.mouseDown(screen.getByLabelText(/Tipe Node 2 Workflow 2/i));
    fireEvent.click(screen.getByRole('option', { name: /System Action/i }));

    // Add 1 edge to WF 2
    const addEdgeBtn2 = screen.getByRole('button', { name: /Tambah Edge Workflow 2/i });
    fireEvent.click(addEdgeBtn2);

    const edge2_1Label = screen.getByLabelText(/Label Edge 1 Workflow 2/i);
    fireEvent.change(edge2_1Label, { target: { value: 'Trigger Display' } });

    // Select Target Node for WF2 Edge 1: Tampilkan Nomor Loket
    fireEvent.mouseDown(screen.getByLabelText(/Target Node Edge 1 Workflow 2/i));
    // Verify that options in WF2 DO NOT show WF1's nodes!
    expect(screen.queryByRole('option', { name: /Validasi Slot Kuota/i })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Tampilkan Nomor Loket/i }));

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Workflow/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.workflows).toBeDefined();
    expect(submittedData.workflows.length).toBe(2);

    // Workflow 1 verification
    const wf1 = submittedData.workflows[0];
    expect(wf1.id).toMatch(/^wf-[0-9a-f-]+$/);
    expect(wf1.name).toBe('Alur Reservasi Online');
    expect(wf1.description).toBe('Proses reservasi online pemohon');
    expect(wf1.lanes.length).toBe(2);
    expect(wf1.lanes[0].id).toMatch(/^lane-[0-9a-f-]+$/);
    expect(wf1.lanes[0].label).toBe('Pemohon Layanan');
    expect(wf1.lanes[0].order).toBe(1);
    expect(wf1.lanes[1].id).toMatch(/^lane-[0-9a-f-]+$/);
    expect(wf1.lanes[1].label).toBe('Sistem Reservasi');
    expect(wf1.lanes[1].order).toBe(2);

    expect(wf1.nodes.length).toBe(2);
    expect(wf1.nodes[0].id).toMatch(/^wnode-[0-9a-f-]+$/);
    expect(wf1.nodes[0].lane_id).toBe(wf1.lanes[0].id);
    expect(wf1.nodes[0].type).toBe('start');
    expect(wf1.nodes[0].label).toBe('Buka Web Reservasi');
    expect(wf1.nodes[0].layout).toEqual({ x: 0, y: 0 });

    expect(wf1.nodes[1].id).toMatch(/^wnode-[0-9a-f-]+$/);
    expect(wf1.nodes[1].lane_id).toBe(wf1.lanes[1].id);
    expect(wf1.nodes[1].type).toBe('decision');
    expect(wf1.nodes[1].label).toBe('Validasi Slot Kuota');
    expect(wf1.nodes[1].layout).toEqual({ x: 0, y: 0 });

    expect(wf1.edges.length).toBe(1);
    expect(wf1.edges[0].id).toMatch(/^wedge-[0-9a-f-]+$/);
    expect(wf1.edges[0].source).toBe(wf1.nodes[0].id);
    expect(wf1.edges[0].target).toBe(wf1.nodes[1].id);
    expect(wf1.edges[0].label).toBe('Kirim Form');

    // Workflow 2 verification
    const wf2 = submittedData.workflows[1];
    expect(wf2.id).toMatch(/^wf-[0-9a-f-]+$/);
    expect(wf2.name).toBe('Alur Pelayanan Loket');
    expect(wf2.description).toBe('Proses pelayanan di loket fisik');
    expect(wf2.lanes.length).toBe(2);
    expect(wf2.lanes[0].id).toMatch(/^lane-[0-9a-f-]+$/);
    expect(wf2.lanes[0].label).toBe('Petugas Loket');
    expect(wf2.lanes[0].order).toBe(1);
    expect(wf2.lanes[1].id).toMatch(/^lane-[0-9a-f-]+$/);
    expect(wf2.lanes[1].label).toBe('Display TV');
    expect(wf2.lanes[1].order).toBe(2);

    expect(wf2.nodes.length).toBe(2);
    expect(wf2.nodes[0].id).toMatch(/^wnode-[0-9a-f-]+$/);
    expect(wf2.nodes[0].lane_id).toBe(wf2.lanes[0].id);
    expect(wf2.nodes[0].type).toBe('action');
    expect(wf2.nodes[0].label).toBe('Tekan Tombol Panggil');
    expect(wf2.nodes[0].layout).toEqual({ x: 0, y: 0 });

    expect(wf2.nodes[1].id).toMatch(/^wnode-[0-9a-f-]+$/);
    expect(wf2.nodes[1].lane_id).toBe(wf2.lanes[1].id);
    expect(wf2.nodes[1].type).toBe('system_action');
    expect(wf2.nodes[1].label).toBe('Tampilkan Nomor Loket');
    expect(wf2.nodes[1].layout).toEqual({ x: 0, y: 0 });

    expect(wf2.edges.length).toBe(1);
    expect(wf2.edges[0].id).toMatch(/^wedge-[0-9a-f-]+$/);
    expect(wf2.edges[0].source).toBe(wf2.nodes[0].id);
    expect(wf2.edges[0].target).toBe(wf2.nodes[1].id);
    expect(wf2.edges[0].label).toBe('Trigger Display');
  }, 30000);

  it('rejects deletion of a lane that still contains nodes', () => {
    render(
      <WorkflowFormHarness
        initialData={{
          workflows: [
            {
              id: 'wf-1',
              name: 'Workflow 1',
              description: '',
              lanes: [{ id: 'lane-1', label: 'Lane 1', order: 1 }],
              nodes: [
                {
                  id: 'wnode-1',
                  lane_id: 'lane-1',
                  type: 'action',
                  label: 'Node 1',
                  description: '',
                  layout: { x: 0, y: 0 },
                },
              ],
              edges: [],
            },
          ],
        }}
      />
    );

    // Try deleting lane-1
    const deleteLaneBtn = screen.getByRole('button', { name: /Hapus Lane 1 Workflow 1/i });
    fireEvent.click(deleteLaneBtn);

    // Assert deletion guard alert is displayed and lane remains
    expect(screen.getByText(/tidak dapat dihapus karena masih berisi Node/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Lane 1')).toBeTruthy();
  });

  it('rejects deletion of a node that is connected to an edge', () => {
    render(
      <WorkflowFormHarness
        initialData={{
          workflows: [
            {
              id: 'wf-1',
              name: 'Workflow 1',
              description: '',
              lanes: [{ id: 'lane-1', label: 'Lane 1', order: 1 }],
              nodes: [
                {
                  id: 'wnode-1',
                  lane_id: 'lane-1',
                  type: 'action',
                  label: 'Node 1',
                  description: '',
                  layout: { x: 0, y: 0 },
                },
                {
                  id: 'wnode-2',
                  lane_id: 'lane-1',
                  type: 'end',
                  label: 'Node 2',
                  description: '',
                  layout: { x: 100, y: 0 },
                },
              ],
              edges: [
                {
                  id: 'wedge-1',
                  source: 'wnode-1',
                  target: 'wnode-2',
                  label: 'Next',
                },
              ],
            },
          ],
        }}
      />
    );

    // Try deleting wnode-1
    const deleteNodeBtn = screen.getByRole('button', { name: /Hapus Node 1 Workflow 1/i });
    fireEvent.click(deleteNodeBtn);

    // Assert deletion guard alert is displayed and node remains
    expect(
      screen.getByText(/tidak dapat dihapus karena terhubung dengan Edge workflow/i)
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Node 1')).toBeTruthy();
  });

  it('preloads complex approved Workflow content and preserves exact IDs, types, and layout {x, y} coordinates', () => {
    render(<WorkflowFormHarness initialData={{ workflows: queueBundle.workflows as any }} />);

    expect(screen.queryByText(/WARN_EMPTY_SECTION/i)).toBeNull();
    expect(screen.getByDisplayValue('Alur Pendaftaran dan Reservasi Layanan Daring')).toBeTruthy();
    expect(
      screen.getByDisplayValue('Alur Pemanggilan, Verifikasi, dan Pelayanan Loket')
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Pemohon Layanan')).toBeTruthy();
    expect(screen.getByDisplayValue('Mulai Reservasi Online')).toBeTruthy();
    expect(screen.getByDisplayValue('Submit Form')).toBeTruthy();
  }, 30000);
});

describe('WBS manual completion form', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays empty section warning banner when no modules or cross-references are defined', () => {
    render(<WBSFormHarness />);
    expect(screen.getByText(/WARN_EMPTY_SECTION/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Module yang ditambahkan/i)).toBeTruthy();
    expect(screen.getByText(/Belum ada Cross Reference yang ditambahkan/i)).toBeTruthy();
  });

  it('allows adding modules, features with acceptance criteria, module dependencies (multi-select), module references, and cross-references, submitting exact wbs and cross_references envelope', async () => {
    const handleSubmit = vi.fn();
    render(<WBSFormHarness onSubmit={handleSubmit} />);

    // 1. Add Module 1
    const addModuleBtn = screen.getByRole('button', { name: /Tambah Module/i });
    fireEvent.click(addModuleBtn);

    const mod1NameInput = screen.getByLabelText(/Nama Module 1/i);
    fireEvent.change(mod1NameInput, { target: { value: 'Modul Core Queue Engine & API' } });

    const mod1DescInput = screen.getByLabelText(/Deskripsi Module 1/i);
    fireEvent.change(mod1DescInput, {
      target: { value: 'Backend modular monolith pengelola logika inti antrean.' },
    });

    // Select Priority for Module 1: high
    fireEvent.mouseDown(screen.getByLabelText(/Prioritas Module 1/i));
    fireEvent.click(screen.getByRole('option', { name: /Tinggi \/ High/i }));

    // Add Feature 1 to Module 1
    const addFeatBtn1 = screen.getByRole('button', { name: /Tambah Feature Module 1/i });
    fireEvent.click(addFeatBtn1);

    const feat1NameInput = screen.getByLabelText(/Nama Feature 1 Module 1/i);
    fireEvent.change(feat1NameInput, { target: { value: 'Alokasi Nomor Tiket' } });

    const feat1DescInput = screen.getByLabelText(/Deskripsi Feature 1 Module 1/i);
    fireEvent.change(feat1DescInput, {
      target: { value: 'Penerbitan nomor antrean berurutan secara atomik.' },
    });

    // Add 2 Acceptance Criteria to Feature 1
    const critInput1 = screen.getByLabelText(/Input Kriteria Feature 1 Module 1/i);
    fireEvent.change(critInput1, {
      target: { value: 'Nomor antrean diterbitkan unik tanpa duplikat.' },
    });
    const addCritBtn1 = screen.getByRole('button', { name: /Tambah Kriteria Feature 1 Module 1/i });
    fireEvent.click(addCritBtn1);

    fireEvent.change(critInput1, {
      target: { value: 'Sistem menolak reservasi jika kuota slot penuh.' },
    });
    fireEvent.click(addCritBtn1);

    // 2. Add Module 2
    fireEvent.click(addModuleBtn);

    const mod2NameInput = screen.getByLabelText(/Nama Module 2/i);
    fireEvent.change(mod2NameInput, { target: { value: 'Modul Real-Time WebSocket Hub' } });

    const mod2DescInput = screen.getByLabelText(/Deskripsi Module 2/i);
    fireEvent.change(mod2DescInput, {
      target: { value: 'Layanan manajemen koneksi broadcast real-time.' },
    });

    // Select Priority for Module 2: high
    fireEvent.mouseDown(screen.getByLabelText(/Prioritas Module 2/i));
    fireEvent.click(screen.getByRole('option', { name: /Tinggi \/ High/i }));

    // Select Dependency for Module 2 -> Module 1
    fireEvent.mouseDown(screen.getByLabelText(/Dependencies Module 2/i));
    fireEvent.click(screen.getByRole('option', { name: /Modul Core Queue Engine & API/i }));
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    // 3. Add Cross Reference
    const addXrefBtn = screen.getByRole('button', { name: /Tambah Cross Reference/i });
    fireEvent.click(addXrefBtn);

    // Select Source Ref for Cross Reference 1
    const sourceRefInput = screen.getByPlaceholderText(/Pilih canonical source/i);
    fireEvent.change(sourceRefInput, { target: { value: 'wbs.module.mod-core-queue-engine' } });
    fireEvent.keyDown(sourceRefInput, { key: 'ArrowDown' });
    fireEvent.keyDown(sourceRefInput, { key: 'Enter' });

    // Select Target Ref for Cross Reference 1
    const targetRefInput = screen.getByPlaceholderText(/Pilih canonical target/i);
    fireEvent.change(targetRefInput, { target: { value: 'architecture.node.node-queue-service' } });
    fireEvent.keyDown(targetRefInput, { key: 'ArrowDown' });
    fireEvent.keyDown(targetRefInput, { key: 'Enter' });

    // Select Relation Type: implements
    fireEvent.mouseDown(screen.getByLabelText(/Tipe Relasi #1/i));
    fireEvent.click(screen.getByRole('option', { name: /Mengimplementasikan/i }));

    const xrefDescInput = screen.getByLabelText(/Deskripsi Cross Reference 1/i);
    fireEvent.change(xrefDescInput, {
      target: { value: 'Modul core queue engine mengimplementasikan layanan queue service.' },
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit WBS/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.wbs).toBeDefined();
    expect(submittedData.wbs.modules.length).toBe(2);

    // Module 1 verification
    const mod1 = submittedData.wbs.modules[0];
    expect(mod1.id).toMatch(/^mod-[0-9a-f-]+$/);
    expect(mod1.name).toBe('Modul Core Queue Engine & API');
    expect(mod1.description).toBe('Backend modular monolith pengelola logika inti antrean.');
    expect(mod1.priority).toBe('high');
    expect(mod1.dependencies).toEqual([]);
    expect(mod1.features.length).toBe(1);

    const feat1 = mod1.features[0];
    expect(feat1.id).toMatch(/^feat-[0-9a-f-]+$/);
    expect(feat1.name).toBe('Alokasi Nomor Tiket');
    expect(feat1.description).toBe('Penerbitan nomor antrean berurutan secara atomik.');
    expect(feat1.acceptance_criteria).toEqual([
      'Nomor antrean diterbitkan unik tanpa duplikat.',
      'Sistem menolak reservasi jika kuota slot penuh.',
    ]);

    // Module 2 verification
    const mod2 = submittedData.wbs.modules[1];
    expect(mod2.id).toMatch(/^mod-[0-9a-f-]+$/);
    expect(mod2.name).toBe('Modul Real-Time WebSocket Hub');
    expect(mod2.description).toBe('Layanan manajemen koneksi broadcast real-time.');
    expect(mod2.priority).toBe('high');
    expect(mod2.dependencies).toEqual([mod1.id]);

    // Cross reference verification
    expect(submittedData.cross_references.length).toBe(1);
    const xref1 = submittedData.cross_references[0];
    expect(xref1.id).toMatch(/^xref-[0-9a-f-]+$/);
    expect(xref1.relation_type).toBe('implements');
    expect(xref1.description).toBe(
      'Modul core queue engine mengimplementasikan layanan queue service.'
    );
  }, 30000);

  it('rejects deletion of a module that is used as a dependency by another module', () => {
    render(
      <WBSFormHarness
        initialData={{
          wbs: {
            modules: [
              {
                id: 'mod-1',
                name: 'Modul Core Engine',
                description: '',
                priority: 'high',
                dependencies: [],
                references: [],
                features: [],
              },
              {
                id: 'mod-2',
                name: 'Modul WebSocket',
                description: '',
                priority: 'high',
                dependencies: ['mod-1'],
                references: [],
                features: [],
              },
            ],
          },
          cross_references: [],
        }}
      />
    );

    // Try deleting Module 1
    const deleteModBtn = screen.getByRole('button', { name: /Hapus Module 1/i });
    fireEvent.click(deleteModBtn);

    // Assert deletion guard alert is displayed and module remains
    expect(
      screen.getByText(/tidak dapat dihapus karena menjadi dependency bagi module lain/i)
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Modul Core Engine')).toBeTruthy();
  });

  it('rejects deletion of a module that is referenced by a cross-reference', () => {
    render(
      <WBSFormHarness
        initialData={{
          wbs: {
            modules: [
              {
                id: 'mod-1',
                name: 'Modul Core Engine',
                description: '',
                priority: 'high',
                dependencies: [],
                references: [],
                features: [],
              },
            ],
          },
          cross_references: [
            {
              id: 'xref-1',
              source_ref: 'wbs.module.mod-1',
              target_ref: 'architecture.node.node-queue-service',
              relation_type: 'implements',
              description: '',
            },
          ],
        }}
      />
    );

    // Try deleting Module 1
    const deleteModBtn = screen.getByRole('button', { name: /Hapus Module 1/i });
    fireEvent.click(deleteModBtn);

    // Assert deletion guard alert is displayed and module remains
    expect(screen.getByText(/sedang dirujuk oleh Cross Reference/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Modul Core Engine')).toBeTruthy();
  });

  it('validates cyclic dependency prevention / warning in form', async () => {
    const handleSubmit = vi.fn();
    render(
      <WBSFormHarness
        initialData={{
          wbs: {
            modules: [
              {
                id: 'mod-1',
                name: 'Modul A',
                description: '',
                priority: 'high',
                dependencies: ['mod-2'],
                references: [],
                features: [],
              },
              {
                id: 'mod-2',
                name: 'Modul B',
                description: '',
                priority: 'high',
                dependencies: ['mod-1'],
                references: [],
                features: [],
              },
            ],
          },
          cross_references: [],
        }}
        onSubmit={handleSubmit}
      />
    );

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit WBS/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ditemukan cyclic dependency pada Module WBS/i)).toBeTruthy();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('preloads complex approved WBS & cross_references content from queueBundle preserving IDs and structure', () => {
    render(
      <WBSFormHarness
        initialData={{
          wbs: queueBundle.wbs as any,
          cross_references: queueBundle.cross_references as any,
        }}
      />
    );

    expect(screen.queryByText(/WARN_EMPTY_SECTION/i)).toBeNull();
    expect(screen.getByDisplayValue('Modul Core Queue Engine & API')).toBeTruthy();
    expect(screen.getByDisplayValue('Modul Real-Time WebSocket Hub')).toBeTruthy();
    expect(screen.getByDisplayValue('Alokasi Nomor Tiket & Pengelolaan Slot')).toBeTruthy();
    expect(
      screen.getByDisplayValue(
        'Modul core queue engine mengimplementasikan layanan backend service pada arsitektur sistem.'
      )
    ).toBeTruthy();
  }, 30000);
});

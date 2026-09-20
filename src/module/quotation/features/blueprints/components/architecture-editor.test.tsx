// @vitest-environment happy-dom
import type { Architecture } from '../types/bundle';

import React from 'react';
import { it, vi, expect, describe, afterEach, beforeAll } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';

import { ArchitectureEditor } from './architecture-editor';

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

const mockArchitecture: Architecture = {
  groups: [
    { id: 'grp-client-tier', label: 'Presentation & Channel Tier', order: 1 },
    { id: 'grp-service-tier', label: 'Application & Service Tier', order: 2 },
  ],
  nodes: [
    {
      id: 'node-web-portal',
      group_id: 'grp-client-tier',
      type: 'application',
      label: 'Web Portal Pemohon',
      description: 'Aplikasi web portal',
      layout: { x: 100, y: 100 },
    },
    {
      id: 'node-queue-service',
      group_id: 'grp-service-tier',
      type: 'service',
      label: 'Queue Engine & API Service',
      description: 'Core backend service',
      layout: { x: 400, y: 100 },
    },
    {
      id: 'node-postgres-db',
      group_id: 'grp-service-tier',
      type: 'database',
      label: 'Relational Database (PostgreSQL)',
      description: 'Main persistence store',
      layout: { x: 400, y: 300 },
    },
  ],
  edges: [
    {
      id: 'edge-web-to-service',
      source: 'node-web-portal',
      target: 'node-queue-service',
      label: 'HTTPS REST / JSON',
      type: 'sync',
    },
    {
      id: 'edge-service-to-db',
      source: 'node-queue-service',
      target: 'node-postgres-db',
      label: 'SQL Transactions',
      type: 'data_flow',
    },
  ],
};

describe('ArchitectureEditor (Task 5.01 RED Model & UI Tests)', () => {
  it('renders architecture groups, nodes, edges and canvas toolbar', () => {
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={vi.fn()} />);

    // Canvas exists
    expect(screen.getByTestId('blueprint-flow-canvas')).toBeTruthy();

    // Groups render
    expect(screen.getAllByText('Presentation & Channel Tier').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Application & Service Tier').length).toBeGreaterThan(0);

    // Nodes render
    expect(screen.getAllByText('Web Portal Pemohon').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Queue Engine & API Service').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Relational Database (PostgreSQL)').length).toBeGreaterThan(0);

    // Toolbar buttons
    expect(screen.getAllByRole('button', { name: /tambah group/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /tambah node/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /auto-layout/i })).toBeTruthy();
  });

  it('adds a new group with stable ID grp-xxx and incremented order', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const addGroupBtn = screen.getAllByRole('button', { name: /tambah group/i })[0];
    fireEvent.click(addGroupBtn);

    const labelInput = screen.getByLabelText(/label group/i);
    fireEvent.change(labelInput, { target: { value: 'Data & Persistence Tier' } });

    const saveBtn = screen.getByRole('button', { name: /simpan group/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    expect(updatedArch.groups).toHaveLength(3);
    const newGroup = updatedArch.groups[2];
    expect(newGroup.id).toMatch(/^grp-[a-z0-9-]+$/);
    expect(newGroup.label).toBe('Data & Persistence Tier');
    expect(newGroup.order).toBe(3);
    // existing groups retain exact IDs
    expect(updatedArch.groups[0].id).toBe('grp-client-tier');
    expect(updatedArch.groups[1].id).toBe('grp-service-tier');
  });

  it('edits group label while keeping exact ID and order', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const editGroupBtn = screen.getByRole('button', {
      name: /edit group presentation & channel tier/i,
    });
    fireEvent.click(editGroupBtn);

    const labelInput = screen.getByDisplayValue('Presentation & Channel Tier');
    fireEvent.change(labelInput, { target: { value: 'Frontend Channel Tier' } });

    const saveBtn = screen.getByRole('button', { name: /simpan group/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    expect(updatedArch.groups[0].id).toBe('grp-client-tier');
    expect(updatedArch.groups[0].label).toBe('Frontend Channel Tier');
    expect(updatedArch.groups[0].order).toBe(1);
  });

  it('deletes group with confirmation listing affected nodes', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const deleteGroupBtn = screen.getByRole('button', {
      name: /hapus group application & service tier/i,
    });
    fireEvent.click(deleteGroupBtn);

    // Confirmation dialog should appear listing affected member nodes
    expect(screen.getByText(/konfirmasi hapus group/i)).toBeTruthy();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/queue engine & api service/i)).toBeTruthy();
    expect(within(dialog).getByText(/relational database \(postgresql\)/i)).toBeTruthy();

    const confirmBtn = screen.getByRole('button', { name: /hapus group beserta node/i });
    fireEvent.click(confirmBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    expect(updatedArch.groups).toHaveLength(1);
    expect(updatedArch.groups[0].id).toBe('grp-client-tier');
    // Member nodes and their connected edges are also safely purged
    expect(updatedArch.nodes.some((n) => n.group_id === 'grp-service-tier')).toBe(false);
    expect(updatedArch.edges.some((e) => e.target === 'node-queue-service')).toBe(false);
  });

  it('adds a new node with stable ID node-xxx, selected group, type, label, description', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const addNodeBtn = screen.getAllByRole('button', { name: /tambah node/i })[0];
    fireEvent.click(addNodeBtn);

    const labelInput = screen.getByLabelText(/label node/i);
    fireEvent.change(labelInput, { target: { value: 'Redis In-Memory Cache' } });

    const descInput = screen.getByLabelText(/deskripsi node/i);
    fireEvent.change(descInput, { target: { value: 'PubSub dan cache antrean aktif' } });

    const saveBtn = screen.getByRole('button', { name: /simpan node/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    expect(updatedArch.nodes).toHaveLength(4);
    const newNode = updatedArch.nodes[3];
    expect(newNode.id).toMatch(/^node-[a-z0-9-]+$/);
    expect(newNode.label).toBe('Redis In-Memory Cache');
    expect(newNode.description).toBe('PubSub dan cache antrean aktif');
    expect(newNode.group_id).toBe('grp-client-tier'); // Default first group
  });

  it('edits node properties and reparents node to a different group', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const editNodeBtn = screen.getByRole('button', { name: /edit node web portal pemohon/i });
    fireEvent.click(editNodeBtn);

    const labelInput = screen.getByDisplayValue('Web Portal Pemohon');
    fireEvent.change(labelInput, { target: { value: 'Web Portal Publik & Mobile PWA' } });

    const saveBtn = screen.getByRole('button', { name: /simpan node/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    const editedNode = updatedArch.nodes.find((n) => n.id === 'node-web-portal');
    expect(editedNode).toBeTruthy();
    expect(editedNode?.label).toBe('Web Portal Publik & Mobile PWA');
    expect(editedNode?.id).toBe('node-web-portal');
  });

  it('deletes node with confirmation listing affected edges', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const deleteNodeBtn = screen.getByRole('button', {
      name: /hapus node queue engine & api service/i,
    });
    fireEvent.click(deleteNodeBtn);

    // Confirmation dialog should appear listing affected edges
    expect(screen.getByText(/konfirmasi hapus node/i)).toBeTruthy();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/https rest \/ json/i)).toBeTruthy();
    expect(within(dialog).getByText(/sql transactions/i)).toBeTruthy();

    const confirmBtn = screen.getByRole('button', { name: /hapus node beserta relasi/i });
    fireEvent.click(confirmBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    expect(updatedArch.nodes).toHaveLength(2);
    expect(updatedArch.nodes.some((n) => n.id === 'node-queue-service')).toBe(false);
    // Both connected edges are safely removed
    expect(updatedArch.edges).toHaveLength(0);
  });

  it('adds a new typed edge with stable ID edge-xxx', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const addEdgeBtn = screen.getAllByRole('button', { name: /tambah relasi/i })[0];
    fireEvent.click(addEdgeBtn);

    const labelInput = screen.getByLabelText(/label relasi/i);
    fireEvent.change(labelInput, { target: { value: 'Direct Read Replica' } });

    const saveBtn = screen.getByRole('button', { name: /simpan relasi/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    expect(updatedArch.edges).toHaveLength(3);
    const newEdge = updatedArch.edges[2];
    expect(newEdge.id).toMatch(/^edge-[a-z0-9-]+$/);
    expect(newEdge.label).toBe('Direct Read Replica');
    expect(newEdge.type).toBe('sync');
  });

  it('edits edge label and type', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const editEdgeBtn = screen.getByRole('button', { name: /edit relasi https rest \/ json/i });
    fireEvent.click(editEdgeBtn);

    const labelInput = screen.getByDisplayValue('HTTPS REST / JSON');
    fireEvent.change(labelInput, { target: { value: 'gRPC Protocol Buffers' } });

    const saveBtn = screen.getByRole('button', { name: /simpan relasi/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    const editedEdge = updatedArch.edges.find((e) => e.id === 'edge-web-to-service');
    expect(editedEdge?.label).toBe('gRPC Protocol Buffers');
    expect(editedEdge?.id).toBe('edge-web-to-service');
  });

  it('deletes edge without deleting connected nodes', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const deleteEdgeBtn = screen.getByRole('button', {
      name: /hapus relasi https rest \/ json/i,
    });
    fireEvent.click(deleteEdgeBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];
    expect(updatedArch.edges).toHaveLength(1);
    expect(updatedArch.edges[0].id).toBe('edge-service-to-db');
    // Nodes still remain untouched
    expect(updatedArch.nodes).toHaveLength(3);
  });

  it('applies auto-layout and preserves all IDs, labels, types, and edge connections while updating ONLY layout coordinates', () => {
    const handleChange = vi.fn();
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={handleChange} />);

    const autoLayoutBtn = screen.getByRole('button', { name: /auto-layout/i });
    fireEvent.click(autoLayoutBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedArch: Architecture = handleChange.mock.calls[0][0];

    // Groups invariant
    expect(updatedArch.groups).toEqual(mockArchitecture.groups);

    // Node count and properties invariant
    expect(updatedArch.nodes).toHaveLength(3);
    updatedArch.nodes.forEach((node, idx) => {
      const origNode = mockArchitecture.nodes[idx];
      expect(node.id).toBe(origNode.id);
      expect(node.group_id).toBe(origNode.group_id);
      expect(node.type).toBe(origNode.type);
      expect(node.label).toBe(origNode.label);
      expect(node.description).toBe(origNode.description);
      // layout has numbers
      expect(typeof node.layout.x).toBe('number');
      expect(typeof node.layout.y).toBe('number');
    });

    // Edges invariant
    expect(updatedArch.edges).toEqual(mockArchitecture.edges);
  });

  it('supports focusTargetId highlighting for validation issues', () => {
    render(
      <ArchitectureEditor
        architecture={mockArchitecture}
        onChange={vi.fn()}
        focusTargetId="node-queue-service"
      />
    );

    const targetNode = screen.getByTestId('arch-node-node-queue-service');
    expect(targetNode).toBeTruthy();
  });

  it('renders read-only guidance banner and disables mutation actions when readOnly is true', () => {
    render(<ArchitectureEditor architecture={mockArchitecture} onChange={vi.fn()} readOnly />);

    // Read-only banner is visible
    expect(screen.getByText(/mode baca arsitektur/i)).toBeTruthy();

    // Mutation buttons should be disabled or hidden
    const addGroupBtns = screen.queryAllByRole('button', { name: /tambah group/i });
    addGroupBtns.forEach((btn) => {
      expect(btn.hasAttribute('disabled')).toBe(true);
    });
    const addNodeBtns = screen.queryAllByRole('button', { name: /tambah node/i });
    addNodeBtns.forEach((btn) => {
      expect(btn.hasAttribute('disabled')).toBe(true);
    });
  });
});

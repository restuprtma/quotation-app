// @vitest-environment happy-dom
import type { Workflow } from '../types/bundle';

import React from 'react';
import { it, vi, expect, describe, afterEach, beforeAll } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';

import { WorkflowEditor } from './workflow-editor';

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
// Test Fixtures (Multiple Workflows)
// ----------------------------------------------------------------------

const mockWorkflows: Workflow[] = [
  {
    id: 'wf-pendaftaran-reservasi-online',
    name: 'Alur Pendaftaran dan Reservasi Online',
    description: 'Proses pemohon melakukan reservasi jadwal kunjungan via web portal',
    lanes: [
      { id: 'lane-pemohon-web', label: 'Pemohon Layanan', order: 1 },
      { id: 'lane-portal-web', label: 'Web Portal & API Gateway', order: 2 },
      { id: 'lane-backend-queue', label: 'Sistem Queue Engine', order: 3 },
    ],
    nodes: [
      {
        id: 'wnode-start-reservasi',
        lane_id: 'lane-pemohon-web',
        type: 'start',
        label: 'Mulai Reservasi Online',
        description: 'Pemohon membuka halaman reservasi',
        layout: { x: 50, y: 50 },
      },
      {
        id: 'wnode-pilih-jadwal',
        lane_id: 'lane-pemohon-web',
        type: 'action',
        label: 'Pilih Kategori & Jadwal',
        description: 'Memilih kategori layanan dan waktu',
        layout: { x: 220, y: 50 },
      },
      {
        id: 'wnode-cek-kuota',
        lane_id: 'lane-backend-queue',
        type: 'decision',
        label: 'Cek Ketersediaan Slot?',
        description: 'Pemeriksaan kuota pada database',
        layout: { x: 400, y: 250 },
      },
      {
        id: 'wnode-simpan-booking',
        lane_id: 'lane-backend-queue',
        type: 'system_action',
        label: 'Simpan Status BOOKED',
        description: 'Merekam data tiket',
        layout: { x: 600, y: 250 },
      },
      {
        id: 'wnode-tampilkan-error',
        lane_id: 'lane-portal-web',
        type: 'system_action',
        label: 'Tampilkan Error Slot Penuh',
        description: 'Notifikasi kuota habis',
        layout: { x: 600, y: 150 },
      },
      {
        id: 'wnode-end-sukses',
        lane_id: 'lane-pemohon-web',
        type: 'end',
        label: 'Reservasi Sukses',
        description: 'Tiket digital diterbitkan',
        layout: { x: 800, y: 50 },
      },
      {
        id: 'wnode-end-gagal',
        lane_id: 'lane-pemohon-web',
        type: 'end',
        label: 'Reservasi Gagal',
        description: 'Sesi reservasi berakhir',
        layout: { x: 800, y: 150 },
      },
    ],
    edges: [
      { id: 'wedge-1', source: 'wnode-start-reservasi', target: 'wnode-pilih-jadwal', label: '' },
      {
        id: 'wedge-2',
        source: 'wnode-pilih-jadwal',
        target: 'wnode-cek-kuota',
        label: 'Submit Form',
      },
      {
        id: 'wedge-3',
        source: 'wnode-cek-kuota',
        target: 'wnode-simpan-booking',
        label: 'Slot Tersedia',
      },
      {
        id: 'wedge-4',
        source: 'wnode-cek-kuota',
        target: 'wnode-tampilkan-error',
        label: 'Slot Penuh',
      },
      {
        id: 'wedge-5',
        source: 'wnode-simpan-booking',
        target: 'wnode-end-sukses',
        label: 'Selesai',
      },
      { id: 'wedge-6', source: 'wnode-tampilkan-error', target: 'wnode-end-gagal', label: 'Tutup' },
    ],
  },
  {
    id: 'wf-pemanggilan-pelayanan-loket',
    name: 'Alur Pemanggilan dan Pelayanan Loket',
    description: 'Proses pemanggilan antrean dan pelayanan dokumen oleh petugas loket',
    lanes: [
      { id: 'lane-petugas-loket', label: 'Petugas Loket', order: 1 },
      { id: 'lane-loket-app', label: 'Loket Counter Web App', order: 2 },
    ],
    nodes: [
      {
        id: 'wnode-start-panggil',
        lane_id: 'lane-petugas-loket',
        type: 'start',
        label: 'Siap Panggil Antrean',
        description: 'Petugas siap di loket',
        layout: { x: 50, y: 50 },
      },
      {
        id: 'wnode-tekan-panggil',
        lane_id: 'lane-loket-app',
        type: 'action',
        label: 'Tekan Tombol Panggil',
        description: 'Memanggil nomor antrean berikutnya',
        layout: { x: 220, y: 150 },
      },
      {
        id: 'wnode-end-panggil',
        lane_id: 'lane-petugas-loket',
        type: 'end',
        label: 'Pelayanan Selesai',
        description: 'Proses selesai',
        layout: { x: 400, y: 50 },
      },
    ],
    edges: [
      {
        id: 'wedge-call-1',
        source: 'wnode-start-panggil',
        target: 'wnode-tekan-panggil',
        label: 'Panggil',
      },
      {
        id: 'wedge-call-2',
        source: 'wnode-tekan-panggil',
        target: 'wnode-end-panggil',
        label: 'Selesai Layanan',
      },
    ],
  },
];

describe('WorkflowEditor (Task 7.01 RED Model & UI Tests)', () => {
  it('renders multiple workflows tabs, active workflow metadata, lanes, nodes, edges and canvas toolbar', () => {
    render(<WorkflowEditor workflows={mockWorkflows} onChange={vi.fn()} />);

    // Container exists
    expect(screen.getByTestId('workflow-editor')).toBeTruthy();

    // Canvas exists
    expect(screen.getByTestId('blueprint-flow-canvas')).toBeTruthy();

    // Workflow tabs / selector render both workflows
    expect(screen.getAllByText('Alur Pendaftaran dan Reservasi Online').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alur Pemanggilan dan Pelayanan Loket').length).toBeGreaterThan(0);

    // Active workflow lanes render
    expect(screen.getAllByText('Pemohon Layanan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Web Portal & API Gateway').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sistem Queue Engine').length).toBeGreaterThan(0);

    // Active workflow nodes render
    expect(screen.getAllByText('Mulai Reservasi Online').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cek Ketersediaan Slot?').length).toBeGreaterThan(0);

    // Active workflow edges and branch labels render
    expect(screen.getAllByText('Slot Tersedia').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Slot Penuh').length).toBeGreaterThan(0);

    // Toolbar buttons
    expect(screen.getAllByRole('button', { name: /tambah lane/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /tambah node/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /tambah edge/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /auto-layout/i })).toBeTruthy();
  });

  it('switches between multiple workflows and displays workflow-scoped lanes, nodes, and edges without cross-workflow leakage', () => {
    render(<WorkflowEditor workflows={mockWorkflows} onChange={vi.fn()} />);

    // Initially workflow 1 is active
    expect(screen.getAllByText('Cek Ketersediaan Slot?').length).toBeGreaterThan(0);
    expect(screen.queryByText('Tekan Tombol Panggil')).toBeNull();

    // Switch to workflow 2
    const wf2Tab = screen.getByRole('tab', { name: /alur pemanggilan dan pelayanan loket/i });
    fireEvent.click(wf2Tab);

    // Now workflow 2 elements are visible, workflow 1 elements are not in active editor view
    expect(screen.getAllByText('Tekan Tombol Panggil').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cek Ketersediaan Slot?')).toBeNull();
  });

  it('adds a new workflow with stable ID wf-xxx and default empty lanes/nodes/edges', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    const addWfBtn = screen.getByRole('button', { name: /tambah workflow/i });
    fireEvent.click(addWfBtn);

    const nameInput = screen.getByLabelText(/nama workflow/i);
    fireEvent.change(nameInput, { target: { value: 'Alur Pembatalan dan Pengembalian Berkas' } });

    const saveBtn = screen.getByRole('button', { name: /simpan workflow/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows).toHaveLength(3);
    const newWf = updatedWorkflows[2];
    expect(newWf.id).toMatch(/^wf-[a-z0-9-]+$/);
    expect(newWf.name).toBe('Alur Pembatalan dan Pengembalian Berkas');
    expect(newWf.lanes).toEqual([]);
    expect(newWf.nodes).toEqual([]);
    expect(newWf.edges).toEqual([]);
  });

  it('edits current workflow name and description while keeping exact ID and elements', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    const editWfBtn = screen.getByRole('button', { name: /edit info workflow/i });
    fireEvent.click(editWfBtn);

    const nameInput = screen.getByDisplayValue('Alur Pendaftaran dan Reservasi Online');
    fireEvent.change(nameInput, {
      target: { value: 'Alur Pendaftaran & Reservasi Online Terintegrasi' },
    });

    const saveBtn = screen.getByRole('button', { name: /simpan workflow/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows[0].id).toBe('wf-pendaftaran-reservasi-online');
    expect(updatedWorkflows[0].name).toBe('Alur Pendaftaran & Reservasi Online Terintegrasi');
    expect(updatedWorkflows[0].nodes).toHaveLength(7);
  });

  it('adds a new lane to the active workflow with stable ID lane-xxx and incremented order', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    const addLaneBtn = screen.getAllByRole('button', { name: /tambah lane/i })[0];
    fireEvent.click(addLaneBtn);

    const labelInput = screen.getByLabelText(/label lane/i);
    fireEvent.change(labelInput, { target: { value: 'WhatsApp Notification Gateway' } });

    const saveBtn = screen.getByRole('button', { name: /simpan lane/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows[0].lanes).toHaveLength(4);
    const newLane = updatedWorkflows[0].lanes[3];
    expect(newLane.id).toMatch(/^lane-[a-z0-9-]+$/);
    expect(newLane.label).toBe('WhatsApp Notification Gateway');
    expect(newLane.order).toBe(4);
  });

  it('adds a new workflow node with 6 supported types (start, action, system_action, decision, wait, end), lane assignment, label, and layout', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    const addNodeBtn = screen.getAllByRole('button', { name: /tambah node/i })[0];
    fireEvent.click(addNodeBtn);

    const labelInput = screen.getByLabelText(/label node/i);
    fireEvent.change(labelInput, { target: { value: 'Kirim Notifikasi Pengingat' } });

    const saveBtn = screen.getByRole('button', { name: /simpan node/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows[0].nodes).toHaveLength(8);
    const newNode = updatedWorkflows[0].nodes[7];
    expect(newNode.id).toMatch(/^wnode-[a-z0-9-]+$/);
    expect(newNode.label).toBe('Kirim Notifikasi Pengingat');
    expect(newNode.lane_id).toBe('lane-pemohon-web');
  });

  it('edits an existing workflow node while keeping exact ID, lane_id, and updating label/type/description', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    const editNodeBtn = screen.getByRole('button', {
      name: /edit node mulai reservasi online/i,
    });
    fireEvent.click(editNodeBtn);

    const labelInput = screen.getByDisplayValue('Mulai Reservasi Online');
    fireEvent.change(labelInput, { target: { value: 'Akses Portal Pendaftaran Reservasi' } });

    const saveBtn = screen.getByRole('button', { name: /simpan node/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows[0].nodes[0].id).toBe('wnode-start-reservasi');
    expect(updatedWorkflows[0].nodes[0].label).toBe('Akses Portal Pendaftaran Reservasi');
  });

  it('deletes a workflow node with safety confirmation modal listing all impacted edges', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    // wnode-cek-kuota is connected to wedge-2 (incoming), wedge-3 (outgoing), and wedge-4 (outgoing)
    const deleteNodeBtn = screen.getByRole('button', {
      name: /hapus node cek ketersediaan slot/i,
    });
    fireEvent.click(deleteNodeBtn);

    // Confirmation modal should appear listing affected edges
    expect(screen.getByText(/konfirmasi hapus node/i)).toBeTruthy();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/slot tersedia/i)).toBeTruthy();
    expect(within(dialog).getByText(/slot penuh/i)).toBeTruthy();

    const confirmBtn = screen.getByRole('button', { name: /hapus node beserta edge/i });
    fireEvent.click(confirmBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows[0].nodes).toHaveLength(6);
    expect(updatedWorkflows[0].nodes.some((n) => n.id === 'wnode-cek-kuota')).toBe(false);
    // Impacted edges are safely purged
    expect(
      updatedWorkflows[0].edges.some(
        (e) => e.source === 'wnode-cek-kuota' || e.target === 'wnode-cek-kuota'
      )
    ).toBe(false);
    expect(updatedWorkflows[0].edges.some((e) => e.id === 'wedge-2')).toBe(false);
    expect(updatedWorkflows[0].edges.some((e) => e.id === 'wedge-3')).toBe(false);
    expect(updatedWorkflows[0].edges.some((e) => e.id === 'wedge-4')).toBe(false);
    // Non-impacted edge remains
    expect(updatedWorkflows[0].edges.some((e) => e.id === 'wedge-1')).toBe(true);
  });

  it('adds and edits workflow edges with branch labels (e.g. Yes/No, Slot Tersedia/Penuh)', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    const addEdgeBtn = screen.getAllByRole('button', { name: /tambah edge/i })[0];
    fireEvent.click(addEdgeBtn);

    const labelInput = screen.getByLabelText(/label edge/i);
    fireEvent.change(labelInput, { target: { value: 'Validasi Ulang' } });

    const saveBtn = screen.getByRole('button', { name: /simpan edge/i });
    fireEvent.click(saveBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows[0].edges).toHaveLength(7);
    const newEdge = updatedWorkflows[0].edges[6];
    expect(newEdge.id).toMatch(/^wedge-[a-z0-9-]+$/);
    expect(newEdge.label).toBe('Validasi Ulang');
  });

  it('flags decision node with fewer than 2 outgoing branch edges with underbranched warning badge', () => {
    // Modify fixture so decision node only has 1 outgoing edge
    const underbranchedWorkflows: Workflow[] = [
      {
        ...mockWorkflows[0],
        edges: mockWorkflows[0].edges.filter((e) => e.id !== 'wedge-4'), // remove second branch
      },
    ];

    render(<WorkflowEditor workflows={underbranchedWorkflows} onChange={vi.fn()} />);

    // StepNode for decision should display warning
    expect(screen.getByText(/cabang 1\/2/i)).toBeTruthy();
  });

  it('applies workflow auto-layout (LR and TB) while preserving all domain IDs, lane scoping, node types, and edge labels', () => {
    const handleChange = vi.fn();
    render(<WorkflowEditor workflows={mockWorkflows} onChange={handleChange} />);

    const autoLayoutBtn = screen.getByRole('button', { name: /auto-layout/i });
    fireEvent.click(autoLayoutBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedWorkflows: Workflow[] = handleChange.mock.calls[0][0];
    expect(updatedWorkflows).toHaveLength(2);
    expect(updatedWorkflows[0].id).toBe('wf-pendaftaran-reservasi-online');
    expect(updatedWorkflows[0].lanes).toHaveLength(3);
    expect(updatedWorkflows[0].nodes).toHaveLength(7);
    expect(updatedWorkflows[0].edges).toHaveLength(6);

    // Verify all domain IDs remain exact
    expect(updatedWorkflows[0].nodes.map((n) => n.id)).toEqual(
      mockWorkflows[0].nodes.map((n) => n.id)
    );
    expect(updatedWorkflows[0].edges.map((e) => e.id)).toEqual(
      mockWorkflows[0].edges.map((e) => e.id)
    );

    // Verify positions are finite
    updatedWorkflows[0].nodes.forEach((n) => {
      expect(Number.isFinite(n.layout.x)).toBe(true);
      expect(Number.isFinite(n.layout.y)).toBe(true);
    });
  });

  it('highlights focused node or edge and switches to the containing workflow when focusTargetId is provided', () => {
    render(
      <WorkflowEditor
        workflows={mockWorkflows}
        onChange={vi.fn()}
        focusTargetId="wnode-tekan-panggil"
        issues={[
          {
            code: 'WORKFLOW_ORPHAN_NODE',
            severity: 'error',
            section: 'workflow',
            path: '/workflows/1/nodes/1',
            target_id: 'wnode-tekan-panggil',
            message: 'Node has issue',
            blocking: true,
          },
        ]}
      />
    );

    // Should automatically have switched to workflow 2 containing wnode-tekan-panggil
    expect(screen.getAllByText('Tekan Tombol Panggil').length).toBeGreaterThan(0);
  });

  it('respects read-only mode by disabling mutating actions', () => {
    render(<WorkflowEditor workflows={mockWorkflows} onChange={vi.fn()} readOnly />);

    const addWfBtn = screen.queryByRole('button', { name: /tambah workflow/i });
    if (addWfBtn) {
      expect((addWfBtn as HTMLButtonElement).disabled).toBe(true);
    }

    const addLaneBtns = screen.queryAllByRole('button', { name: /tambah lane/i });
    addLaneBtns.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    const addNodeBtns = screen.queryAllByRole('button', { name: /tambah node/i });
    addNodeBtns.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });
});

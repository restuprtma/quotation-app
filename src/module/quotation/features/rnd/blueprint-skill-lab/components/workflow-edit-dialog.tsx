import type {
  WorkflowEdge,
  WorkflowLane,
  WorkflowNode,
  WorkflowProcess,
  WorkflowNodeType,
} from '../types';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  editMode: 'node' | 'edge' | 'lane' | 'workflow';
  nodeData: WorkflowNode | null;
  edgeData: WorkflowEdge | null;
  laneData: WorkflowLane | null;
  workflowData: WorkflowProcess | null;
  lanes: WorkflowLane[];
  allNodes: WorkflowNode[];
  onClose: () => void;
  onSaveNode: (node: WorkflowNode) => void;
  onSaveEdge: (edge: WorkflowEdge) => void;
  onSaveLane: (lane: WorkflowLane) => void;
  onSaveWorkflow: (workflow: WorkflowProcess) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onDeleteLane?: (laneId: string) => void;
};

const WORKFLOW_NODE_TYPES: { value: WorkflowNodeType; label: string }[] = [
  { value: 'start', label: 'Start (Titik Awal Alur)' },
  { value: 'action', label: 'Action (Aktivitas Manual Pengguna / Aktor)' },
  { value: 'system_action', label: 'System Action (Pemrosesan Otomatis Sistem)' },
  { value: 'decision', label: 'Decision (Percabangan Kondisi / Evaluasi)' },
  { value: 'wait', label: 'Wait (Menunggu / Delay / Timeout)' },
  { value: 'end', label: 'End (Titik Akhir Alur)' },
];

export function WorkflowEditDialog({
  open,
  editMode,
  nodeData,
  edgeData,
  laneData,
  workflowData,
  lanes,
  allNodes,
  onClose,
  onSaveNode,
  onSaveEdge,
  onSaveLane,
  onSaveWorkflow,
  onDeleteNode,
  onDeleteEdge,
  onDeleteLane,
}: Props) {
  // Node form
  const [nodeForm, setNodeForm] = useState<WorkflowNode>({
    id: '',
    lane_id: '',
    type: 'action',
    label: '',
    description: '',
    layout: { x: 100, y: 100 },
  });

  // Edge form
  const [edgeForm, setEdgeForm] = useState<WorkflowEdge>({
    id: '',
    source: '',
    target: '',
    label: '',
  });

  // Lane form
  const [laneForm, setLaneForm] = useState<WorkflowLane>({
    id: '',
    label: '',
    order: 1,
  });

  // Workflow process form
  const [workflowForm, setWorkflowForm] = useState<WorkflowProcess>({
    id: '',
    name: '',
    description: '',
    lanes: [],
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (editMode === 'node') {
      if (nodeData) {
        setNodeForm(nodeData);
      } else {
        setNodeForm({
          id: `wnode-${Date.now().toString(36)}`,
          lane_id: lanes[0]?.id || '',
          type: 'action',
          label: '',
          description: '',
          layout: { x: 100, y: 100 },
        });
      }
    } else if (editMode === 'edge') {
      if (edgeData) {
        setEdgeForm(edgeData);
      } else {
        setEdgeForm({
          id: `wedge-${Date.now().toString(36)}`,
          source: allNodes[0]?.id || '',
          target: allNodes[1]?.id || allNodes[0]?.id || '',
          label: '',
        });
      }
    } else if (editMode === 'lane') {
      if (laneData) {
        setLaneForm(laneData);
      } else {
        setLaneForm({
          id: `lane-${Date.now().toString(36)}`,
          label: '',
          order: lanes.length + 1,
        });
      }
    } else if (editMode === 'workflow') {
      if (workflowData) {
        setWorkflowForm(workflowData);
      } else {
        setWorkflowForm({
          id: `wf-${Date.now().toString(36)}`,
          name: '',
          description: '',
          lanes: [
            { id: `lane-user-${Date.now().toString(36)}`, label: 'Pengguna', order: 1 },
            { id: `lane-sys-${Date.now().toString(36)}`, label: 'Sistem Backend', order: 2 },
          ],
          nodes: [],
          edges: [],
        });
      }
    }
  }, [editMode, nodeData, edgeData, laneData, workflowData, lanes, allNodes, open]);

  const handleSave = () => {
    if (editMode === 'node') {
      if (!nodeForm.label.trim()) return;
      onSaveNode(nodeForm);
    } else if (editMode === 'edge') {
      if (!edgeForm.source || !edgeForm.target) return;
      onSaveEdge(edgeForm);
    } else if (editMode === 'lane') {
      if (!laneForm.label.trim()) return;
      onSaveLane(laneForm);
    } else if (editMode === 'workflow') {
      if (!workflowForm.name.trim()) return;
      onSaveWorkflow(workflowForm);
    }
    onClose();
  };

  const getTitle = () => {
    if (editMode === 'node') {
      return nodeData ? 'Edit Langkah Alur (Workflow Node)' : 'Tambah Langkah Alur Baru';
    }
    if (editMode === 'edge') {
      return edgeData ? 'Edit Koneksi / Transisi Alur' : 'Tambah Koneksi / Transisi Alur';
    }
    if (editMode === 'lane') {
      return laneData ? 'Edit Jalur / Swimlane' : 'Tambah Jalur / Swimlane Baru';
    }
    return workflowData ? 'Edit Informasi Workflow Process' : 'Buat Workflow Process Baru';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{getTitle()}</Typography>
        <IconButton onClick={onClose} size="small">
          <Icon icon="solar:close-circle-bold" width={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {/* Node Edit Mode */}
          {editMode === 'node' && (
            <>
              <TextField
                label="Node ID"
                value={nodeForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^wnode-[a-z0-9-]+$)"
              />

              <TextField
                label="Label / Nama Langkah"
                value={nodeForm.label}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, label: e.target.value }))}
                required
                fullWidth
                placeholder="e.g. Scan QR & Cetak Tiket, Apakah Berkas Lengkap?"
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipe Langkah</InputLabel>
                  <Select
                    value={nodeForm.type}
                    label="Tipe Langkah"
                    onChange={(e) =>
                      setNodeForm((prev) => ({
                        ...prev,
                        type: e.target.value as WorkflowNodeType,
                      }))
                    }
                  >
                    {WORKFLOW_NODE_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Jalur / Swimlane</InputLabel>
                  <Select
                    value={nodeForm.lane_id}
                    label="Jalur / Swimlane"
                    onChange={(e) => setNodeForm((prev) => ({ ...prev, lane_id: e.target.value }))}
                  >
                    {lanes.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.order}. {l.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Deskripsi / Petunjuk Pelaksanaan"
                value={nodeForm.description}
                onChange={(e) =>
                  setNodeForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                multiline
                rows={3}
                fullWidth
                placeholder="Detail aksi yang dilakukan pada langkah ini..."
              />
            </>
          )}

          {/* Edge Edit Mode */}
          {editMode === 'edge' && (
            <>
              <TextField
                label="Edge ID"
                value={edgeForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^wedge-[a-z0-9-]+$)"
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source Node (Dari)</InputLabel>
                  <Select
                    value={edgeForm.source}
                    label="Source Node (Dari)"
                    onChange={(e) => setEdgeForm((prev) => ({ ...prev, source: e.target.value }))}
                  >
                    {allNodes.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.label} ({n.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Target Node (Menuju)</InputLabel>
                  <Select
                    value={edgeForm.target}
                    label="Target Node (Menuju)"
                    onChange={(e) => setEdgeForm((prev) => ({ ...prev, target: e.target.value }))}
                  >
                    {allNodes.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.label} ({n.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Label Alur / Kondisi Percabangan"
                value={edgeForm.label}
                onChange={(e) => setEdgeForm((prev) => ({ ...prev, label: e.target.value }))}
                fullWidth
                placeholder="e.g. Ya, Tidak, Valid, Timeout, Lanjut"
                helperText="Label kondisi untuk alur (sangat disarankan untuk outgoing cabang decision)"
              />
            </>
          )}

          {/* Lane Edit Mode */}
          {editMode === 'lane' && (
            <>
              <TextField
                label="Lane ID"
                value={laneForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^lane-[a-z0-9-]+$)"
              />

              <TextField
                label="Nama Jalur / Aktor / Departemen"
                value={laneForm.label}
                onChange={(e) => setLaneForm((prev) => ({ ...prev, label: e.target.value }))}
                required
                fullWidth
                placeholder="e.g. Warga / Pemohon, Petugas Loket, Server Backend"
              />

              <TextField
                label="Urutan Tampilan (Order)"
                type="number"
                value={laneForm.order}
                onChange={(e) =>
                  setLaneForm((prev) => ({ ...prev, order: Number(e.target.value) || 1 }))
                }
                fullWidth
              />
            </>
          )}

          {/* Workflow Process Edit Mode */}
          {editMode === 'workflow' && (
            <>
              <TextField
                label="Workflow ID"
                value={workflowForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^wf-[a-z0-9-]+$)"
              />

              <TextField
                label="Nama Alur Kerja (Workflow Name)"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
                placeholder="e.g. Alur Pendaftaran Online, Alur Pelayanan Loket Walk-in"
              />

              <TextField
                label="Deskripsi / Cakupan Proses"
                value={workflowForm.description}
                onChange={(e) =>
                  setWorkflowForm((prev) => ({ ...prev, description: e.target.value }))
                }
                multiline
                rows={3}
                fullWidth
                placeholder="Penjelasan tujuan dan prosedur bisnis alur kerja ini..."
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {editMode === 'node' && nodeData && onDeleteNode && (
            <Button
              color="error"
              size="small"
              startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
              onClick={() => {
                onDeleteNode(nodeData.id);
                onClose();
              }}
            >
              Hapus Langkah
            </Button>
          )}
          {editMode === 'edge' && edgeData && onDeleteEdge && (
            <Button
              color="error"
              size="small"
              startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
              onClick={() => {
                onDeleteEdge(edgeData.id);
                onClose();
              }}
            >
              Hapus Koneksi
            </Button>
          )}
          {editMode === 'lane' && laneData && onDeleteLane && (
            <Button
              color="error"
              size="small"
              startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
              onClick={() => {
                onDeleteLane(laneData.id);
                onClose();
              }}
            >
              Hapus Jalur
            </Button>
          )}
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button onClick={onClose} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={
              editMode === 'node'
                ? !nodeForm.label.trim()
                : editMode === 'edge'
                  ? !edgeForm.source || !edgeForm.target
                  : editMode === 'lane'
                    ? !laneForm.label.trim()
                    : !workflowForm.name.trim()
            }
          >
            Simpan Perubahan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

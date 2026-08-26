import type { ArchEdge, ArchNode, ArchGroup, ArchEdgeType, ArchNodeType } from '../types';

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
  editMode: 'node' | 'edge';
  nodeData: ArchNode | null;
  edgeData: ArchEdge | null;
  groups: ArchGroup[];
  allNodes: ArchNode[];
  onClose: () => void;
  onSaveNode: (node: ArchNode) => void;
  onSaveEdge: (edge: ArchEdge) => void;
};

const ARCH_NODE_TYPES: { value: ArchNodeType; label: string }[] = [
  { value: 'channel', label: 'Channel (Presentation / Display)' },
  { value: 'application', label: 'Application (Web / Mobile App)' },
  { value: 'service', label: 'Service (Backend / Microservice)' },
  { value: 'database', label: 'Database (SQL / NoSQL DB)' },
  { value: 'cache', label: 'Cache (Redis / In-Memory)' },
  { value: 'storage', label: 'Storage (S3 / File System)' },
  { value: 'integration', label: 'Integration (External API / Gateway)' },
  { value: 'device', label: 'Device (Printer / Kiosk / POS)' },
];

const ARCH_EDGE_TYPES: { value: ArchEdgeType; label: string }[] = [
  { value: 'sync', label: 'Sync (Synchronous REST / gRPC)' },
  { value: 'async', label: 'Async (Asynchronous Queue / Message)' },
  { value: 'data_flow', label: 'Data Flow (Database / Storage I/O)' },
  { value: 'event', label: 'Event (Event-Driven Streaming)' },
];

export function NodeEditDialog({
  open,
  editMode,
  nodeData,
  edgeData,
  groups,
  allNodes,
  onClose,
  onSaveNode,
  onSaveEdge,
}: Props) {
  // Node state
  const [nodeForm, setNodeForm] = useState<ArchNode>({
    id: '',
    group_id: '',
    type: 'service',
    label: '',
    description: '',
    layout: { x: 100, y: 100 },
  });

  // Edge state
  const [edgeForm, setEdgeForm] = useState<ArchEdge>({
    id: '',
    source: '',
    target: '',
    label: '',
    type: 'sync',
  });

  useEffect(() => {
    if (editMode === 'node') {
      if (nodeData) {
        setNodeForm(nodeData);
      } else {
        setNodeForm({
          id: `node-${Date.now().toString(36)}`,
          group_id: groups[0]?.id || '',
          type: 'service',
          label: '',
          description: '',
          layout: { x: 100, y: 100 },
        });
      }
    } else if (edgeData) {
      setEdgeForm(edgeData);
    } else {
      setEdgeForm({
        id: `edge-${Date.now().toString(36)}`,
        source: allNodes[0]?.id || '',
        target: allNodes[1]?.id || allNodes[0]?.id || '',
        label: '',
        type: 'sync',
      });
    }
  }, [editMode, nodeData, edgeData, groups, allNodes, open]);

  const handleSave = () => {
    if (editMode === 'node') {
      if (!nodeForm.label.trim()) return;
      onSaveNode(nodeForm);
    } else {
      if (!edgeForm.source || !edgeForm.target) return;
      onSaveEdge(edgeForm);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {editMode === 'node'
            ? nodeData
              ? 'Edit Architecture Node'
              : 'Tambah Architecture Node'
            : edgeData
              ? 'Edit Architecture Edge / Connection'
              : 'Tambah Architecture Edge / Connection'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Icon icon="solar:close-circle-bold" width={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {editMode === 'node' ? (
            <>
              <TextField
                label="Node ID"
                value={nodeForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^node-[a-z0-9-]+$)"
              />

              <TextField
                label="Component Label"
                value={nodeForm.label}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, label: e.target.value }))}
                required
                fullWidth
                placeholder="e.g. Booking Service"
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Component Type</InputLabel>
                  <Select
                    value={nodeForm.type}
                    label="Component Type"
                    onChange={(e) =>
                      setNodeForm((prev) => ({
                        ...prev,
                        type: e.target.value as ArchNodeType,
                      }))
                    }
                  >
                    {ARCH_NODE_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Group / Tier</InputLabel>
                  <Select
                    value={nodeForm.group_id}
                    label="Group / Tier"
                    onChange={(e) =>
                      setNodeForm((prev) => ({
                        ...prev,
                        group_id: e.target.value,
                      }))
                    }
                  >
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.order}. {g.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Description & Tech Notes"
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
                placeholder="Catatan teknologi, framework, atau arsitektur..."
              />
            </>
          ) : (
            <>
              <TextField
                label="Edge ID"
                value={edgeForm.id}
                disabled
                size="small"
                helperText="Kanonikal identifier unik (^edge-[a-z0-9-]+$)"
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source Node</InputLabel>
                  <Select
                    value={edgeForm.source}
                    label="Source Node"
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
                  <InputLabel>Target Node</InputLabel>
                  <Select
                    value={edgeForm.target}
                    label="Target Node"
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

              <FormControl fullWidth size="small">
                <InputLabel>Communication Paradigm</InputLabel>
                <Select
                  value={edgeForm.type}
                  label="Communication Paradigm"
                  onChange={(e) =>
                    setEdgeForm((prev) => ({
                      ...prev,
                      type: e.target.value as ArchEdgeType,
                    }))
                  }
                >
                  {ARCH_EDGE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Protocol / Payload Label"
                value={edgeForm.label}
                onChange={(e) => setEdgeForm((prev) => ({ ...prev, label: e.target.value }))}
                fullWidth
                placeholder="e.g. HTTPS / REST, gRPC, WebSocket, SQL Tx"
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Batal
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={
            editMode === 'node' ? !nodeForm.label.trim() : !edgeForm.source || !edgeForm.target
          }
        >
          Simpan Perubahan
        </Button>
      </DialogActions>
    </Dialog>
  );
}

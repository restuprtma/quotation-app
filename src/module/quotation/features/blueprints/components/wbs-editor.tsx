import type { CanonicalIssue } from '../types';
import type { ReferenceOption } from '../validation/manual-section';
import type {
  WBS,
  WBSModule,
  WBSFeature,
  CrossReference,
  WBSModulePriority,
  CrossReferenceRelationType,
} from '../types/bundle';

import React, { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';

import { Iconify } from 'src/shared/ui/iconify';

import { ReferenceSelect } from './manual/reference-select';
import { detectWBSCycles } from '../utils/wbs-cycle-detector';
import { newBlueprintItemId } from '../validation/manual-payload';
import { checkReferencedItem } from '../validation/manual-section';
import { WBS_MODULE_PRIORITIES, CROSS_REFERENCE_RELATION_TYPES } from './manual/wbs-fields';

// ----------------------------------------------------------------------

export interface WbsEditorProps {
  wbs: WBS;
  crossReferences?: CrossReference[];
  onChange: (updatedWbs: WBS, updatedCrossRefs: CrossReference[]) => void;
  referenceOptions?: ReferenceOption[];
  issues?: CanonicalIssue[];
  focusTargetId?: string | null;
  readOnly?: boolean;
}

const PRIORITY_COLOR_MAP: Record<WBSModulePriority, 'error' | 'warning' | 'success'> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
};

// ----------------------------------------------------------------------

export function WbsEditor({
  wbs,
  crossReferences = [],
  onChange,
  referenceOptions = [],
  issues = [],
  focusTargetId = null,
  readOnly = false,
}: WbsEditorProps) {
  const modules = useMemo(() => wbs?.modules || [], [wbs]);
  const crossRefs = useMemo(() => crossReferences || [], [crossReferences]);

  // View state: 'tree' | 'table'
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Deletion alert / warning state
  const [deletionAlert, setDeletionAlert] = useState<string | null>(null);

  // Dialog States
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<WBSModule | null>(null);
  const [moduleForm, setModuleForm] = useState<{
    id: string;
    name: string;
    description: string;
    priority: WBSModulePriority;
    dependencies: string[];
    references: string[];
  }>({
    id: '',
    name: '',
    description: '',
    priority: 'medium',
    dependencies: [],
    references: [],
  });

  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [targetModuleIdForFeature, setTargetModuleIdForFeature] = useState<string>('');
  const [editingFeature, setEditingFeature] = useState<WBSFeature | null>(null);
  const [featureForm, setFeatureForm] = useState<{
    id: string;
    name: string;
    description: string;
    acceptance_criteria: string[];
  }>({
    id: '',
    name: '',
    description: '',
    acceptance_criteria: [],
  });
  const [newCriteriaText, setNewCriteriaText] = useState('');

  const [crossRefModalOpen, setCrossRefModalOpen] = useState(false);
  const [editingCrossRef, setEditingCrossRef] = useState<CrossReference | null>(null);
  const [crossRefForm, setCrossRefForm] = useState<{
    id: string;
    source_ref: string;
    target_ref: string;
    relation_type: CrossReferenceRelationType;
    description: string;
  }>({
    id: '',
    source_ref: '',
    target_ref: '',
    relation_type: 'implements',
    description: '',
  });

  // Cycle detection
  const cycleResult = useMemo(() => detectWBSCycles(modules), [modules]);

  // Metrics summary
  const totalModules = modules.length;
  const totalFeatures = modules.reduce((acc, m) => acc + (m.features?.length || 0), 0);
  const totalCriteria = modules.reduce(
    (acc, m) =>
      acc + (m.features || []).reduce((fAcc, f) => fAcc + (f.acceptance_criteria?.length || 0), 0),
    0
  );
  const highPriorityCount = modules.filter((m) => m.priority === 'high').length;
  const medPriorityCount = modules.filter((m) => m.priority === 'medium').length;
  const lowPriorityCount = modules.filter((m) => m.priority === 'low').length;

  // Collect all item IDs for expand all
  const allTreeItemIds = useMemo(() => {
    const ids: string[] = [];
    modules.forEach((mod) => {
      ids.push(`mod-${mod.id}`);
      (mod.features || []).forEach((feat) => {
        ids.push(`feat-${mod.id}-${feat.id}`);
        (feat.acceptance_criteria || []).forEach((_, cIdx) => {
          ids.push(`crit-${mod.id}-${feat.id}-${cIdx}`);
        });
      });
    });
    return ids;
  }, [modules]);

  // Auto-expand on initial render
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current && allTreeItemIds.length > 0) {
      setExpandedItems(allTreeItemIds);
      isInitializedRef.current = true;
    }
  }, [allTreeItemIds]);

  // Auto-focus when focusTargetId changes
  useEffect(() => {
    if (!focusTargetId || modules.length === 0) return;

    for (const mod of modules) {
      if (mod.id === focusTargetId) {
        setExpandedItems((prev) => Array.from(new Set([...prev, `mod-${mod.id}`])));
        return;
      }
      for (const feat of mod.features || []) {
        if (feat.id === focusTargetId) {
          setExpandedItems((prev) =>
            Array.from(new Set([...prev, `mod-${mod.id}`, `feat-${mod.id}-${feat.id}`]))
          );
          return;
        }
      }
    }
  }, [focusTargetId, modules]);

  // Filtered modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        (m.features || []).some(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.id.toLowerCase().includes(q) ||
            f.description?.toLowerCase().includes(q)
        )
    );
  }, [modules, searchQuery]);

  // Handlers for Tree Expansion
  const handleExpandAll = () => setExpandedItems(allTreeItemIds);
  const handleCollapseAll = () => setExpandedItems([]);

  // ============================================================
  // Module Actions
  // ============================================================
  const handleOpenAddModule = () => {
    setDeletionAlert(null);
    setEditingModule(null);
    setModuleForm({
      id: newBlueprintItemId('mod'),
      name: '',
      description: '',
      priority: 'medium',
      dependencies: [],
      references: [],
    });
    setModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: WBSModule) => {
    setDeletionAlert(null);
    setEditingModule(mod);
    setModuleForm({
      id: mod.id,
      name: mod.name,
      description: mod.description || '',
      priority: mod.priority || 'medium',
      dependencies: [...(mod.dependencies || [])],
      references: [...(mod.references || [])],
    });
    setModuleModalOpen(true);
  };

  const handleSaveModule = () => {
    if (!moduleForm.name.trim()) return;

    if (editingModule) {
      // Update existing
      const updatedModules = modules.map((m) =>
        m.id === editingModule.id
          ? {
              ...m,
              name: moduleForm.name.trim(),
              description: moduleForm.description.trim(),
              priority: moduleForm.priority,
              dependencies: moduleForm.dependencies,
              references: moduleForm.references,
            }
          : m
      );
      onChange({ ...wbs, modules: updatedModules }, crossRefs);
    } else {
      // Add new
      const newMod: WBSModule = {
        id: moduleForm.id || newBlueprintItemId('mod'),
        name: moduleForm.name.trim(),
        description: moduleForm.description.trim(),
        priority: moduleForm.priority,
        dependencies: moduleForm.dependencies,
        references: moduleForm.references,
        features: [],
      };
      onChange({ ...wbs, modules: [...modules, newMod] }, crossRefs);
    }
    setModuleModalOpen(false);
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    onChange({ ...wbs, modules: updated }, crossRefs);
  };

  const handleDeleteModule = (moduleId: string) => {
    setDeletionAlert(null);
    const guard = checkReferencedItem(moduleId, 'module', wbs, {
      cross_references: crossRefs,
    });

    if (!guard.allowed) {
      setDeletionAlert(guard.reason || `Module "${moduleId}" tidak dapat dihapus.`);
      return;
    }

    const updatedModules = modules.filter((m) => m.id !== moduleId);
    onChange({ ...wbs, modules: updatedModules }, crossRefs);
  };

  // ============================================================
  // Feature Actions
  // ============================================================
  const handleOpenAddFeature = (moduleId: string) => {
    setDeletionAlert(null);
    setTargetModuleIdForFeature(moduleId);
    setEditingFeature(null);
    setFeatureForm({
      id: newBlueprintItemId('feat'),
      name: '',
      description: '',
      acceptance_criteria: [],
    });
    setNewCriteriaText('');
    setFeatureModalOpen(true);
  };

  const handleOpenEditFeature = (moduleId: string, feat: WBSFeature) => {
    setDeletionAlert(null);
    setTargetModuleIdForFeature(moduleId);
    setEditingFeature(feat);
    setFeatureForm({
      id: feat.id,
      name: feat.name,
      description: feat.description || '',
      acceptance_criteria: [...(feat.acceptance_criteria || [])],
    });
    setNewCriteriaText('');
    setFeatureModalOpen(true);
  };

  const handleSaveFeature = () => {
    if (!featureForm.name.trim() || !targetModuleIdForFeature) return;

    const updatedModules = modules.map((m) => {
      if (m.id !== targetModuleIdForFeature) return m;

      if (editingFeature) {
        // Update feature
        const updatedFeatures = (m.features || []).map((f) =>
          f.id === editingFeature.id
            ? {
                ...f,
                name: featureForm.name.trim(),
                description: featureForm.description.trim(),
                acceptance_criteria: featureForm.acceptance_criteria,
              }
            : f
        );
        return { ...m, features: updatedFeatures };
      } else {
        // Add feature
        const newFeat: WBSFeature = {
          id: featureForm.id || newBlueprintItemId('feat'),
          name: featureForm.name.trim(),
          description: featureForm.description.trim(),
          acceptance_criteria: featureForm.acceptance_criteria,
        };
        return { ...m, features: [...(m.features || []), newFeat] };
      }
    });

    onChange({ ...wbs, modules: updatedModules }, crossRefs);
    setFeatureModalOpen(false);
  };

  const handleDeleteFeature = (moduleId: string, featId: string) => {
    setDeletionAlert(null);
    const updatedModules = modules.map((m) => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        features: (m.features || []).filter((f) => f.id !== featId),
      };
    });
    onChange({ ...wbs, modules: updatedModules }, crossRefs);
  };

  const handleAddCriteriaToForm = () => {
    const trimmed = newCriteriaText.trim();
    if (trimmed) {
      setFeatureForm((prev) => ({
        ...prev,
        acceptance_criteria: [...prev.acceptance_criteria, trimmed],
      }));
      setNewCriteriaText('');
    }
  };

  const handleRemoveCriteriaFromForm = (critIdx: number) => {
    setFeatureForm((prev) => ({
      ...prev,
      acceptance_criteria: prev.acceptance_criteria.filter((_, i) => i !== critIdx),
    }));
  };

  const handleUpdateCriteriaInForm = (critIdx: number, val: string) => {
    setFeatureForm((prev) => {
      const updated = [...prev.acceptance_criteria];
      updated[critIdx] = val;
      return { ...prev, acceptance_criteria: updated };
    });
  };

  // ============================================================
  // Cross Reference Actions
  // ============================================================
  const handleOpenAddCrossRef = () => {
    setDeletionAlert(null);
    setEditingCrossRef(null);
    setCrossRefForm({
      id: newBlueprintItemId('xref'),
      source_ref: '',
      target_ref: '',
      relation_type: 'implements',
      description: '',
    });
    setCrossRefModalOpen(true);
  };

  const handleOpenEditCrossRef = (xr: CrossReference) => {
    setDeletionAlert(null);
    setEditingCrossRef(xr);
    setCrossRefForm({
      id: xr.id,
      source_ref: xr.source_ref,
      target_ref: xr.target_ref,
      relation_type: xr.relation_type || 'implements',
      description: xr.description || '',
    });
    setCrossRefModalOpen(true);
  };

  const handleSaveCrossRef = () => {
    if (editingCrossRef) {
      const updatedRefs = crossRefs.map((x) =>
        x.id === editingCrossRef.id
          ? {
              ...x,
              source_ref: crossRefForm.source_ref,
              target_ref: crossRefForm.target_ref,
              relation_type: crossRefForm.relation_type,
              description: crossRefForm.description.trim(),
            }
          : x
      );
      onChange(wbs, updatedRefs);
    } else {
      const newXr: CrossReference = {
        id: crossRefForm.id || newBlueprintItemId('xref'),
        source_ref: crossRefForm.source_ref,
        target_ref: crossRefForm.target_ref,
        relation_type: crossRefForm.relation_type,
        description: crossRefForm.description.trim(),
      };
      onChange(wbs, [...crossRefs, newXr]);
    }
    setCrossRefModalOpen(false);
  };

  const handleDeleteCrossRef = (xrId: string) => {
    setDeletionAlert(null);
    const updatedRefs = crossRefs.filter((x) => x.id !== xrId);
    onChange(wbs, updatedRefs);
  };

  return (
    <Box data-testid="wbs-editor" sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Deletion Error Alert */}
        {deletionAlert && (
          <Alert severity="error" onClose={() => setDeletionAlert(null)}>
            {deletionAlert}
          </Alert>
        )}

        {/* Dependency Cycle Alert */}
        {cycleResult.hasCycle && (
          <Alert severity="error" variant="filled">
            <AlertTitle sx={{ fontWeight: 700 }}>
              Terdeteksi Siklus Dependensi (Dependency Cycle Blocking)
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {cycleResult.message}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Struktur WBS harus membentuk Directed Acyclic Graph (DAG). Siklus dependensi ini akan
              memblokir validasi authoritative backend saat tahap diselesaikan.
            </Typography>
          </Alert>
        )}

        {/* Metrics & Control Toolbar */}
        <Card variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            {/* Summary Metrics Chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Chip
                icon={<Iconify icon="solar:folder-with-files-bold" />}
                label={`Total Modul: ${totalModules}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<Iconify icon="solar:checklist-bold" />}
                label={`Total Fitur: ${totalFeatures}`}
                color="info"
                variant="outlined"
              />
              <Chip
                icon={<Iconify icon="solar:check-circle-bold" />}
                label={`Acceptance Criteria: ${totalCriteria}`}
                color="default"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`High: ${highPriorityCount}`}
                color="error"
                variant="soft"
              />
              <Chip
                size="small"
                label={`Medium: ${medPriorityCount}`}
                color="warning"
                variant="soft"
              />
              <Chip
                size="small"
                label={`Low: ${lowPriorityCount}`}
                color="success"
                variant="soft"
              />
            </Stack>

            {/* View Mode & Actions */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Cari modul / fitur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:magnifer-bold" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ width: 220 }}
              />

              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={viewMode === 'tree' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('tree')}
                  startIcon={<Iconify icon="solar:widget-6-bold" />}
                >
                  Tree View
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  startIcon={<Iconify icon="solar:list-bold" />}
                >
                  Tabel
                </Button>
              </ButtonGroup>

              {viewMode === 'tree' && (
                <ButtonGroup size="small" variant="outlined" color="inherit">
                  <Button onClick={handleExpandAll} title="Buka Semua Cabang">
                    Expand All
                  </Button>
                  <Button onClick={handleCollapseAll} title="Tutup Semua Cabang">
                    Collapse All
                  </Button>
                </ButtonGroup>
              )}

              {!readOnly && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenAddModule}
                >
                  Tambah Module
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>

        {/* ============================================================ */}
        {/* 1. MODULES TREE / TABLE VIEW */}
        {/* ============================================================ */}
        {filteredModules.length === 0 ? (
          <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? 'Tidak ada modul WBS yang cocok dengan pencarian.'
                : 'Belum ada modul WBS yang ditambahkan.'}
            </Typography>
          </Card>
        ) : viewMode === 'tree' ? (
          /* Tree View using @mui/x-tree-view */
          <Card variant="outlined" sx={{ p: 2.5 }}>
            <SimpleTreeView
              expandedItems={expandedItems}
              onExpandedItemsChange={(event, ids) => setExpandedItems(ids)}
            >
              {filteredModules.map((mod, mIdx) => {
                const isCycleModule = cycleResult.cycleModules.includes(mod.id);
                const isFocused = focusTargetId === mod.id;
                const modName = mod.name || mod.id;

                return (
                  <TreeItem
                    key={mod.id}
                    itemId={`mod-${mod.id}`}
                    label={
                      <Box sx={{ py: 0.5, width: '100%' }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={2}
                          sx={{
                            py: 0.5,
                            px: 1,
                            borderRadius: 1,
                            bgcolor: isFocused
                              ? 'action.selected'
                              : isCycleModule
                                ? 'error.lighter'
                                : 'transparent',
                            border: isFocused ? '1px solid' : 'none',
                            borderColor: isFocused ? 'primary.main' : 'transparent',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                            <Chip
                              size="small"
                              label={`Prioritas: ${mod.priority || 'medium'}`}
                              color={PRIORITY_COLOR_MAP[mod.priority] || 'warning'}
                              variant="filled"
                            />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {modName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
                            >
                              ({mod.id})
                            </Typography>
                            {isCycleModule && (
                              <Chip size="small" label="CYCLIC" color="error" variant="filled" />
                            )}
                            {mod.dependencies?.length > 0 && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  Prasyarat:
                                </Typography>
                                {mod.dependencies.map((depId) => (
                                  <Chip key={depId} label={depId} size="small" variant="outlined" />
                                ))}
                              </Stack>
                            )}
                          </Stack>

                          {!readOnly && (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Tooltip title="Geser Atas">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={mIdx === 0}
                                    aria-label={`Geser Atas Module ${modName}`}
                                    onClick={() => handleMoveModule(mIdx, 'up')}
                                  >
                                    <Iconify icon="solar:arrow-up-bold" width={16} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Geser Bawah">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={mIdx === modules.length - 1}
                                    aria-label={`Geser Bawah Module ${modName}`}
                                    onClick={() => handleMoveModule(mIdx, 'down')}
                                  >
                                    <Iconify icon="solar:arrow-down-bold" width={16} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Iconify icon="solar:add-circle-bold" width={14} />}
                                aria-label={`Tambah Feature ke Module ${modName}`}
                                onClick={() => handleOpenAddFeature(mod.id)}
                              >
                                Tambah Fitur
                              </Button>
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label={`Edit Module ${modName}`}
                                onClick={() => handleOpenEditModule(mod)}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Hapus Module ${modName}`}
                                onClick={() => handleDeleteModule(mod.id)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Stack>
                          )}
                        </Stack>

                        {mod.description && (
                          <Typography
                            variant="body2"
                            sx={{ px: 1, color: 'text.secondary', fontSize: '0.85rem', mt: 0.25 }}
                          >
                            {mod.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  >
                    {/* Features List (Direct TreeItem children of Module TreeItem) */}
                    {(mod.features || []).map((feat) => {
                      const isFeatFocused = focusTargetId === feat.id;
                      const featName = feat.name || feat.id;

                      return (
                        <TreeItem
                          key={feat.id}
                          itemId={`feat-${mod.id}-${feat.id}`}
                          label={
                            <Box sx={{ py: 0.25, width: '100%' }}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                spacing={2}
                                sx={{
                                  py: 0.5,
                                  px: 1,
                                  borderRadius: 1,
                                  bgcolor: isFeatFocused ? 'action.selected' : 'transparent',
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1.5}
                                  flexWrap="wrap"
                                >
                                  <Iconify
                                    icon="solar:checklist-bold"
                                    width={18}
                                    color="info.main"
                                  />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {featName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
                                  >
                                    ({feat.id})
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={`${feat.acceptance_criteria?.length || 0} Kriteria`}
                                    variant="outlined"
                                  />
                                </Stack>

                                {!readOnly && (
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      aria-label={`Edit Feature ${featName}`}
                                      onClick={() => handleOpenEditFeature(mod.id, feat)}
                                    >
                                      <Iconify icon="solar:pen-bold" width={14} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      aria-label={`Hapus Feature ${featName}`}
                                      onClick={() => handleDeleteFeature(mod.id, feat.id)}
                                    >
                                      <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                                    </IconButton>
                                  </Stack>
                                )}
                              </Stack>

                              {feat.description && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    px: 1,
                                    color: 'text.secondary',
                                    fontSize: '0.8rem',
                                    display: 'block',
                                  }}
                                >
                                  {feat.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        >
                          {/* Acceptance Criteria Sub-items (Direct TreeItem children of Feature TreeItem) */}
                          {(feat.acceptance_criteria || []).map((crit, cIdx) => (
                            <TreeItem
                              key={cIdx}
                              itemId={`crit-${mod.id}-${feat.id}-${cIdx}`}
                              label={
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ py: 0.25 }}
                                >
                                  <Iconify
                                    icon="solar:check-circle-bold"
                                    width={14}
                                    color="success.main"
                                  />
                                  <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                                    {crit}
                                  </Typography>
                                </Stack>
                              }
                            />
                          ))}
                        </TreeItem>
                      );
                    })}
                  </TreeItem>
                );
              })}
            </SimpleTreeView>
          </Card>
        ) : (
          /* Table View */
          <Card variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '25%' }}>Modul & Prioritas</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '20%' }}>
                      Prasyarat / Dependensi
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '40%' }}>Fitur & Kriteria</TableCell>
                    {!readOnly && (
                      <TableCell align="right" sx={{ fontWeight: 700, width: '15%' }}>
                        Aksi
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredModules.map((mod, mIdx) => {
                    const isCycleModule = cycleResult.cycleModules.includes(mod.id);
                    const modName = mod.name || mod.id;

                    return (
                      <TableRow key={mod.id} hover>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={mod.priority || 'medium'}
                                color={PRIORITY_COLOR_MAP[mod.priority] || 'warning'}
                              />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {modName}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                            >
                              {mod.id}
                            </Typography>
                            {mod.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: '0.8rem' }}
                              >
                                {mod.description}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          <Stack spacing={0.5}>
                            {mod.dependencies?.length > 0 ? (
                              mod.dependencies.map((depId) => (
                                <Chip
                                  key={depId}
                                  label={depId}
                                  size="small"
                                  color={isCycleModule ? 'error' : 'default'}
                                  variant="outlined"
                                />
                              ))
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontStyle: 'italic' }}
                              >
                                Tidak ada prasyarat
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          <Stack spacing={1.5}>
                            {(mod.features || []).map((f) => (
                              <Box
                                key={f.id}
                                sx={{ p: 1, bgcolor: 'background.neutral', borderRadius: 1 }}
                              >
                                <Typography variant="subtitle2" color="primary">
                                  {f.name} ({f.id})
                                </Typography>
                                {f.description && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    {f.description}
                                  </Typography>
                                )}
                                <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                                  {(f.acceptance_criteria || []).map((crit, cIdx) => (
                                    <Typography
                                      key={cIdx}
                                      variant="caption"
                                      sx={{ display: 'flex', gap: 0.5 }}
                                    >
                                      <span>•</span> {crit}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        </TableCell>
                        {!readOnly && (
                          <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label={`Edit Module ${modName}`}
                                onClick={() => handleOpenEditModule(mod)}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Hapus Module ${modName}`}
                                onClick={() => handleDeleteModule(mod.id)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* ============================================================ */}
        {/* 2. CROSS REFERENCES SECTION */}
        {/* ============================================================ */}
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Cross-References / Pemetaan Lintas Blueprint
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Relasi keterhubungan eksplisit antara elemen WBS, Arsitektur, Workflow, State
                  Machine, atau User Journey.
                </Typography>
              </Box>

              {!readOnly && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleOpenAddCrossRef}
                >
                  Tambah Cross Reference
                </Button>
              )}
            </Stack>

            {crossRefs.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic', py: 1 }}
              >
                Belum ada Cross Reference yang ditambahkan.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Source Ref</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipe Relasi</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Target Ref</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Deskripsi</TableCell>
                      {!readOnly && (
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Aksi
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {crossRefs.map((xr) => (
                      <TableRow key={xr.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {xr.id}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={xr.source_ref}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={xr.relation_type} size="small" color="info" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={xr.target_ref}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{xr.description || '-'}</TableCell>
                        {!readOnly && (
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label={`Edit Cross Reference ${xr.id}`}
                                onClick={() => handleOpenEditCrossRef(xr)}
                              >
                                <Iconify icon="solar:pen-bold" width={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Hapus Cross Reference ${xr.id}`}
                                onClick={() => handleDeleteCrossRef(xr.id)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* ============================================================ */}
      {/* DIALOG: Add / Edit Module */}
      {/* ============================================================ */}
      <Dialog
        open={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingModule ? 'Edit Module WBS' : 'Tambah Module WBS'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Nama Module"
              fullWidth
              size="small"
              required
              placeholder="Contoh: Modul Core Queue Engine"
              value={moduleForm.name}
              onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="mod-priority-select-label">Prioritas Module</InputLabel>
              <Select
                labelId="mod-priority-select-label"
                label="Prioritas Module"
                value={moduleForm.priority}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, priority: e.target.value as WBSModulePriority })
                }
              >
                {WBS_MODULE_PRIORITIES.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Deskripsi Module"
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Penjelasan arsitektur dan ruang lingkup modul"
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
            />

            {/* Dependencies Multi-Select */}
            <FormControl fullWidth size="small">
              <InputLabel id="mod-deps-select-label">Prasyarat / Dependencies Modul</InputLabel>
              <Select
                labelId="mod-deps-select-label"
                label="Prasyarat / Dependencies Modul"
                multiple
                value={moduleForm.dependencies}
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    dependencies:
                      typeof e.target.value === 'string'
                        ? e.target.value.split(',')
                        : e.target.value,
                  })
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((val) => {
                      const depMod = modules.find((m) => m.id === val);
                      return <Chip key={val} label={depMod?.name || val} size="small" />;
                    })}
                  </Box>
                )}
              >
                {modules
                  .filter((m) => m.id !== moduleForm.id)
                  .map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name || m.id} ({m.id})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Canonical References */}
            <ReferenceSelect
              label="Referensi Canonical Modul"
              options={referenceOptions}
              multiple
              value={moduleForm.references}
              onChange={(val) => setModuleForm({ ...moduleForm, references: val as string[] })}
              placeholder="Pilih referensi canonical..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleModalOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveModule}
            variant="contained"
            color="primary"
            disabled={!moduleForm.name.trim()}
          >
            Simpan Module
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: Add / Edit Feature */}
      {/* ============================================================ */}
      <Dialog
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingFeature ? 'Edit Feature' : 'Tambah Feature'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Nama Feature"
              fullWidth
              size="small"
              required
              placeholder="Contoh: Alokasi Nomor Tiket"
              value={featureForm.name}
              onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
            />

            <TextField
              label="Deskripsi Feature"
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Penjelasan fungsionalitas fitur"
              value={featureForm.description}
              onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
            />

            {/* Acceptance Criteria Sub-list */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Acceptance Criteria / Kriteria Keberterimaan
              </Typography>

              {featureForm.acceptance_criteria.length > 0 && (
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {featureForm.acceptance_criteria.map((crit, cIdx) => (
                    <Stack key={cIdx} direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        fullWidth
                        label={`Kriteria ${cIdx + 1}`}
                        value={crit}
                        onChange={(e) => handleUpdateCriteriaInForm(cIdx, e.target.value)}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Hapus Kriteria ${cIdx + 1}`}
                        onClick={() => handleRemoveCriteriaFromForm(cIdx)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  label="Input Kriteria"
                  placeholder="Tulis kriteria keberterimaan..."
                  value={newCriteriaText}
                  onChange={(e) => setNewCriteriaText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCriteriaToForm();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddCriteriaToForm}
                  disabled={!newCriteriaText.trim()}
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                >
                  Tambah Kriteria
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeatureModalOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={handleSaveFeature}
            variant="contained"
            color="primary"
            disabled={!featureForm.name.trim()}
          >
            Simpan Feature
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: Add / Edit Cross Reference */}
      {/* ============================================================ */}
      <Dialog
        open={crossRefModalOpen}
        onClose={() => setCrossRefModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCrossRef ? 'Edit Cross Reference' : 'Tambah Cross Reference'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <ReferenceSelect
              label="Source Ref"
              options={referenceOptions}
              value={crossRefForm.source_ref}
              onChange={(val) => setCrossRefForm({ ...crossRefForm, source_ref: val as string })}
              placeholder="Pilih canonical source URI..."
            />

            <ReferenceSelect
              label="Target Ref"
              options={referenceOptions}
              value={crossRefForm.target_ref}
              onChange={(val) => setCrossRefForm({ ...crossRefForm, target_ref: val as string })}
              placeholder="Pilih canonical target URI..."
            />

            <FormControl fullWidth size="small">
              <InputLabel id="xref-relation-select-label">Tipe Relasi</InputLabel>
              <Select
                labelId="xref-relation-select-label"
                label="Tipe Relasi"
                value={crossRefForm.relation_type}
                onChange={(e) =>
                  setCrossRefForm({
                    ...crossRefForm,
                    relation_type: e.target.value as CrossReferenceRelationType,
                  })
                }
              >
                {CROSS_REFERENCE_RELATION_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Deskripsi Cross Reference"
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Penjelasan keterhubungan antar elemen blueprint"
              value={crossRefForm.description}
              onChange={(e) => setCrossRefForm({ ...crossRefForm, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCrossRefModalOpen(false)} color="inherit">
            Batal
          </Button>
          <Button onClick={handleSaveCrossRef} variant="contained" color="primary">
            Simpan Cross Reference
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

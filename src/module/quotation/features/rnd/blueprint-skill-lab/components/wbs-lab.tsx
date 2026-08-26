import type { WBSModule, WBSFeature, WBSSection } from '../types';

import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';

import { WBSEditDialog } from './wbs-edit-dialog';
import { detectWBSCycles } from '../utils/wbs-cycle-detector';

// ----------------------------------------------------------------------

type Props = {
  wbs: WBSSection;
  onChange: (updatedWBS: WBSSection) => void;
};

export function WBSLab({ wbs, onChange }: Props) {
  const theme = useTheme();

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'module' | 'feature' | 'criteria'>('module');
  const [selectedModule, setSelectedModule] = useState<WBSModule | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<WBSFeature | null>(null);
  const [selectedCriteriaText, setSelectedCriteriaText] = useState<string | null>(null);
  const [selectedCriteriaIndex, setSelectedCriteriaIndex] = useState<number | null>(null);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [targetFeatureId, setTargetFeatureId] = useState<string>('');

  // Tree View Expand / Collapse & Search
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Cycle Detection
  const cycleResult = useMemo(() => detectWBSCycles(wbs.modules), [wbs.modules]);

  // 2. Metrics summary
  const totalModules = wbs.modules.length;
  const totalFeatures = wbs.modules.reduce((acc, m) => acc + m.features.length, 0);
  const totalCriteria = wbs.modules.reduce(
    (acc, m) => acc + m.features.reduce((fAcc, f) => fAcc + f.acceptance_criteria.length, 0),
    0
  );
  const highPriorityCount = wbs.modules.filter((m) => m.priority === 'high').length;
  const medPriorityCount = wbs.modules.filter((m) => m.priority === 'medium').length;
  const lowPriorityCount = wbs.modules.filter((m) => m.priority === 'low').length;

  // Collect all item IDs for expand all
  const allItemIds = useMemo(() => {
    const ids: string[] = [];
    wbs.modules.forEach((mod) => {
      ids.push(`mod-${mod.id}`);
      mod.features.forEach((feat) => {
        ids.push(`feat-${mod.id}-${feat.id}`);
        feat.acceptance_criteria.forEach((_, cIdx) => {
          ids.push(`crit-${mod.id}-${feat.id}-${cIdx}`);
        });
      });
    });
    return ids;
  }, [wbs.modules]);

  const handleExpandAll = () => {
    setExpandedItems(allItemIds);
  };

  const handleCollapseAll = () => {
    setExpandedItems([]);
  };

  // Handlers for Opening Dialogs
  const handleOpenAddModule = () => {
    setEditMode('module');
    setSelectedModule(null);
    setDialogOpen(true);
  };

  const handleOpenEditModule = (mod: WBSModule) => {
    setEditMode('module');
    setSelectedModule(mod);
    setDialogOpen(true);
  };

  const handleOpenAddFeature = (moduleId: string) => {
    setEditMode('feature');
    setTargetModuleId(moduleId);
    setSelectedFeature(null);
    setDialogOpen(true);
  };

  const handleOpenEditFeature = (moduleId: string, feat: WBSFeature) => {
    setEditMode('feature');
    setTargetModuleId(moduleId);
    setSelectedFeature(feat);
    setDialogOpen(true);
  };

  const handleOpenAddCriteria = (moduleId: string, featureId: string) => {
    setEditMode('criteria');
    setTargetModuleId(moduleId);
    setTargetFeatureId(featureId);
    setSelectedCriteriaText('');
    setSelectedCriteriaIndex(null);
    setDialogOpen(true);
  };

  const handleOpenEditCriteria = (
    moduleId: string,
    featureId: string,
    critIndex: number,
    text: string
  ) => {
    setEditMode('criteria');
    setTargetModuleId(moduleId);
    setTargetFeatureId(featureId);
    setSelectedCriteriaText(text);
    setSelectedCriteriaIndex(critIndex);
    setDialogOpen(true);
  };

  // Handlers for Save operations
  const handleSaveModule = (mod: WBSModule) => {
    const exists = wbs.modules.some((m) => m.id === mod.id);
    const updatedModules = exists
      ? wbs.modules.map((m) => (m.id === mod.id ? mod : m))
      : [...wbs.modules, mod];
    onChange({ ...wbs, modules: updatedModules });
  };

  const handleSaveFeature = (modId: string, feat: WBSFeature) => {
    const updatedModules = wbs.modules.map((m) => {
      if (m.id !== modId) return m;
      const featExists = m.features.some((f) => f.id === feat.id);
      const updatedFeatures = featExists
        ? m.features.map((f) => (f.id === feat.id ? feat : f))
        : [...m.features, feat];
      return { ...m, features: updatedFeatures };
    });
    onChange({ ...wbs, modules: updatedModules });
  };

  const handleSaveCriteria = (
    modId: string,
    featId: string,
    critIdx: number | null,
    text: string
  ) => {
    const updatedModules = wbs.modules.map((m) => {
      if (m.id !== modId) return m;
      const updatedFeatures = m.features.map((f) => {
        if (f.id !== featId) return f;
        const updatedCriteria = [...f.acceptance_criteria];
        if (critIdx !== null && critIdx >= 0) {
          updatedCriteria[critIdx] = text;
        } else {
          updatedCriteria.push(text);
        }
        return { ...f, acceptance_criteria: updatedCriteria };
      });
      return { ...m, features: updatedFeatures };
    });
    onChange({ ...wbs, modules: updatedModules });
  };

  // Handlers for Delete operations
  const handleDeleteModule = (modId: string) => {
    const updatedModules = wbs.modules.filter((m) => m.id !== modId);
    onChange({ ...wbs, modules: updatedModules });
  };

  const handleDeleteFeature = (modId: string, featId: string) => {
    const updatedModules = wbs.modules.map((m) => {
      if (m.id !== modId) return m;
      return { ...m, features: m.features.filter((f) => f.id !== featId) };
    });
    onChange({ ...wbs, modules: updatedModules });
  };

  const handleDeleteCriteria = (modId: string, featId: string, critIdx: number) => {
    const updatedModules = wbs.modules.map((m) => {
      if (m.id !== modId) return m;
      const updatedFeatures = m.features.map((f) => {
        if (f.id !== featId) return f;
        return {
          ...f,
          acceptance_criteria: f.acceptance_criteria.filter((_, i) => i !== critIdx),
        };
      });
      return { ...m, features: updatedFeatures };
    });
    onChange({ ...wbs, modules: updatedModules });
  };

  // Priority color helper
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Filtered modules by search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return wbs.modules;
    const q = searchQuery.toLowerCase();
    return wbs.modules.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.features.some(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.acceptance_criteria.some((c) => c.toLowerCase().includes(q))
        )
    );
  }, [wbs.modules, searchQuery]);

  return (
    <Box>
      {/* 1. Cycle Detection Alert Banner */}
      {cycleResult.hasCycle && (
        <Alert
          severity="error"
          variant="filled"
          sx={{ mb: 3, boxShadow: theme.customShadows?.z8 || 3 }}
          icon={<Icon icon="solar:danger-triangle-bold" width={28} />}
        >
          <AlertTitle sx={{ fontWeight: 800 }}>
            ERR_WBS_DEPENDENCY_CYCLE: Terdeteksi Siklus Dependensi pada WBS!
          </AlertTitle>
          <Typography variant="body2" sx={{ opacity: 0.95, mb: 1 }}>
            Modul WBS wajib membentuk <strong>Directed Acyclic Graph (DAG)</strong> tanpa dependensi
            melingkar. Modul yang terlibat siklus:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {cycleResult.cycleModules.map((cModId) => (
              <Chip
                key={cModId}
                label={cModId}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>
        </Alert>
      )}

      {/* 2. Top Summary & Control Bar */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          {/* Left metrics */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Stack direction="row" spacing={1} alignItems="center">
              <Icon
                icon="solar:folder-with-files-bold"
                width={22}
                color={theme.palette.primary.main}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {totalModules} Modules
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Icon icon="solar:widget-add-bold" width={20} color={theme.palette.info.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {totalFeatures} Features
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Icon icon="solar:check-circle-bold" width={20} color={theme.palette.success.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {totalCriteria} Criteria
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Chip label={`${highPriorityCount} High`} size="small" color="error" variant="soft" />
              <Chip label={`${medPriorityCount} Med`} size="small" color="warning" variant="soft" />
              <Chip label={`${lowPriorityCount} Low`} size="small" color="success" variant="soft" />
            </Stack>
          </Stack>

          {/* Right Action buttons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Cari modul / fitur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="solar:magnifer-linear" width={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />

            <Button
              variant="outlined"
              size="small"
              startIcon={<Icon icon="solar:unfold-more-bold" />}
              onClick={handleExpandAll}
            >
              Expand All
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Icon icon="solar:unfold-less-bold" />}
              onClick={handleCollapseAll}
            >
              Collapse
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<Icon icon="solar:add-circle-bold" />}
              onClick={handleOpenAddModule}
            >
              Tambah Modul
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* 3. Hierarchical Tree View Card */}
      <Card sx={{ p: 3 }}>
        {filteredModules.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Icon
              icon="solar:folder-with-files-bold-duotone"
              width={56}
              color={theme.palette.text.disabled}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 1.5 }}>
              Belum ada modul WBS yang terdefinisi
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Icon icon="solar:add-circle-bold" />}
              onClick={handleOpenAddModule}
              sx={{ mt: 2 }}
            >
              Buat Modul Pertama
            </Button>
          </Box>
        ) : (
          <SimpleTreeView
            expandedItems={expandedItems}
            onExpandedItemsChange={(_, itemIds) => setExpandedItems(itemIds)}
            sx={{
              '& .MuiTreeItem-content': {
                py: 1,
                px: 1.5,
                borderRadius: 1.5,
                mb: 0.8,
                transition: theme.transitions.create(['background-color', 'box-shadow'], {
                  duration: theme.transitions.duration.shorter,
                }),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  },
                },
              },
            }}
          >
            {filteredModules.map((mod) => {
              const isModuleInCycle = cycleResult.cycleModules.includes(mod.id);

              return (
                <TreeItem
                  key={mod.id}
                  itemId={`mod-${mod.id}`}
                  label={
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ py: 0.5, width: '100%' }}
                    >
                      {/* Left: Module Header Info */}
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Icon
                          icon="solar:folder-with-files-bold"
                          width={22}
                          color={
                            isModuleInCycle ? theme.palette.error.main : theme.palette.primary.main
                          }
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {mod.name}
                        </Typography>
                        <Chip
                          label={mod.priority.toUpperCase()}
                          size="small"
                          color={getPriorityColor(mod.priority) as any}
                          variant="filled"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                        <Chip
                          label={mod.id}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem', color: 'text.secondary' }}
                        />
                        {/* Dependencies chips */}
                        {mod.dependencies.length > 0 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              Prereq:
                            </Typography>
                            {mod.dependencies.map((dep) => (
                              <Chip
                                key={dep}
                                label={dep}
                                size="small"
                                color="primary"
                                variant="soft"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            ))}
                          </Stack>
                        )}
                      </Stack>

                      {/* Right: Actions */}
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip title="Tambah Fitur ke Modul ini">
                          <Button
                            size="small"
                            variant="text"
                            color="primary"
                            startIcon={<Icon icon="solar:widget-add-bold" />}
                            onClick={() => handleOpenAddFeature(mod.id)}
                            sx={{ fontSize: '0.75rem', py: 0.2 }}
                          >
                            Tambah Fitur
                          </Button>
                        </Tooltip>

                        <Tooltip title="Edit Modul">
                          <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => handleOpenEditModule(mod)}
                          >
                            <Icon icon="solar:pen-bold" width={16} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Hapus Modul">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteModule(mod.id)}
                          >
                            <Icon icon="solar:trash-bin-minimalistic-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  }
                >
                  {/* Module Description & References Bar */}
                  <Box
                    sx={{
                      pl: 3,
                      pr: 2,
                      py: 1,
                      mb: 1.5,
                      borderLeft: '2px solid',
                      borderColor: 'primary.light',
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {mod.description || 'Tidak ada deskripsi modul.'}
                    </Typography>
                    {mod.references.length > 0 && (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ mt: 0.5 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}
                        >
                          Refs:
                        </Typography>
                        {mod.references.map((ref) => (
                          <Chip
                            key={ref}
                            label={ref}
                            size="small"
                            color="info"
                            variant="soft"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  {/* Level 2: Features */}
                  {mod.features.map((feat) => (
                    <TreeItem
                      key={feat.id}
                      itemId={`feat-${mod.id}-${feat.id}`}
                      label={
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                          justifyContent="space-between"
                          spacing={1}
                          sx={{ py: 0.4, width: '100%' }}
                        >
                          {/* Left Feature Header */}
                          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                            <Icon
                              icon="solar:widget-add-bold"
                              width={18}
                              color={theme.palette.info.main}
                            />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {feat.name}
                            </Typography>
                            <Chip
                              label={feat.id}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem', color: 'text.secondary' }}
                            />
                            <Chip
                              label={`${feat.acceptance_criteria.length} Criteria`}
                              size="small"
                              color="info"
                              variant="soft"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Stack>

                          {/* Right Feature Actions */}
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tooltip title="Tambah Kriteria Pengujian">
                              <Button
                                size="small"
                                variant="text"
                                color="success"
                                startIcon={<Icon icon="solar:check-circle-bold" />}
                                onClick={() => handleOpenAddCriteria(mod.id, feat.id)}
                                sx={{ fontSize: '0.75rem', py: 0.2 }}
                              >
                                Tambah Kriteria
                              </Button>
                            </Tooltip>

                            <Tooltip title="Edit Fitur">
                              <IconButton
                                size="small"
                                color="inherit"
                                onClick={() => handleOpenEditFeature(mod.id, feat)}
                              >
                                <Icon icon="solar:pen-bold" width={15} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Hapus Fitur">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteFeature(mod.id, feat.id)}
                              >
                                <Icon icon="solar:trash-bin-minimalistic-bold" width={15} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      }
                    >
                      {/* Feature Description */}
                      {feat.description && (
                        <Box sx={{ pl: 3, py: 0.5, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {feat.description}
                          </Typography>
                        </Box>
                      )}

                      {/* Level 3: Acceptance Criteria */}
                      {feat.acceptance_criteria.map((crit, cIdx) => (
                        <TreeItem
                          key={cIdx}
                          itemId={`crit-${mod.id}-${feat.id}-${cIdx}`}
                          label={
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                              sx={{ py: 0.2, width: '100%' }}
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="flex-start"
                                sx={{ flex: 1 }}
                              >
                                <Icon
                                  icon="solar:check-circle-bold"
                                  width={16}
                                  color={theme.palette.success.main}
                                  style={{ marginTop: 2, flexShrink: 0 }}
                                />
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                  {crit}
                                </Typography>
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Tooltip title="Edit Kriteria">
                                  <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={() =>
                                      handleOpenEditCriteria(mod.id, feat.id, cIdx, crit)
                                    }
                                  >
                                    <Icon icon="solar:pen-bold" width={14} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Hapus Kriteria">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteCriteria(mod.id, feat.id, cIdx)}
                                  >
                                    <Icon icon="solar:trash-bin-minimalistic-bold" width={14} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          }
                        />
                      ))}
                    </TreeItem>
                  ))}
                </TreeItem>
              );
            })}
          </SimpleTreeView>
        )}
      </Card>

      {/* 4. Edit Dialog Modal */}
      <WBSEditDialog
        open={dialogOpen}
        editMode={editMode}
        moduleData={selectedModule}
        featureData={selectedFeature}
        criteriaText={selectedCriteriaText}
        criteriaIndex={selectedCriteriaIndex}
        targetModuleId={targetModuleId}
        targetFeatureId={targetFeatureId}
        allModules={wbs.modules}
        onClose={() => setDialogOpen(false)}
        onSaveModule={handleSaveModule}
        onSaveFeature={handleSaveFeature}
        onSaveCriteria={handleSaveCriteria}
        onDeleteModule={handleDeleteModule}
        onDeleteFeature={handleDeleteFeature}
        onDeleteCriteria={handleDeleteCriteria}
      />
    </Box>
  );
}

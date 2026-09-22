import type { CanonicalIssue } from '../types';
import type { ReferenceOption } from '../validation/manual-section';
import type { Journey, JourneyActor, JourneyPhase, JourneyActivity } from '../types/bundle';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/shared/ui/iconify';

import { ReferenceSelect } from './manual/reference-select';
import { newBlueprintItemId } from '../validation/manual-payload';

// ----------------------------------------------------------------------

export interface JourneyEditorProps {
  journey: Journey;
  onChange: (updatedJourney: Journey) => void;
  referenceOptions?: ReferenceOption[];
  issues?: CanonicalIssue[];
  focusTargetId?: string | null;
  readOnly?: boolean;
}

interface DeleteConfirmationState {
  type: 'phase' | 'actor';
  item: JourneyPhase | JourneyActor;
  affectedActivities: JourneyActivity[];
}

export function JourneyEditor({
  journey,
  onChange,
  referenceOptions = [],
  issues = [],
  focusTargetId = null,
  readOnly = false,
}: JourneyEditorProps) {
  const theme = useTheme();

  // Scroll to focused target element when focusTargetId changes
  React.useEffect(() => {
    if (!focusTargetId) return;
    const el = document.querySelector(`[data-target-id="${focusTargetId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [focusTargetId]);

  // Dialog states
  const [selectedActivity, setSelectedActivity] = useState<JourneyActivity | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [defaultCell, setDefaultCell] = useState<{ phaseId: string; actorId: string } | null>(null);

  const [editingPhase, setEditingPhase] = useState<JourneyPhase | null>(null);
  const [editingActor, setEditingActor] = useState<JourneyActor | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState | null>(
    null
  );

  // Sorting
  const sortedPhases = [...(journey.phases || [])].sort((a, b) => a.order - b.order);
  const sortedActors = [...(journey.actors || [])].sort((a, b) => a.order - b.order);
  const activities = journey.activities || [];

  // Filter journey issues
  const journeyIssues = issues.filter(
    (issue) => issue.section === 'journey' || issue.path?.startsWith('journey')
  );

  // ----------------------------------------------------------------------
  // Phase Handlers
  // ----------------------------------------------------------------------

  const handleAddPhase = () => {
    if (readOnly) return;
    const nextOrder = sortedPhases.length + 1;
    const newPhase: JourneyPhase = {
      id: newBlueprintItemId('phase'),
      label: `Fase ${nextOrder}`,
      order: nextOrder,
    };
    onChange({
      ...journey,
      phases: [...(journey.phases || []), newPhase],
    });
  };

  const handleSavePhaseEdit = () => {
    if (!editingPhase || readOnly) return;
    const updatedPhases = (journey.phases || []).map((p) =>
      p.id === editingPhase.id ? { ...p, label: editingPhase.label } : p
    );
    onChange({
      ...journey,
      phases: updatedPhases,
    });
    setEditingPhase(null);
  };

  const handleMovePhase = (index: number, direction: 'left' | 'right') => {
    if (readOnly) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedPhases.length) return;

    const newSorted = [...sortedPhases];
    const [moved] = newSorted.splice(index, 1);
    newSorted.splice(targetIndex, 0, moved);

    // Re-index orders
    const reordered = newSorted.map((p, idx) => ({ ...p, order: idx + 1 }));
    onChange({
      ...journey,
      phases: reordered,
    });
  };

  const handleDeletePhasePrompt = (phase: JourneyPhase) => {
    if (readOnly) return;
    const affected = activities.filter((act) => act.phase_id === phase.id);
    if (affected.length > 0) {
      setDeleteConfirmation({
        type: 'phase',
        item: phase,
        affectedActivities: affected,
      });
    } else {
      executeDeletePhase(phase.id);
    }
  };

  const executeDeletePhase = (phaseId: string) => {
    const updatedPhases = (journey.phases || [])
      .filter((p) => p.id !== phaseId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    const updatedActivities = activities.filter((act) => act.phase_id !== phaseId);

    onChange({
      ...journey,
      phases: updatedPhases,
      activities: updatedActivities,
    });
    setDeleteConfirmation(null);
  };

  // ----------------------------------------------------------------------
  // Actor Handlers
  // ----------------------------------------------------------------------

  const handleAddActor = () => {
    if (readOnly) return;
    const nextOrder = sortedActors.length + 1;
    const newActor: JourneyActor = {
      id: newBlueprintItemId('actor'),
      label: `Aktor ${nextOrder}`,
      order: nextOrder,
    };
    onChange({
      ...journey,
      actors: [...(journey.actors || []), newActor],
    });
  };

  const handleSaveActorEdit = () => {
    if (!editingActor || readOnly) return;
    const updatedActors = (journey.actors || []).map((a) =>
      a.id === editingActor.id ? { ...a, label: editingActor.label } : a
    );
    onChange({
      ...journey,
      actors: updatedActors,
    });
    setEditingActor(null);
  };

  const handleMoveActor = (index: number, direction: 'up' | 'down') => {
    if (readOnly) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedActors.length) return;

    const newSorted = [...sortedActors];
    const [moved] = newSorted.splice(index, 1);
    newSorted.splice(targetIndex, 0, moved);

    // Re-index orders
    const reordered = newSorted.map((a, idx) => ({ ...a, order: idx + 1 }));
    onChange({
      ...journey,
      actors: reordered,
    });
  };

  const handleDeleteActorPrompt = (actor: JourneyActor) => {
    if (readOnly) return;
    const affected = activities.filter((act) => act.actor_id === actor.id);
    if (affected.length > 0) {
      setDeleteConfirmation({
        type: 'actor',
        item: actor,
        affectedActivities: affected,
      });
    } else {
      executeDeleteActor(actor.id);
    }
  };

  const executeDeleteActor = (actorId: string) => {
    const updatedActors = (journey.actors || [])
      .filter((a) => a.id !== actorId)
      .map((a, idx) => ({ ...a, order: idx + 1 }));
    const updatedActivities = activities.filter((act) => act.actor_id !== actorId);

    onChange({
      ...journey,
      actors: updatedActors,
      activities: updatedActivities,
    });
    setDeleteConfirmation(null);
  };

  // ----------------------------------------------------------------------
  // Activity Handlers
  // ----------------------------------------------------------------------

  const handleOpenAddActivity = (phaseId?: string, actorId?: string) => {
    if (readOnly) return;
    setDefaultCell(
      phaseId && actorId
        ? { phaseId, actorId }
        : { phaseId: sortedPhases[0]?.id || '', actorId: sortedActors[0]?.id || '' }
    );
    setSelectedActivity(null);
    setActivityDialogOpen(true);
  };

  const handleOpenEditActivity = (activity: JourneyActivity) => {
    if (readOnly) return;
    setSelectedActivity(activity);
    setDefaultCell(null);
    setActivityDialogOpen(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (readOnly) return;
    onChange({
      ...journey,
      activities: activities.filter((act) => act.id !== activityId),
    });
  };

  const handleSaveActivity = (activity: JourneyActivity) => {
    if (readOnly) return;
    const exists = activities.some((act) => act.id === activity.id);
    const updatedActivities = exists
      ? activities.map((act) => (act.id === activity.id ? activity : act))
      : [...activities, activity];

    onChange({
      ...journey,
      activities: updatedActivities,
    });
    setActivityDialogOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Issues summary alert if any */}
      {journeyIssues.length > 0 && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {journeyIssues.map((issue, idx) => (
            <Alert
              key={idx}
              severity={issue.severity === 'error' ? 'error' : 'warning'}
              variant="outlined"
            >
              <strong>{issue.code || 'ISSUE'}:</strong> {issue.message}
            </Alert>
          ))}
        </Stack>
      )}

      {/* Toolbar / Header Card */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            User Journey Matrix
          </Typography>
          <Chip
            label={`${sortedPhases.length} Phases`}
            size="small"
            color="primary"
            variant="soft"
          />
          <Chip label={`${sortedActors.length} Actors`} size="small" color="info" variant="soft" />
          <Chip
            label={`${activities.length} Activities`}
            size="small"
            color="success"
            variant="soft"
          />
          {readOnly && (
            <Chip
              label="Mode Read-Only"
              size="small"
              color="default"
              variant="outlined"
              icon={<Iconify icon="solar:lock-bold" width={14} />}
            />
          )}
        </Stack>

        {!readOnly && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddPhase}
              aria-label="Tambah Fase"
            >
              Tambah Fase
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:user-plus-bold" />}
              onClick={handleAddActor}
              aria-label="Tambah Aktor"
            >
              Tambah Aktor
            </Button>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<Iconify icon="solar:card-2-bold" />}
              onClick={() => handleOpenAddActivity()}
              disabled={sortedPhases.length === 0 || sortedActors.length === 0}
              aria-label="Tambah Aktivitas"
            >
              Tambah Aktivitas
            </Button>
          </Stack>
        )}
      </Card>

      {/* Matrix Table */}
      <Box
        sx={{
          overflowX: 'auto',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `220px repeat(${sortedPhases.length}, minmax(280px, 1fr))`,
            minWidth: 220 + sortedPhases.length * 280,
          }}
        >
          {/* Top-Left Corner Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderBottom: '2px solid',
              borderRight: '2px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
              AKTOR \ FASE
            </Typography>
          </Box>

          {/* Phase Column Headers */}
          {sortedPhases.map((phase, pIndex) => {
            const isPhaseFocused = focusTargetId === phase.id;
            return (
              <Box
                key={phase.id}
                data-target-id={phase.id}
                sx={{
                  p: 2,
                  bgcolor: isPhaseFocused ? 'primary.lighter' : 'action.hover',
                  borderBottom: '2px solid',
                  borderRight: '1px solid',
                  borderColor: isPhaseFocused ? 'primary.main' : 'divider',
                  boxShadow: isPhaseFocused
                    ? (t) => `inset 0 0 0 2px ${t.palette.primary.main}`
                    : 'none',
                  textAlign: 'center',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <Chip
                    label={`Phase ${phase.order}`}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}
                  />
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {phase.label}
                </Typography>

                {!readOnly && (
                  <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mt: 1 }}>
                    <Tooltip title="Geser Kiri">
                      <span>
                        <IconButton
                          size="small"
                          disabled={pIndex === 0}
                          onClick={() => handleMovePhase(pIndex, 'left')}
                          aria-label={`Geser Kiri Phase ${phase.label}`}
                        >
                          <Iconify icon="solar:arrow-left-bold" width={14} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Edit Phase">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setEditingPhase(phase)}
                        aria-label={`Edit Phase ${phase.label}`}
                      >
                        <Iconify icon="solar:pen-bold" width={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Geser Kanan">
                      <span>
                        <IconButton
                          size="small"
                          disabled={pIndex === sortedPhases.length - 1}
                          onClick={() => handleMovePhase(pIndex, 'right')}
                          aria-label={`Geser Kanan Phase ${phase.label}`}
                        >
                          <Iconify icon="solar:arrow-right-bold" width={14} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Hapus Phase">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePhasePrompt(phase)}
                        aria-label={`Hapus Phase ${phase.label}`}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Box>
            );
          })}

          {/* Rows by Actor */}
          {sortedActors.map((actor, aIndex) => {
            const isActorFocused = focusTargetId === actor.id;
            return (
              <Box key={actor.id} sx={{ display: 'contents' }}>
                {/* Actor Row Header */}
                <Box
                  data-target-id={actor.id}
                  sx={{
                    p: 2,
                    bgcolor: isActorFocused ? 'info.lighter' : 'background.neutral',
                    borderBottom: '1px solid',
                    borderRight: '2px solid',
                    borderColor: isActorFocused ? 'info.main' : 'divider',
                    boxShadow: isActorFocused
                      ? (t) => `inset 0 0 0 2px ${t.palette.info.main}`
                      : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <Chip
                    label={`Actor ${actor.order}`}
                    size="small"
                    color="info"
                    variant="soft"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      mb: 0.5,
                      width: 'fit-content',
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {actor.label}
                  </Typography>

                  {!readOnly && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                      <Tooltip title="Geser Atas">
                        <span>
                          <IconButton
                            size="small"
                            disabled={aIndex === 0}
                            onClick={() => handleMoveActor(aIndex, 'up')}
                            aria-label={`Geser Atas Actor ${actor.label}`}
                          >
                            <Iconify icon="solar:arrow-up-bold" width={14} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit Actor">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setEditingActor(actor)}
                          aria-label={`Edit Actor ${actor.label}`}
                        >
                          <Iconify icon="solar:pen-bold" width={14} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Geser Bawah">
                        <span>
                          <IconButton
                            size="small"
                            disabled={aIndex === sortedActors.length - 1}
                            onClick={() => handleMoveActor(aIndex, 'down')}
                            aria-label={`Geser Bawah Actor ${actor.label}`}
                          >
                            <Iconify icon="solar:arrow-down-bold" width={14} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Hapus Actor">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteActorPrompt(actor)}
                          aria-label={`Hapus Actor ${actor.label}`}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Box>

                {/* Matrix Cells */}
                {sortedPhases.map((phase) => {
                  const cellActivities = activities.filter(
                    (act) => act.phase_id === phase.id && act.actor_id === actor.id
                  );

                  return (
                    <Box
                      key={`${actor.id}-${phase.id}`}
                      sx={{
                        p: 1.5,
                        borderBottom: '1px solid',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: cellActivities.length > 0 ? 'transparent' : 'action.hover',
                        minHeight: 140,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      {cellActivities.map((activity) => {
                        const activityIssues = journeyIssues.filter(
                          (i) => i.target_id === activity.id || i.path?.includes(activity.id)
                        );
                        const isActFocused = focusTargetId === activity.id;

                        return (
                          <Card
                            key={activity.id}
                            data-target-id={activity.id}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              bgcolor: 'background.paper',
                              borderColor: isActFocused
                                ? 'primary.main'
                                : activityIssues.length > 0
                                  ? 'error.main'
                                  : 'divider',
                              boxShadow: isActFocused
                                ? (t) => `0 0 0 2px ${t.palette.primary.main}`
                                : 'none',
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, lineHeight: 1.3 }}
                              >
                                {activity.label}
                              </Typography>
                              {!readOnly && (
                                <Stack direction="row" spacing={0.5}>
                                  <Tooltip title="Edit Aktivitas">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleOpenEditActivity(activity)}
                                      aria-label={`Edit Aktivitas ${activity.label}`}
                                    >
                                      <Iconify icon="solar:pen-bold" width={16} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Hapus Aktivitas">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteActivity(activity.id)}
                                      aria-label={`Hapus Aktivitas ${activity.label}`}
                                    >
                                      <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              )}
                            </Box>

                            {activity.description && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '0.775rem',
                                  mb: 1.25,
                                  lineHeight: 1.35,
                                }}
                              >
                                {activity.description}
                              </Typography>
                            )}

                            {/* Touchpoints */}
                            {activity.touchpoints && activity.touchpoints.length > 0 && (
                              <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {activity.touchpoints.map((tp, tpIdx) => (
                                    <Chip
                                      key={tpIdx}
                                      label={tp}
                                      size="small"
                                      color="info"
                                      variant="soft"
                                      sx={{ height: 18, fontSize: '0.675rem' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* References */}
                            {activity.references && activity.references.length > 0 && (
                              <Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {activity.references.map((ref, rIdx) => (
                                    <Chip
                                      key={rIdx}
                                      label={ref}
                                      size="small"
                                      color="secondary"
                                      variant="soft"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        fontFamily: 'monospace',
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Card>
                        );
                      })}

                      {!readOnly && (
                        <Button
                          size="small"
                          variant="text"
                          color="inherit"
                          onClick={() => handleOpenAddActivity(phase.id, actor.id)}
                          startIcon={<Iconify icon="solar:add-circle-linear" width={16} />}
                          aria-label={`Tambah Aktivitas di Phase ${phase.order} Actor ${actor.order}`}
                          sx={{
                            mt: 'auto',
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 1,
                            py: 0.75,
                            fontSize: '0.725rem',
                            color: 'text.secondary',
                            '&:hover': {
                              borderColor: 'primary.main',
                              color: 'primary.main',
                            },
                          }}
                        >
                          + Tambah Aktivitas
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Activity Edit / Add Dialog */}
      <JourneyActivityDialog
        open={activityDialogOpen}
        activity={selectedActivity}
        defaultPhaseId={defaultCell?.phaseId}
        defaultActorId={defaultCell?.actorId}
        phases={sortedPhases}
        actors={sortedActors}
        referenceOptions={referenceOptions}
        onClose={() => setActivityDialogOpen(false)}
        onSave={handleSaveActivity}
      />

      {/* Edit Phase Label Dialog */}
      <Dialog
        open={Boolean(editingPhase)}
        onClose={() => setEditingPhase(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Label Phase</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nama Phase"
            fullWidth
            value={editingPhase?.label || ''}
            onChange={(e) =>
              setEditingPhase((prev) => (prev ? { ...prev, label: e.target.value } : null))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingPhase(null)}>Batal</Button>
          <Button onClick={handleSavePhaseEdit} variant="contained">
            Simpan Phase
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Actor Label Dialog */}
      <Dialog
        open={Boolean(editingActor)}
        onClose={() => setEditingActor(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Label Actor</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nama Actor"
            fullWidth
            value={editingActor?.label || ''}
            onChange={(e) =>
              setEditingActor((prev) => (prev ? { ...prev, label: e.target.value } : null))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingActor(null)}>Batal</Button>
          <Button onClick={handleSaveActorEdit} variant="contained">
            Simpan Actor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Impact Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Konfirmasi Hapus {deleteConfirmation?.type === 'phase' ? 'Phase' : 'Actor'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Menghapus {deleteConfirmation?.type === 'phase' ? 'Phase' : 'Actor'}{' '}
            <strong>&quot;{deleteConfirmation?.item.label}&quot;</strong> akan menghapus{' '}
            <strong>{deleteConfirmation?.affectedActivities.length}</strong> aktivitas terkait:
          </Alert>
          <Stack spacing={1}>
            {deleteConfirmation?.affectedActivities.map((act) => (
              <Box
                key={act.id}
                sx={{
                  p: 1,
                  bgcolor: 'background.neutral',
                  borderRadius: 1,
                  fontSize: '0.85rem',
                }}
              >
                • {act.label || act.id}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation(null)}>Batal</Button>
          <Button
            onClick={() => {
              if (deleteConfirmation?.type === 'phase') {
                executeDeletePhase(deleteConfirmation.item.id);
              } else if (deleteConfirmation?.type === 'actor') {
                executeDeleteActor(deleteConfirmation.item.id);
              }
            }}
            color="error"
            variant="contained"
          >
            Konfirmasi Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Activity Modal Component
// ----------------------------------------------------------------------

interface JourneyActivityDialogProps {
  open: boolean;
  activity: JourneyActivity | null;
  defaultPhaseId?: string;
  defaultActorId?: string;
  phases: JourneyPhase[];
  actors: JourneyActor[];
  referenceOptions: ReferenceOption[];
  onClose: () => void;
  onSave: (activity: JourneyActivity) => void;
}

function JourneyActivityDialog({
  open,
  activity,
  defaultPhaseId,
  defaultActorId,
  phases,
  actors,
  referenceOptions,
  onClose,
  onSave,
}: JourneyActivityDialogProps) {
  const [formData, setFormData] = useState<JourneyActivity>({
    id: '',
    phase_id: '',
    actor_id: '',
    label: '',
    description: '',
    touchpoints: [],
    references: [],
  });

  const [newTouchpoint, setNewTouchpoint] = useState('');

  React.useEffect(() => {
    if (activity) {
      setFormData(activity);
    } else {
      setFormData({
        id: newBlueprintItemId('act'),
        phase_id: defaultPhaseId || phases[0]?.id || '',
        actor_id: defaultActorId || actors[0]?.id || '',
        label: '',
        description: '',
        touchpoints: [],
        references: [],
      });
    }
    setNewTouchpoint('');
  }, [activity, defaultPhaseId, defaultActorId, phases, actors, open]);

  const handleAddTouchpoint = () => {
    const trimmed = newTouchpoint.trim();
    if (trimmed && !formData.touchpoints.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        touchpoints: [...prev.touchpoints, trimmed],
      }));
      setNewTouchpoint('');
    }
  };

  const handleRemoveTouchpoint = (tp: string) => {
    setFormData((prev) => ({
      ...prev,
      touchpoints: prev.touchpoints.filter((item) => item !== tp),
    }));
  };

  const handleSave = () => {
    if (!formData.label.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {activity ? 'Edit Journey Activity' : 'Tambah Journey Activity'}
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Tutup">
          <Iconify icon="solar:close-circle-bold" width={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="Activity ID"
            value={formData.id}
            disabled
            size="small"
            helperText="Kanonikal identifier unik"
          />

          <TextField
            label="Label Aktivitas"
            value={formData.label}
            onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
            required
            fullWidth
            placeholder="e.g. Reservasi Tiket Daring"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="phase-select-label">Pilih Phase</InputLabel>
              <Select
                labelId="phase-select-label"
                value={formData.phase_id}
                label="Pilih Phase"
                inputProps={{
                  'aria-label': 'Pilih Phase',
                  'data-testid': 'phase-select-input',
                }}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phase_id: e.target.value as string }))
                }
              >
                {phases.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.order}. {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="actor-select-label">Pilih Actor</InputLabel>
              <Select
                labelId="actor-select-label"
                value={formData.actor_id}
                label="Pilih Actor"
                inputProps={{
                  'aria-label': 'Pilih Actor',
                  'data-testid': 'actor-select-input',
                }}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, actor_id: e.target.value as string }))
                }
              >
                {actors.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.order}. {a.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Deskripsi Aktivitas"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            fullWidth
            placeholder="Deskripsi interaksi atau alur..."
          />

          {/* Touchpoints */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Touchpoints / Saluran
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Tambah Touchpoint (e.g. Mobile App)"
                value={newTouchpoint}
                onChange={(e) => setNewTouchpoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTouchpoint();
                  }
                }}
              />
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAddTouchpoint}
                startIcon={<Iconify icon="solar:add-circle-bold" />}
              >
                Tambah
              </Button>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.touchpoints.map((tp, idx) => (
                <Chip
                  key={idx}
                  label={tp}
                  size="small"
                  color="info"
                  variant="soft"
                  onDelete={() => handleRemoveTouchpoint(tp)}
                />
              ))}
            </Box>
          </Box>

          {/* Canonical Cross References */}
          <Box>
            <ReferenceSelect
              label="Referensi Cross-Section"
              options={referenceOptions}
              multiple
              value={formData.references || []}
              onChange={(newRefs) =>
                setFormData((prev) => ({
                  ...prev,
                  references: Array.isArray(newRefs) ? newRefs : newRefs ? [newRefs] : [],
                }))
              }
              placeholder="Pilih elemen terkait..."
            />
          </Box>
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
          disabled={!formData.label.trim()}
        >
          Simpan Aktivitas
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import type { JourneyActor, JourneyPhase, JourneySection, JourneyActivity } from '../types';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { ActivityEditDialog } from './activity-edit-dialog';

// ----------------------------------------------------------------------

type Props = {
  journey: JourneySection;
  onChange: (updatedJourney: JourneySection) => void;
};

export function JourneyLab({ journey, onChange }: Props) {
  const theme = useTheme();

  const [selectedActivity, setSelectedActivity] = useState<JourneyActivity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sorting phases and actors by order
  const sortedPhases = [...journey.phases].sort((a, b) => a.order - b.order);
  const sortedActors = [...journey.actors].sort((a, b) => a.order - b.order);

  const handleOpenAdd = (defaultPhaseId?: string, defaultActorId?: string) => {
    setSelectedActivity(
      defaultPhaseId && defaultActorId
        ? {
            id: `act-${Date.now().toString(36)}`,
            phase_id: defaultPhaseId,
            actor_id: defaultActorId,
            label: '',
            description: '',
            touchpoints: [],
            references: [],
          }
        : null
    );
    setDialogOpen(true);
  };

  const handleOpenEdit = (activity: JourneyActivity) => {
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    onChange({
      ...journey,
      activities: journey.activities.filter((act) => act.id !== activityId),
    });
  };

  const handleSaveActivity = (activity: JourneyActivity) => {
    const exists = journey.activities.some((act) => act.id === activity.id);
    const updatedActivities = exists
      ? journey.activities.map((act) => (act.id === activity.id ? activity : act))
      : [...journey.activities, activity];

    onChange({
      ...journey,
      activities: updatedActivities,
    });
  };

  const handleAddPhase = () => {
    const nextOrder = sortedPhases.length + 1;
    const newPhase: JourneyPhase = {
      id: `phase-${Date.now().toString(36)}`,
      label: `Fase ${nextOrder}`,
      order: nextOrder,
    };
    onChange({
      ...journey,
      phases: [...journey.phases, newPhase],
    });
  };

  const handleAddActor = () => {
    const nextOrder = sortedActors.length + 1;
    const newActor: JourneyActor = {
      id: `actor-${Date.now().toString(36)}`,
      label: `Aktor ${nextOrder}`,
      order: nextOrder,
    };
    onChange({
      ...journey,
      actors: [...journey.actors, newActor],
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Toolbar & Summary Header */}
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
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            User Journey & Service Blueprint Matrix
          </Typography>
          <Chip
            label={`${sortedPhases.length} Phases`}
            size="small"
            color="primary"
            variant="soft"
          />
          <Chip label={`${sortedActors.length} Actors`} size="small" color="info" variant="soft" />
          <Chip
            label={`${journey.activities.length} Activities`}
            size="small"
            color="success"
            variant="soft"
          />
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="solar:add-circle-bold" />}
            onClick={handleAddPhase}
          >
            Tambah Fase
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="solar:user-plus-bold" />}
            onClick={handleAddActor}
          >
            Tambah Aktor
          </Button>
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Icon icon="solar:card-2-bold" />}
            onClick={() => handleOpenAdd()}
          >
            Tambah Aktivitas
          </Button>
        </Stack>
      </Card>

      {/* Swimlane Matrix Table */}
      <Box
        sx={{
          overflowX: 'auto',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.customShadows?.z1 || 1,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${sortedPhases.length}, minmax(280px, 1fr))`,
            minWidth: 200 + sortedPhases.length * 280,
          }}
        >
          {/* Top-Left Corner Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              borderBottom: `2px solid ${theme.palette.divider}`,
              borderRight: `2px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
              ACTOR \ PHASE
            </Typography>
          </Box>

          {/* Phase Columns Header */}
          {sortedPhases.map((phase) => (
            <Box
              key={phase.id}
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                borderBottom: `2px solid ${theme.palette.divider}`,
                borderRight: `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
              }}
            >
              <Chip
                label={`Phase ${phase.order}`}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {phase.label}
              </Typography>
            </Box>
          ))}

          {/* Swimlane Rows by Actor */}
          {sortedActors.map((actor) => (
            <Box key={actor.id} sx={{ display: 'contents' }}>
              {/* Actor Column Row Header */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.background.neutral, 0.75),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  borderRight: `2px solid ${theme.palette.divider}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
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
              </Box>

              {/* Grid Cells for this Actor across each Phase */}
              {sortedPhases.map((phase) => {
                const cellActivities = journey.activities.filter(
                  (act) => act.phase_id === phase.id && act.actor_id === actor.id
                );

                return (
                  <Box
                    key={`${actor.id}-${phase.id}`}
                    sx={{
                      p: 1.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      backgroundColor:
                        cellActivities.length > 0
                          ? 'transparent'
                          : alpha(theme.palette.background.neutral, 0.25),
                      minHeight: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    {cellActivities.map((activity) => (
                      <Card
                        key={activity.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          backgroundColor: theme.palette.background.paper,
                          borderColor: alpha(theme.palette.primary.main, 0.24),
                          boxShadow: theme.customShadows?.z1 || 1,
                          transition: theme.transitions.create(['box-shadow', 'border-color'], {
                            duration: theme.transitions.duration.shorter,
                          }),
                          '&:hover': {
                            boxShadow: theme.customShadows?.z8 || 3,
                            borderColor: theme.palette.primary.main,
                          },
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
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {activity.label}
                          </Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit Aktivitas">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(activity)}
                              >
                                <Icon icon="solar:pen-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hapus Aktivitas">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteActivity(activity.id)}
                              >
                                <Icon icon="solar:trash-bin-trash-bold" width={16} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
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

                        {/* Touchpoints Chips */}
                        {activity.touchpoints?.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.disabled',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'block',
                                mb: 0.25,
                              }}
                            >
                              Touchpoints
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {activity.touchpoints.map((tp) => (
                                <Chip
                                  key={tp}
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

                        {/* Canonical References Chips */}
                        {activity.references?.length > 0 && (
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.disabled',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'block',
                                mb: 0.25,
                              }}
                            >
                              References
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {activity.references.map((ref) => (
                                <Chip
                                  key={ref}
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
                    ))}

                    <Button
                      size="small"
                      variant="text"
                      color="inherit"
                      onClick={() => handleOpenAdd(phase.id, actor.id)}
                      startIcon={<Icon icon="solar:add-circle-linear" width={16} />}
                      sx={{
                        mt: 'auto',
                        border: `1px dashed ${alpha(theme.palette.text.secondary, 0.2)}`,
                        borderRadius: 1,
                        py: 0.75,
                        fontSize: '0.725rem',
                        color: 'text.secondary',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          color: 'primary.main',
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      + Tambah Aktivitas
                    </Button>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Activity Edit Modal Dialog */}
      <ActivityEditDialog
        open={dialogOpen}
        activity={selectedActivity}
        phases={sortedPhases}
        actors={sortedActors}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveActivity}
      />
    </Box>
  );
}

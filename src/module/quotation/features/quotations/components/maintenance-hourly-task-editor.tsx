import type { HourlyMaintenanceTask } from '../types';
import type { StandaloneMaintenanceFormValues } from '../constants/standalone-maintenance';

import { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField } from 'src/shared/ui/hook-form';

import { formatHalfHours } from '../constants/standalone-maintenance';

// ----------------------------------------------------------------------

export const LIPUTAN6_SAMPLE_TASKS: HourlyMaintenanceTask[] = [
  {
    description: 'fix app link',
    platform: 'Android / iOS',
    hours_half_units: 16,
  },
  {
    description: 'update deep link parser',
    platform: 'Android',
    hours_half_units: 8,
  },
  {
    description: 'fix iOS share URL',
    platform: 'iOS',
    hours_half_units: 8,
  },
  {
    description: 'testing Android/iOS',
    platform: 'QA Test',
    hours_half_units: 4,
  },
  {
    description: 'upload Play Store/App Store',
    platform: 'Mobile DevOps',
    hours_half_units: 4,
  },
];

type Props = {
  disabled?: boolean;
};

export function MaintenanceHourlyTaskEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, watch } = useFormContext<StandaloneMaintenanceFormValues>();

  const [confirmLiputan6Open, setConfirmLiputan6Open] = useState(false);

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'standalone_maintenance.hourly_tasks',
  });

  const watchedTasks = watch('standalone_maintenance.hourly_tasks') || [];

  const totalTaskHalfUnits = watchedTasks.reduce(
    (sum, task) => sum + (Number(task?.hours_half_units) || 0),
    0
  );

  const handleAddTask = () => {
    append({
      description: '',
      platform: '',
      hours_half_units: 2,
    });
  };

  const handleLoadLiputan6Sample = () => {
    replace(LIPUTAN6_SAMPLE_TASKS);
    setConfirmLiputan6Open(false);
  };

  return (
    <Card>
      <CardHeader
        title={t('standaloneMaintenanceForm.scopeTitle')}
        subheader={t('standaloneMaintenanceForm.scopeSubtitle')}
        action={
          <Button
            size="small"
            variant="contained"
            color="info"
            startIcon={<Iconify icon="solar:document-text-bold" />}
            onClick={() => setConfirmLiputan6Open(true)}
            disabled={disabled}
            aria-label={t('standaloneMaintenanceForm.hourlyTask.loadLiputan6Tasks')}
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.hourlyTask.loadLiputan6Tasks')}
          </Button>
        }
      />
      <CardContent>
        <Stack spacing={3}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            sx={{ gap: 1 }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              {t('standaloneMaintenanceForm.hourlyTask.tasksTitle')}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddTask}
              disabled={disabled}
              aria-label={t('standaloneMaintenanceForm.hourlyTask.addTask')}
              sx={{ minHeight: 44, px: 2 }}
            >
              {t('standaloneMaintenanceForm.hourlyTask.addTask')}
            </Button>
          </Stack>

          <Stack spacing={2.5}>
            {fields.map((field, index) => (
              <Box
                key={field.id}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  bgcolor: 'background.neutral',
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <RHFTextField
                      name={`standalone_maintenance.hourly_tasks.${index}.description`}
                      label={t('standaloneMaintenanceForm.hourlyTask.description')}
                      placeholder={t('standaloneMaintenanceForm.hourlyTask.descriptionPlaceholder')}
                      multiline
                      rows={2}
                      disabled={disabled}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <RHFTextField
                      name={`standalone_maintenance.hourly_tasks.${index}.platform`}
                      label={t('standaloneMaintenanceForm.hourlyTask.platform')}
                      placeholder={t('standaloneMaintenanceForm.hourlyTask.platformPlaceholder')}
                      disabled={disabled}
                    />
                  </Grid>

                  <Grid size={{ xs: 10, sm: 4, md: 2 }}>
                    <Controller
                      name={`standalone_maintenance.hourly_tasks.${index}.hours_half_units`}
                      control={control}
                      render={({ field: hoursField, fieldState: { error } }) => {
                        const hoursVal = Number(hoursField.value) > 0 ? hoursField.value / 2 : '';
                        return (
                          <TextField
                            fullWidth
                            type="number"
                            label={t('standaloneMaintenanceForm.hourlyTask.hours')}
                            value={hoursVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!Number.isNaN(val) && val > 0) {
                                hoursField.onChange(Math.round(val * 2));
                              } else {
                                hoursField.onChange(0);
                              }
                            }}
                            error={Boolean(error)}
                            helperText={error?.message}
                            disabled={disabled}
                            slotProps={{ htmlInput: { step: 0.5, min: 0.5, max: 1000 } }}
                          />
                        );
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 2, sm: 2, md: 1 }} sx={{ textAlign: 'right' }}>
                    <IconButton
                      color="error"
                      aria-label={t('standaloneMaintenanceForm.hourlyTask.removeTask')}
                      disabled={disabled || fields.length <= 1}
                      onClick={() => remove(index)}
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>

          {/* Informational Footer */}
          <Divider sx={{ my: 1 }} />

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={700}>
                {t('standaloneMaintenanceForm.hourlyTask.totalHours')}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                {`${formatHalfHours(totalTaskHalfUnits)} ${t('standaloneMaintenanceForm.preview.unitHour')}`}
              </Typography>
            </Stack>
            <Alert severity="info">
              {t('standaloneMaintenanceForm.hourlyTask.totalHoursHelper')}
            </Alert>
          </Stack>
        </Stack>
      </CardContent>

      {/* Confirmation Dialog for Liputan6 sample tasks */}
      <Dialog
        open={confirmLiputan6Open}
        onClose={() => setConfirmLiputan6Open(false)}
        aria-labelledby="load-liputan6-dialog-title"
      >
        <DialogTitle id="load-liputan6-dialog-title">
          {t('standaloneMaintenanceForm.hourlyTask.loadLiputan6DialogTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('standaloneMaintenanceForm.hourlyTask.loadLiputan6DialogMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmLiputan6Open(false)}
            color="inherit"
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.hourlyTask.cancelLoadLiputan6')}
          </Button>
          <Button
            onClick={handleLoadLiputan6Sample}
            variant="contained"
            color="info"
            autoFocus
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.hourlyTask.confirmLoadLiputan6')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

import type { SquadModel } from '../types';

import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

import { SENIORITIES, STANDARD_ROLES } from '../../rate-cards/types';

// ----------------------------------------------------------------------

type Props = {
  name: string;
  model: SquadModel;
  maintenance?: boolean;
  disabled?: boolean;
};

type QuarterInputProps = {
  name: string;
  label: string;
  disabled?: boolean;
  max?: number;
  helperText?: string;
};

function QuarterInput({ name, label, disabled, max = 24, helperText }: QuarterInputProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const quarterUnits = Number(field.value || 0);
        const value = quarterUnits > 0 ? quarterUnits / 4 : '';

        return (
          <TextField
            {...field}
            fullWidth
            type="number"
            label={label}
            value={value}
            disabled={disabled}
            error={!!error}
            helperText={error?.message || helperText}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              field.onChange(Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 4) : 0);
            }}
            slotProps={{
              htmlInput: {
                min: 0.25,
                max,
                step: 0.25,
                inputMode: 'decimal',
              },
            }}
          />
        );
      }}
    />
  );
}

function WorkdayInput({ name, label, disabled }: Omit<QuarterInputProps, 'max'>) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          type="number"
          label={label}
          value={field.value || ''}
          disabled={disabled}
          error={!!error}
          helperText={error?.message}
          onChange={(event) => field.onChange(Number(event.target.value) || 0)}
          slotProps={{ htmlInput: { min: 1, max: 366, step: 1, inputMode: 'numeric' } }}
        />
      )}
    />
  );
}

function defaultLine(model: SquadModel) {
  return {
    role: 'frontend_programmer',
    seniority: 'intermediate',
    headcount_quarters: 4,
    period_quarters: model === '1D' ? 0 : 24,
    // A newly added sprint line starts with the same five-weekday default as
    // the form's initial sprint. The form still validates this against the
    // selected date range before preview/generation.
    workday_count: model === '1D' ? 5 : 0,
  };
}

export function SquadPicker({ name, model, maintenance = false, disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const isSprint = model === '1D';

  return (
    <Stack spacing={1.5} data-testid={`${maintenance ? 'maintenance' : 'development'}-squad-picker`}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="subtitle2">
            {maintenance
              ? t('dedicatedSquadForm.picker.maintenanceSquad')
              : t('dedicatedSquadForm.picker.developmentSquad')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isSprint
              ? t('dedicatedSquadForm.picker.sprintHint')
              : t('dedicatedSquadForm.picker.quarterHint')}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => append(defaultLine(model))}
          disabled={disabled}
        >
          {t('dedicatedSquadForm.picker.addLine')}
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              p: 1.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
            }}
          >
            <Grid container spacing={1.5} alignItems="center">
              <Grid size={{ xs: 12, md: isSprint ? 4 : 3 }}>
                <Controller
                  name={`${name}.${index}.role`}
                  control={control}
                  render={({ field: inputField, fieldState: { error } }) => (
                    <TextField
                      {...inputField}
                      fullWidth
                      select
                      label={t('dedicatedSquadForm.picker.role')}
                      disabled={disabled}
                      error={!!error}
                      helperText={error?.message}
                    >
                      {STANDARD_ROLES.map((role) => (
                        <MenuItem key={role.role} value={role.role}>
                          {role.displayName}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: isSprint ? 3 : 2.5 }}>
                <Controller
                  name={`${name}.${index}.seniority`}
                  control={control}
                  render={({ field: inputField, fieldState: { error } }) => (
                    <TextField
                      {...inputField}
                      fullWidth
                      select
                      label={t('dedicatedSquadForm.picker.seniorityLabel')}
                      disabled={disabled}
                      error={!!error}
                      helperText={error?.message}
                    >
                      {SENIORITIES.map((seniority) => (
                        <MenuItem key={seniority} value={seniority}>
                          {t(`dedicatedSquadForm.picker.seniority.${seniority}`)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: isSprint ? 3 : 2.5 }}>
                <QuarterInput
                  name={`${name}.${index}.headcount_quarters`}
                  label={t('dedicatedSquadForm.picker.headcount')}
                  helperText={t('dedicatedSquadForm.picker.quarterUnit')}
                  max={100}
                  disabled={disabled}
                />
              </Grid>

              {isSprint ? (
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <WorkdayInput
                    name={`${name}.${index}.workday_count`}
                    label={t('dedicatedSquadForm.picker.workdays')}
                    disabled={disabled}
                  />
                </Grid>
              ) : (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <QuarterInput
                    name={`${name}.${index}.period_quarters`}
                    label={t('dedicatedSquadForm.picker.period')}
                    helperText={t('dedicatedSquadForm.picker.monthUnit')}
                    max={24}
                    disabled={disabled}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={t('dedicatedSquadForm.picker.removeLine')}
                  onClick={() => remove(index)}
                  disabled={disabled || fields.length <= 1}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

export { defaultLine as getDefaultSquadLine };

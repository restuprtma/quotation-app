import type { StandaloneMaintenancePriority } from '../types';
import type { StandaloneMaintenanceFormValues } from '../constants/standalone-maintenance';

import { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
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

import { STANDALONE_MAINTENANCE_PRIORITY_OPTIONS } from '../constants/standalone-maintenance';

// ----------------------------------------------------------------------

export type NexSampleDefectItem = {
  item_number: string;
  priority: StandaloneMaintenancePriority;
  function: string;
  screen_flow: string;
  existing: string;
  improvement: string;
  reference?: string;
};

export type NexSampleDefectGroup = {
  title: string;
  items: NexSampleDefectItem[];
};

export const NEX_HEALTH_SAMPLE_DEFECT_GROUPS: NexSampleDefectGroup[] = [
  {
    title: 'Modul Pasien',
    items: [
      {
        item_number: '1.1',
        priority: 'P0',
        function: 'Melihat riwayat medis pasien',
        screen_flow: 'Pasien > Medical History',
        existing: 'Hanya mencantumkan catatan registrasi awal',
        improvement: 'Mencantumkan seluruh riwayat SOAP (Dokter, Terapis, Perawat)',
        reference: 'Ref 1.01',
      },
      {
        item_number: '1.2',
        priority: 'P0',
        function: 'Riwayat foto pasien',
        screen_flow: 'Pasien > Foto Pasien',
        existing: 'Format foto hanya JPG dan PNG',
        improvement: 'Mendukung format JPG, PNG, dan PDF',
        reference: 'Ref 1.02',
      },
      {
        item_number: '1.3',
        priority: 'P1',
        function: 'Riwayat kunjungan',
        screen_flow: 'Pasien > Riwayat Kunjungan',
        existing: 'Berdasarkan booked transaction',
        improvement: 'Berdasarkan paid transaction',
        reference: 'Ref 1.03',
      },
    ],
  },
  {
    title: 'Modul Treatment',
    items: [
      {
        item_number: '4.1',
        priority: 'P0',
        function: 'Akses harga COGS',
        screen_flow: 'Treatment > Edit Treatment',
        existing: 'Melekat pada hak akses edit treatment',
        improvement: 'Dibuat hak akses terpisah khusus role tertentu',
        reference: 'Ref 4.01',
      },
    ],
  },
];

export function reorderItems<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

type DefectGroupItemProps = {
  groupIndex: number;
  disabled?: boolean;
  onRemoveGroup: () => void;
  canRemoveGroup: boolean;
};

function DefectGroupItem({
  groupIndex,
  disabled = false,
  onRemoveGroup,
  canRemoveGroup,
}: DefectGroupItemProps) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<StandaloneMaintenanceFormValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `standalone_maintenance.defect_groups.${groupIndex}.items`,
  });

  const handleAddItem = () => {
    append({
      item_number: '',
      priority: 'P0',
      function: '',
      screen_flow: '',
      existing: '',
      improvement: '',
      reference: '',
    });
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.neutral',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box sx={{ width: { xs: '100%', sm: '60%' } }}>
          <RHFTextField
            name={`standalone_maintenance.defect_groups.${groupIndex}.title`}
            label={t('standaloneMaintenanceForm.defect.groupTitle')}
            placeholder={t('standaloneMaintenanceForm.defect.groupTitlePlaceholder')}
            disabled={disabled}
            size="small"
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={handleAddItem}
            disabled={disabled}
            aria-label={t('standaloneMaintenanceForm.defect.addItem')}
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.defect.addItem')}
          </Button>

          {canRemoveGroup && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={onRemoveGroup}
              disabled={disabled}
              aria-label={t('standaloneMaintenanceForm.defect.removeGroup')}
              sx={{ minHeight: 44, px: 2 }}
            >
              {t('standaloneMaintenanceForm.defect.removeGroup')}
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {fields.map((field, itemIndex) => (
          <Box
            key={field.id}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            }}
          >
            <Grid container spacing={2} alignItems="flex-start">
              {/* Row 1: Item #, Priority, Reference, Reorder and Delete controls */}
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <RHFTextField
                  name={`standalone_maintenance.defect_groups.${groupIndex}.items.${itemIndex}.item_number`}
                  label={t('standaloneMaintenanceForm.defect.itemNumber')}
                  placeholder={t('standaloneMaintenanceForm.defect.itemNumberPlaceholder')}
                  disabled={disabled}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Controller
                  name={`standalone_maintenance.defect_groups.${groupIndex}.items.${itemIndex}.priority`}
                  control={control}
                  render={({ field: pField, fieldState: { error } }) => (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={t('standaloneMaintenanceForm.defect.priority')}
                      value={pField.value ?? 'P0'}
                      onChange={pField.onChange}
                      error={Boolean(error)}
                      helperText={error?.message}
                      disabled={disabled}
                    >
                      {STANDALONE_MAINTENANCE_PRIORITY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <RHFTextField
                  name={`standalone_maintenance.defect_groups.${groupIndex}.items.${itemIndex}.reference`}
                  label={t('standaloneMaintenanceForm.defect.reference')}
                  placeholder={t('standaloneMaintenanceForm.defect.referencePlaceholder')}
                  disabled={disabled}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                  alignItems="center"
                >
                  <IconButton
                    size="small"
                    aria-label={t('standaloneMaintenanceForm.defect.moveUp')}
                    disabled={disabled || itemIndex === 0}
                    onClick={() => move(itemIndex, itemIndex - 1)}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <Iconify icon="eva:arrow-upward-fill" />
                  </IconButton>

                  <IconButton
                    size="small"
                    aria-label={t('standaloneMaintenanceForm.defect.moveDown')}
                    disabled={disabled || itemIndex === fields.length - 1}
                    onClick={() => move(itemIndex, itemIndex + 1)}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <Iconify icon="eva:arrow-downward-fill" />
                  </IconButton>

                  <IconButton
                    size="small"
                    color="error"
                    aria-label={t('standaloneMaintenanceForm.defect.removeItem')}
                    disabled={disabled || fields.length <= 1}
                    onClick={() => remove(itemIndex)}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>
              </Grid>

              {/* Row 2: Function and Screen/Flow */}
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name={`standalone_maintenance.defect_groups.${groupIndex}.items.${itemIndex}.function`}
                  label={t('standaloneMaintenanceForm.defect.function')}
                  placeholder={t('standaloneMaintenanceForm.defect.functionPlaceholder')}
                  multiline
                  rows={2}
                  disabled={disabled}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name={`standalone_maintenance.defect_groups.${groupIndex}.items.${itemIndex}.screen_flow`}
                  label={t('standaloneMaintenanceForm.defect.screenFlow')}
                  placeholder={t('standaloneMaintenanceForm.defect.screenFlowPlaceholder')}
                  multiline
                  rows={2}
                  disabled={disabled}
                />
              </Grid>

              {/* Row 3: Existing (As-Is) and Improvement (To-Be) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name={`standalone_maintenance.defect_groups.${groupIndex}.items.${itemIndex}.existing`}
                  label={t('standaloneMaintenanceForm.defect.existing')}
                  placeholder={t('standaloneMaintenanceForm.defect.existingPlaceholder')}
                  multiline
                  rows={3}
                  disabled={disabled}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name={`standalone_maintenance.defect_groups.${groupIndex}.items.${itemIndex}.improvement`}
                  label={t('standaloneMaintenanceForm.defect.improvement')}
                  placeholder={t('standaloneMaintenanceForm.defect.improvementPlaceholder')}
                  multiline
                  rows={3}
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

type Props = {
  disabled?: boolean;
};

export function DefectMatrixEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<StandaloneMaintenanceFormValues>();

  const [nexConfirmOpen, setNexConfirmOpen] = useState(false);

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
    replace: replaceGroups,
  } = useFieldArray({
    control,
    name: 'standalone_maintenance.defect_groups',
  });

  const handleAddGroup = () => {
    appendGroup({
      title: '',
      items: [
        {
          item_number: '',
          priority: 'P0',
          function: '',
          screen_flow: '',
          existing: '',
          improvement: '',
          reference: '',
        },
      ],
    });
  };

  const handleLoadNexBlueprint = () => {
    replaceGroups(NEX_HEALTH_SAMPLE_DEFECT_GROUPS);
    setNexConfirmOpen(false);
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
            color="warning"
            startIcon={<Iconify icon="solar:document-medicine-bold" />}
            onClick={() => setNexConfirmOpen(true)}
            disabled={disabled}
            aria-label={t('standaloneMaintenanceForm.defect.loadNexBlueprint')}
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.defect.loadNexBlueprint')}
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
              {t('standaloneMaintenanceForm.defect.groupsTitle')}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddGroup}
              disabled={disabled}
              aria-label={t('standaloneMaintenanceForm.defect.addGroup')}
              sx={{ minHeight: 44, px: 2 }}
            >
              {t('standaloneMaintenanceForm.defect.addGroup')}
            </Button>
          </Stack>

          <Stack spacing={3}>
            {groupFields.map((groupField, groupIndex) => (
              <DefectGroupItem
                key={groupField.id}
                groupIndex={groupIndex}
                disabled={disabled}
                onRemoveGroup={() => removeGroup(groupIndex)}
                canRemoveGroup={groupFields.length > 1}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>

      {/* Confirmation Dialog for Nex Health Blueprint Example */}
      <Dialog
        open={nexConfirmOpen}
        onClose={() => setNexConfirmOpen(false)}
        aria-labelledby="load-nex-dialog-title"
      >
        <DialogTitle id="load-nex-dialog-title">
          {t('standaloneMaintenanceForm.defect.loadNexDialogTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('standaloneMaintenanceForm.defect.loadNexDialogMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNexConfirmOpen(false)}
            color="inherit"
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.defect.cancelLoadNex')}
          </Button>
          <Button
            onClick={handleLoadNexBlueprint}
            variant="contained"
            color="warning"
            autoFocus
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.defect.confirmLoadNex')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

import type { WhiteLabelFormValues } from '../constants/white-label';

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

// ----------------------------------------------------------------------

const STARTER_POS_GROUPS = [
  'Master Data',
  'Inventory',
  'Pembelian',
  'Kasir POS',
  'Kas & Bank',
  'Laporan',
];

type Props = {
  disabled?: boolean;
};

export function WhiteLabelScopeEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control } = useFormContext<WhiteLabelFormValues>();

  const [confirmStarterOpen, setConfirmStarterOpen] = useState(false);

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
    replace: replaceGroups,
  } = useFieldArray({
    control,
    name: 'white_label.module_groups',
  });

  const {
    fields: timelineFields,
    append: appendTimeline,
    remove: removeTimeline,
  } = useFieldArray({
    control,
    name: 'white_label.timeline_rows',
  });

  const handleAddGroup = () => {
    appendGroup({
      name: `Modul ${groupFields.length + 1}`,
      features: ['Fitur Utama'],
    });
  };

  const handleApplyStarter = () => {
    const starter = STARTER_POS_GROUPS.map((name) => ({
      name,
      features: [],
    }));
    replaceGroups(starter);
  };

  const handleOpenStarterDialog = () => {
    if (groupFields.length > 0) {
      setConfirmStarterOpen(true);
    } else {
      handleApplyStarter();
    }
  };

  const handleAddTimeline = () => {
    appendTimeline({
      description: '',
      timeline: '',
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('whiteLabelForm.scopeTitle')}
        subheader={t('whiteLabelForm.scopeSubtitle')}
      />
      <CardContent>
        <Stack spacing={3}>
          <Alert severity="info">{t('whiteLabelForm.scope.helper')}</Alert>

          {/* Module Groups Section */}
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('whiteLabelForm.scope.modulesTitle')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('whiteLabelForm.scope.starterPosHint')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<Iconify icon="solar:box-minimalistic-bold" />}
                  onClick={handleOpenStarterDialog}
                  disabled={disabled}
                >
                  {t('whiteLabelForm.scope.starterPos')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={handleAddGroup}
                  disabled={disabled}
                >
                  {t('whiteLabelForm.scope.addGroup')}
                </Button>
              </Stack>
            </Stack>

            {groupFields.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                Tidak ada kelompok modul. Bagian modul akan disembunyikan jika dibiarkan kosong.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {groupFields.map((field, groupIndex) => (
                  <Card
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2.5, bgcolor: 'background.neutral' }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <RHFTextField
                          name={`white_label.module_groups.${groupIndex}.name`}
                          label={t('whiteLabelForm.scope.groupName')}
                          placeholder={t('whiteLabelForm.scope.groupNamePlaceholder')}
                          disabled={disabled}
                          size="small"
                          sx={{ flex: 1 }}
                        />
                        <IconButton
                          color="error"
                          aria-label={t('whiteLabelForm.scope.removeGroup')}
                          onClick={() => removeGroup(groupIndex)}
                          disabled={disabled}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      {/* Nested Features List */}
                      <Controller
                        name={`white_label.module_groups.${groupIndex}.features`}
                        control={control}
                        render={({ field: subField, fieldState: { error } }) => {
                          const features: string[] = Array.isArray(subField.value)
                            ? subField.value
                            : [];

                          const handleAddFeature = () => {
                            subField.onChange([...features, '']);
                          };

                          const handleUpdateFeature = (fIndex: number, val: string) => {
                            const next = [...features];
                            next[fIndex] = val;
                            subField.onChange(next);
                          };

                          const handleRemoveFeature = (fIndex: number) => {
                            subField.onChange(features.filter((_, i) => i !== fIndex));
                          };

                          return (
                            <Stack spacing={1.5} sx={{ pl: { xs: 0, sm: 2 } }}>
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Fitur dalam modul:
                              </Typography>

                              {error && (
                                <Typography variant="caption" color="error">
                                  {error.message || 'Minimal 1 fitur diperlukan per kelompok'}
                                </Typography>
                              )}

                              {features.map((feature, featureIndex) => (
                                <Stack
                                  key={featureIndex}
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={feature}
                                    placeholder={t('whiteLabelForm.scope.featurePlaceholder')}
                                    disabled={disabled}
                                    onChange={(e) =>
                                      handleUpdateFeature(featureIndex, e.target.value)
                                    }
                                  />
                                  <IconButton
                                    size="small"
                                    color="error"
                                    aria-label={t('whiteLabelForm.scope.removeFeature')}
                                    onClick={() => handleRemoveFeature(featureIndex)}
                                    disabled={disabled}
                                  >
                                    <Iconify icon="eva:close-fill" width={18} />
                                  </IconButton>
                                </Stack>
                              ))}

                              <Box sx={{ pt: 0.5 }}>
                                <Button
                                  size="small"
                                  variant="text"
                                  startIcon={<Iconify icon="solar:add-circle-linear" />}
                                  onClick={handleAddFeature}
                                  disabled={disabled}
                                >
                                  {t('whiteLabelForm.scope.addFeature')}
                                </Button>
                              </Box>
                            </Stack>
                          );
                        }}
                      />
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Timeline Rows Section */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('whiteLabelForm.scope.timelineTitle')}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddTimeline}
                disabled={disabled}
              >
                {t('whiteLabelForm.scope.addTimeline')}
              </Button>
            </Stack>

            {timelineFields.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                Tidak ada baris timeline implementasi.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {timelineFields.map((field, index) => (
                  <Card
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'background.neutral' }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 7 }}>
                        <RHFTextField
                          name={`white_label.timeline_rows.${index}.description`}
                          label={t('whiteLabelForm.scope.timelineDesc')}
                          placeholder={t('whiteLabelForm.scope.timelineDescPlaceholder')}
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 10, sm: 4 }}>
                        <RHFTextField
                          name={`white_label.timeline_rows.${index}.timeline`}
                          label={t('whiteLabelForm.scope.timelineTarget')}
                          placeholder={t('whiteLabelForm.scope.timelineTargetPlaceholder')}
                          disabled={disabled}
                          size="small"
                        />
                      </Grid>

                      <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: 'right' }}>
                        <IconButton
                          color="error"
                          aria-label={t('whiteLabelForm.scope.removeTimeline')}
                          onClick={() => removeTimeline(index)}
                          disabled={disabled}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>

      {/* Confirmation Dialog for Starter POS */}
      <Dialog
        open={confirmStarterOpen}
        onClose={() => setConfirmStarterOpen(false)}
        aria-labelledby="confirm-starter-pos-dialog-title"
      >
        <DialogTitle id="confirm-starter-pos-dialog-title">
          {t('whiteLabelForm.scope.confirmStarterTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t('whiteLabelForm.scope.confirmStarterDesc')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStarterOpen(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={() => {
              setConfirmStarterOpen(false);
              handleApplyStarter();
            }}
            variant="contained"
            color="primary"
            autoFocus
          >
            Ya, Muat Struktur
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

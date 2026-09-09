import type { CustomDevelopmentFormValues } from './custom-development-form-model';

import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
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

type PresetKey = 'kopi' | 'assessment' | 'ecoflow';

export const CUSTOM_DEVELOPMENT_PRESETS: Record<
  PresetKey,
  {
    module_groups: Array<{ name: string; features: string[] }>;
    timeline_rows: Array<{ description: string; timeline: string }>;
  }
> = {
  kopi: {
    module_groups: [
      {
        name: 'Modul Web Administrator',
        features: [
          'Dashboard & Statistik',
          'Manajemen User & Role',
          'Audit Log & Verifikasi Foto Kopi',
          'Laporan & Rekapitulasi',
        ],
      },
      {
        name: 'Modul Mobile / PWA',
        features: [
          'Autentikasi Petugas',
          'Pengambilan & Kompresi Foto',
          'Sinkronisasi Offline-First',
          'Riwayat Unggahan',
        ],
      },
    ],
    timeline_rows: [
      { description: 'Fase 1: Analisis & Desain UI/UX', timeline: '2 Minggu' },
      { description: 'Fase 2: Pengembangan Core & API', timeline: '4 Minggu' },
      { description: 'Fase 3: Integrasi & Pengujian QA', timeline: '2 Minggu' },
    ],
  },
  assessment: {
    module_groups: [
      {
        name: 'Modul Ujian & Soal',
        features: ['Bank Soal Dinamis', 'Timer & Anti-Kecurangan', 'Penilaian Otomatis'],
      },
      {
        name: 'Modul Peserta & Hasil',
        features: ['Registrasi Peserta', 'Sertifikat Digital', 'Unduh Rekap Nilai'],
      },
    ],
    timeline_rows: [{ description: 'Pengembangan Sistem & Uji Coba', timeline: '1 Bulan' }],
  },
  ecoflow: {
    module_groups: [
      {
        name: 'Website Utama Ecoflow',
        features: [
          'Katalog Produk Dinamis',
          'Kalkulator Penghematan Energi',
          'Formulir Konsultasi',
        ],
      },
      {
        name: 'Modul CMS Konten',
        features: ['Manajemen Artikel & Berita', 'SEO & Metadata Editor'],
      },
    ],
    timeline_rows: [
      { description: 'Desain UI/UX & Prototipe', timeline: '1 Minggu' },
      { description: 'Implementasi Frontend & Backend', timeline: '2 Minggu' },
    ],
  },
};

function hasScopeContent(
  moduleGroups?: Array<{ name?: string; features?: string[] }>,
  timelineRows?: Array<{ description?: string; timeline?: string }>
): boolean {
  const hasModules = (moduleGroups || []).some(
    (g) =>
      Boolean(g.name && g.name.trim() !== '' && g.name !== 'Modul Utama') ||
      (g.features || []).some((f) => Boolean(f && f.trim() !== '' && f !== 'Fitur Utama'))
  );
  const hasTimelines = (timelineRows || []).some(
    (r) =>
      Boolean(
        r.description &&
        r.description.trim() !== '' &&
        r.description !== 'Fase 1: Pengembangan dan Testing'
      ) || Boolean(r.timeline && r.timeline.trim() !== '' && r.timeline !== '1 Bulan')
  );
  return hasModules || hasTimelines;
}

type Props = {
  disabled?: boolean;
};

export function CustomDevelopmentScopeEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue, watch } = useFormContext<CustomDevelopmentFormValues>();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<PresetKey | null>(null);

  const moduleGroups = watch('custom_development.module_groups') || [];
  const timelineRows = watch('custom_development.timeline_rows') || [];

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: 'custom_development.module_groups',
  });

  const {
    fields: timelineFields,
    append: appendTimeline,
    remove: removeTimeline,
  } = useFieldArray({
    control,
    name: 'custom_development.timeline_rows',
  });

  const applyPreset = (presetKey: PresetKey) => {
    const preset = CUSTOM_DEVELOPMENT_PRESETS[presetKey];
    setValue('custom_development.module_groups', preset.module_groups, { shouldValidate: true });
    setValue('custom_development.timeline_rows', preset.timeline_rows, { shouldValidate: true });
  };

  const handleRequestPreset = (presetKey: PresetKey) => {
    if (hasScopeContent(moduleGroups, timelineRows)) {
      setPendingPreset(presetKey);
      setConfirmDialogOpen(true);
    } else {
      applyPreset(presetKey);
    }
  };

  const handleConfirmPreset = () => {
    if (pendingPreset) {
      applyPreset(pendingPreset);
    }
    setConfirmDialogOpen(false);
    setPendingPreset(null);
  };

  const handleCancelPreset = () => {
    setConfirmDialogOpen(false);
    setPendingPreset(null);
  };

  const handleAddModuleGroup = () => {
    appendGroup({
      name: '',
      features: [''],
    });
  };

  const handleAddTimelineRow = () => {
    appendTimeline({
      description: '',
      timeline: '',
    });
  };

  return (
    <Card>
      <CardHeader
        title={t('customDevelopmentForm.scopeTitle')}
        subheader={t('customDevelopmentForm.scopeSubtitle')}
      />
      <CardContent>
        <Stack spacing={3}>
          {/* Preset Buttons */}
          <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {t('customDevelopmentForm.scope.presetsTitle')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:document-add-bold" />}
                onClick={() => handleRequestPreset('kopi')}
                disabled={disabled}
              >
                {t('customDevelopmentForm.scope.loadKopi')}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:document-add-bold" />}
                onClick={() => handleRequestPreset('assessment')}
                disabled={disabled}
              >
                {t('customDevelopmentForm.scope.loadAssessment')}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:document-add-bold" />}
                onClick={() => handleRequestPreset('ecoflow')}
                disabled={disabled}
              >
                {t('customDevelopmentForm.scope.loadEcoflow')}
              </Button>
            </Stack>
          </Box>

          {/* Module Groups */}
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('customDevelopmentForm.scope.moduleGroupsTitle')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddModuleGroup}
                disabled={disabled}
              >
                {t('customDevelopmentForm.scope.addModuleGroup')}
              </Button>
            </Stack>

            {groupFields.map((groupField, groupIndex) => (
              <ModuleGroupItem
                key={groupField.id}
                groupIndex={groupIndex}
                control={control}
                disabled={disabled}
                canRemoveGroup={groupFields.length > 1}
                onRemoveGroup={() => removeGroup(groupIndex)}
              />
            ))}
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* Timeline Rows */}
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t('customDevelopmentForm.scope.timelineTitle')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddTimelineRow}
                disabled={disabled}
              >
                {t('customDevelopmentForm.scope.addTimelineRow')}
              </Button>
            </Stack>

            <Stack spacing={2}>
              {timelineFields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: 'background.neutral',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                      <RHFTextField
                        name={`custom_development.timeline_rows.${index}.description`}
                        label={t('customDevelopmentForm.scope.timelineDesc')}
                        placeholder={t('customDevelopmentForm.scope.timelineDescPlaceholder')}
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid size={{ xs: 10, sm: 10, md: 3.5 }}>
                      <RHFTextField
                        name={`custom_development.timeline_rows.${index}.timeline`}
                        label={t('customDevelopmentForm.scope.timelineTarget')}
                        placeholder={t('customDevelopmentForm.scope.timelineTargetPlaceholder')}
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, sm: 2, md: 0.5 }} sx={{ textAlign: 'right' }}>
                      <IconButton
                        color="error"
                        disabled={disabled || timelineFields.length <= 1}
                        onClick={() => removeTimeline(index)}
                        aria-label={t('customDevelopmentForm.scope.removeTimelineRow')}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>

      {/* Preset Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelPreset}>
        <DialogTitle>{t('customDevelopmentForm.scope.confirmPresetTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customDevelopmentForm.scope.confirmPresetMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPreset} color="inherit">
            {t('customDevelopmentForm.scope.cancelPreset')}
          </Button>
          <Button onClick={handleConfirmPreset} variant="contained" color="warning" autoFocus>
            {t('customDevelopmentForm.scope.confirmPreset')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// ----------------------------------------------------------------------

type ModuleGroupProps = {
  groupIndex: number;
  control: any;
  disabled: boolean;
  canRemoveGroup: boolean;
  onRemoveGroup: () => void;
};

function ModuleGroupItem({
  groupIndex,
  control,
  disabled,
  canRemoveGroup,
  onRemoveGroup,
}: ModuleGroupProps) {
  const { t } = useTranslate('quotation');

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({
    control,
    name: `custom_development.module_groups.${groupIndex}.features` as any,
  });

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <RHFTextField
              name={`custom_development.module_groups.${groupIndex}.name`}
              label={t('customDevelopmentForm.scope.moduleGroupName')}
              placeholder={t('customDevelopmentForm.scope.moduleGroupNamePlaceholder')}
              disabled={disabled}
            />
          </Box>
          <Button
            color="error"
            size="small"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={onRemoveGroup}
            disabled={disabled || !canRemoveGroup}
          >
            {t('customDevelopmentForm.scope.removeModuleGroup')}
          </Button>
        </Stack>

        <Box sx={{ pl: { xs: 0, sm: 2 } }}>
          <Stack spacing={1.5}>
            <Typography variant="caption" color="text.secondary">
              {t('customDevelopmentForm.scope.featuresTitle')}
            </Typography>

            {featureFields.map((featField, featIndex) => (
              <Stack key={featField.id} direction="row" spacing={1} alignItems="center">
                <RHFTextField
                  name={`custom_development.module_groups.${groupIndex}.features.${featIndex}`}
                  placeholder={t('customDevelopmentForm.scope.featurePlaceholder')}
                  disabled={disabled}
                />
                <IconButton
                  color="error"
                  disabled={disabled || featureFields.length <= 1}
                  onClick={() => removeFeature(featIndex)}
                  aria-label={t('customDevelopmentForm.scope.removeFeature')}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Stack>
            ))}

            <Box>
              <Button
                size="small"
                variant="text"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => appendFeature('')}
                disabled={disabled}
              >
                {t('customDevelopmentForm.scope.addFeature')}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

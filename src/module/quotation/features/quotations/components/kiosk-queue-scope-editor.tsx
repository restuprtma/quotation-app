import type { Control, UseFormSetValue } from 'react-hook-form';
import type { KioskQueueFormValues } from './kiosk-queue-form-model';
import type {
  KioskQueueExpertInput,
  KioskQueueScopePhaseInput,
  KioskQueueTimelineRowInput,
} from '../types';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFTextField, RHFNumericField } from 'src/shared/ui/hook-form';

import { fieldId } from './kiosk-queue-form-model';

// ----------------------------------------------------------------------
// Pure data manipulation helpers for tests and stable array operations
// ----------------------------------------------------------------------

export function addScopePhase(phases: KioskQueueScopePhaseInput[]): KioskQueueScopePhaseInput[] {
  return [...phases, { title: '', deliverables: [''] }];
}

export function removeScopePhase(
  phases: KioskQueueScopePhaseInput[],
  index: number
): KioskQueueScopePhaseInput[] {
  return phases.filter((_, i) => i !== index);
}

export function reorderPhases(
  phases: KioskQueueScopePhaseInput[],
  fromIndex: number,
  toIndex: number
): KioskQueueScopePhaseInput[] {
  if (fromIndex < 0 || fromIndex >= phases.length || toIndex < 0 || toIndex >= phases.length) {
    return phases;
  }
  const result = [...phases];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

export function addDeliverable(deliverables: string[]): string[] {
  return [...deliverables, ''];
}

export function removeDeliverable(deliverables: string[], index: number): string[] {
  if (deliverables.length <= 1) return [''];
  return deliverables.filter((_, i) => i !== index);
}

export function addExpertRequirement(experts: KioskQueueExpertInput[]): KioskQueueExpertInput[] {
  return [
    ...experts,
    {
      role: '',
      headcount: 1,
      duration_label: '',
      minimum_qualification: '',
    },
  ];
}

export function removeExpertRequirement(
  experts: KioskQueueExpertInput[],
  index: number
): KioskQueueExpertInput[] {
  return experts.filter((_, i) => i !== index);
}

export function reorderExpertRequirements(
  experts: KioskQueueExpertInput[],
  fromIndex: number,
  toIndex: number
): KioskQueueExpertInput[] {
  if (fromIndex < 0 || fromIndex >= experts.length || toIndex < 0 || toIndex >= experts.length) {
    return experts;
  }
  const result = [...experts];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

export function addTimelineRow(rows: KioskQueueTimelineRowInput[]): KioskQueueTimelineRowInput[] {
  return [...rows, { description: '', timeline: '' }];
}

export function removeTimelineRow(
  rows: KioskQueueTimelineRowInput[],
  index: number
): KioskQueueTimelineRowInput[] {
  return rows.filter((_, i) => i !== index);
}

export function reorderTimelineRows(
  rows: KioskQueueTimelineRowInput[],
  fromIndex: number,
  toIndex: number
): KioskQueueTimelineRowInput[] {
  if (fromIndex < 0 || fromIndex >= rows.length || toIndex < 0 || toIndex >= rows.length) {
    return rows;
  }
  const result = [...rows];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

// ----------------------------------------------------------------------
// Nested Deliverables Editor for a single Phase
// ----------------------------------------------------------------------

type DeliverablesEditorProps = {
  phaseIndex: number;
  control: Control<KioskQueueFormValues>;
  setValue: UseFormSetValue<KioskQueueFormValues>;
  disabled?: boolean;
};

function DeliverablesEditor({
  phaseIndex,
  control,
  setValue,
  disabled = false,
}: DeliverablesEditorProps) {
  const { t } = useTranslate('quotation');
  const path = `kiosk_queue_system.government_scope_phases.${phaseIndex}.deliverables` as const;

  const watched = useWatch({ control, name: path });
  const currentDeliverables = (watched && watched.length > 0 ? watched : ['']) as string[];

  const handleAdd = () => {
    const next = addDeliverable(currentDeliverables);
    setValue(path, next, { shouldValidate: true, shouldDirty: true });
  };

  const handleRemove = (index: number) => {
    const next = removeDeliverable(currentDeliverables, index);
    setValue(path, next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Stack spacing={1.5} sx={{ pl: { xs: 1, sm: 2 } }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary">
        {t('kioskQueueForm.scope.deliverablesTitle', 'Rincian Output / Deliverables:')}
      </Typography>

      {currentDeliverables.map((_, dIdx) => (
        <Stack key={dIdx} direction="row" spacing={1} alignItems="flex-start">
          <RHFTextField
            id={fieldId(`${path}.${dIdx}`)}
            name={`${path}.${dIdx}`}
            placeholder={t(
              'kioskQueueForm.scope.deliverablePlaceholder',
              'contoh: Dokumen SRS & Arsitektur Sistem'
            )}
            multiline
            minRows={1}
            maxRows={3}
            size="small"
            disabled={disabled}
            fullWidth
          />
          <Tooltip title={t('kioskQueueForm.scope.removeDeliverable', 'Hapus Deliverable')}>
            <span>
              <IconButton
                aria-label="Hapus deliverable"
                size="small"
                color="error"
                onClick={() => handleRemove(dIdx)}
                disabled={disabled || currentDeliverables.length <= 1}
                sx={{
                  minWidth: 44,
                  minHeight: 44,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ))}

      <Box>
        <Button
          size="small"
          variant="text"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={handleAdd}
          disabled={disabled || currentDeliverables.length >= 100}
          aria-label="Tambah deliverable"
          sx={{ minHeight: 44 }}
        >
          {t('kioskQueueForm.scope.addDeliverable', 'Tambah Deliverable')}
        </Button>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Scope Editor Main Component
// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function KioskQueueScopeEditor({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue } = useFormContext<KioskQueueFormValues>();
  const variant =
    useWatch({
      control,
      name: 'kiosk_queue_system.variant',
    }) || 'government_mpp';

  // Government Scope Phases Field Array
  const {
    fields: phaseFields,
    append: appendPhase,
    remove: removePhaseRHF,
    swap: swapPhaseRHF,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.government_scope_phases',
  });

  // Government Expert Requirements Field Array
  const {
    fields: expertFields,
    append: appendExpert,
    remove: removeExpertRHF,
    swap: swapExpertRHF,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.expert_requirements',
  });

  // Private Timeline Rows Field Array
  const {
    fields: timelineFields,
    append: appendTimeline,
    remove: removeTimelineRHF,
    swap: swapTimelineRHF,
  } = useFieldArray({
    control,
    name: 'kiosk_queue_system.private_timeline_rows',
  });

  // --------------------------------------------------------------------
  // Render Government Scope & Experts
  // --------------------------------------------------------------------
  if (variant === 'government_mpp') {
    return (
      <Card data-testid="kiosk-queue-scope-editor-gov">
        <CardHeader
          title={t('kioskQueueForm.scope.govTitle', '3. Lingkup Pekerjaan & Tenaga Ahli')}
          subheader={t(
            'kioskQueueForm.scope.govSubtitle',
            'Fase pengadaan antrian MPP dan alokasi tim tenaga ahli bersertifikasi'
          )}
        />
        <CardContent>
          <Stack spacing={4}>
            {/* Section A: Fase Lingkup Pekerjaan */}
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('kioskQueueForm.scope.phasesTitle', 'Fase Lingkup Pekerjaan')}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={() => appendPhase({ title: '', deliverables: [''] })}
                  disabled={disabled || phaseFields.length >= 30}
                  aria-label="Tambah fase lingkup"
                  sx={{ minHeight: 44 }}
                >
                  {t('kioskQueueForm.scope.addPhase', 'Tambah Fase')}
                </Button>
              </Stack>

              {phaseFields.map((field, pIdx) => (
                <Paper
                  key={field.id}
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <RHFTextField
                        id={fieldId(`kiosk_queue_system.government_scope_phases.${pIdx}.title`)}
                        name={`kiosk_queue_system.government_scope_phases.${pIdx}.title`}
                        label={t('kioskQueueForm.scope.phaseTitleLabel', `Judul Fase ${pIdx + 1}`)}
                        placeholder={t(
                          'kioskQueueForm.scope.phaseTitlePlaceholder',
                          'contoh: Fase 1: Instalasi & Pengujian Kiosk'
                        )}
                        disabled={disabled}
                        fullWidth
                      />

                      {/* Reorder Up */}
                      <Tooltip title={t('kioskQueueForm.scope.moveUp', 'Pindahkan ke atas')}>
                        <span>
                          <IconButton
                            aria-label="Pindahkan fase ke atas"
                            onClick={() => swapPhaseRHF(pIdx, pIdx - 1)}
                            disabled={disabled || pIdx === 0}
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <Iconify icon="solar:arrow-up-bold" width={20} />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Reorder Down */}
                      <Tooltip title={t('kioskQueueForm.scope.moveDown', 'Pindahkan ke bawah')}>
                        <span>
                          <IconButton
                            aria-label="Pindahkan fase ke bawah"
                            onClick={() => swapPhaseRHF(pIdx, pIdx + 1)}
                            disabled={disabled || pIdx === phaseFields.length - 1}
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <Iconify icon="solar:arrow-down-bold" width={20} />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Remove Phase */}
                      <Tooltip title={t('kioskQueueForm.scope.removePhase', 'Hapus Fase')}>
                        <span>
                          <IconButton
                            aria-label="Hapus fase"
                            color="error"
                            onClick={() => removePhaseRHF(pIdx)}
                            disabled={disabled || phaseFields.length <= 1}
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>

                    <DeliverablesEditor
                      phaseIndex={pIdx}
                      control={control}
                      setValue={setValue}
                      disabled={disabled}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>

            {/* Section B: Kebutuhan Tenaga Ahli */}
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('kioskQueueForm.scope.expertTitle', 'Kebutuhan Tenaga Ahli')}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:user-plus-bold" />}
                  onClick={() =>
                    appendExpert({
                      role: '',
                      headcount: 1,
                      duration_label: '',
                      minimum_qualification: '',
                    })
                  }
                  disabled={disabled || expertFields.length >= 50}
                  aria-label="Tambah tenaga ahli"
                  sx={{ minHeight: 44 }}
                >
                  {t('kioskQueueForm.scope.addExpert', 'Tambah Tenaga Ahli')}
                </Button>
              </Stack>

              {expertFields.map((field, eIdx) => (
                <Paper
                  key={field.id}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper' }}
                >
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <RHFTextField
                        id={fieldId(`kiosk_queue_system.expert_requirements.${eIdx}.role`)}
                        name={`kiosk_queue_system.expert_requirements.${eIdx}.role`}
                        label={t('kioskQueueForm.scope.expertRole', 'Peran / Posisi')}
                        placeholder="contoh: Project Manager"
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 2 }}>
                      <Box id={fieldId(`kiosk_queue_system.expert_requirements.${eIdx}.headcount`)}>
                        <RHFNumericField
                          name={`kiosk_queue_system.expert_requirements.${eIdx}.headcount`}
                          label={t('kioskQueueForm.scope.expertHeadcount', 'Jumlah (Org)')}
                          disabled={disabled}
                          size="small"
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                      <RHFTextField
                        id={fieldId(
                          `kiosk_queue_system.expert_requirements.${eIdx}.duration_label`
                        )}
                        name={`kiosk_queue_system.expert_requirements.${eIdx}.duration_label`}
                        label={t('kioskQueueForm.scope.expertDuration', 'Durasi Penugasan')}
                        placeholder="contoh: 3 Bulan"
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title={t('kioskQueueForm.scope.moveUp', 'Pindahkan ke atas')}>
                          <span>
                            <IconButton
                              aria-label="Pindahkan tenaga ahli ke atas"
                              onClick={() => swapExpertRHF(eIdx, eIdx - 1)}
                              disabled={disabled || eIdx === 0}
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Iconify icon="solar:arrow-up-bold" width={18} />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={t('kioskQueueForm.scope.moveDown', 'Pindahkan ke bawah')}>
                          <span>
                            <IconButton
                              aria-label="Pindahkan tenaga ahli ke bawah"
                              onClick={() => swapExpertRHF(eIdx, eIdx + 1)}
                              disabled={disabled || eIdx === expertFields.length - 1}
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Iconify icon="solar:arrow-down-bold" width={18} />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip
                          title={t('kioskQueueForm.scope.removeExpert', 'Hapus Tenaga Ahli')}
                        >
                          <span>
                            <IconButton
                              aria-label="Hapus tenaga ahli"
                              color="error"
                              onClick={() => removeExpertRHF(eIdx)}
                              disabled={disabled || expertFields.length <= 1}
                              sx={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <RHFTextField
                        id={fieldId(
                          `kiosk_queue_system.expert_requirements.${eIdx}.minimum_qualification`
                        )}
                        name={`kiosk_queue_system.expert_requirements.${eIdx}.minimum_qualification`}
                        label={t('kioskQueueForm.scope.expertQualification', 'Kualifikasi Minimal')}
                        placeholder="contoh: Minimal S1 Sistem Informasi / Teknik Informatika, pengalaman 3 tahun"
                        multiline
                        minRows={2}
                        disabled={disabled}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------
  // Render Private Timeline Rows (matching `/timeline swasta/i`)
  // --------------------------------------------------------------------
  return (
    <Card data-testid="kiosk-queue-scope-editor-priv">
      <CardHeader
        title={t('kioskQueueForm.scope.privateTitle', '3. Lingkup Pekerjaan & Timeline Swasta')}
        subheader={t(
          'kioskQueueForm.scope.privateSubtitle',
          'Daftar ruang lingkup implementasi kiosk self-ordering dan target jadwal'
        )}
      />
      <CardContent>
        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight={700}>
              {t('kioskQueueForm.scope.timelineRowsTitle', 'Daftar Timeline Swasta')}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => appendTimeline({ description: '', timeline: '' })}
              disabled={disabled || timelineFields.length >= 100}
              aria-label="Tambah baris timeline"
              sx={{ minHeight: 44 }}
            >
              {t('kioskQueueForm.scope.addTimelineRow', 'Tambah Baris Timeline')}
            </Button>
          </Stack>

          {timelineFields.map((field, tIdx) => (
            <Paper
              key={field.id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper' }}
            >
              <Grid container spacing={2} alignItems="flex-start">
                <Grid size={{ xs: 12, sm: 7 }}>
                  <RHFTextField
                    id={fieldId(`kiosk_queue_system.private_timeline_rows.${tIdx}.description`)}
                    name={`kiosk_queue_system.private_timeline_rows.${tIdx}.description`}
                    label={t('kioskQueueForm.scope.timelineDescription', 'Deskripsi Lingkup')}
                    placeholder="contoh: Desain UI Kiosk & Integrasi Payment Gateway"
                    multiline
                    minRows={2}
                    disabled={disabled}
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <RHFTextField
                    id={fieldId(`kiosk_queue_system.private_timeline_rows.${tIdx}.timeline`)}
                    name={`kiosk_queue_system.private_timeline_rows.${tIdx}.timeline`}
                    label={t('kioskQueueForm.scope.timelineTarget', 'Target Waktu')}
                    placeholder="contoh: Bulan 1 (Minggu 1-2)"
                    disabled={disabled}
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 2 }}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={t('kioskQueueForm.scope.moveUp', 'Pindahkan ke atas')}>
                      <span>
                        <IconButton
                          aria-label="Pindahkan timeline ke atas"
                          onClick={() => swapTimelineRHF(tIdx, tIdx - 1)}
                          disabled={disabled || tIdx === 0}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <Iconify icon="solar:arrow-up-bold" width={18} />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title={t('kioskQueueForm.scope.moveDown', 'Pindahkan ke bawah')}>
                      <span>
                        <IconButton
                          aria-label="Pindahkan timeline ke bawah"
                          onClick={() => swapTimelineRHF(tIdx, tIdx + 1)}
                          disabled={disabled || tIdx === timelineFields.length - 1}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <Iconify icon="solar:arrow-down-bold" width={18} />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title={t('kioskQueueForm.scope.removeTimeline', 'Hapus Baris')}>
                      <span>
                        <IconButton
                          aria-label="Hapus timeline"
                          color="error"
                          onClick={() => removeTimelineRHF(tIdx)}
                          disabled={disabled || timelineFields.length <= 1}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

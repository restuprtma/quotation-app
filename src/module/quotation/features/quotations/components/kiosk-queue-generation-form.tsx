import type { KioskQueueFormValues } from './kiosk-queue-form-model';
import type { ActiveSkill, KioskQueueVariant, GenerateQuotationPayload } from '../types';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Form, RHFSelect, RHFTextField } from 'src/shared/ui/hook-form';

import { useClients } from '../hooks/use-clients';
import { SOLUTION_TYPES } from '../constants/scope-presets';
import { useActiveSkills } from '../hooks/use-active-skills';
import { KioskQueueCostEditor } from './kiosk-queue-cost-editor';
import { KioskQueueScopeEditor } from './kiosk-queue-scope-editor';
import { fieldId, kioskQueueFormSchema } from './kiosk-queue-form-model';
import { KioskQueuePaymentLegalEditor } from './kiosk-queue-payment-legal-editor';
import { KioskQueuePreview, isKioskQueueSubmitReady } from './kiosk-queue-preview';
import {
  toKioskQueuePayload,
  createDefaultKioskQueueValues,
} from '../constants/kiosk-queue-system';
import {
  useKioskQueuePreview,
  normalizeKioskQueuePreviewPayload,
} from '../hooks/use-quotation-generation';

// ----------------------------------------------------------------------
// Exported Helpers and Factories
// ----------------------------------------------------------------------

export type KioskQueueSharedIdentity = {
  client_id?: string;
  client_name?: string;
  client_company_name?: string;
  subject?: string;
  solution_type?: string;
  document_number?: string;
  system_name?: string;
  quotation_date?: string;
};

export function makeGovernmentDefaults(shared?: KioskQueueSharedIdentity): KioskQueueFormValues {
  const today = shared?.quotation_date || new Date().toISOString().slice(0, 10);
  return {
    client_id: shared?.client_id ?? '',
    client_company_name: shared?.client_company_name ?? '',
    client_name: shared?.client_name || 'Pejabat Pembuat Komitmen (PPK)',
    subject: shared?.subject || 'Penawaran Pengadaan Sistem Antrian Terpadu MPP',
    solution_type: shared?.solution_type || 'Sistem Antrian (Queue Management)',
    commercial_scheme: 'kiosk_queue_system',
    kiosk_queue_system: {
      variant: 'government_mpp',
      document_number: shared?.document_number ?? '',
      system_name: shared?.system_name || 'Sistem Antrian Terpadu MPP',
      quotation_date: today,
      hardware_provision: 'venturo_supplied',
      tax_treatment: 'inclusive_ppn_11',
      government_scope_phases: [
        {
          title: 'Fase 1: Persiapan & Analisis Kebutuhan',
          deliverables: ['Dokumen Analisis Kebutuhan & Desain Arsitektur'],
        },
      ],
      expert_requirements: [
        {
          role: 'Project Manager',
          headcount: 1,
          duration_label: '3 Bulan',
          minimum_qualification: 'S1 Sistem Informasi / Teknik Informatika',
        },
      ],
      service_groups: [
        {
          title: 'Pengembangan Perangkat Lunak Antrian Terpadu',
          items: [
            {
              name: 'Senior Programmer',
              monthly_rate: 15_000_000,
              headcount: 1,
              period_quarters: 4,
            },
          ],
        },
      ],
      service_discount_amount: 0,
      show_service_discount_row: false,
      hardware_items: [],
      maintenance_items: [],
      private_timeline_rows: [],
      government_payment_schedule: [
        {
          stage: 'Termin 1 (Uang Muka 50%)',
          billing_basis: 'Penandatanganan Kontrak & SPMK',
          nominal: 0,
        },
      ],
      private_payment_schedule: [],
      payment_due_days: 14,
      limitation_codes: ['civil_electrical'],
      additional_limitations: [],
      rights_statements: [],
    },
  };
}

export function makePrivateDefaults(shared?: KioskQueueSharedIdentity): KioskQueueFormValues {
  const today = shared?.quotation_date || new Date().toISOString().slice(0, 10);
  return {
    client_id: shared?.client_id ?? '',
    client_company_name: shared?.client_company_name ?? '',
    client_name: shared?.client_name || 'Pimpinan Perusahaan',
    subject: shared?.subject || 'Penawaran Self-Ordering Kiosk Food Court',
    solution_type: shared?.solution_type || 'Kiosk Application',
    commercial_scheme: 'kiosk_queue_system',
    kiosk_queue_system: {
      variant: 'private_food_court',
      document_number: shared?.document_number ?? '',
      system_name: shared?.system_name || 'Self-Ordering Kiosk Food Court',
      quotation_date: today,
      hardware_provision: 'client_supplied',
      tax_treatment: 'exclusive_ppn',
      government_scope_phases: [],
      expert_requirements: [],
      service_groups: [
        {
          title: 'Pengembangan Aplikasi Self-Ordering Kiosk & POS',
          items: [
            {
              name: 'Fullstack Developer',
              monthly_rate: 15_000_000,
              headcount: 1,
              period_quarters: 4,
            },
          ],
        },
      ],
      service_discount_amount: 0,
      show_service_discount_row: false,
      hardware_items: [],
      maintenance_items: [],
      private_timeline_rows: [
        {
          description: 'Requirement Analysis & POS Integration',
          timeline: 'Bulan 1',
        },
      ],
      government_payment_schedule: [],
      private_payment_schedule: [
        {
          work_period: 'Termin 1',
          terms: 'DP Kick-off 50%',
          invoice_date_label: today,
          due_date_label: 'H+7',
          nominal: 0,
        },
      ],
      payment_due_days: 0,
      limitation_codes: ['client_hardware'],
      additional_limitations: [],
      rights_statements: [],
    },
  };
}

export function shouldPromptVariantSwitch(
  currentVariant: KioskQueueVariant,
  values?: Record<string, any> | null
): boolean {
  if (!values) return false;

  if (currentVariant === 'government_mpp') {
    const phases = values.government_scope_phases || [];
    const hasCustomPhases = phases.some(
      (p: any) =>
        p?.title &&
        p.title.trim() !== '' &&
        p.title !== 'Fase 1: Persiapan & Desain' &&
        p.title !== 'Fase 1: Persiapan & Analisis Kebutuhan'
    );
    const experts = values.expert_requirements || [];
    const hasCustomExperts =
      experts.length > 1 ||
      experts.some((e: any) => {
        if (!e?.role || e.role.trim() === '') return false;
        const isDefaultRole = e.role === 'Project Manager' && e.headcount === 1;
        const isDefaultQual =
          !e.minimum_qualification ||
          e.minimum_qualification === 'S1 Sistem Informasi' ||
          e.minimum_qualification === 'S1 Sistem Informasi / Teknik Informatika';
        return !isDefaultRole || !isDefaultQual;
      });
    const hardware = values.hardware_items || [];
    const hasHardware = hardware.length > 0;
    const payments = values.government_payment_schedule || [];
    const hasPayments = payments.some((p: any) => p?.nominal && p.nominal > 0);

    return hasCustomPhases || hasCustomExperts || hasHardware || hasPayments;
  }

  // private_food_court
  const timeline = values.private_timeline_rows || [];
  const hasTimeline = timeline.some(
    (tRow: any) =>
      tRow?.description &&
      tRow.description.trim() !== '' &&
      tRow.description !== 'Requirement Analysis & System Design' &&
      tRow.description !== 'Requirement Analysis & POS Integration'
  );
  const maintenance = values.maintenance_items || [];
  const hasMaintenance = maintenance.length > 0;
  const payments = values.private_payment_schedule || [];
  const hasPayments = payments.some((p: any) => p?.nominal && p.nominal > 0);

  return hasTimeline || hasMaintenance || hasPayments;
}

export { fieldId, isKioskQueueSubmitReady };

export type ExtractedFieldError = {
  path: string;
  message: string;
};

export function extractFieldErrors(
  errors: Record<string, any>,
  currentPath = ''
): ExtractedFieldError[] {
  const result: ExtractedFieldError[] = [];

  for (const key of Object.keys(errors)) {
    const val = errors[key];
    if (!val) continue;

    const path = currentPath ? `${currentPath}.${key}` : key;

    if (val.message && typeof val.message === 'string') {
      result.push({ path, message: val.message });
    } else if (typeof val === 'object') {
      result.push(...extractFieldErrors(val, path));
    }
  }

  return result;
}

export function getKioskQueuePayloadHash(
  payload: GenerateQuotationPayload | null | undefined
): string {
  const normalized = normalizeKioskQueuePreviewPayload(payload);
  return normalized ? JSON.stringify(normalized) : '';
}

// ----------------------------------------------------------------------
// Main Form Component
// ----------------------------------------------------------------------

type Props = {
  selectedSkill?: ActiveSkill | null;
  isSubmitting?: boolean;
  onSubmit: (payload: GenerateQuotationPayload) => void;
  onCancel: () => void;
  initialValues?: KioskQueueFormValues;
};

export function KioskQueueGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
  initialValues,
}: Props) {
  const { t } = useTranslate('quotation');
  const { data: activeSkills = [] } = useActiveSkills();
  const { data: clients = [] } = useClients();

  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [pendingVariant, setPendingVariant] = useState<KioskQueueVariant | null>(null);

  const defaultValues = useMemo(
    () =>
      initialValues ||
      createDefaultKioskQueueValues(
        new Date().toISOString().slice(0, 10),
        clients[0],
        'government_mpp'
      ),
    [clients, initialValues]
  );

  const methods = useForm<KioskQueueFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(kioskQueueFormSchema) as any,
    defaultValues,
  });

  const { control, handleSubmit, reset, setValue, setFocus, formState } = methods;
  const values = useWatch({ control });

  const prevSubmitCountRef = useRef(formState.submitCount);

  // Focus error summary on invalid submit attempt
  useEffect(() => {
    if (formState.submitCount > prevSubmitCountRef.current && !formState.isValid) {
      errorSummaryRef.current?.focus();
    }
    prevSubmitCountRef.current = formState.submitCount;
  }, [formState.isValid, formState.submitCount]);

  // Auto-populate initial client details if empty
  useEffect(() => {
    if (clients.length > 0 && !values.client_id && !values.client_company_name) {
      setValue('client_id', clients[0].id, { shouldValidate: true });
      setValue('client_company_name', clients[0].name, { shouldValidate: true });
    }
  }, [clients, setValue, values.client_company_name, values.client_id]);

  const currentVariant = values.kiosk_queue_system?.variant || 'government_mpp';

  const performVariantSwitch = (newVariant: KioskQueueVariant) => {
    const shared: KioskQueueSharedIdentity = {
      client_id: values.client_id,
      client_name: values.client_name,
      client_company_name: values.client_company_name,
      subject: values.subject,
      solution_type: values.solution_type,
      document_number: values.kiosk_queue_system?.document_number,
      system_name: values.kiosk_queue_system?.system_name,
      quotation_date: values.kiosk_queue_system?.quotation_date,
    };

    if (newVariant === 'government_mpp') {
      const nextGov = makeGovernmentDefaults(shared);
      reset(nextGov);
    } else {
      const nextPriv = makePrivateDefaults(shared);
      reset(nextPriv);
    }
  };

  const handleRequestVariantChange = (newVariant: KioskQueueVariant) => {
    if (newVariant === currentVariant) return;

    if (shouldPromptVariantSwitch(currentVariant, values.kiosk_queue_system)) {
      setPendingVariant(newVariant);
      setVariantDialogOpen(true);
    } else {
      performVariantSwitch(newVariant);
    }
  };

  const handleConfirmVariantSwitch = () => {
    if (pendingVariant) {
      performVariantSwitch(pendingVariant);
    }
    setVariantDialogOpen(false);
    setPendingVariant(null);
  };

  const handleCancelVariantSwitch = () => {
    setVariantDialogOpen(false);
    setPendingVariant(null);
  };

  // Preview payload derivation
  const previewPayload = useMemo(() => {
    const parsed = kioskQueueFormSchema.safeParse(values);
    if (!parsed.success) return null;
    return toKioskQueuePayload(parsed.data, selectedSkill, activeSkills);
  }, [activeSkills, selectedSkill, values]);

  const currentNormalizedPayloadHash = useMemo(
    () => getKioskQueuePayloadHash(previewPayload),
    [previewPayload]
  );

  const preview = useKioskQueuePreview(previewPayload, formState.isValid && !isSubmitting);

  const [previewPayloadHash, setPreviewPayloadHash] = useState('');

  useEffect(() => {
    if (preview.isSuccess && !preview.isFetching && !preview.isDebouncing) {
      setPreviewPayloadHash(currentNormalizedPayloadHash);
    }
  }, [currentNormalizedPayloadHash, preview.isDebouncing, preview.isFetching, preview.isSuccess]);

  const submitReady = isKioskQueueSubmitReady({
    isValid: formState.isValid,
    isDebouncing: preview.isDebouncing,
    isFetching: preview.isFetching,
    isSuccess: preview.isSuccess,
    isSubmitting,
    error: preview.error,
    preview: preview.data,
    previewPayloadHash,
    currentNormalizedPayloadHash,
  });

  const fieldErrors = useMemo(
    () => (formState.errors ? extractFieldErrors(formState.errors) : []),
    [formState.errors]
  );

  const submit = handleSubmit((data) => {
    if (!submitReady) return;
    onSubmit(toKioskQueuePayload(data as KioskQueueFormValues, selectedSkill, activeSkills));
  });

  return (
    <Form methods={methods} onSubmit={submit} sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Active Skill Banner */}
        <Alert
          severity="info"
          icon={<Iconify icon="solar:atom-bold-duotone" width={22} />}
          action={
            <Button color="inherit" size="small" onClick={onCancel}>
              {t('kioskQueueForm.changeCommand', 'Ganti Perintah')}
            </Button>
          }
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="subtitle2">
            {t('kioskQueueForm.activeSkillBanner', 'Skill Aktif:')}{' '}
            <strong>{selectedSkill?.command || '/quotation'}</strong> (
            {selectedSkill?.name || t('kioskQueueForm.defaultSkill', 'Kiosk & Hardware System')})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t(
              'kioskQueueForm.aiHint',
              'Kios antrian MPP pemerintah atau kiosk pemesanan mandiri swasta dengan kalkulasi PPN dan rekonsiliasi termin pembayaran.'
            )}
          </Typography>
        </Alert>

        {/* Focusable Error Summary */}
        {formState.submitCount > 0 && !formState.isValid && (
          <Box
            role="alert"
            tabIndex={-1}
            ref={errorSummaryRef}
            aria-labelledby="kiosk-error-title"
            sx={{
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: 'error.lighter',
              border: (theme) => `1px solid ${theme.palette.error.main}`,
              outline: 'none',
            }}
          >
            <Typography
              id="kiosk-error-title"
              variant="subtitle1"
              color="error.dark"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              {t('kioskQueueForm.errors.title', 'Periksa kembali data quotation')}
            </Typography>
            <Stack spacing={0.75}>
              {fieldErrors.map((error) => (
                <Link
                  key={error.path}
                  href={`#${fieldId(error.path)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setFocus(error.path as any);
                  }}
                  variant="body2"
                  color="error.dark"
                  sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {error.message}
                </Link>
              ))}
            </Stack>
          </Box>
        )}

        {/* 1. Identitas Proyek & Varian */}
        <Card data-testid="kiosk-queue-card-identity">
          <CardHeader
            title={t('kioskQueueForm.identityTitle', '1. Identitas Quotation & Varian')}
            subheader={t(
              'kioskQueueForm.identitySubtitle',
              'Pemilihan varian sistem, nomor dokumen resmi, sistem yang ditawarkan, dan informasi klien'
            )}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              {/* Variant Selector */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  {t('kioskQueueForm.variant.label', 'Pilihan Varian Sistem')}
                </Typography>
                <RadioGroup
                  row
                  value={currentVariant}
                  onChange={(e) => handleRequestVariantChange(e.target.value as KioskQueueVariant)}
                >
                  <FormControlLabel
                    value="government_mpp"
                    control={<Radio />}
                    label={t('kioskQueueForm.variant.government', 'Instansi Pemerintah / MPP')}
                    disabled={isSubmitting}
                  />
                  <FormControlLabel
                    value="private_food_court"
                    control={<Radio />}
                    label={t('kioskQueueForm.variant.private', 'Korporasi Swasta / Food Court')}
                    disabled={isSubmitting}
                  />
                </RadioGroup>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  id={fieldId('kiosk_queue_system.document_number')}
                  name="kiosk_queue_system.document_number"
                  label={t('kioskQueueForm.documentNumber', 'Nomor Dokumen')}
                  placeholder={
                    currentVariant === 'government_mpp'
                      ? 'contoh: LANDA/MPP-Antrian/0926/001'
                      : 'contoh: 042/Q-VENTURO/IX/2026'
                  }
                  helperText={
                    currentVariant === 'government_mpp'
                      ? t(
                          'kioskQueueForm.documentNumberHelperGov',
                          'Format resmi: LANDA/MPP-Antrian/MMYY/NNN'
                        )
                      : undefined
                  }
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  id={fieldId('kiosk_queue_system.quotation_date')}
                  name="kiosk_queue_system.quotation_date"
                  label={t('kioskQueueForm.quotationDate', 'Tanggal Quotation')}
                  type="date"
                  disabled={isSubmitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  id={fieldId('client_company_name')}
                  name="client_company_name"
                  label={t('kioskQueueForm.clientCompany', 'Instansi / Perusahaan Klien')}
                  placeholder="Nama instansi atau perusahaan klien..."
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  id={fieldId('client_name')}
                  name="client_name"
                  label={t('kioskQueueForm.clientName', 'Pejabat Penanggung Jawab / PIC')}
                  placeholder="Nama pejabat atau penanggung jawab..."
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  id={fieldId('kiosk_queue_system.system_name')}
                  name="kiosk_queue_system.system_name"
                  label={t('kioskQueueForm.systemName', 'Nama Sistem Kiosk')}
                  placeholder="contoh: Sistem Antrian Terpadu MPP Kab. Malang"
                  disabled={isSubmitting}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <RHFSelect
                  id={fieldId('solution_type')}
                  name="solution_type"
                  label={t('kioskQueueForm.solutionType', 'Tipe Solusi')}
                  disabled={isSubmitting}
                >
                  {SOLUTION_TYPES.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <RHFTextField
                  id={fieldId('subject')}
                  name="subject"
                  label={t('kioskQueueForm.subject', 'Perihal Penawaran')}
                  placeholder="contoh: Penawaran Pengadaan Sistem Antrian Terpadu MPP"
                  disabled={isSubmitting}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 2. Kepemilikan Hardware dan Pajak */}
        <Card data-testid="kiosk-queue-card-hardware-tax">
          <CardHeader
            title={t(
              'kioskQueueForm.hardwareTaxTitle',
              '2. Kepemilikan Hardware & Perlakuan Pajak'
            )}
            subheader={t(
              'kioskQueueForm.hardwareTaxSubtitle',
              'Ketentuan penyediaan perangkat keras dan skema perpajakan sesuai varian'
            )}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              {/* Hardware Provision */}
              <Grid size={{ xs: 12, md: 6 }}>
                {currentVariant === 'government_mpp' ? (
                  <RHFSelect
                    name="kiosk_queue_system.hardware_provision"
                    label={t('kioskQueueForm.hardware.label', 'Penyediaan Perangkat Keras')}
                    helperText={t(
                      'kioskQueueForm.hardware.helperGov',
                      'Pemerintah dapat memilih apakah perangkat disediakan Venturo atau klien.'
                    )}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="venturo_supplied">
                      {t('kioskQueueForm.hardware.venturo', 'Perangkat disediakan Venturo')}
                    </MenuItem>
                    <MenuItem value="client_supplied">
                      {t('kioskQueueForm.hardware.client', 'Perangkat disediakan klien')}
                    </MenuItem>
                  </RHFSelect>
                ) : (
                  <RHFTextField
                    name="kiosk_queue_system.hardware_provision"
                    label={t('kioskQueueForm.hardware.label', 'Penyediaan Perangkat Keras')}
                    value={t('kioskQueueForm.hardware.client', 'Perangkat disediakan klien')}
                    helperText={t(
                      'kioskQueueForm.hardware.helperPrivate',
                      'Varian swasta mengharuskan perangkat disediakan oleh klien.'
                    )}
                    disabled
                  />
                )}
              </Grid>

              {/* Tax Treatment */}
              <Grid size={{ xs: 12, md: 6 }}>
                {currentVariant === 'government_mpp' ? (
                  <RHFTextField
                    name="kiosk_queue_system.tax_treatment"
                    label={t('kioskQueueForm.tax.label', 'Perlakuan Pajak')}
                    value={t('kioskQueueForm.tax.inclusive', 'Sudah Termasuk PPN 11%')}
                    helperText={t(
                      'kioskQueueForm.tax.helperGov',
                      'Sesuai regulasi pengadaan pemerintah, nilai penawaran sudah termasuk PPN 11%.'
                    )}
                    disabled
                  />
                ) : (
                  <RHFTextField
                    name="kiosk_queue_system.tax_treatment"
                    label={t('kioskQueueForm.tax.label', 'Perlakuan Pajak')}
                    value={t('kioskQueueForm.tax.exclusive', 'Belum Termasuk PPN')}
                    helperText={t(
                      'kioskQueueForm.tax.helperPrivate',
                      'Penawaran korporasi swasta belum termasuk PPN.'
                    )}
                    disabled
                  />
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 3. Scope of Work */}
        <KioskQueueScopeEditor disabled={isSubmitting} />

        {/* 4. Biaya & Anggaran */}
        <KioskQueueCostEditor disabled={isSubmitting} />

        {/* 5. Pembayaran dan Batasan */}
        <KioskQueuePaymentLegalEditor disabled={isSubmitting} />

        {/* 6. Preview Authoritative dan Submit */}
        <KioskQueuePreview
          preview={preview.data}
          isLoading={preview.isLoading}
          isDebouncing={preview.isDebouncing}
          error={preview.error}
          onRetry={() => preview.refetch()}
          previewReady={submitReady}
        />

        {/* Submit Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
            {t('kioskQueueForm.cancel', 'Batal')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={!submitReady || isSubmitting}
            startIcon={
              isSubmitting ? (
                <Iconify icon="solar:restart-bold" />
              ) : (
                <Iconify icon="solar:document-text-bold" />
              )
            }
          >
            {isSubmitting
              ? t('kioskQueueForm.submitting', 'Membuat Quotation...')
              : t('kioskQueueForm.submit', 'Buat Draf Quotation')}
          </Button>
        </Box>
      </Stack>

      {/* Confirmation Dialog on Variant Switch */}
      <Dialog
        open={variantDialogOpen}
        onClose={handleCancelVariantSwitch}
        aria-labelledby="variant-switch-dialog-title"
      >
        <DialogTitle id="variant-switch-dialog-title">
          {t('kioskQueueForm.variantDialog.title', 'Ganti Varian Quotation?')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              'kioskQueueForm.variantDialog.message',
              'Mengganti varian akan menghapus baris data khusus varian yang sedang aktif. Apakah Anda yakin ingin melanjutkan?'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelVariantSwitch} color="inherit">
            {t('kioskQueueForm.variantDialog.cancel', 'Batal')}
          </Button>
          <Button onClick={handleConfirmVariantSwitch} color="warning" variant="contained">
            {t('kioskQueueForm.variantDialog.confirm', 'Lanjutkan Ganti Varian')}
          </Button>
        </DialogActions>
      </Dialog>
    </Form>
  );
}

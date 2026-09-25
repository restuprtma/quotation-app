import type { WhiteLabelFormValues } from './white-label-form-model';
import type { ActiveSkill, GenerateQuotationPayload } from '../types';
import type { QuotationEntryIdentity } from '../types/quotation-entry';

import { useRef, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applyEntryIdentityToSchemeDefaults } from '../utils/quotation-entry-state';
import { useEntryIdentityBridge } from '../hooks/use-entry-identity-bridge';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Form, RHFSelect, RHFTextField } from 'src/shared/ui/hook-form';

import { useClients } from '../hooks/use-clients';
import { WhiteLabelPreview } from './white-label-preview';
import { SOLUTION_TYPES } from '../constants/scope-presets';
import { useActiveSkills } from '../hooks/use-active-skills';
import { whiteLabelFormSchema } from './white-label-form-model';
import { WhiteLabelScopeEditor } from './white-label-scope-editor';
import { WhiteLabelLicenseEditor } from './white-label-license-editor';
import { WhiteLabelServiceEditor } from './white-label-service-editor';
import { useWhiteLabelPreview } from '../hooks/use-quotation-generation';
import { WhiteLabelPaymentRightsEditor } from './white-label-payment-rights-editor';
import {
  toWhiteLabelPayload,
  createDefaultWhiteLabelValues,
  calculateWhiteLabelDraftTotals,
} from '../constants/white-label';

// ----------------------------------------------------------------------

type Props = {
  selectedSkill?: ActiveSkill | null;
  isSubmitting?: boolean;
  onSubmit: (payload: GenerateQuotationPayload) => void;
  onCancel: () => void;
  entryIdentity?: QuotationEntryIdentity;
  onEntryIdentityChange?: (identity: QuotationEntryIdentity) => void;
};

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function WhiteLabelGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
  entryIdentity,
  onEntryIdentityChange,
}: Props) {
  const { t } = useTranslate('quotation');
  const { data: activeSkills = [] } = useActiveSkills();
  const { data: clients = [] } = useClients();

  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const defaultValues = useMemo(
    () =>
      applyEntryIdentityToSchemeDefaults(
        createDefaultWhiteLabelValues(toISODate(new Date())),
        entryIdentity ?? ({} as any)
      ),
    [entryIdentity]
  );

  const methods = useForm<WhiteLabelFormValues>({
    resolver: zodResolver(whiteLabelFormSchema) as any,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { control, handleSubmit, setValue, formState } = methods;
  useEntryIdentityBridge({ control, onChange: onEntryIdentityChange });
  const values = useWatch({ control });

  const prevSubmitCountRef = useRef(formState.submitCount);

  // Focus error summary on invalid submit attempt
  useEffect(() => {
    if (formState.submitCount > prevSubmitCountRef.current && !formState.isValid) {
      errorSummaryRef.current?.focus();
    }
    prevSubmitCountRef.current = formState.submitCount;
  }, [formState.submitCount, formState.isValid]);

  // Preview payload derivation
  const previewPayload = useMemo(() => {
    const parsed = whiteLabelFormSchema.safeParse(values);
    if (!parsed.success) return null;
    return toWhiteLabelPayload(parsed.data, selectedSkill, activeSkills);
  }, [activeSkills, selectedSkill, values]);

  const preview = useWhiteLabelPreview(previewPayload, formState.isValid && !isSubmitting);

  const draftTotals = useMemo(() => {
    if (!values.white_label) return null;
    const wl = values.white_label;
    return calculateWhiteLabelDraftTotals({
      product_name: wl.product_name || '',
      quotation_date: wl.quotation_date || '',
      tax_treatment: wl.tax_treatment || 'not_stated',
      license_items: (wl.license_items || []).filter(Boolean).map((i) => ({
        name: i?.name || '',
        unit_rate: Number(i?.unit_rate) || 0,
        quantity: Number(i?.quantity) || 0,
      })),
      maintenance_items: (wl.maintenance_items || []).filter(Boolean).map((m) => ({
        name: m?.name || '',
        monthly_rate: Number(m?.monthly_rate) || 0,
        fte_quarters: Number(m?.fte_quarters) || 2,
        period_months: Number(m?.period_months) || 0,
      })),
      hosting_items: (wl.hosting_items || []).filter(Boolean).map((h) => ({
        name: h?.name || '',
        monthly_rate: Number(h?.monthly_rate) || 0,
        quantity: Number(h?.quantity) || 0,
        period_months: Number(h?.period_months) || 0,
      })),
      module_groups: (wl.module_groups || []).filter(Boolean).map((g) => ({
        name: g?.name || '',
        features: (g?.features || []).filter(Boolean) as string[],
      })),
      timeline_rows: (wl.timeline_rows || []).filter(Boolean).map((row) => ({
        description: row?.description || '',
        timeline: row?.timeline || '',
      })),
      payment_schedule: (wl.payment_schedule || []).filter(Boolean).map((p) => ({
        work_period: p?.work_period || '',
        terms: p?.terms || '',
        invoice_date_label: p?.invoice_date_label || '',
        due_date_label: p?.due_date_label || '',
        component: p?.component || 'license',
        nominal: Number(p?.nominal) || 0,
      })),
      rights_statements: (wl.rights_statements || []).filter(Boolean) as string[],
      limitation_codes: (wl.limitation_codes || []).filter(Boolean) as any,
    });
  }, [values.white_label]);

  const previewReady = Boolean(
    preview.data &&
    !preview.isFetching &&
    !preview.isDebouncing &&
    !preview.error &&
    draftTotals?.is_balanced
  );

  const submit = handleSubmit((data) => {
    if (!previewReady) return;
    onSubmit(toWhiteLabelPayload(data as WhiteLabelFormValues, selectedSkill, activeSkills));
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
              {t('whiteLabelForm.changeCommand')}
            </Button>
          }
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="subtitle2">
            {t('whiteLabelForm.activeSkillBanner')}{' '}
            <strong>{selectedSkill?.command || '/quotation'}</strong> (
            {selectedSkill?.name || t('whiteLabelForm.defaultSkill')})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('whiteLabelForm.aiHint')}
          </Typography>
        </Alert>

        {/* Focusable Error Summary */}
        {formState.submitCount > 0 && !formState.isValid && (
          <Alert
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            severity="error"
            sx={{ outline: 'none' }}
          >
            <AlertTitle>{t('whiteLabelForm.validationTitle')}</AlertTitle>
            {t('whiteLabelForm.validationBody')}
          </Alert>
        )}

        {/* 1. Identitas Quotation */}
        <Card>
          <CardHeader
            title={t('whiteLabelForm.identityTitle')}
            subheader={t('whiteLabelForm.identitySubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="subject"
                  label={t('whiteLabelForm.subject')}
                  placeholder={t('whiteLabelForm.subjectPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFSelect
                  name="solution_type"
                  label={t('whiteLabelForm.solutionType')}
                  disabled={isSubmitting}
                >
                  {SOLUTION_TYPES.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_company_name"
                  label={t('whiteLabelForm.clientCompany')}
                  placeholder={t('whiteLabelForm.clientCompanyPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_name"
                  label={t('whiteLabelForm.clientName')}
                  placeholder={t('whiteLabelForm.clientNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="white_label.product_name"
                  label={t('whiteLabelForm.productName')}
                  placeholder={t('whiteLabelForm.productNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFTextField
                  name="white_label.quotation_date"
                  label={t('whiteLabelForm.quotationDate')}
                  type="date"
                  disabled={isSubmitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 2. Lisensi Software */}
        <WhiteLabelLicenseEditor disabled={isSubmitting} />

        {/* 3. Maintenance & Hosting (Opsional) */}
        <WhiteLabelServiceEditor disabled={isSubmitting} />

        {/* 4. Modul & Timeline (Opsional) */}
        <WhiteLabelScopeEditor disabled={isSubmitting} />

        {/* 5. Pembayaran, Pajak, Batasan & Hak Lisensi */}
        <WhiteLabelPaymentRightsEditor disabled={isSubmitting} />

        {/* 6. Preview Backend Authoritative */}
        <WhiteLabelPreview
          preview={preview.data}
          isLoading={preview.isFetching}
          isDebouncing={preview.isDebouncing}
          error={preview.error}
        />

        {/* Form Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1, pb: 4 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
            {t('whiteLabelForm.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !formState.isValid || !previewReady}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="solar:atom-bold-duotone" />
              )
            }
          >
            {isSubmitting ? t('whiteLabelForm.submitting') : t('whiteLabelForm.submit')}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

import type { ActiveSkill, GenerateQuotationPayload } from '../types';
import type { CustomDevelopmentFormValues } from './custom-development-form-model';

import { useRef, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
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
import { SOLUTION_TYPES } from '../constants/scope-presets';
import { useActiveSkills } from '../hooks/use-active-skills';
import { customDevelopmentFormSchema } from './custom-development-form-model';
import { CustomDevelopmentCostEditor } from './custom-development-cost-editor';
import { useCustomDevelopmentPreview } from '../hooks/use-quotation-generation';
import { CustomDevelopmentScopeEditor } from './custom-development-scope-editor';
import { CustomDevelopmentMonthlyEditor } from './custom-development-monthly-editor';
import { CustomDevelopmentPaymentLegalEditor } from './custom-development-payment-legal-editor';
import {
  CustomDevelopmentPreview,
  isCustomDevelopmentSubmitReady,
} from './custom-development-preview';
import {
  toCustomDevelopmentPayload,
  createDefaultCustomDevelopmentValues,
  calculateCustomDevelopmentDraftTotals,
} from '../constants/custom-development';

// Re-export submit-ready check for consumers and tests
export { isCustomDevelopmentSubmitReady };

// ----------------------------------------------------------------------

function getFirstErrorMessage(
  errors: Record<string, any>
): { field: string; message: string } | null {
  for (const key of Object.keys(errors)) {
    const val = errors[key];
    if (!val) continue;
    if (val.message && typeof val.message === 'string') {
      return { field: key, message: val.message };
    }
    if (typeof val === 'object') {
      const nested = getFirstErrorMessage(val);
      if (nested) {
        return { field: `${key}.${nested.field}`, message: nested.message };
      }
    }
  }
  return null;
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type Props = {
  selectedSkill?: ActiveSkill | null;
  isSubmitting?: boolean;
  onSubmit: (payload: GenerateQuotationPayload) => void;
  onCancel: () => void;
};

export function CustomDevelopmentGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslate('quotation');
  const { data: activeSkills = [] } = useActiveSkills();
  const { data: clients = [] } = useClients();

  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const defaultValues = useMemo(
    () => createDefaultCustomDevelopmentValues(toISODate(new Date()), clients[0]),
    [clients]
  );

  const methods = useForm<CustomDevelopmentFormValues>({
    resolver: zodResolver(customDevelopmentFormSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues,
  });

  const { control, handleSubmit, setValue, setFocus, formState } = methods;
  const values = useWatch({ control });

  const prevSubmitCountRef = useRef(formState.submitCount);

  // Focus error summary on invalid submit attempt
  useEffect(() => {
    if (formState.submitCount > prevSubmitCountRef.current && !formState.isValid) {
      errorSummaryRef.current?.focus();
    }
    prevSubmitCountRef.current = formState.submitCount;
  }, [formState.submitCount, formState.isValid]);

  // Auto-populate initial client details if empty
  useEffect(() => {
    if (clients.length > 0 && !values.client_id && !values.client_company_name) {
      setValue('client_id', clients[0].id, { shouldValidate: true });
      setValue('client_company_name', clients[0].name, { shouldValidate: true });
    }
  }, [clients, setValue, values.client_company_name, values.client_id]);

  // Preview payload derivation
  const previewPayload = useMemo(() => {
    if (!values.custom_development?.system_name) return null;
    try {
      return toCustomDevelopmentPayload(
        values as CustomDevelopmentFormValues,
        selectedSkill,
        activeSkills
      );
    } catch {
      return null;
    }
  }, [activeSkills, selectedSkill, values]);

  const preview = useCustomDevelopmentPreview(
    previewPayload,
    Boolean(values.custom_development?.system_name) && !isSubmitting
  );

  const draftTotals = useMemo(() => {
    if (!values.custom_development) return null;
    const cd = values.custom_development;
    return calculateCustomDevelopmentDraftTotals({
      development_groups: (cd.development_groups || []).filter(Boolean).map((g) => ({
        title: g.title || '',
        items: (g.items || []).filter(Boolean).map((item) => ({
          name: item.name || '',
          display_rate: item.display_rate ?? null,
          headcount: Number(item.headcount) || 1,
          period_label: item.period_label || '',
          quoted_line_total:
            item.quoted_line_total !== null && item.quoted_line_total !== undefined
              ? Number(item.quoted_line_total)
              : null,
        })),
      })),
      discount_amount: Number(cd.discount_amount) || 0,
      monthly_items: (cd.monthly_items || []).filter(Boolean).map((m) => ({
        name: m.name || '',
        specification: m.specification || '',
        unit_rate: Number(m.unit_rate) || 0,
        quantity: Number(m.quantity) || 1,
      })),
      payment_schedule: (cd.payment_schedule || []).filter(Boolean).map((p) => ({
        work_period: p.work_period || '',
        terms: p.terms || '',
        invoice_date_label: p.invoice_date_label || '',
        due_date_label: p.due_date_label || '',
        component: p.component || 'development',
        nominal: Number(p.nominal) || 0,
      })),
    });
  }, [values.custom_development]);

  const submitReady = isCustomDevelopmentSubmitReady({
    isValid: formState.isValid,
    isDebouncing: preview.isDebouncing,
    isFetching: preview.isFetching,
    error: preview.error,
    preview: preview.data,
    draftTotals,
  });

  const firstError = useMemo(
    () => (formState.errors ? getFirstErrorMessage(formState.errors) : null),
    [formState.errors]
  );

  const handleFocusFirstError = () => {
    if (firstError?.field) {
      setFocus(firstError.field as any);
    }
  };

  const moduleCount = (values.custom_development?.module_groups || []).length;
  const timelineCount = (values.custom_development?.timeline_rows || []).length;

  const submit = handleSubmit((data) => {
    if (!submitReady) return;
    onSubmit(
      toCustomDevelopmentPayload(data as CustomDevelopmentFormValues, selectedSkill, activeSkills)
    );
  });

  return (
    <Form methods={methods} onSubmit={submit} sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* Active Skill Banner */}
        <Alert
          severity="info"
          icon={<Iconify icon="solar:code-square-bold-duotone" width={22} />}
          action={
            <Button color="inherit" size="small" onClick={onCancel}>
              {t('customDevelopmentForm.changeCommand')}
            </Button>
          }
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="subtitle2">
            {t('customDevelopmentForm.activeSkillBanner')}{' '}
            <strong>{selectedSkill?.command || '/quotation'}</strong> (
            {selectedSkill?.name || t('customDevelopmentForm.defaultSkill')})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('customDevelopmentForm.aiHint')}
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
            action={
              firstError ? (
                <Button color="inherit" size="small" onClick={handleFocusFirstError}>
                  {t('customDevelopmentForm.focusFirstError', {
                    message: firstError.message,
                  })}
                </Button>
              ) : undefined
            }
          >
            <AlertTitle>{t('customDevelopmentForm.validationTitle')}</AlertTitle>
            {t('customDevelopmentForm.validationBody')}
          </Alert>
        )}

        {/* 1. Identitas Proyek */}
        <Card>
          <CardHeader
            title={t('customDevelopmentForm.identityTitle')}
            subheader={t('customDevelopmentForm.identitySubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="subject"
                  label={t('customDevelopmentForm.subject')}
                  placeholder={t('customDevelopmentForm.subjectPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFSelect
                  name="solution_type"
                  label={t('customDevelopmentForm.solutionType')}
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
                  label={t('customDevelopmentForm.clientCompany')}
                  placeholder={t('customDevelopmentForm.clientCompanyPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_name"
                  label={t('customDevelopmentForm.clientName')}
                  placeholder={t('customDevelopmentForm.clientNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="custom_development.system_name"
                  label={t('customDevelopmentForm.systemName')}
                  placeholder={t('customDevelopmentForm.systemNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFTextField
                  name="custom_development.quotation_date"
                  label={t('customDevelopmentForm.quotationDate')}
                  type="date"
                  disabled={isSubmitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 2. Biaya Development */}
        <CustomDevelopmentCostEditor disabled={isSubmitting} />

        {/* 3. Biaya Monthly */}
        <CustomDevelopmentMonthlyEditor disabled={isSubmitting} />

        {/* 4. Modul & Timeline */}
        <CustomDevelopmentScopeEditor disabled={isSubmitting} />

        {/* 5. Pembayaran, Pajak, Batasan, Hak Cipta */}
        <CustomDevelopmentPaymentLegalEditor disabled={isSubmitting} />

        {/* 6. Authoritative Preview */}
        <Box aria-live="polite">
          <CustomDevelopmentPreview
            preview={preview.data}
            isLoading={preview.isFetching}
            isDebouncing={preview.isDebouncing}
            error={preview.error}
            moduleCount={moduleCount}
            timelineCount={timelineCount}
          />
        </Box>

        {/* Form Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1, pb: 4 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
            {t('customDevelopmentForm.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !submitReady}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="solar:atom-bold-duotone" />
              )
            }
          >
            {isSubmitting
              ? t('customDevelopmentForm.submitting')
              : t('customDevelopmentForm.submit')}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

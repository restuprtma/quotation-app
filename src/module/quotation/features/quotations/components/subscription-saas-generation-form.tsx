import type { ActiveSkill, GenerateQuotationPayload } from '../types';
import type { QuotationEntryIdentity } from '../types/quotation-entry';
import type { SubscriptionSaaSFormValues } from './subscription-saas-form-model';

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
import { Form, RHFSelect, RHFSwitch, RHFTextField } from 'src/shared/ui/hook-form';

import { useClients } from '../hooks/use-clients';
import { SOLUTION_TYPES } from '../constants/scope-presets';
import { useActiveSkills } from '../hooks/use-active-skills';
import { SubscriptionSaaSPreview } from './subscription-saas-preview';
import { SubscriptionRightsPanel } from './subscription-rights-panel';
import { SubscriptionFeatureEditor } from './subscription-feature-editor';
import { subscriptionSaaSFormSchema } from './subscription-saas-form-model';
import { useSubscriptionSaaSPreview } from '../hooks/use-quotation-generation';
import { SubscriptionPricingPeriodEditor } from './subscription-pricing-period-editor';
import { SubscriptionPaymentScheduleEditor } from './subscription-payment-schedule-editor';
import {
  BILLING_CYCLE_OPTIONS,
  TAX_TREATMENT_OPTIONS,
  SECTION_LAYOUT_OPTIONS,
  toSubscriptionSaaSPayload,
  syncFeatureGroupsForLayout,
  createDefaultSubscriptionSaaSValues,
} from '../constants/subscription-saas';

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

export function SubscriptionSaaSGenerationForm({
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
        createDefaultSubscriptionSaaSValues(toISODate(new Date())),
        entryIdentity ?? ({} as any)
      ),
    [entryIdentity]
  );

  const methods = useForm<SubscriptionSaaSFormValues>({
    resolver: zodResolver(subscriptionSaaSFormSchema),
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

  const sectionLayout = values.subscription_saas?.section_layout || 'subscription_development';

  // Keep feature groups synced when section layout changes
  useEffect(() => {
    const rawGroups = values.subscription_saas?.feature_groups || [];
    const currentGroups = rawGroups.filter((g): g is { name: string; features: string[] } =>
      Boolean(g?.name && Array.isArray(g?.features))
    );
    const synced = syncFeatureGroupsForLayout(sectionLayout, currentGroups);
    if (synced.length !== currentGroups.length) {
      setValue('subscription_saas.feature_groups', synced, { shouldValidate: true });
    }
  }, [sectionLayout, setValue, values.subscription_saas?.feature_groups]);

  // Preview payload derivation
  const previewPayload = useMemo(() => {
    const parsed = subscriptionSaaSFormSchema.safeParse(values);
    if (!parsed.success) return null;
    return toSubscriptionSaaSPayload(parsed.data, selectedSkill, activeSkills);
  }, [activeSkills, selectedSkill, values]);

  const preview = useSubscriptionSaaSPreview(previewPayload, formState.isValid && !isSubmitting);
  const previewReady = Boolean(
    preview.data && !preview.isFetching && !preview.isDebouncing && !preview.error
  );

  const submit = handleSubmit((data) => {
    if (!previewReady) return;
    onSubmit(toSubscriptionSaaSPayload(data, selectedSkill, activeSkills));
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
              {t('subscriptionSaaSForm.changeCommand')}
            </Button>
          }
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="subtitle2">
            {t('subscriptionSaaSForm.activeSkillBanner')}{' '}
            <strong>{selectedSkill?.command || '/quotation'}</strong> (
            {selectedSkill?.name || t('subscriptionSaaSForm.defaultSkill')})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('subscriptionSaaSForm.aiHint')}
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
            <AlertTitle>{t('subscriptionSaaSForm.validationTitle')}</AlertTitle>
            {t('subscriptionSaaSForm.validationBody')}
          </Alert>
        )}

        {/* 1. Identitas Quotation */}
        <Card>
          <CardHeader
            title={t('subscriptionSaaSForm.identityTitle')}
            subheader={t('subscriptionSaaSForm.identitySubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="subject"
                  label={t('subscriptionSaaSForm.subject')}
                  placeholder={t('subscriptionSaaSForm.subjectPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFSelect
                  name="solution_type"
                  label={t('subscriptionSaaSForm.solutionType')}
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
                  label={t('subscriptionSaaSForm.clientCompany')}
                  placeholder={t('subscriptionSaaSForm.clientCompanyPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_name"
                  label={t('subscriptionSaaSForm.clientName')}
                  placeholder={t('subscriptionSaaSForm.clientNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="subscription_saas.product_name"
                  label={t('subscriptionSaaSForm.productName')}
                  placeholder={t('subscriptionSaaSForm.productNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFTextField
                  name="subscription_saas.quotation_date"
                  label={t('subscriptionSaaSForm.quotationDate')}
                  type="date"
                  disabled={isSubmitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 2. Struktur Layanan */}
        <Card>
          <CardHeader
            title={t('subscriptionSaaSForm.structureTitle')}
            subheader={t('subscriptionSaaSForm.structureSubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect
                  name="subscription_saas.section_layout"
                  label={t('subscriptionSaaSForm.sectionLayout')}
                  disabled={isSubmitting}
                >
                  {SECTION_LAYOUT_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect
                  name="subscription_saas.billing_cycle"
                  label={t('subscriptionSaaSForm.billingCycle')}
                  disabled={isSubmitting}
                >
                  {BILLING_CYCLE_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect
                  name="subscription_saas.tax_treatment"
                  label={t('subscriptionSaaSForm.taxTreatment')}
                  disabled={isSubmitting}
                >
                  {TAX_TREATMENT_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="subscription_saas.initial_term_months"
                  label={t('subscriptionSaaSForm.initialTerm')}
                  type="number"
                  disabled={isSubmitting}
                  slotProps={{
                    htmlInput: { min: 1, max: 60, step: 1 },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <RHFSwitch
                  name="subscription_saas.auto_renewal"
                  label={t('subscriptionSaaSForm.autoRenewal')}
                  disabled={isSubmitting}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', pl: 6 }}
                >
                  {t('subscriptionSaaSForm.autoRenewalHelper')}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 3. Harga: Price Periods dan One-time Items */}
        <SubscriptionPricingPeriodEditor disabled={isSubmitting} />

        {/* 4. Payment Schedule */}
        <SubscriptionPaymentScheduleEditor disabled={isSubmitting} />

        {/* 5. List Features (Hanya ketika layout development_maintenance) */}
        {sectionLayout === 'development_maintenance' && (
          <SubscriptionFeatureEditor disabled={isSubmitting} />
        )}

        {/* 6. Hak Para Pihak & Kemitraan (Collapsed by default) */}
        <SubscriptionRightsPanel disabled={isSubmitting} />

        {/* 7. Preview Backend Authoritative */}
        <SubscriptionSaaSPreview
          preview={preview.data}
          isLoading={preview.isFetching}
          isDebouncing={preview.isDebouncing}
          error={preview.error}
        />

        {/* Form Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1, pb: 4 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
            {t('subscriptionSaaSForm.cancel')}
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
            {isSubmitting ? t('subscriptionSaaSForm.submitting') : t('subscriptionSaaSForm.submit')}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

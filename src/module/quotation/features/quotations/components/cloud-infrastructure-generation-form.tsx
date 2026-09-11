import type { Resolver, FieldPath } from 'react-hook-form';
import type { ActiveSkill, GenerateQuotationPayload } from '../types';
import type { CloudInfrastructureFormValues } from './cloud-infrastructure-form-model';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { Form, RHFSelect } from 'src/shared/ui/hook-form';

import { useClients } from '../hooks/use-clients';
import { CloudScopeEditor } from './cloud-scope-editor';
import { CloudPackageEditor } from './cloud-package-editor';
import { useActiveSkills } from '../hooks/use-active-skills';
import { resolveQuotationSkillId } from '../utils/generation';
import { CloudFormField as RHFTextField } from './cloud-form-field';
import { useActiveRateCards } from '../hooks/use-active-rate-cards';
import { CloudPaymentLegalEditor } from './cloud-payment-legal-editor';
import { useRateCardDetail } from '../../rate-cards/hooks/use-rate-cards';
import { CloudInfrastructurePreview } from './cloud-infrastructure-preview';
import { useCloudInfrastructurePreview } from '../hooks/use-quotation-generation';
import { cloudInfrastructureFormSchema } from './cloud-infrastructure-form-model';
import {
  normalizeCloudInfrastructure,
  makeDefaultCloudInfrastructureValues,
} from '../constants/cloud-infrastructure';

type Props = {
  selectedSkill?: ActiveSkill | null;
  isSubmitting?: boolean;
  onSubmit: (payload: GenerateQuotationPayload) => void;
  onCancel: () => void;
};

export function CloudInfrastructureGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslate('quotation');
  const { data: activeSkills = [] } = useActiveSkills();
  const { data: clients = [] } = useClients();
  const { data: rateCards = [] } = useActiveRateCards();
  const [selectedRateCardID, setSelectedRateCardID] = useState('');
  const selectedRateCardQuery = useRateCardDetail(selectedRateCardID);
  const errorRef = useRef<HTMLDivElement>(null);
  const [showErrors, setShowErrors] = useState(false);
  const defaultValues = useMemo<CloudInfrastructureFormValues>(() => {
    const initial = makeDefaultCloudInfrastructureValues();
    return {
      client_id: '',
      client_name: '',
      client_company_name: '',
      subject: initial.subject,
      solution_type: 'cloud_infrastructure',
      commercial_scheme: 'cloud_infrastructure',
      cloud_infrastructure: {
        ...initial.cloud_infrastructure,
        package_items: [
          { category: 'vps_cloud', name: '', vcpu: 1, ram_gb: 1, storage_gb: 1, unit_rate: 1 },
        ],
        payment_schedule: [
          {
            work_period: '',
            terms: '',
            invoice_date_label: '',
            due_date_label: '',
            component: 'monthly_service',
            nominal: 1,
          },
        ],
        setup_items: [],
        scope_rows: [],
        additional_limitations: [],
      },
    };
  }, []);
  const methods = useForm<CloudInfrastructureFormValues>({
    resolver: zodResolver(cloudInfrastructureFormSchema) as Resolver<CloudInfrastructureFormValues>,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { control, register, handleSubmit, setFocus, setValue, formState } = methods;
  const values = useWatch({ control });

  useEffect(() => {
    if (clients.length > 0 && !values.client_id && !values.client_company_name) {
      setValue('client_id', clients[0].id, { shouldValidate: true });
      setValue('client_company_name', clients[0].name, { shouldValidate: true });
    }
  }, [clients, setValue, values.client_company_name, values.client_id]);

  const parsed = useMemo(() => cloudInfrastructureFormSchema.safeParse(values), [values]);
  const payload = useMemo<GenerateQuotationPayload | null>(() => {
    if (!parsed.success) return null;
    return {
      ...parsed.data,
      client_id: parsed.data.client_id || undefined,
      skill_id: resolveQuotationSkillId(selectedSkill, activeSkills),
      cloud_infrastructure: normalizeCloudInfrastructure(parsed.data.cloud_infrastructure),
    };
  }, [activeSkills, selectedSkill, parsed]);
  const preview = useCloudInfrastructurePreview(payload, Boolean(payload) && !isSubmitting);
  const canSubmit = Boolean(
    payload && formState.isValid &&
    preview.isSuccess &&
    !preview.isFetching &&
    !preview.isDebouncing &&
    preview.successfulFingerprint === preview.currentFingerprint
  );

  useEffect(() => {
    if (showErrors) errorRef.current?.focus();
  }, [showErrors, formState.submitCount]);

  const submit = handleSubmit((data) => {
    if (!canSubmit) return;
    onSubmit({
      ...data,
      client_id: data.client_id || undefined,
      skill_id: resolveQuotationSkillId(selectedSkill, activeSkills),
      cloud_infrastructure: normalizeCloudInfrastructure(data.cloud_infrastructure),
    });
  });

  return (
    <Form methods={methods} onSubmit={submit} sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={3}>
        {showErrors && !parsed.success && (
          <Alert ref={errorRef} tabIndex={-1} role="alert" aria-label={t('cloudInfrastructure.validation.title')} severity="error">
            {t('cloudInfrastructure.validation.title')}
            <Stack>{parsed.error.issues.map((issue, index) => <Button key={`${issue.path.join('.')}-${index}`} component="a" href={`#${issue.path.join('.')}`} sx={{ minHeight: 44 }} onClick={(event) => { event.preventDefault(); const path = issue.path.join('.'); const element = document.getElementById(path); if (element) element.focus(); else setFocus(path as FieldPath<CloudInfrastructureFormValues>); }}>{t('cloudInfrastructure.validation.focus')} {index + 1}</Button>)}</Stack>
          </Alert>
        )}
        <Card>
          <CardHeader title={t('cloudInfrastructure.administration.title')} />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="subject"
                  label={t('cloudInfrastructure.subject')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFSelect
                  name="client_id"
                  label={t('cloudInfrastructure.clientCompany')}
                  disabled={isSubmitting}
                >
                  <MenuItem value="">{t('cloudInfrastructure.actions.chooseClient')}</MenuItem>
                  {clients.map((client) => (
                    <MenuItem
                      key={client.id}
                      value={client.id}
                      onClick={() =>
                        setValue('client_company_name', client.name, { shouldValidate: true })
                      }
                    >
                      {client.name}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField name="client_company_name" label={t('cloudInfrastructure.clientCompany')} disabled={isSubmitting || Boolean(values.client_id)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_name"
                  label={t('cloudInfrastructure.clientName')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="cloud_infrastructure.document_number"
                  label={t('cloudInfrastructure.documentNumber')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="cloud_infrastructure.quotation_date"
                  type="date"
                  label={t('cloudInfrastructure.quotationDate')}
                  disabled={isSubmitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="cloud_infrastructure.service_name"
                  label={t('cloudInfrastructure.serviceName')}
                  disabled={isSubmitting}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <CloudPackageEditor
          control={control}
          register={register}
          errors={formState.errors}
          rateCards={rateCards}
          selectedRateCard={selectedRateCardQuery.data ?? null}
          onSelectRateCard={setSelectedRateCardID}
          onLoadRateCard={() => selectedRateCardQuery.refetch()}
          disabled={isSubmitting}
        />
        <CloudScopeEditor control={control} register={register} disabled={isSubmitting} />
        <CloudPaymentLegalEditor control={control} register={register} disabled={isSubmitting} />
        <CloudInfrastructurePreview
          data={preview.data}
          isLoading={preview.isFetching || preview.isDebouncing}
          error={preview.error}
          isStale={!payload || preview.successfulFingerprint !== preview.currentFingerprint}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={2} sx={{ pb: 4 }}>
          <Button disabled={isSubmitting} sx={{ minHeight: 44 }} onClick={async () => { await methods.trigger(); setShowErrors(true); errorRef.current?.focus(); }}>{t('cloudInfrastructure.actions.validate')}</Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isSubmitting}
            sx={{ minHeight: 44 }}
          >
            {t('cloudInfrastructure.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !canSubmit}
            sx={{ minHeight: 44 }}
          >
            {isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              t('cloudInfrastructure.actions.submit')
            )}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

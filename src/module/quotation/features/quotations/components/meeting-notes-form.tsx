import type { ClientSummary } from '../types';
import type { DraftIssue } from '../types/prompt-first';
import type { QuotationEntryState } from '../types/quotation-entry';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { ClientOrganizationField } from './client-organization-field';

const schema = z.object({
  project_name: z.string().trim().min(1, 'prompt.promptFirst.errors.projectNameRequired'),
  client_id: z.string().min(1, 'prompt.promptFirst.errors.clientRequired'),
  client_company_name: z.string().optional(),
  pic_name: z.string().optional(),
  meeting_notes: z.string().trim().min(20, 'prompt.promptFirst.errors.meetingNotesRequired'),
});

type FormValues = z.infer<typeof schema>;

export type MeetingNotesFormProps = {
  value?: QuotationEntryState;
  onChange?: (value: QuotationEntryState) => void;
  clients?: ClientSummary[];
  isLoadingClients?: boolean;
  loadClientsError?: Error | null;
  onCreateClient?: (name: string) => Promise<ClientSummary>;
  isCreatingClient?: boolean;
  createClientError?: Error | null;
  onSubmit: (payload: {
    project_name: string;
    client_id: string;
    client_company_name: string;
    pic_name?: string;
    meeting_notes: string;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  issues?: DraftIssue[];
  onOpenAdvanced?: () => void;
  disabled?: boolean;
};

export function MeetingNotesForm({
  value,
  onChange,
  clients = [],
  isLoadingClients = false,
  loadClientsError = null,
  onCreateClient,
  isCreatingClient = false,
  createClientError = null,
  onSubmit,
  isSubmitting = false,
  issues = [],
  onOpenAdvanced,
  disabled = false,
}: MeetingNotesFormProps) {
  const { t } = useTranslate('quotation');
  const [isLocallySubmitting, setIsLocallySubmitting] = useState(false);
  const submittingRef = useRef(false);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_name: value?.project_name ?? '',
      client_id: value?.client_id ?? '',
      client_company_name: value?.client_company_name ?? '',
      pic_name: value?.pic_name ?? '',
      meeting_notes: value?.meeting_notes ?? '',
    },
  });

  const lastExternalValueRef = useRef<QuotationEntryState | undefined>(value);
  const isExternalSyncRef = useRef(false);

  useEffect(() => {
    if (value && value !== lastExternalValueRef.current) {
      lastExternalValueRef.current = value;
      const current = getValues();
      if (
        current.project_name !== value.project_name ||
        current.client_id !== value.client_id ||
        current.client_company_name !== value.client_company_name ||
        current.pic_name !== value.pic_name ||
        current.meeting_notes !== value.meeting_notes
      ) {
        isExternalSyncRef.current = true;
        reset({
          project_name: value.project_name ?? '',
          client_id: value.client_id ?? '',
          client_company_name: value.client_company_name ?? '',
          pic_name: value.pic_name ?? '',
          meeting_notes: value.meeting_notes ?? '',
        });
      }
    }
  }, [value, getValues, reset]);

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (isExternalSyncRef.current) {
      isExternalSyncRef.current = false;
      return;
    }
    if (!onChange) return;
    const current: QuotationEntryState = {
      version: 1,
      project_name: watchedValues.project_name ?? '',
      client_id: watchedValues.client_id ?? '',
      client_company_name: watchedValues.client_company_name ?? '',
      pic_name: watchedValues.pic_name ?? '',
      meeting_notes: watchedValues.meeting_notes ?? '',
    };

    if (
      !value ||
      value.project_name !== current.project_name ||
      value.client_id !== current.client_id ||
      value.client_company_name !== current.client_company_name ||
      value.pic_name !== current.pic_name ||
      value.meeting_notes !== current.meeting_notes
    ) {
      onChange(current);
    }
  }, [watchedValues, onChange, value]);

  const submit = async (values: FormValues) => {
    if (submittingRef.current || isSubmitting || disabled) return;
    submittingRef.current = true;
    setIsLocallySubmitting(true);
    try {
      await onSubmit({
        project_name: values.project_name.trim(),
        client_id: values.client_id,
        client_company_name: values.client_company_name?.trim() ?? '',
        pic_name: values.pic_name?.trim() || undefined,
        meeting_notes: values.meeting_notes.trim(),
      });
    } finally {
      submittingRef.current = false;
      setIsLocallySubmitting(false);
    }
  };

  const handleOpenAdvanced = () => {
    if (disabled || isSubmitting || isLocallySubmitting) return;
    const current = getValues();
    onChange?.({
      version: 1,
      project_name: current.project_name ?? '',
      client_id: current.client_id ?? '',
      client_company_name: current.client_company_name ?? '',
      pic_name: current.pic_name ?? '',
      meeting_notes: current.meeting_notes ?? '',
    });
    onOpenAdvanced?.();
  };

  const submitting = isSubmitting || isLocallySubmitting;

  const selectedClient: ClientSummary | null = useMemo(() => {
    const id = watchedValues.client_id;
    const company = watchedValues.client_company_name;
    if (!id && !company) return null;
    const found = clients.find((c) => (id && c.id === id) || (company && c.name === company));
    if (found) return found;
    return {
      id: id ?? '',
      name: company ?? '',
    };
  }, [watchedValues.client_id, watchedValues.client_company_name, clients]);

  const handleClientChange = (selected: ClientSummary | null) => {
    setValue('client_id', selected?.id ?? '', { shouldValidate: true, shouldDirty: true });
    setValue('client_company_name', selected?.name ?? '', { shouldDirty: true });
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: 820, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={0.5}>
          <Typography variant="h4">{t('prompt.promptFirst.title')}</Typography>
          <Typography color="text.secondary">{t('prompt.promptFirst.subtitle')}</Typography>
        </Stack>

        <Controller
          name="project_name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              required
              fullWidth
              disabled={disabled || submitting}
              label={t('prompt.promptFirst.projectName')}
              placeholder={t('prompt.promptFirst.projectNamePlaceholder')}
              error={Boolean(errors.project_name)}
              helperText={errors.project_name ? t(errors.project_name.message ?? '') : undefined}
            />
          )}
        />

        <ClientOrganizationField
          value={selectedClient}
          options={clients}
          isLoading={isLoadingClients}
          loadError={loadClientsError}
          createError={createClientError}
          disabled={disabled || submitting}
          required
          label={t('prompt.promptFirst.clientCompany')}
          placeholder={t('prompt.promptFirst.clientCompanyPlaceholder')}
          error={Boolean(errors.client_id)}
          helperText={errors.client_id ? t(errors.client_id.message ?? '') : undefined}
          onChange={handleClientChange}
          onCreate={onCreateClient}
          isCreating={isCreatingClient}
        />

        <Controller
          name="pic_name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              disabled={disabled || submitting}
              label={t('prompt.promptFirst.picName')}
              placeholder={t('prompt.promptFirst.picNamePlaceholder')}
              helperText={t('prompt.promptFirst.picOptional')}
            />
          )}
        />

        <Controller
          name="meeting_notes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              required
              fullWidth
              multiline
              minRows={8}
              disabled={disabled || submitting}
              label={t('prompt.promptFirst.meetingNotes')}
              placeholder={t('prompt.promptFirst.meetingNotesPlaceholder')}
              error={Boolean(errors.meeting_notes)}
              helperText={
                errors.meeting_notes
                  ? t(errors.meeting_notes.message ?? '')
                  : t('prompt.promptFirst.meetingNotesHelper')
              }
            />
          )}
        />

        {issues.length > 0 && (
          <Stack spacing={1} aria-live="polite">
            {issues.map((issue) => (
              <Alert
                key={`${issue.code}-${issue.field}`}
                severity={issue.severity === 'blocking' ? 'error' : 'warning'}
              >
                {issue.code ? (
                  <>
                    <strong>{issue.code}</strong>:{' '}
                  </>
                ) : null}
                {issue.message}
              </Alert>
            ))}
          </Stack>
        )}

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={1.5}
          justifyContent="flex-end"
        >
          {onOpenAdvanced && (
            <Button
              type="button"
              variant="text"
              onClick={handleOpenAdvanced}
              disabled={submitting || disabled}
            >
              {t('prompt.promptFirst.advanced')}
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || disabled}
            aria-busy={submitting}
          >
            {submitting ? t('prompt.promptFirst.submitting') : t('prompt.promptFirst.submit')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

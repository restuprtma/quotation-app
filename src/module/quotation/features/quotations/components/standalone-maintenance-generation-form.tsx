import type { StandaloneMaintenanceFormValues } from './standalone-maintenance-form-model';
import type {
  ActiveSkill,
  GenerateQuotationPayload,
  StandaloneMaintenanceMode,
  StandaloneMaintenancePreviewResponse,
} from '../types';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { Form, RHFSelect, RHFTextField } from 'src/shared/ui/hook-form';

import { useClients } from '../hooks/use-clients';
import { DefectMatrixEditor } from './defect-matrix-editor';
import { SOLUTION_TYPES } from '../constants/scope-presets';
import { useActiveSkills } from '../hooks/use-active-skills';
import { MaintenanceHourlyTaskEditor } from './maintenance-hourly-task-editor';
import { StandaloneMaintenancePreview } from './standalone-maintenance-preview';
import { useStandaloneMaintenancePreview } from '../hooks/use-quotation-generation';
import { standaloneMaintenanceFormSchema } from './standalone-maintenance-form-model';
import { StandaloneMaintenanceCostEditor } from './standalone-maintenance-cost-editor';
import { StandaloneMaintenancePaymentLegalEditor } from './standalone-maintenance-payment-legal-editor';
import {
  toStandaloneMaintenancePayload,
  type StandaloneMaintenanceDraftTotals,
  createDefaultStandaloneMaintenanceValues,
  calculateStandaloneMaintenanceDraftTotals,
} from '../constants/standalone-maintenance';

// ----------------------------------------------------------------------

export function makeStandaloneMaintenanceFormSchema(_t?: any) {
  return standaloneMaintenanceFormSchema;
}

export function isModeBlank(
  mode: StandaloneMaintenanceMode,
  smValues?: Record<string, any> | null
): boolean {
  if (!smValues) return true;

  if (mode === 'retainer') {
    const retainerItems = smValues.retainer_items || [];
    const hasRetainerData = retainerItems.some(
      (i: any) => (i?.name && i.name.trim() !== '') || (i?.monthly_rate && i.monthly_rate > 0)
    );
    const defectGroups = smValues.defect_groups || [];
    const hasDefectData = defectGroups.some(
      (g: any) =>
        (g?.title && g.title.trim() !== '') ||
        (g?.items || []).some(
          (item: any) =>
            (item?.function && item.function.trim() !== '') ||
            (item?.screen_flow && item.screen_flow.trim() !== '') ||
            (item?.existing && item.existing.trim() !== '') ||
            (item?.improvement && item.improvement.trim() !== '')
        )
    );
    return !hasRetainerData && !hasDefectData;
  }

  const hourlyCostItems = smValues.hourly_cost_items || [];
  const hasCostData = hourlyCostItems.some(
    (i: any) =>
      (i?.name && i.name.trim() !== '') ||
      (i?.display_monthly_rate && i.display_monthly_rate > 0) ||
      (i?.quoted_line_total && i.quoted_line_total > 0)
  );
  const hourlyTasks = smValues.hourly_tasks || [];
  const hasTaskData = hourlyTasks.some(
    (t: any) =>
      (t?.description && t.description.trim() !== '') || (t?.platform && t.platform.trim() !== '')
  );
  return !hasCostData && !hasTaskData;
}

export function isStandaloneMaintenanceSubmitReady(params: {
  isValid: boolean;
  isDebouncing: boolean;
  isFetching: boolean;
  error: any;
  preview: StandaloneMaintenancePreviewResponse | undefined;
  draftTotals: StandaloneMaintenanceDraftTotals | null;
  currentMode: StandaloneMaintenanceMode | undefined;
}): boolean {
  if (!params.isValid) return false;
  if (params.isDebouncing || params.isFetching || Boolean(params.error)) return false;
  if (!params.preview || !params.draftTotals) return false;

  const { calculation } = params.preview;

  // Response matches current mode and totals
  if (calculation.mode !== params.currentMode) return false;
  if (calculation.total_investment !== params.draftTotals.total_investment) return false;
  if (calculation.payment_total !== params.draftTotals.payment_total) return false;

  // Backend payment total equals total investment
  if (calculation.payment_total !== calculation.total_investment) return false;
  if (!params.draftTotals.is_balanced) return false;

  return true;
}

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

export function StandaloneMaintenanceGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslate('quotation');
  const { data: activeSkills = [] } = useActiveSkills();
  const { data: clients = [] } = useClients();

  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const [modeSwitchDialogOpen, setModeSwitchDialogOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<StandaloneMaintenanceMode | null>(null);

  const defaultValues = useMemo(
    () => createDefaultStandaloneMaintenanceValues(toISODate(new Date()), clients[0]),
    [clients]
  );

  const methods = useForm<StandaloneMaintenanceFormValues>({
    resolver: zodResolver(makeStandaloneMaintenanceFormSchema(t)) as any,
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

  const currentMode = values.standalone_maintenance?.mode || 'retainer';

  const performModeSwitch = (newMode: StandaloneMaintenanceMode) => {
    setValue('standalone_maintenance.mode', newMode, { shouldValidate: true });
    if (newMode === 'hourly_task') {
      setValue('standalone_maintenance.retainer_items', [], { shouldValidate: true });
      setValue('standalone_maintenance.defect_groups', [], { shouldValidate: true });
      setValue(
        'standalone_maintenance.hourly_cost_items',
        [
          {
            name: '',
            display_monthly_rate: 0,
            headcount: 1,
            hours_half_units: 2,
            quoted_line_total: 0,
          },
        ],
        { shouldValidate: true }
      );
      setValue(
        'standalone_maintenance.hourly_tasks',
        [
          {
            description: '',
            platform: '',
            hours_half_units: 2,
          },
        ],
        { shouldValidate: true }
      );
    } else {
      setValue('standalone_maintenance.hourly_cost_items', [], { shouldValidate: true });
      setValue('standalone_maintenance.hourly_tasks', [], { shouldValidate: true });
      setValue(
        'standalone_maintenance.retainer_items',
        [
          {
            name: '',
            monthly_rate: 0,
            fte_quarters: 4,
            period_months: 1,
          },
        ],
        { shouldValidate: true }
      );
      setValue(
        'standalone_maintenance.defect_groups',
        [
          {
            title: '',
            items: [
              {
                item_number: '1.1',
                priority: 'P0',
                function: '',
                screen_flow: '',
                existing: '',
                improvement: '',
                reference: '',
              },
            ],
          },
        ],
        { shouldValidate: true }
      );
    }
  };

  const handleRequestModeChange = (newMode: StandaloneMaintenanceMode) => {
    if (newMode === currentMode) return;

    if (isModeBlank(currentMode, values.standalone_maintenance)) {
      performModeSwitch(newMode);
    } else {
      setPendingMode(newMode);
      setModeSwitchDialogOpen(true);
    }
  };

  const handleConfirmModeSwitch = () => {
    if (pendingMode) {
      performModeSwitch(pendingMode);
    }
    setModeSwitchDialogOpen(false);
    setPendingMode(null);
  };

  const handleCancelModeSwitch = () => {
    setModeSwitchDialogOpen(false);
    setPendingMode(null);
  };

  // Preview payload derivation (memoized to prevent resetting debounce timer on every keystroke)
  const previewPayload = useMemo(() => {
    const parsed = standaloneMaintenanceFormSchema.safeParse(values);
    if (!parsed.success) return null;
    return toStandaloneMaintenancePayload(parsed.data, selectedSkill, activeSkills);
  }, [activeSkills, selectedSkill, values]);

  const preview = useStandaloneMaintenancePreview(
    previewPayload,
    formState.isValid && !isSubmitting
  );

  const draftTotals = useMemo(() => {
    if (!values.standalone_maintenance) return null;
    const sm = values.standalone_maintenance;
    return calculateStandaloneMaintenanceDraftTotals({
      system_name: sm.system_name || '',
      quotation_date: sm.quotation_date || '',
      mode: sm.mode || 'retainer',
      tax_treatment: sm.tax_treatment || 'exclusive_ppn',
      retainer_items: (sm.retainer_items || []).filter(Boolean).map((r: any) => ({
        name: r?.name || '',
        monthly_rate: Number(r?.monthly_rate) || 0,
        fte_quarters: Number(r?.fte_quarters) || 4,
        period_months: Number(r?.period_months) || 1,
      })),
      hourly_cost_items: (sm.hourly_cost_items || []).filter(Boolean).map((h: any) => ({
        name: h?.name || '',
        display_monthly_rate: Number(h?.display_monthly_rate) || 0,
        headcount: Number(h?.headcount) || 1,
        hours_half_units: Number(h?.hours_half_units) || 2,
        quoted_line_total: Number(h?.quoted_line_total) || 0,
      })),
      defect_groups: (sm.defect_groups || []).filter(Boolean).map((g: any) => ({
        title: g?.title || '',
        items: (g?.items || []).filter(Boolean).map((i: any) => ({
          item_number: i?.item_number || '',
          priority: i?.priority || 'P0',
          function: i?.function || '',
          screen_flow: i?.screen_flow || '',
          existing: i?.existing || '',
          improvement: i?.improvement || '',
          reference: i?.reference || '',
        })),
      })),
      hourly_tasks: (sm.hourly_tasks || []).filter(Boolean).map((tItem: any) => ({
        description: tItem?.description || '',
        platform: tItem?.platform || '',
        hours_half_units: Number(tItem?.hours_half_units) || 2,
      })),
      discount_amount: Number(sm.discount_amount) || 0,
      show_discount_row: Boolean(sm.show_discount_row),
      payment_schedule: (sm.payment_schedule || []).filter(Boolean).map((p: any) => ({
        work_period: p?.work_period || '',
        terms: p?.terms || '',
        invoice_date_label: p?.invoice_date_label || '',
        due_date_label: p?.due_date_label || '',
        nominal: Number(p?.nominal) || 0,
      })),
      rights_statements: (sm.rights_statements || []).filter(Boolean) as string[],
    });
  }, [values.standalone_maintenance]);

  const submitReady = isStandaloneMaintenanceSubmitReady({
    isValid: formState.isValid,
    isDebouncing: preview.isDebouncing,
    isFetching: preview.isFetching,
    error: preview.error,
    preview: preview.data,
    draftTotals,
    currentMode: values.standalone_maintenance?.mode,
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

  const defectCount = useMemo(() => {
    const groups = values.standalone_maintenance?.defect_groups || [];
    return groups.reduce((acc, g) => acc + (g?.items?.length || 0), 0);
  }, [values.standalone_maintenance?.defect_groups]);

  const taskCount = useMemo(
    () => (values.standalone_maintenance?.hourly_tasks || []).length,
    [values.standalone_maintenance?.hourly_tasks]
  );

  const submit = handleSubmit((data) => {
    if (!submitReady) return;
    onSubmit(
      toStandaloneMaintenancePayload(
        data as StandaloneMaintenanceFormValues,
        selectedSkill,
        activeSkills
      )
    );
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
              {t('standaloneMaintenanceForm.changeCommand')}
            </Button>
          }
          sx={{ borderRadius: 1.5 }}
        >
          <Typography variant="subtitle2">
            {t('standaloneMaintenanceForm.activeSkillBanner')}{' '}
            <strong>{selectedSkill?.command || '/quotation'}</strong> (
            {selectedSkill?.name || t('standaloneMaintenanceForm.defaultSkill')})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('standaloneMaintenanceForm.aiHint')}
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
                  {t('standaloneMaintenanceForm.focusFirstError', {
                    message: firstError.message,
                  })}
                </Button>
              ) : undefined
            }
          >
            <AlertTitle>{t('standaloneMaintenanceForm.validationTitle')}</AlertTitle>
            {t('standaloneMaintenanceForm.validationBody')}
          </Alert>
        )}

        {/* 1. Identitas Sistem */}
        <Card>
          <CardHeader
            title={t('standaloneMaintenanceForm.identityTitle')}
            subheader={t('standaloneMaintenanceForm.identitySubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="subject"
                  label={t('standaloneMaintenanceForm.subject')}
                  placeholder={t('standaloneMaintenanceForm.subjectPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFSelect
                  name="solution_type"
                  label={t('standaloneMaintenanceForm.solutionType')}
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
                  label={t('standaloneMaintenanceForm.clientCompany')}
                  placeholder={t('standaloneMaintenanceForm.clientCompanyPlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <RHFTextField
                  name="client_name"
                  label={t('standaloneMaintenanceForm.clientName')}
                  placeholder={t('standaloneMaintenanceForm.clientNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <RHFTextField
                  name="standalone_maintenance.system_name"
                  label={t('standaloneMaintenanceForm.systemName')}
                  placeholder={t('standaloneMaintenanceForm.systemNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFTextField
                  name="standalone_maintenance.quotation_date"
                  label={t('standaloneMaintenanceForm.quotationDate')}
                  type="date"
                  disabled={isSubmitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 2. Mode Penawaran */}
        <Card>
          <CardHeader
            title={t('standaloneMaintenanceForm.modeTitle')}
            subheader={t('standaloneMaintenanceForm.modeSubtitle')}
          />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderWidth: currentMode === 'retainer' ? 2 : 1,
                    borderColor: currentMode === 'retainer' ? 'primary.main' : 'divider',
                    bgcolor: currentMode === 'retainer' ? 'primary.lighter' : 'background.paper',
                  }}
                >
                  <CardActionArea
                    onClick={() => handleRequestModeChange('retainer')}
                    disabled={isSubmitting}
                    sx={{ p: 2.5 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '10px',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'inline-flex',
                        }}
                      >
                        <Iconify icon="solar:users-group-two-rounded-bold-duotone" width={28} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {t('standaloneMaintenanceForm.modeRetainerTitle')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('standaloneMaintenanceForm.modeRetainerDesc')}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderWidth: currentMode === 'hourly_task' ? 2 : 1,
                    borderColor: currentMode === 'hourly_task' ? 'primary.main' : 'divider',
                    bgcolor: currentMode === 'hourly_task' ? 'info.lighter' : 'background.paper',
                  }}
                >
                  <CardActionArea
                    onClick={() => handleRequestModeChange('hourly_task')}
                    disabled={isSubmitting}
                    sx={{ p: 2.5 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: '10px',
                          bgcolor: 'info.main',
                          color: 'info.contrastText',
                          display: 'inline-flex',
                        }}
                      >
                        <Iconify icon="solar:clock-circle-bold-duotone" width={28} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {t('standaloneMaintenanceForm.modeHourlyTitle')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('standaloneMaintenanceForm.modeHourlyDesc')}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 3. Biaya */}
        <StandaloneMaintenanceCostEditor mode={currentMode} disabled={isSubmitting} />

        {/* 4. Lingkup */}
        {currentMode === 'retainer' ? (
          <DefectMatrixEditor disabled={isSubmitting} />
        ) : (
          <MaintenanceHourlyTaskEditor disabled={isSubmitting} />
        )}

        {/* 5. Pembayaran & 6. Pajak & Hak */}
        <StandaloneMaintenancePaymentLegalEditor disabled={isSubmitting} />

        {/* 7. Preview Backend Authoritative */}
        <StandaloneMaintenancePreview
          preview={preview.data}
          isLoading={preview.isFetching}
          isDebouncing={preview.isDebouncing}
          error={preview.error}
          defectCount={currentMode === 'retainer' ? defectCount : undefined}
          taskCount={currentMode === 'hourly_task' ? taskCount : undefined}
        />

        {/* Form Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1, pb: 4 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={isSubmitting}>
            {t('standaloneMaintenanceForm.cancel')}
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
              ? t('standaloneMaintenanceForm.submitting')
              : t('standaloneMaintenanceForm.submit')}
          </Button>
        </Stack>
      </Stack>

      {/* Mode Switch Confirmation Dialog */}
      <Dialog
        open={modeSwitchDialogOpen}
        onClose={handleCancelModeSwitch}
        aria-labelledby="mode-switch-dialog-title"
      >
        <DialogTitle id="mode-switch-dialog-title">
          {t('standaloneMaintenanceForm.modeSwitchDialogTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingMode === 'hourly_task'
              ? t('standaloneMaintenanceForm.modeSwitchToHourlyWarning')
              : t('standaloneMaintenanceForm.modeSwitchToRetainerWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelModeSwitch} color="inherit" sx={{ minHeight: 44, px: 2 }}>
            {t('standaloneMaintenanceForm.cancelModeSwitch')}
          </Button>
          <Button
            onClick={handleConfirmModeSwitch}
            variant="contained"
            color="warning"
            autoFocus
            sx={{ minHeight: 44, px: 2 }}
          >
            {t('standaloneMaintenanceForm.confirmModeSwitch')}
          </Button>
        </DialogActions>
      </Dialog>
    </Form>
  );
}

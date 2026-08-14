import type { TFunction } from 'i18next';
import type { Quotation, ProjectType } from '../types';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';
import { ErrorDialog } from 'src/shared/ui/error-dialog';
import { Form, Field, RHFNumericField } from 'src/shared/ui/hook-form';

import { PricingEditor } from './pricing-editor';
import { useQuotation } from '../hooks/use-quotation';
import { DiagramEditor } from './editors/diagram-editor';
import { NarrativeEditor } from './editors/narrative-editor';
import { BlueprintEditor } from './editors/blueprint-editor';
import { ProductDetailEditor } from './editors/product-detail-editor';
import { ProjectDetailEditor } from './editors/project-detail-editor';
import { createQuotation, updateQuotation, generateQuotationAI } from '../api';

function makeSchema(t: TFunction) {
  return z.object({
    client_id: z.string().uuid({ message: t('form.validationFailed') }),
    client_name: z.string(),
    client_industry: z.string(),
    project_type: z.enum(['product_based', 'project_based']),
    budget: z.number({ message: t('form.validationFailed') }).positive(t('form.validationFailed')),
    client_requirements: z.string().min(1, { message: t('form.validationFailed') }),
    maintenance_info: z.string(),
    hosting_info: z.string(),
    notes: z.string(),
    narrative_data: z.any().optional(),
    product_detail_data: z.any().optional(),
    blueprint_data: z.any().optional(),
    sections: z.array(
      z.object({
        section_name: z.string().min(1, { message: t('form.validationFailed') }),
        section_type: z.enum(['package', 'service', 'phase', 'resource_group', 'other']),
        sort_order: z.number(),
        items: z.array(
          z.object({
            item_name: z.string().min(1, { message: t('form.validationFailed') }),
            pricing_mode: z.enum(['unit', 'resource', 'fixed']),
            unit_price: z.number().min(0, { message: t('form.validationFailed') }),
            quantity: z.number().min(0, { message: t('form.validationFailed') }),
            employee_count: z.number().min(0, { message: t('form.validationFailed') }),
            duration: z.number().min(0, { message: t('form.validationFailed') }),
            billing_period: z.enum(['one_time', 'monthly', 'yearly', 'custom']),
            unit_label: z.string().optional().nullable(),
            duration_unit: z.string().optional().nullable(),
            sort_order: z.number(),
          })
        ),
      })
    ).optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

type Props = {
  open: boolean;
  mode: 'new' | 'edit';
  id: string | null;
  onClose: () => void;
  onSaved: (quotation: Quotation) => void;
};

  const emptyNarrative = { introduction: '', scope: [] };
  const emptyDetail = { mode: 'project' };
  const emptyBlueprint = { title: '', summary: '', actors: [], diagrams: [], rules: [], assumptions: [], edge_cases: [], outputs: [] };

export function QuotationFormDialog({ open, mode, id, onClose, onSaved }: Props) {
  const { t } = useTranslate('quotation');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();
  const schema = useMemo(() => makeSchema(t), [t]);
  const submitting = useBoolean();
  const generating = useBoolean();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { data, loading } = useQuotation(open && mode === 'edit' ? id : null);

  const defaultValues = useMemo<FormValues>(
    () => ({
      client_id: data?.client_id ?? '',
      client_name: data?.client_name ?? '',
      client_industry: '',
      project_type: data?.project_type ?? 'project_based',
      budget: data?.revision?.budget ?? 0,
      client_requirements: '',
      maintenance_info: data?.revision?.maintenance_info ?? '',
      hosting_info: data?.revision?.hosting_info ?? '',
      notes: data?.revision?.notes ?? '',
      narrative_data: data?.revision?.narrative_data ?? emptyNarrative,
      product_detail_data: data?.revision?.product_detail_data ?? emptyDetail,
      blueprint_data: data?.revision?.blueprint_data ?? emptyBlueprint,
      sections: data?.revision?.sections ?? [],
    }),
    [data]
  );

  const methods = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });
  const { handleSubmit, watch } = methods;
  const isEditing = mode === 'edit';

  const projectType = watch('project_type');

  useEffect(() => {
    if (open) methods.reset(defaultValues);
    if (!open) setErrorMsg(null);
  }, [defaultValues, methods, open]);

  const handleGenerate = async () => {
    const values = methods.getValues();
    if (!values.client_name.trim() || !values.client_requirements.trim() || !values.budget) {
      setErrorMsg(t('form.validationFailed'));
      return;
    }

    generating.onTrue();
    setErrorMsg(null);
    try {
      const result = await generateQuotationAI({
        project_type: values.project_type,
        client_name: values.client_name || t('form.fallbackClientName'),
        client_industry: values.client_industry || t('form.fallbackIndustry'),
        budget: values.budget,
        client_requirements: values.client_requirements
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        user_notes: values.notes,
      });
      methods.setValue('narrative_data', result.narrative, { shouldValidate: true });
      methods.setValue('product_detail_data', result.product_or_project_detail, { shouldValidate: true });
      methods.setValue('blueprint_data', result.blueprint, { shouldValidate: true });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : t('form.aiFailed'));
    } finally {
      generating.onFalse();
    }
  };

  const onSave = handleSubmit(async (values) => {
    submitting.onTrue();
    setErrorMsg(null);
    try {
      let saved: Quotation;
      if (isEditing && id) {
        saved = await updateQuotation(id, {
          budget: values.budget,
          maintenance_info: values.maintenance_info,
          hosting_info: values.hosting_info,
          notes: values.notes,
          narrative_data: values.narrative_data,
          product_detail_data: values.product_detail_data,
          blueprint_data: values.blueprint_data,
          sections: values.sections,
        });
      } else {
        const created = await createQuotation({
          client_id: values.client_id,
          project_type: values.project_type,
          budget: values.budget,
          sections: values.sections,
        });
        saved = await updateQuotation(created.id, {
          budget: values.budget,
          maintenance_info: values.maintenance_info,
          hosting_info: values.hosting_info,
          notes: values.notes,
          narrative_data: values.narrative_data,
          product_detail_data: values.product_detail_data,
          blueprint_data: values.blueprint_data,
          sections: values.sections,
        });
      }
      onSaved(saved);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : t('form.saveFailed'));
    } finally {
      submitting.onFalse();
    }
  });

  return (
    <>
      <MotionDialog
        open={open}
        onClose={submitting.value || generating.value ? undefined : onClose}
        fullWidth
        maxWidth="lg"
        scroll="paper"
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, pr: 2.5 }}>
          <Box sx={{ flex: 1 }}>{isEditing ? t('form.editTitle') : t('form.newTitle')}</Box>
          <IconButton
            size="small"
            onClick={onClose}
            disabled={submitting.value || generating.value}
          >
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>
        </DialogTitle>
        <Form methods={methods} onSubmit={onSave} sx={{ display: 'contents' }}>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            {loading ? (
              <Typography color="text.secondary">{tCommon('state.loading')}</Typography>
            ) : (
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Text
                      name="client_id"
                      label={t('form.clientId')}
                      placeholder={t('form.clientIdPlaceholder')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Text name="client_name" label={t('form.clientName')} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Text name="client_industry" label={t('form.clientIndustry')} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Select
                      name="project_type"
                      label={t('form.projectType')}
                      onChange={(e) => {
                        const newType = e.target.value as ProjectType;
                        const currentSections = methods.getValues('sections') || [];
                        if (currentSections.length > 0 && newType !== projectType) {
                          if (window.confirm(t('confirmTypeSwitch.description'))) {
                            methods.setValue('sections', []);
                            methods.setValue('project_type', newType);
                          }
                        } else {
                          methods.setValue('project_type', newType);
                        }
                      }}
                    >
                      {(['product_based', 'project_based'] as ProjectType[]).map((type) => (
                        <MenuItem key={type} value={type}>
                          {t(`projectTypes.${type}`)}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <RHFNumericField name="budget" label={t('form.budget')} prefix="Rp" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Text name="maintenance_info" label={t('form.maintenance')} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Text name="hosting_info" label={t('form.hosting')} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Field.Text name="notes" label={t('form.notes')} />
                  </Grid>
                </Grid>

                <Field.Text
                  name="client_requirements"
                  label={t('form.requirements')}
                  placeholder={t('form.requirementsPlaceholder')}
                  multiline
                  rows={4}
                />

                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                    {t('buttons.generateAI')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('form.aiHint')}
                  </Typography>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleGenerate}
                    loading={generating.value}
                    startIcon={<Iconify icon="solar:cup-star-bold" />}
                  >
                    {t('buttons.generateAI')}
                  </Button>
                </Box>

                <Box sx={{ mt: 2, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <NarrativeEditor />
                </Box>

                <Box sx={{ mt: 2, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  {projectType === 'product_based' ? <ProductDetailEditor /> : <ProjectDetailEditor />}
                </Box>

                <Box sx={{ mt: 2, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <BlueprintEditor />
                </Box>
                
                <Box sx={{ mt: 2, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <DiagramEditor />
                </Box>

                <Box sx={{ mt: 2, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <PricingEditor projectType={projectType} />
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              loading={submitting.value}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              {t('buttons.save')}
            </Button>
          </DialogActions>
        </Form>
      </MotionDialog>
      <ErrorDialog open={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
    </>
  );
}


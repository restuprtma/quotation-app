import type { QuotationOption, BlueprintStatus } from '../types';

import { useRef, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, type Control } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { Iconify } from 'src/shared/ui/iconify';

import { useCreateBlueprint, useQuotationRevisions } from '../hooks/use-blueprint';
import {
  blueprintSourceSchema,
  toCreateBlueprintInput,
  defaultBlueprintSourceValues,
  type BlueprintSourceFormValues,
} from '../validation/source-schema';

type StringListFieldProps = {
  name: any;
  control: Control<any>;
  label: string;
  itemLabelPrefix: string;
  minItems?: number;
  maxItems?: number;
  required?: boolean;
  disabled?: boolean;
};

function StringListField({
  name,
  control,
  label,
  itemLabelPrefix,
  minItems = 0,
  maxItems,
  required = false,
  disabled = false,
}: StringListFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const items: string[] = Array.isArray(field.value) ? field.value : [];

        const handleItemChange = (index: number, val: string) => {
          const next = [...items];
          next[index] = val;
          field.onChange(next);
        };

        const handleAdd = () => {
          if (maxItems && items.length >= maxItems) return;
          field.onChange([...items, '']);
        };

        const handleRemove = (index: number) => {
          if (items.length <= minItems) return;
          const next = items.filter((_, i) => i !== index);
          field.onChange(next);
        };

        return (
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">
                {label} {required ? '*' : ''}
              </Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAdd}
                disabled={disabled || Boolean(maxItems && items.length >= maxItems)}
              >
                Tambah {itemLabelPrefix}
              </Button>
            </Stack>

            {error?.message && (
              <FormHelperText error sx={{ mb: 1 }}>
                {error.message}
              </FormHelperText>
            )}

            <Stack spacing={1.5}>
              {items.map((item, index) => {
                const itemError =
                  Array.isArray(error) && (error as any)[index]?.message
                    ? (error as any)[index].message
                    : undefined;
                return (
                  <Stack key={index} direction="row" spacing={1} alignItems="center">
                    <TextField
                      fullWidth
                      size="small"
                      label={`${itemLabelPrefix} ${index + 1}`}
                      value={item}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      error={Boolean(itemError)}
                      helperText={itemError}
                      disabled={disabled}
                      inputProps={{ 'aria-label': `${itemLabelPrefix} ${index + 1}` }}
                    />
                    {items.length > minItems && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemove(index)}
                        disabled={disabled}
                        aria-label={`Hapus ${itemLabelPrefix} ${index + 1}`}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        );
      }}
    />
  );
}

type Props = {
  quotations?: QuotationOption[];
  initialQuotationId?: string;
  initialRevisionId?: string;
  onSubmitSuccess?: (status: BlueprintStatus) => void;
  onDuplicateFound?: (quotationId: string) => void;
};

export function BlueprintSourceForm({
  quotations = [],
  initialQuotationId = '',
  initialRevisionId = '',
  onSubmitSuccess,
  onDuplicateFound,
}: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [foreignPrefillWarning, setForeignPrefillWarning] = useState<string | null>(null);

  const lastSubmitRef = useRef<{ signature: string; idempotencyKey: string } | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BlueprintSourceFormValues>({
    resolver: zodResolver(blueprintSourceSchema) as any,
    defaultValues: {
      ...defaultBlueprintSourceValues,
      quotation_id: initialQuotationId || '',
      source_quotation_revision_id: initialRevisionId || '',
    },
  });

  const selectedQuotationId = watch('quotation_id');

  const { data: revisions = [], isLoading: isLoadingRevisions } = useQuotationRevisions(
    selectedQuotationId,
    Boolean(selectedQuotationId)
  );

  const createBlueprintMutation = useCreateBlueprint();

  // Validate initial prefill
  useEffect(() => {
    if (initialQuotationId && quotations.length > 0) {
      const match = quotations.find((q) => q.id === initialQuotationId);
      if (!match) {
        setForeignPrefillWarning(
          'Quotation sumber dari deep link tidak ditemukan atau tidak memiliki izin akses.'
        );
      } else {
        setForeignPrefillWarning(null);
        setValue('quotation_id', initialQuotationId, { shouldValidate: true });
      }
    }
  }, [initialQuotationId, quotations, setValue]);

  // Handle prefilling revision when revisions load
  useEffect(() => {
    if (initialRevisionId && revisions.length > 0 && selectedQuotationId === initialQuotationId) {
      const match = revisions.find((r) => r.id === initialRevisionId);
      if (match && match.blueprint_eligible) {
        setValue('source_quotation_revision_id', initialRevisionId, { shouldValidate: true });
      }
    }
  }, [initialRevisionId, initialQuotationId, revisions, selectedQuotationId, setValue]);

  const handleQuotationChange = (newQuotationId: string) => {
    setValue('quotation_id', newQuotationId, { shouldValidate: true });
    setValue('source_quotation_revision_id', '', { shouldValidate: true });
    setIsDuplicate(false);
    setSubmitError(null);
  };

  const onSubmit = async (values: BlueprintSourceFormValues) => {
    setSubmitError(null);
    setIsDuplicate(false);

    try {
      // Calculate normalized payload signature excluding idempotency key
      const normalizedForSig = toCreateBlueprintInput(values, 'SIG_PLACEHOLDER');
      const signature = JSON.stringify({ ...normalizedForSig, idempotency_key: undefined });

      let idempotencyKey: string;
      if (lastSubmitRef.current && lastSubmitRef.current.signature === signature) {
        // Reuse key on identical retry
        idempotencyKey = lastSubmitRef.current.idempotencyKey;
      } else {
        // Generate new key on new or changed payload
        idempotencyKey =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        lastSubmitRef.current = { signature, idempotencyKey };
      }

      const input = toCreateBlueprintInput(values, idempotencyKey);
      const result = await createBlueprintMutation.mutateAsync(input);
      onSubmitSuccess?.(result);
    } catch (err: any) {
      const errorCode = err.response?.data?.errors || err.message;
      if (err.status === 409 || errorCode === 'blueprint_already_exists') {
        setIsDuplicate(true);
      } else {
        setSubmitError(errorCode || 'Failed to create blueprint');
      }
    }
  };

  return (
    <Card sx={{ p: 4 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          <Typography variant="h5">Buat Blueprint dari Quotation</Typography>

          {foreignPrefillWarning && (
            <Alert severity="warning" onClose={() => setForeignPrefillWarning(null)}>
              {foreignPrefillWarning}
            </Alert>
          )}

          {isDuplicate && (
            <Alert
              severity="info"
              action={
                onDuplicateFound && selectedQuotationId ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => onDuplicateFound(selectedQuotationId)}
                  >
                    Buka Blueprint yang Ada
                  </Button>
                ) : undefined
              }
            >
              Blueprint untuk quotation ini sudah ada.
            </Alert>
          )}

          {submitError && <Alert severity="error">{submitError}</Alert>}

          {/* Quotation & Revision Selectors */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Controller
              name="quotation_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={Boolean(error)}>
                  <InputLabel id="quotation-select-label">Pilih Quotation</InputLabel>
                  <Select
                    native
                    labelId="quotation-select-label"
                    id="quotation-select"
                    label="Pilih Quotation"
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e);
                      handleQuotationChange(e.target.value);
                    }}
                    disabled={isSubmitting}
                    inputProps={{ 'aria-label': 'Pilih Quotation', id: 'quotation-select' }}
                  >
                    <option value="">-- Pilih Quotation --</option>
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotation_number} {q.subject ? `— ${q.subject}` : ''}
                      </option>
                    ))}
                  </Select>
                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />

            <Controller
              name="source_quotation_revision_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl
                  fullWidth
                  error={Boolean(error)}
                  disabled={!selectedQuotationId || isLoadingRevisions || isSubmitting}
                >
                  <InputLabel id="revision-select-label">Pilih Revisi</InputLabel>
                  <Select
                    native
                    labelId="revision-select-label"
                    id="revision-select"
                    label="Pilih Revisi"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e)}
                    disabled={!selectedQuotationId || isLoadingRevisions || isSubmitting}
                    inputProps={{ 'aria-label': 'Pilih Revisi', id: 'revision-select' }}
                  >
                    <option value="">
                      {isLoadingRevisions
                        ? 'Memuat revisi...'
                        : selectedQuotationId
                          ? '-- Pilih Revisi --'
                          : 'Pilih quotation dahulu'}
                    </option>
                    {revisions.map((rev) => {
                      const isEligible = rev.blueprint_eligible !== false;
                      const label = `v${rev.version_number} (${rev.status})${!isEligible && rev.blueprint_ineligible_reason ? ` - ${rev.blueprint_ineligible_reason}` : ''}`;
                      return (
                        <option key={rev.id} value={rev.id} disabled={!isEligible}>
                          {label}
                        </option>
                      );
                    })}
                  </Select>
                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Stack>

          {/* Title */}
          <TextField
            fullWidth
            label="Judul Blueprint"
            {...register('title')}
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
            disabled={isSubmitting}
            inputProps={{ 'aria-label': 'Judul Blueprint' }}
          />

          {/* Business Goals */}
          <StringListField
            name="business_goals"
            control={control}
            label="Tujuan Bisnis (Business Goals)"
            itemLabelPrefix="Tujuan Bisnis"
            minItems={1}
            required
            disabled={isSubmitting}
          />

          {/* Actors */}
          <StringListField
            name="actors"
            control={control}
            label="Aktor Sistem (Actors)"
            itemLabelPrefix="Aktor"
            minItems={1}
            required
            disabled={isSubmitting}
          />

          {/* Business Phases */}
          <StringListField
            name="business_phases"
            control={control}
            label="Fase Bisnis (Business Phases)"
            itemLabelPrefix="Fase Bisnis"
            minItems={1}
            maxItems={30}
            required
            disabled={isSubmitting}
          />

          {/* Optional Collapsible Section */}
          <Accordion>
            <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
              <Typography variant="subtitle1">Spesifikasi Tambahan (Opsional)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                <StringListField
                  name="channels"
                  control={control}
                  label="Channels"
                  itemLabelPrefix="Channel"
                  maxItems={20}
                  disabled={isSubmitting}
                />

                <StringListField
                  name="business_rules"
                  control={control}
                  label="Business Rules"
                  itemLabelPrefix="Business Rule"
                  maxItems={50}
                  disabled={isSubmitting}
                />

                <StringListField
                  name="known_states"
                  control={control}
                  label="Known States"
                  itemLabelPrefix="State"
                  maxItems={100}
                  disabled={isSubmitting}
                />

                <StringListField
                  name="integrations"
                  control={control}
                  label="Integrations"
                  itemLabelPrefix="Integrasi"
                  maxItems={50}
                  disabled={isSubmitting}
                />

                <StringListField
                  name="technology_preferences"
                  control={control}
                  label="Preferensi Teknologi"
                  itemLabelPrefix="Teknologi"
                  maxItems={30}
                  disabled={isSubmitting}
                />

                <StringListField
                  name="operational_constraints"
                  control={control}
                  label="Batasan Operasional"
                  itemLabelPrefix="Batasan"
                  maxItems={50}
                  disabled={isSubmitting}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Catatan Tambahan (Maks 2000 karakter)"
                  {...register('additional_notes')}
                  error={Boolean(errors.additional_notes)}
                  helperText={errors.additional_notes?.message}
                  disabled={isSubmitting}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Submit button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting || createBlueprintMutation.isPending}
              startIcon={
                isSubmitting || createBlueprintMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Iconify icon="solar:file-check-bold-duotone" />
                )
              }
            >
              Buat Blueprint
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}

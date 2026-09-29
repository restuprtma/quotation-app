import type { QuotationEntryIdentity } from '../types/quotation-entry';
import type { ActiveSkill, TalentEngagementMode, GenerateQuotationPayload } from '../types';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, FormProvider } from 'react-hook-form';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { RHFTextField } from 'src/shared/ui/hook-form';

import { TalentCostEditor } from './talent-cost-editor';
import { TalentScopeEditor } from './talent-scope-editor';
import { useActiveSkills } from '../hooks/use-active-skills';
import { TalentPaymentLegalEditor } from './talent-payment-legal-editor';
import { useEntryIdentityBridge } from '../hooks/use-entry-identity-bridge';
import { makeTalentOutsourcingFormSchema } from './talent-outsourcing-form-model';
import { applyEntryIdentityToSchemeDefaults } from '../utils/quotation-entry-state';
import {
  TalentOutsourcingPreview,
  isTalentOutsourcingSubmitReady,
} from './talent-outsourcing-preview';
import {
  toTalentOutsourcingPayload,
  createDefaultTalentOutsourcingValues,
} from '../constants/talent-outsourcing';
import {
  useTalentOutsourcingPreview,
  normalizeTalentOutsourcingPreviewPayload,
} from '../hooks/use-quotation-generation';

const hash = (payload: GenerateQuotationPayload | null) =>
  JSON.stringify(normalizeTalentOutsourcingPreviewPayload(payload));

type Props = {
  selectedSkill?: ActiveSkill | null;
  isSubmitting?: boolean;
  onSubmit: (payload: GenerateQuotationPayload) => void;
  onCancel: () => void;
  entryIdentity?: QuotationEntryIdentity;
  onEntryIdentityChange?: (identity: QuotationEntryIdentity) => void;
};

export function TalentOutsourcingGenerationForm({
  selectedSkill,
  isSubmitting = false,
  onSubmit,
  onCancel,
  entryIdentity,
  onEntryIdentityChange,
}: Props) {
  const { data: activeSkills = [] } = useActiveSkills();
  const schema = useMemo(() => makeTalentOutsourcingFormSchema(), []);
  const defaultValues = useMemo(
    () =>
      applyEntryIdentityToSchemeDefaults(
        createDefaultTalentOutsourcingValues(new Date().toISOString().slice(0, 10)),
        entryIdentity ?? ({} as any)
      ),
    [entryIdentity]
  );
  const methods = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { formState, getValues, setValue, handleSubmit, control } = methods;
  useEntryIdentityBridge({ control, onChange: onEntryIdentityChange });
  const values = useWatch({ control });
  const [submitted, setSubmitted] = useState(false);
  const [pendingMode, setPendingMode] = useState<TalentEngagementMode | null>(null);
  const payload = useMemo(
    () =>
      formState.isValid ? toTalentOutsourcingPayload(values, selectedSkill, activeSkills) : null,
    [activeSkills, formState.isValid, selectedSkill, values]
  );
  const preview = useTalentOutsourcingPreview(payload, Boolean(payload) && !isSubmitting);
  const currentHash = hash(payload);
  const previewHash = preview.data ? currentHash : '';
  const switchMode = (mode: TalentEngagementMode) => {
    const current = getValues('talent_outsourcing.engagement_mode');
    if (mode !== current) setPendingMode(mode);
  };
  const confirmMode = () => {
    if (!pendingMode) return;
    setValue('talent_outsourcing.engagement_mode', pendingMode, { shouldValidate: true });
    if (pendingMode === 'manpower_supply') {
      setValue('talent_outsourcing.cost_groups', [
        {
          category: 'personnel',
          title: 'Biaya Langsung Personil',
          items: [
            {
              name: '',
              quantity: 1,
              quantity_unit: 'Orang',
              period_count: 1,
              period_unit: 'month',
              unit_rate: 0,
            },
          ],
        },
      ]);
      setValue('talent_outsourcing.preparation_items', []);
      setValue('talent_outsourcing.preparation_discount_amount', 0);
      setValue('talent_outsourcing.show_preparation_discount_row', false);
      setValue('talent_outsourcing.squad_items', []);
    } else {
      setValue('talent_outsourcing.cost_groups', []);
      setValue('talent_outsourcing.squad_items', [
        { role: '', monthly_rate: 0, headcount: 1, period_months: 1 },
      ]);
    }
    setPendingMode(null);
  };
  const ready = isTalentOutsourcingSubmitReady({
    isValid: formState.isValid,
    hasPreview: Boolean(preview.data),
    isFetching: preview.isFetching,
    isDebouncing: preview.isDebouncing,
    hasError: Boolean(preview.error),
    previewMatchesInput: previewHash === currentHash,
    isSubmitting,
  });
  return (
    <FormProvider {...methods}>
      <Stack
        component="form"
        spacing={3}
        onSubmit={handleSubmit(
          (data) => onSubmit(toTalentOutsourcingPayload(data, selectedSkill, activeSkills)),
          () => setSubmitted(true)
        )}
      >
        {submitted && !formState.isValid && (
          <Alert severity="error" tabIndex={-1} role="alert">
            <AlertTitle>Periksa data quotation</AlertTitle>
            <Link
              component="button"
              onClick={() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()}
            >
              Buka kesalahan pertama
            </Link>
          </Alert>
        )}
        <Typography variant="h5">Talent Outsourcing</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            sx={{ minHeight: 44 }}
            onClick={() => switchMode('manpower_supply')}
          >
            Manpower supply
          </Button>
          <Button
            variant="outlined"
            sx={{ minHeight: 44 }}
            onClick={() => switchMode('managed_squad')}
          >
            Managed squad
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <RHFTextField name="talent_outsourcing.engagement_mode" label="Mode engagement" />
          <RHFTextField name="talent_outsourcing.document_number" label="Nomor dokumen" />
          <RHFTextField name="talent_outsourcing.service_name" label="Nama layanan" />
          <RHFTextField name="talent_outsourcing.quotation_date" label="Tanggal quotation" />
        </Stack>
        <TalentCostEditor disabled={isSubmitting} />
        <TalentScopeEditor disabled={isSubmitting} />
        <TalentPaymentLegalEditor disabled={isSubmitting} />
        <TalentOutsourcingPreview
          preview={preview.data}
          isLoading={preview.isLoading}
          isDebouncing={preview.isDebouncing}
          error={preview.error}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onCancel} sx={{ minHeight: 44 }}>
            Batal
          </Button>
          <Button type="submit" variant="contained" disabled={!ready} sx={{ minHeight: 44 }}>
            {isSubmitting ? 'Membuat...' : 'Buat draf quotation'}
          </Button>
        </Stack>
      </Stack>
      <Dialog open={Boolean(pendingMode)} onClose={() => setPendingMode(null)}>
        <DialogTitle>Ganti mode quotation?</DialogTitle>
        <DialogContent>Data biaya yang tidak berlaku pada mode baru akan dihapus.</DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingMode(null)}>Batal</Button>
          <Button variant="contained" onClick={confirmMode} autoFocus>
            Lanjutkan
          </Button>
        </DialogActions>
      </Dialog>
    </FormProvider>
  );
}

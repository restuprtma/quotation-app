import type { TalentLimitationCode } from '../types';
import type { TalentOutsourcingFormValues } from './talent-outsourcing-form-model';

import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { RHFTextField, RHFNumericField } from 'src/shared/ui/hook-form';

import {
  TALENT_LIMITATION_OPTIONS,
  calculateTalentDraftTotals,
} from '../constants/talent-outsourcing';

export function TalentPaymentLegalEditor({ disabled = false }: { disabled?: boolean }) {
  const { control, setValue } = useFormContext<TalentOutsourcingFormValues>();
  const payments = useFieldArray({ control, name: 'talent_outsourcing.payment_schedule' });
  const current = useWatch({ control, name: 'talent_outsourcing' });
  const total = current ? calculateTalentDraftTotals(current) : null;
  const selected = current?.limitation_codes || [];
  const toggle = (code: TalentLimitationCode) =>
    setValue(
      'talent_outsourcing.limitation_codes',
      selected.includes(code) ? selected.filter((x) => x !== code) : [...selected, code],
      { shouldValidate: true }
    );
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Pembayaran, pajak & legal</Typography>
      <RHFTextField
        name="talent_outsourcing.tax_treatment"
        label="Perlakuan pajak"
        disabled={disabled}
      />{' '}
      {payments.fields.map((row, index) => (
        <Stack key={row.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <RHFTextField
            name={`talent_outsourcing.payment_schedule.${index}.work_period`}
            label="Periode"
            disabled={disabled}
          />
          <RHFTextField
            name={`talent_outsourcing.payment_schedule.${index}.terms`}
            label="Ketentuan"
            disabled={disabled}
          />
          <RHFTextField
            name={`talent_outsourcing.payment_schedule.${index}.invoice_date_label`}
            label="Invoice"
            disabled={disabled}
          />
          <RHFTextField
            name={`talent_outsourcing.payment_schedule.${index}.due_date_label`}
            label="Jatuh tempo"
            disabled={disabled}
          />
          <RHFNumericField
            name={`talent_outsourcing.payment_schedule.${index}.nominal`}
            label="Nominal IDR"
            disabled={disabled}
          />
        </Stack>
      ))}
      <Button
        variant="outlined"
        sx={{ minHeight: 44, alignSelf: 'start' }}
        onClick={() =>
          payments.append({
            work_period: '',
            terms: '',
            invoice_date_label: '',
            due_date_label: '',
            nominal: 0,
          })
        }
        disabled={disabled}
      >
        Baris
      </Button>
      {total && (
        <Box>
          <Typography>Grand Total: {total.grand_total ?? '-'}</Typography>
          <Typography>Total Pembayaran: {total.payment_total}</Typography>
          <Typography>
            Selisih: {total.grand_total == null ? '-' : total.grand_total - total.payment_total}
          </Typography>
        </Box>
      )}
      <Typography fontWeight={700}>Batasan & pengecualian</Typography>
      {TALENT_LIMITATION_OPTIONS.map((code) => (
        <FormControlLabel
          key={code}
          control={
            <Checkbox
              checked={selected.includes(code)}
              onChange={() => toggle(code)}
              disabled={disabled}
            />
          }
          label={code.replace(/_/g, ' ')}
        />
      ))}
    </Stack>
  );
}

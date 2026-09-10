import type { TalentOutsourcingPreviewResponse } from '../types';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
export const formatTalentOutsourcingCurrency = (value: number | null | undefined) =>
  value == null ? '-' : formatter.format(value);
export function toTalentOutsourcingPreviewViewModel(preview: TalentOutsourcingPreviewResponse) {
  const { calculation: c, resolved_profile: p } = preview;
  return {
    engagementMode: c.engagement_mode,
    totalBeforeTax: c.total_before_tax,
    dppAmount: c.dpp_amount,
    taxAmount: c.tax_amount,
    grandTotal: c.grand_total,
    paymentTotal: c.payment_total,
    showNonPersonnel: p.show_non_personnel,
    showPreparation: p.show_preparation,
    showPreparationDiscount: p.show_preparation_discount,
    sections: p.sections,
  };
}
export function isTalentOutsourcingSubmitReady(params: {
  isValid: boolean;
  hasPreview: boolean;
  isFetching: boolean;
  isDebouncing: boolean;
  hasError: boolean;
  previewMatchesInput: boolean;
  isSubmitting?: boolean;
}) {
  return (
    params.isValid &&
    params.hasPreview &&
    !params.isFetching &&
    !params.isDebouncing &&
    !params.hasError &&
    params.previewMatchesInput &&
    !params.isSubmitting
  );
}
export function TalentOutsourcingPreview({
  preview,
  isLoading = false,
  isDebouncing = false,
  error = null,
}: {
  preview?: TalentOutsourcingPreviewResponse;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: Error | null;
}) {
  const vm = preview && toTalentOutsourcingPreviewViewModel(preview);
  return (
    <Card variant="outlined" data-testid="talent-outsourcing-preview" aria-live="polite">
      <Stack spacing={1.5} sx={{ p: 2.5 }}>
        {(isLoading || isDebouncing) && (
          <Stack spacing={1}>
            <Skeleton width="45%" />
            <Skeleton height={72} />
          </Stack>
        )}
        {error && <Alert severity="error">{error.message}</Alert>}
        {vm && !error && (
          <>
            <Typography variant="subtitle1" fontWeight={700}>
              Pratinjau kalkulasi resmi
            </Typography>
            <Typography variant="body2">
              Total sebelum pajak: {formatTalentOutsourcingCurrency(vm.totalBeforeTax)}
            </Typography>
            {vm.dppAmount > 0 && (
              <Typography variant="body2">
                DPP PPN: {formatTalentOutsourcingCurrency(vm.dppAmount)}
              </Typography>
            )}
            {vm.taxAmount > 0 && (
              <Typography variant="body2">
                PPN: {formatTalentOutsourcingCurrency(vm.taxAmount)}
              </Typography>
            )}
            <Typography variant="h6">{formatTalentOutsourcingCurrency(vm.grandTotal)}</Typography>
            <Typography variant="caption">
              Total pembayaran: {formatTalentOutsourcingCurrency(vm.paymentTotal)}
            </Typography>
          </>
        )}
      </Stack>
    </Card>
  );
}

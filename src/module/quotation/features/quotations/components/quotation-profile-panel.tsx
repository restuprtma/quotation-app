import { useEffect } from 'react';
import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { Iconify } from 'src/shared/ui/iconify';
import { RHFSelect, RHFTextField } from 'src/shared/ui/hook-form';

import {
  QUOTATION_PROFILE_OPTIONS,
  getQuotationProfileVisibility,
} from '../constants/dedicated-squad';

type Props = { disabled?: boolean };

const base = 'dedicated_squad.quotation_profile' as const;

/** Optional structural overrides. Prices and dates stay server-owned. */
export function QuotationProfilePanel({ disabled = false }: Props) {
  const { control, setValue } = useFormContext();
  const profile = useWatch({ control, name: base }) as Record<string, any> | undefined;
  const visibility = getQuotationProfileVisibility(profile);
  const rows = useFieldArray({ control, name: `${base}.payment_rows` as any });

  useEffect(() => {
    if (profile?.preparation_mode === 'none' && profile.preparation_discount_bps !== undefined) {
      setValue(`${base}.preparation_discount_bps` as any, undefined, { shouldValidate: true });
    }
    if (profile?.scope_timeline_mode === 'none' && profile.included_phases?.length) {
      setValue(`${base}.included_phases` as any, [], { shouldValidate: true });
    }
    if (profile?.payment_mode !== 'explicit_rows' && profile?.payment_rows?.length) {
      setValue(`${base}.payment_rows` as any, [], { shouldValidate: true });
    }
  }, [
    profile?.payment_mode,
    profile?.preparation_mode,
    profile?.preparation_discount_bps,
    profile?.scope_timeline_mode,
    profile?.included_phases?.length,
    profile?.payment_rows?.length,
    setValue,
  ]);

  return (
    <Accordion
      defaultExpanded={false}
      disableGutters
      variant="outlined"
      data-testid="quotation-profile-panel"
    >
      <AccordionSummary
        expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
        aria-controls="quotation-profile-options"
      >
        <Stack spacing={0.25}>
          <Typography fontWeight={700}>Penyesuaian quotation</Typography>
          <Typography variant="caption" color="text.secondary">
            Opsional. Nominal, tarif, dan jatuh tempo dihitung oleh server.
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails id="quotation-profile-options">
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <RHFSelect
                name={`${base}.preparation_mode`}
                label="Biaya persiapan"
                disabled={disabled}
              >
                <MenuItem value="">Gunakan preset</MenuItem>
                {QUOTATION_PROFILE_OPTIONS.preparation.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Grid>
            {visibility.showDiscount && (
              <Grid size={{ xs: 12, md: 4 }}>
                <RHFTextField
                  name={`${base}.preparation_discount_bps`}
                  label="Diskon persiapan (BPS)"
                  type="number"
                  disabled={disabled}
                  helperText="0–10.000; nominal dihitung server"
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 4 }}>
              <RHFSelect
                name={`${base}.maintenance_mode`}
                label="Penempatan maintenance"
                disabled={disabled}
              >
                <MenuItem value="">Gunakan preset</MenuItem>
                {QUOTATION_PROFILE_OPTIONS.maintenance.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RHFSelect name={`${base}.scope_timeline_mode`} label="Timeline" disabled={disabled}>
                <MenuItem value="">Gunakan preset</MenuItem>
                {QUOTATION_PROFILE_OPTIONS.timeline.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RHFSelect name={`${base}.payment_mode`} label="Skema pembayaran" disabled={disabled}>
                <MenuItem value="">Gunakan preset</MenuItem>
                <MenuItem value="preset">Preset</MenuItem>
                <MenuItem value="explicit_rows">Baris termin</MenuItem>
              </RHFSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RHFSelect
                name={`${base}.document_options.letter_prefix`}
                label="Prefix surat"
                disabled={disabled}
              >
                <MenuItem value="">CTH (preset)</MenuItem>
                {QUOTATION_PROFILE_OPTIONS.prefixes.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RHFSelect
                name={`${base}.document_options.tax_treatment`}
                label="Pajak"
                disabled={disabled}
              >
                <MenuItem value="">Eksklusif PPN (preset)</MenuItem>
                {QUOTATION_PROFILE_OPTIONS.tax.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Grid>
          </Grid>

          {visibility.showPaymentRows && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Baris termin</Typography>
              {rows.fields.map((field, index) => (
                <Grid container spacing={1} key={field.id} alignItems="center">
                  <Grid size={{ xs: 12, md: 3 }}>
                    <RHFTextField
                      name={`${base}.payment_rows.${index}.work_period`}
                      label="Periode kerja"
                      disabled={disabled}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <RHFTextField
                      name={`${base}.payment_rows.${index}.terms`}
                      label="Termin"
                      disabled={disabled}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <RHFSelect
                      name={`${base}.payment_rows.${index}.allocation_kind`}
                      label="Alokasi"
                      disabled={disabled}
                    >
                      {QUOTATION_PROFILE_OPTIONS.paymentAllocation.map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <RHFTextField
                      name={`${base}.payment_rows.${index}.allocation_bps`}
                      label="BPS"
                      type="number"
                      disabled={disabled}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1 }}>
                    <Button
                      color="error"
                      onClick={() => rows.remove(index)}
                      disabled={disabled}
                      aria-label="Hapus termin"
                    >
                      Hapus
                    </Button>
                  </Grid>
                </Grid>
              ))}
              <Button
                variant="outlined"
                onClick={() =>
                  rows.append({
                    work_period: '',
                    terms: '',
                    allocation_kind: 'investment_bps',
                    allocation_bps: 0,
                    invoice_month_offset: 0,
                  } as any)
                }
                disabled={disabled || rows.fields.length >= 60}
              >
                Tambah termin
              </Button>
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

import type { SubscriptionSaaSFormValues } from '../constants/subscription-saas';

import { useEffect } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { RHFSelect, RHFSwitch, RHFTextField } from 'src/shared/ui/hook-form';

import { RIGHTS_CLAUSE_VENTURO_SOFTWARE_OWNERSHIP_V1 } from '../constants/subscription-saas';

// ----------------------------------------------------------------------

type Props = {
  disabled?: boolean;
};

export function SubscriptionRightsPanel({ disabled = false }: Props) {
  const { t } = useTranslate('quotation');
  const { control, setValue, getValues } = useFormContext<SubscriptionSaaSFormValues>();

  const isPartnership = Boolean(useWatch({ control, name: 'subscription_saas.is_partnership' }));

  const venturoShareBps =
    useWatch({ control, name: 'subscription_saas.income_sharing.venturo_share_bps' }) ?? 5000;
  const partnerShareBps =
    useWatch({ control, name: 'subscription_saas.income_sharing.partner_share_bps' }) ?? 5000;

  const totalBps = Number(venturoShareBps) + Number(partnerShareBps);
  const isBpsValid = totalBps === 10_000;

  // Sync income_sharing when is_partnership is toggled
  useEffect(() => {
    if (!isPartnership) {
      setValue('subscription_saas.income_sharing', undefined, { shouldValidate: true });
    } else {
      const current = getValues('subscription_saas.income_sharing');
      if (!current) {
        setValue(
          'subscription_saas.income_sharing',
          {
            venturo_share_bps: 5000,
            partner_share_bps: 5000,
            eligible_revenue_description: 'Penjualan dari referensi mitra',
            settlement_business_days: 30,
            prohibit_unilateral_discount: true,
          },
          { shouldValidate: true }
        );
      }
    }
  }, [getValues, isPartnership, setValue]);

  return (
    <Accordion
      defaultExpanded={false}
      sx={{
        borderRadius: '12px !important',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        '&:before': { display: 'none' },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Iconify
            icon="solar:shield-check-bold-duotone"
            width={24}
            sx={{ color: 'primary.main' }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('subscriptionSaaSForm.rightsTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('subscriptionSaaSForm.rightsSubtitle')}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 1, pb: 3, px: 3 }}>
        <Stack spacing={3}>
          {/* Rights Clause Select */}
          <RHFSelect
            name="subscription_saas.rights_clause_code"
            label={t('subscriptionSaaSForm.rights.clauseLabel')}
            disabled={disabled}
          >
            <MenuItem value="">{t('subscriptionSaaSForm.rights.none')}</MenuItem>
            <MenuItem value={RIGHTS_CLAUSE_VENTURO_SOFTWARE_OWNERSHIP_V1}>
              {t('subscriptionSaaSForm.rights.venturoOwnership')}
            </MenuItem>
          </RHFSelect>

          {/* Partnership Toggle */}
          <Box>
            <RHFSwitch
              name="subscription_saas.is_partnership"
              label={t('subscriptionSaaSForm.rights.isPartnership')}
              disabled={disabled}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 6 }}>
              {t('subscriptionSaaSForm.rights.isPartnershipDesc')}
            </Typography>
          </Box>

          {/* Conditional Income Sharing Fields */}
          {isPartnership && (
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'background.neutral',
                borderRadius: 1.5,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                {t('subscriptionSaaSForm.rights.incomeSharingTitle')}
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="subscription_saas.income_sharing.venturo_share_bps"
                    label={t('subscriptionSaaSForm.rights.venturoShare')}
                    type="number"
                    disabled={disabled}
                    helperText={`${Number(venturoShareBps) / 100}%`}
                    slotProps={{
                      htmlInput: { min: 0, max: 10000, step: 100 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="subscription_saas.income_sharing.partner_share_bps"
                    label={t('subscriptionSaaSForm.rights.partnerShare')}
                    type="number"
                    disabled={disabled}
                    helperText={`${Number(partnerShareBps) / 100}%`}
                    slotProps={{
                      htmlInput: { min: 0, max: 10000, step: 100 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="caption"
                    color={isBpsValid ? 'success.main' : 'error.main'}
                    fontWeight={600}
                    display="block"
                  >
                    {t('subscriptionSaaSForm.rights.bpsHelper')}{' '}
                    {t('subscriptionSaaSForm.rights.bpsCurrent', {
                      total: totalBps,
                      percent: totalBps / 100,
                    })}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <RHFTextField
                    name="subscription_saas.income_sharing.eligible_revenue_description"
                    label={t('subscriptionSaaSForm.rights.eligibleRevenue')}
                    placeholder={t('subscriptionSaaSForm.rights.eligibleRevenuePlaceholder')}
                    multiline
                    rows={2}
                    disabled={disabled}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFTextField
                    name="subscription_saas.income_sharing.settlement_business_days"
                    label={t('subscriptionSaaSForm.rights.settlementDays')}
                    type="number"
                    disabled={disabled}
                    slotProps={{
                      htmlInput: { min: 1, max: 365, step: 1 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <RHFSwitch
                    name="subscription_saas.income_sharing.prohibit_unilateral_discount"
                    label={t('subscriptionSaaSForm.rights.prohibitDiscount')}
                    disabled={disabled}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', pl: 6 }}
                  >
                    {t('subscriptionSaaSForm.rights.prohibitDiscountHelper')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

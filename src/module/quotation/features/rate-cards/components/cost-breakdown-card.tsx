import type { RateCardItem } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';

import {
  getSeniorityColor,
  getDisciplineColor,
  formatCurrencyValue,
} from '../utils/format';

interface Props {
  item: RateCardItem;
  currency?: string;
}

export function CostBreakdownCard({ item, currency = 'IDR' }: Props) {
  const { t } = useTranslate('rate_card');

  const totalCost =
    (item.base_salary || 0) +
    (item.tech_lead_fee || 0) +
    (item.ai_rnd_fee || 0) +
    (item.workspace_fee || 0) +
    (item.management_fee || 0);

  const effectiveTotal = totalCost > 0 ? totalCost : item.amount_per_month;

  const getPct = (val: number) =>
    effectiveTotal > 0 ? Math.round((val / effectiveTotal) * 100) : 0;

  const costComponents = [
    {
      key: 'base_salary',
      label: t('breakdown.baseSalary'),
      sublabel: t('breakdown.baseSalarySub'),
      amount: item.base_salary || 0,
      color: '#00A76F',
      icon: 'solar:user-bold',
    },
    {
      key: 'tech_lead_fee',
      label: t('breakdown.techLeadFee'),
      sublabel: t('breakdown.techLeadFeeSub'),
      amount: item.tech_lead_fee || 0,
      color: '#00B8D9',
      icon: 'solar:crown-bold',
    },
    {
      key: 'ai_rnd_fee',
      label: t('breakdown.aiRndFee'),
      sublabel: t('breakdown.aiRndFeeSub'),
      amount: item.ai_rnd_fee || 0,
      color: '#8E33FF',
      icon: 'solar:cpu-bolt-bold',
    },
    {
      key: 'workspace_fee',
      label: t('breakdown.workspaceFee'),
      sublabel: t('breakdown.workspaceFeeSub'),
      amount: item.workspace_fee || 0,
      color: '#FFAB00',
      icon: 'solar:laptop-minimalistic-bold',
    },
    {
      key: 'management_fee',
      label: t('breakdown.managementFee'),
      sublabel: t('breakdown.managementFeeSub'),
      amount: item.management_fee || 0,
      color: '#FF5630',
      icon: 'solar:shield-check-bold',
    },
  ];

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: (theme) => theme.customShadows?.z1 || '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:chart-2-bold" width={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="600">
              {item.display_name || item.role}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.role} • {item.term_type === 'short_term' ? t('terms.shortTerm') : t('terms.longTerm')}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Label color={getDisciplineColor(item.discipline)} variant="soft">
            {item.discipline}
          </Label>
          <Label color={getSeniorityColor(item.seniority)} variant="soft">
            {item.seniority}
          </Label>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2.5 }} />

      {/* 5 Cost Components Progress Bar */}
      <Box sx={{ mb: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.primary">
            {t('breakdown.title')}
          </Typography>
          <Typography variant="subtitle2" fontWeight="700" color="primary.main">
            {formatCurrencyValue(item.amount_per_month, currency)}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              / {t('table.month')}
            </Typography>
          </Typography>
        </Stack>

        {/* Stacked visually segmented bar */}
        <Box
          sx={{
            display: 'flex',
            height: 10,
            borderRadius: 5,
            overflow: 'hidden',
            bgcolor: 'grey.200',
            mb: 1.5,
          }}
        >
          {costComponents.map((comp) => {
            const pct = getPct(comp.amount);
            if (pct <= 0) return null;
            return (
              <Box
                key={comp.key}
                title={`${comp.label}: ${pct}%`}
                sx={{
                  width: `${pct}%`,
                  bgcolor: comp.color,
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </Box>

        {/* Component Items List */}
        <Grid container spacing={1.5}>
          {costComponents.map((comp) => (
            <Grid key={comp.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: 'background.neutral',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: comp.color,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {comp.label}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="body2" fontWeight="600">
                      {formatCurrencyValue(comp.amount, currency)}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                      {getPct(comp.amount)}%
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Negotiation Parameters & Preparation Fees */}
      <Grid container spacing={2}>
        {/* Negotiation Parameters */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              height: '100%',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify icon="solar:hand-money-bold" width={18} sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle2">{t('negotiation.title')}</Typography>
            </Stack>

            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('negotiation.publishedRate')}
                </Typography>
                <Typography variant="body2" fontWeight="600">
                  {formatCurrencyValue(item.published_rate || item.amount_per_month, currency)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {t('negotiation.maxDiscount')}
                </Typography>
                <Label color={item.max_discount_pct > 0 ? 'warning' : 'default'} variant="soft">
                  {item.max_discount_pct || 0}%
                </Label>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('negotiation.floorRate')}
                </Typography>
                <Typography variant="body2" fontWeight="700" color="error.main">
                  {formatCurrencyValue(
                    item.floor_rate ||
                      (item.amount_per_month && item.max_discount_pct
                        ? item.amount_per_month * (1 - item.max_discount_pct / 100)
                        : item.amount_per_month),
                    currency
                  )}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Grid>

        {/* Preparation Fees */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              height: '100%',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify icon="solar:user-plus-bold" width={18} sx={{ color: 'info.main' }} />
              <Typography variant="subtitle2">{t('preparation.title')}</Typography>
              <Typography variant="caption" color="text.disabled">
                ({t('preparation.oneTime')})
              </Typography>
            </Stack>

            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('preparation.kickoffFee')}
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  {formatCurrencyValue(item.kickoff_fee || 0, currency)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('preparation.recruitmentFee')}
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  {formatCurrencyValue(item.recruitment_fee || 0, currency)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t('preparation.onboardingFee')}
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  {formatCurrencyValue(item.onboarding_fee || 0, currency)}
                </Typography>
              </Stack>

              <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight="600" color="text.primary">
                  {t('preparation.totalHiringFee')}
                </Typography>
                <Typography variant="body2" fontWeight="700" color="info.main">
                  {formatCurrencyValue(
                    item.total_hiring_fee ||
                      (item.recruitment_fee || 0) + (item.onboarding_fee || 0),
                    currency
                  )}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

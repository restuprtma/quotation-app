import type { RateCardItem } from '../types';

import { useMemo, useState } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';

import { DISCIPLINES } from '../types';
import { getClientTierColor } from '../utils/format';
import { useRateCardDetail } from '../hooks/use-rate-cards';
import { RateCardItemRow } from '../components/rate-card-item-row';
import { InfraPackageTable } from '../components/infra-package-table';
import { OvertimeConfigTable } from '../components/overtime-config-table';

export default function RateCardDetailPage() {
  const { t } = useTranslate('rate_card');
  const router = useRouter();
  const { id = '' } = useParams();

  const { data: rateCard, isLoading, error } = useRateCardDetail(id);

  const [activeMainTab, setActiveMainTab] = useState<'roles' | 'overtime' | 'infra'>('roles');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [searchRole, setSearchRole] = useState<string>('');

  const items: RateCardItem[] = useMemo(() => rateCard?.items || [], [rateCard]);

  // Discipline counts
  const disciplineCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const d of DISCIPLINES) {
      counts[d] = items.filter((item) => item.discipline === d).length;
    }
    return counts;
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesDiscipline =
          selectedDiscipline === 'all' || item.discipline === selectedDiscipline;
        const matchesSearch =
          !searchRole.trim() ||
          item.role.toLowerCase().includes(searchRole.toLowerCase()) ||
          (item.display_name &&
            item.display_name.toLowerCase().includes(searchRole.toLowerCase())) ||
          item.seniority.toLowerCase().includes(searchRole.toLowerCase());

        return matchesDiscipline && matchesSearch;
      }),
    [items, selectedDiscipline, searchRole]
  );

  if (isLoading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
        >
          <CircularProgress size={40} thickness={4} />
        </Box>
      </DashboardContent>
    );
  }

  if (error || !rateCard) {
    return (
      <DashboardContent maxWidth="xl">
        <PageHeader
          title={t('detail.title')}
          action={
            <Button
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => router.push(paths.dashboard.quotation.rateCards)}
            >
              {t('buttons.back')}
            </Button>
          }
        />
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('detail.notFound')}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => router.push(paths.dashboard.quotation.rateCards)}
          >
            {t('buttons.backToList')}
          </Button>
        </Card>
      </DashboardContent>
    );
  }

  const formatClientTier = (tier: string) => {
    switch (tier) {
      case 'commercial_national':
        return t('tiers.commercialNational');
      case 'government_bumn':
        return t('tiers.governmentBumn');
      case 'international':
        return t('tiers.international');
      default:
        return tier;
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      {/* Header with Back Button */}
      <PageHeader
        title={rateCard.name}
        subtitle={`${rateCard.code} • ${formatClientTier(rateCard.client_tier)}`}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => router.push(paths.dashboard.quotation.rateCards)}
          >
            {t('buttons.back')}
          </Button>
        }
      />

      {/* Metadata Card */}
      <Card sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {/* Left Metadata */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Typography
                  variant="h5"
                  sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}
                >
                  {rateCard.code}
                </Typography>
                <Label color={getClientTierColor(rateCard.client_tier)} variant="soft">
                  {formatClientTier(rateCard.client_tier)}
                </Label>
                <Label
                  color={rateCard.market === 'international' ? 'secondary' : 'default'}
                  variant="outlined"
                >
                  {rateCard.market === 'international'
                    ? t('markets.international')
                    : t('markets.national')}
                </Label>
                <Label color={rateCard.is_active ? 'success' : 'default'} variant="soft">
                  {rateCard.is_active ? t('status.active') : t('status.inactive')}
                </Label>
              </Stack>

              {rateCard.description && (
                <Typography variant="body2" color="text.secondary">
                  {rateCard.description}
                </Typography>
              )}

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 3 }}
                divider={<Divider orientation="vertical" flexItem />}
                sx={{ pt: 1 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('detail.currency')}
                  </Typography>
                  <Typography variant="subtitle2">{rateCard.currency}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('detail.shortTermSurcharge')}
                  </Typography>
                  <Typography variant="subtitle2" color="warning.main">
                    +{rateCard.short_term_surcharge_pct}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('detail.enterpriseMarkup')}
                  </Typography>
                  <Typography variant="subtitle2" color="info.main">
                    +{rateCard.enterprise_markup_pct}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('detail.effectiveDate')}
                  </Typography>
                  <Typography variant="subtitle2">
                    {rateCard.effective_from ? rateCard.effective_from.split('T')[0] : '-'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>

          {/* Right Summary Counters */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'background.neutral',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {t('detail.catalogOverview')}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="h4" fontWeight="700" color="primary.main">
                    {items.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('detail.rateItems')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="h4" fontWeight="700" color="info.main">
                    {rateCard.overtime_configs?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('detail.overtimeConfigs')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="h4" fontWeight="700" color="secondary.main">
                    {rateCard.infra_packages?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('detail.infraPackages')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* Main Section Navigation Tabs */}
      <Tabs
        value={activeMainTab}
        onChange={(_, val) => setActiveMainTab(val)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 600, fontSize: '0.95rem' },
        }}
      >
        <Tab
          value="roles"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>{t('tabs.rolesAndRates')}</span>
              <Label color="primary" variant="soft">
                {items.length}
              </Label>
            </Stack>
          }
        />
        <Tab
          value="overtime"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>{t('tabs.overtime')}</span>
              {Boolean(rateCard.overtime_configs?.length) && (
                <Label color="info" variant="soft">
                  {rateCard.overtime_configs?.length}
                </Label>
              )}
            </Stack>
          }
        />
        <Tab
          value="infra"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>{t('tabs.infrastructure')}</span>
              {Boolean(rateCard.infra_packages?.length) && (
                <Label color="secondary" variant="soft">
                  {rateCard.infra_packages?.length}
                </Label>
              )}
            </Stack>
          }
        />
      </Tabs>

      {/* TAB 1: Roles & Rates */}
      {activeMainTab === 'roles' && (
        <>
          {/* Discipline Sub-tabs & Search Toolbar */}
          <Card sx={{ mb: 3, p: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ md: 'center' }}
              justifyContent="space-between"
            >
              {/* Discipline Tabs */}
              <Tabs
                value={selectedDiscipline}
                onChange={(_, val) => setSelectedDiscipline(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 40 }}
              >
                <Tab
                  value="all"
                  label={`${t('disciplines.all')} (${disciplineCounts.all || 0})`}
                  sx={{ minHeight: 40, py: 0.5 }}
                />
                {DISCIPLINES.map((d) => (
                  <Tab
                    key={d}
                    value={d}
                    label={`${t(`disciplines.${d.toLowerCase()}`, { defaultValue: d })} (${disciplineCounts[d] || 0})`}
                    sx={{ minHeight: 40, py: 0.5 }}
                  />
                ))}
              </Tabs>

              {/* Search Within Roles */}
              <TextField
                size="small"
                value={searchRole}
                placeholder={t('toolbar.searchRolesPlaceholder')}
                onChange={(e) => setSearchRole(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ minWidth: { md: 260 } }}
              />
            </Stack>
          </Card>

          {/* Rate Card Items Master Table */}
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="medium" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.neutral' }}>
                      <TableCell sx={{ width: 48 }} />
                      <TableCell sx={{ fontWeight: 600 }}>{t('table.role')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('table.discipline')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('table.seniority')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('table.termType')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {t('table.monthlyRate')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {t('table.dailyRate')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {t('table.hourlyRate')}
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredItems.map((item) => (
                      <RateCardItemRow
                        key={item.id || `${item.role}-${item.seniority}-${item.term_type}`}
                        item={item}
                        currency={rateCard.currency}
                      />
                    ))}

                    {filteredItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('table.noMatchingRoles')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </>
      )}

      {/* TAB 2: Overtime Configurations */}
      {activeMainTab === 'overtime' && (
        <OvertimeConfigTable
          configs={rateCard.overtime_configs || []}
          currency={rateCard.currency}
        />
      )}

      {/* TAB 3: Infrastructure Packages */}
      {activeMainTab === 'infra' && (
        <InfraPackageTable packages={rateCard.infra_packages || []} currency={rateCard.currency} />
      )}
    </DashboardContent>
  );
}

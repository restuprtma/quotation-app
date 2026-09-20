import type { RateCardSummaryResponse } from '../types';

import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { useTable } from 'src/shared/ui/table';
import { Iconify } from 'src/shared/ui/iconify';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { ConfirmDialog } from 'src/shared/ui/confirm-dialog';

import { RateCardTable } from '../components/rate-card-table';
import { RateCardCreateDialog } from '../components/rate-card-create-dialog';
import { useRateCards, useCreateRateCard, useDeleteRateCard } from '../hooks/use-rate-cards';

export default function RateCardListPage() {
  const { t } = useTranslate('rate_card');
  const { t: tCommon } = useTranslate('common');
  const router = useRouter();
  const table = useTable({ defaultRowsPerPage: 10, defaultDense: false });

  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RateCardSummaryResponse | null>(null);

  const { data: rateCards = [], isLoading } = useRateCards();
  const createMutation = useCreateRateCard();
  const deleteMutation = useDeleteRateCard();

  // Filtered rows
  const filteredRows = useMemo(
    () =>
      rateCards.filter((card) => {
        const matchesSearch =
          !search.trim() ||
          card.name.toLowerCase().includes(search.toLowerCase()) ||
          card.code.toLowerCase().includes(search.toLowerCase());

        const matchesTier = selectedTier === 'all' || card.client_tier === selectedTier;
        const matchesMarket = selectedMarket === 'all' || card.market === selectedMarket;

        return matchesSearch && matchesTier && matchesMarket;
      }),
    [rateCards, search, selectedTier, selectedMarket]
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push(paths.dashboard.quotation.rateCardDetail(id));
    },
    [router]
  );

  const handleOpenDelete = useCallback((row: RateCardSummaryResponse) => {
    setDeleteTarget(row);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(t('messages.deleteSuccess'));
      handleCloseDelete();
    } catch (err: any) {
      toast.error(err.message || t('messages.deleteFailed'));
    }
  };

  const handleCreate = async (payload: any) => {
    try {
      const created = await createMutation.mutateAsync(payload);
      toast.success(t('messages.createSuccess'));
      setCreateDialogOpen(false);
      if (created?.id) {
        router.push(paths.dashboard.quotation.rateCardDetail(created.id));
      }
    } catch (err: any) {
      toast.error(err.message || t('messages.createFailed'));
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {t('buttons.new')}
          </Button>
        }
      />

      {/* Filter toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          {/* Search bar */}
          <TextField
            fullWidth
            value={search}
            placeholder={t('toolbar.searchPlaceholder')}
            onChange={(e) => {
              setSearch(e.target.value);
              table.onResetPage();
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ maxWidth: { sm: 360 } }}
          />

          <Stack direction="row" spacing={1.5} sx={{ minWidth: { sm: 320 } }}>
            {/* Client Tier Filter */}
            <TextField
              select
              fullWidth
              size="small"
              label={t('toolbar.filterTier')}
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                table.onResetPage();
              }}
            >
              <MenuItem value="all">{t('toolbar.allTiers')}</MenuItem>
              <MenuItem value="commercial_national">{t('tiers.commercialNational')}</MenuItem>
              <MenuItem value="government_bumn">{t('tiers.governmentBumn')}</MenuItem>
              <MenuItem value="international">{t('tiers.international')}</MenuItem>
            </TextField>

            {/* Market Filter */}
            <TextField
              select
              fullWidth
              size="small"
              label={t('toolbar.filterMarket')}
              value={selectedMarket}
              onChange={(e) => {
                setSelectedMarket(e.target.value);
                table.onResetPage();
              }}
            >
              <MenuItem value="all">{t('toolbar.allMarkets')}</MenuItem>
              <MenuItem value="national">{t('markets.national')}</MenuItem>
              <MenuItem value="international">{t('markets.international')}</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </Card>

      {/* Table */}
      <RateCardTable
        rows={filteredRows}
        loading={isLoading}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        onView={handleViewDetail}
        onDelete={handleOpenDelete}
        notFound={!isLoading && filteredRows.length === 0}
      />

      {/* Create Dialog */}
      <RateCardCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('dialog.deleteTitle')}
        description={t('dialog.deleteDesc', { code: deleteTarget?.code, name: deleteTarget?.name })}
        confirmLabel={tCommon('actions.delete')}
        confirmColor="error"
        loading={deleteMutation.isPending}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </DashboardContent>
  );
}

import type { QuotationStatus } from '../types';

import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import { PageHeader } from 'src/shared/ui/page-header';
import { DashboardContent } from 'src/layouts/dashboard';
import { SearchNotFound } from 'src/shared/ui/search-not-found';
import { useCreateContract } from 'src/module/contract/features/contracts/hooks/use-contracts';
import {
  useTable,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { useQuotationList } from '../hooks/use-quotation-list';
import { useQuotationDialog } from '../hooks/use-quotation-dialog';
import { QuotationTableRow } from '../components/quotation-table-row';
import { QuotationFormDialog } from '../components/quotation-form-dialog';
import { QuotationDetailDialog } from '../components/quotation-detail-dialog';

const STATUSES: QuotationStatus[] = ['draft', 'shared', 'signed', 'contract_created'];

export function QuotationListView() {
  const { t } = useTranslate('quotation');
  const { t: tCommon } = useTranslate('common');
  const table = useTable({ defaultRowsPerPage: 25, defaultDense: true });
  const dialog = useQuotationDialog();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuotationStatus | ''>('');
  
  const createContract = useCreateContract();

  const params = useMemo(
    () => ({ page: table.page + 1, limit: table.rowsPerPage, search, status }),
    [search, status, table.page, table.rowsPerPage]
  );
  const { data, meta, loading, error, refresh } = useQuotationList(params);

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'number', label: t('table.number') },
      { id: 'client', label: t('table.client') },
      { id: 'budget', label: t('table.budget') },
      { id: 'projectType', label: t('table.projectType') },
      { id: 'status', label: t('table.status') },
      { id: 'createdAt', label: t('table.createdAt') },
      { id: 'revision', label: t('table.revision') },
      { id: 'actions', label: t('table.actions'), align: 'right' as const },
    ],
    [t]
  );

  const handleSaved = useCallback(
    (quotation: { id: string }) => {
      dialog.close();
      refresh();
      dialog.open('view', quotation.id);
      toast.success(t('feedback.saved'));
    },
    [dialog, refresh, t]
  );

  const handleCreateContract = useCallback(
    async (id: string) => {
      try {
        await createContract.mutateAsync({ quotation_id: id });
        toast.success(t('feedback.contractCreated'));
        dialog.close();
        refresh();
        // Option 1: navigate to contracts list
        // router.push(paths.dashboard.contract.root); 
      } catch (err: any) {
        toast.error(err.message || 'Failed to create contract');
      }
    },
    [createContract, dialog, refresh, t]
  );

  const showSkeletons = loading && data.length === 0;
  const isEmpty = !loading && data.length === 0;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => dialog.open('new')}
          >
            {t('buttons.new')}
          </Button>
        }
      />

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            fullWidth
            value={search}
            placeholder={t('toolbar.searchPlaceholder')}
            onChange={(event) => {
              setSearch(event.target.value);
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
          />
          <TextField
            select
            value={status}
            label={t('toolbar.status')}
            onChange={(event) => {
              setStatus(event.target.value as QuotationStatus | '');
              table.onResetPage();
            }}
            sx={{ width: { xs: 1, md: 220 } }}
          >
            <MenuItem value="">{t('toolbar.allStatuses')}</MenuItem>
            {STATUSES.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`statuses.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Divider />
        {error && (
          <Alert severity="error" sx={{ m: 2.5 }}>
            {error}
          </Alert>
        )}
        <TableContainer>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1080 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {showSkeletons && (
                  <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} />
                )}
                {data.map((row) => (
                  <QuotationTableRow
                    key={row.id}
                    row={row}
                    onView={(id) => dialog.open('view', id)}
                    onEdit={(id) => dialog.open('edit', id)}
                  />
                ))}
                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      {search || status ? (
                        <SearchNotFound query={search} sx={{ py: 8 }} />
                      ) : (
                        <Stack spacing={0.5} sx={{ py: 8, textAlign: 'center' }}>
                          <strong>{t('list.emptyTitle')}</strong>
                          <span>{t('list.emptySubtitle')}</span>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
        <TablePaginationCustom
          component="div"
          page={table.page}
          count={meta.total}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          labelRowsPerPage={tCommon('pagination.rowsPerPage')}
        />
      </Card>

      <QuotationFormDialog
        open={dialog.mode === 'new' || dialog.mode === 'edit'}
        mode={dialog.mode === 'edit' ? 'edit' : 'new'}
        id={dialog.mode === 'edit' ? dialog.id : null}
        onClose={dialog.close}
        onSaved={handleSaved}
      />
      <QuotationDetailDialog
        open={dialog.mode === 'view'}
        id={dialog.mode === 'view' ? dialog.id : null}
        onClose={dialog.close}
        onEdit={(id) => dialog.open('edit', id)}
        onCreateContract={handleCreateContract}
      />
    </DashboardContent>
  );
}

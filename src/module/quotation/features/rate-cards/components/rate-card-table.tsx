import type { RateCardSummaryResponse } from '../types';

import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';
import { Scrollbar } from 'src/shared/ui/scrollbar';
import {
  TableNoData,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/shared/ui/table';

import { RateCardTableRow } from './rate-card-table-row';

interface Props {
  rows: RateCardSummaryResponse[];
  loading?: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onView: (id: string) => void;
  onDelete: (row: RateCardSummaryResponse) => void;
  onSetDefault?: (id: string) => void;
  notFound?: boolean;
}

export function RateCardTable({
  rows,
  loading = false,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onDelete,
  onSetDefault,
  notFound = false,
}: Props) {
  const { t } = useTranslate('rate_card');

  const TABLE_HEAD = useMemo(
    () => [
      { id: 'code', label: t('table.code'), width: 140 },
      { id: 'name', label: t('table.name'), minWidth: 220 },
      { id: 'client_tier', label: t('table.clientTier'), width: 180 },
      { id: 'market', label: t('table.market'), width: 140 },
      { id: 'currency', label: t('table.currency'), width: 100 },
      { id: 'item_count', label: t('table.itemCount'), width: 130, align: 'center' as const },
      { id: 'is_active', label: t('table.status'), width: 120, align: 'center' as const },
      { id: 'actions', label: t('table.actions'), width: 110, align: 'right' as const },
    ],
    [t]
  );

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  return (
    <Card>
      <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
        <Scrollbar>
          <Table size="medium" sx={{ minWidth: 900 }}>
            <TableHeadCustom headCells={TABLE_HEAD} />

            <TableBody>
              {loading ? (
                Array.from({ length: Math.min(rowsPerPage, 5) }).map((_, index) => (
                  <TableSkeleton key={index} sx={{ height: 60 }} />
                ))
              ) : (
                <>
                  {paginatedRows.map((row) => (
                    <RateCardTableRow
                      key={row.id}
                      row={row}
                      onView={onView}
                      onDelete={onDelete}
                      onSetDefault={onSetDefault}
                    />
                  ))}

                  <TableNoData
                    notFound={notFound || (!loading && rows.length === 0)}
                    message={t('table.noDataTitle')}
                  />
                </>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePaginationCustom
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Card>
  );
}

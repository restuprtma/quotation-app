import { useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { PROCESS_BLUEPRINT_STATUSES, type GenerationStatus } from '../types';
import { useBlueprintList } from '../hooks/use-blueprint';
import { BlueprintListTable } from '../components/blueprint-list-table';

export type BlueprintListViewProps = {
  mode: 'process' | 'completed';
};

export function BlueprintListView({ mode }: BlueprintListViewProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(() => {
    const raw = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(raw) || raw < 1 ? 1 : raw;
  }, [searchParams]);

  const limit = useMemo(() => {
    const raw = parseInt(searchParams.get('limit') || '20', 10);
    return isNaN(raw) || raw < 1 ? 20 : raw;
  }, [searchParams]);

  const statuses: GenerationStatus[] = useMemo(
    () => (mode === 'process' ? PROCESS_BLUEPRINT_STATUSES : ['completed']),
    [mode]
  );

  const { data, isLoading, error } = useBlueprintList({
    statuses,
    page,
    limit,
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      });
    },
    [setSearchParams]
  );

  const handleLimitChange = useCallback(
    (newLimit: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('limit', String(newLimit));
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams]
  );

  const title = mode === 'process' ? 'Proses Blueprint' : 'Daftar Blueprint';
  const subtitle =
    mode === 'process'
      ? 'Pantau dan lanjutkan generasi blueprint arsitektur yang sedang berjalan atau membutuhkan pemulihan.'
      : 'Daftar blueprint arsitektur sistem yang telah selesai dibuat.';
  const emptyMessage =
    mode === 'process'
      ? 'Tidak ada proses blueprint yang sedang berjalan atau membutuhkan pemulihan.'
      : 'Belum ada blueprint yang selesai dibuat.';

  const items = data?.items || [];
  const total = data?.total ?? items.length;

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h4">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => navigate(paths.dashboard.blueprint.create)}
          >
            Buat Blueprint
          </Button>
        </Stack>

        {/* Table */}
        <BlueprintListTable
          items={items}
          total={total}
          page={page}
          limit={limit}
          isLoading={isLoading}
          error={error}
          emptyMessage={emptyMessage}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </Stack>
    </DashboardContent>
  );
}

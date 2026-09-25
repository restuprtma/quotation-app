import type { BlueprintListItem, GenerationStatus } from '../types';

import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/shared/ui/iconify';
import { TablePaginationCustom } from 'src/shared/ui/table';

export type BlueprintListTableProps = {
  items: BlueprintListItem[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
};

export function getBlueprintStatusChip(status: GenerationStatus | string) {
  switch (status) {
    case 'completed':
      return <Chip size="small" label="Selesai" color="success" variant="soft" />;
    case 'in_progress':
      return <Chip size="small" label="Sedang Berjalan" color="info" variant="soft" />;
    case 'partial_failed':
      return <Chip size="small" label="Menunggu input / pemulihan" color="warning" variant="soft" />;
    case 'failed':
      return <Chip size="small" label="Gagal / butuh pemulihan" color="warning" variant="soft" />;
    case 'pending':
      return <Chip size="small" label="Menunggu" color="default" variant="soft" />;
    default:
      return <Chip size="small" label={status} color="default" variant="soft" />;
  }
}

export function BlueprintListTable({
  items,
  total,
  page,
  limit,
  isLoading = false,
  error = null,
  emptyMessage = 'Tidak ada blueprint.',
  onPageChange,
  onLimitChange,
}: BlueprintListTableProps) {
  const navigate = useNavigate();

  const handleOpenBlueprint = (blueprintId: string) => {
    navigate(paths.dashboard.blueprint.detail(blueprintId));
  };

  return (
    <Card>
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error.message || 'Gagal memuat data blueprint.'}</Alert>
        </Box>
      )}

      {isLoading ? (
        <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      ) : items.length > 0 ? (
        <>
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Judul</TableCell>
                  <TableCell>Status Generasi</TableCell>
                  <TableCell>Terakhir Diperbarui</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.blueprint_id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{item.title}</Typography>
                    </TableCell>
                    <TableCell>{getBlueprintStatusChip(item.generation_status)}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.updated_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<Iconify icon="solar:arrow-right-bold" />}
                        onClick={() => handleOpenBlueprint(item.blueprint_id)}
                      >
                        Buka
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePaginationCustom
            count={total}
            page={Math.max(0, page - 1)}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 20, 50]}
            onPageChange={(_event, newPageZeroIndexed) => onPageChange(newPageZeroIndexed + 1)}
            onRowsPerPageChange={(event) => onLimitChange(parseInt(event.target.value, 10))}
          />
        </>
      ) : (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      )}
    </Card>
  );
}

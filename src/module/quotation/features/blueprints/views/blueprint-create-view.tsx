import type { QuotationOption } from '../types';

import { useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { listBlueprints } from '../api';
import { useBlueprintList } from '../hooks/use-blueprint';
import { BlueprintSourceForm } from '../components/blueprint-source-form';
import { useQuotationList } from '../../quotations/hooks/use-quotation-list';

export function BlueprintCreateView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialQuotationId = searchParams.get('quotation_id') || '';
  const initialRevisionId = searchParams.get('revision_id') || '';

  const { data: quotationsData } = useQuotationList({ limit: 100 });
  const { data: blueprintListData, isLoading: isLoadingBlueprints } = useBlueprintList();

  const quotationOptions: QuotationOption[] = useMemo(
    () =>
      (quotationsData || []).map((q: any) => ({
        id: q.id,
        quotation_number: q.quotation_number,
        subject: q.subject ?? null,
        status: q.status,
        commercial_scheme: q.commercial_scheme ?? '',
      })),
    [quotationsData]
  );

  const handleDuplicateFound = useCallback(
    async (quotationId: string) => {
      // Check in loaded blueprint list first
      const existing = blueprintListData?.items.find((bp) => bp.quotation_id === quotationId);
      if (existing) {
        navigate(`/blueprint/${existing.blueprint_id}`);
        return;
      }

      // If not in list, fetch list with filter
      try {
        const result = await listBlueprints(quotationId);
        if (result.items && result.items.length > 0) {
          navigate(`/blueprint/${result.items[0].blueprint_id}`);
        } else {
          toast.error('Blueprint untuk quotation ini tidak ditemukan.');
        }
      } catch (err: any) {
        toast.error('Gagal memuat blueprint yang ada: ' + (err.message || 'Error'));
      }
    },
    [blueprintListData?.items, navigate]
  );

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip size="small" label="Selesai" color="success" variant="soft" />;
      case 'in_progress':
        return <Chip size="small" label="Sedang Berjalan" color="info" variant="soft" />;
      case 'partial_failed':
      case 'failed':
        return <Chip size="small" label="Gagal / Butuh Pemulihan" color="warning" variant="soft" />;
      default:
        return <Chip size="small" label={status} color="default" variant="soft" />;
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={4}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">Blueprint Generator</Typography>
            <Typography variant="body2" color="text.secondary">
              Buat dan kelola blueprint arsitektur sistem dari quotation yang telah disetujui.
            </Typography>
          </Box>
        </Stack>

        {/* Create Form */}
        <BlueprintSourceForm
          quotations={quotationOptions}
          initialQuotationId={initialQuotationId}
          initialRevisionId={initialRevisionId}
          onSubmitSuccess={(status) => {
            toast.success('Blueprint berhasil dibuat!');
            navigate(`/blueprint/${status.blueprint_id}`);
          }}
          onDuplicateFound={handleDuplicateFound}
        />

        {/* Tenant Blueprint List for Resume */}
        <Card>
          <CardHeader
            title="Daftar Blueprint Tenant"
            subheader="Lanjutkan proses generasi atau buka blueprint yang sudah ada."
          />
          {isLoadingBlueprints ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : blueprintListData?.items && blueprintListData.items.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Judul</TableCell>
                    <TableCell>Status Generasi</TableCell>
                    <TableCell>Terakhir Diperbarui</TableCell>
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blueprintListData.items.map((item) => (
                    <TableRow key={item.blueprint_id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{item.title}</Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(item.generation_status)}</TableCell>
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
                          onClick={() => navigate(`/blueprint/${item.blueprint_id}`)}
                        >
                          Buka
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Belum ada blueprint yang dibuat untuk tenant ini.
              </Typography>
            </Box>
          )}
        </Card>
      </Stack>
    </DashboardContent>
  );
}

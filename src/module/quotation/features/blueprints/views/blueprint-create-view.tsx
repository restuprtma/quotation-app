import type { QuotationOption } from '../types';

import { useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { toast } from 'src/shared/ui/snackbar';
import { DashboardContent } from 'src/layouts/dashboard';

import { listBlueprints } from '../api';
import { BlueprintSourceForm } from '../components/blueprint-source-form';
import { useQuotationList } from '../../quotations/hooks/use-quotation-list';

export function BlueprintCreateView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialQuotationId = searchParams.get('quotation_id') || '';
  const initialRevisionId = searchParams.get('revision_id') || '';

  const { data: quotationsData } = useQuotationList({ limit: 100 });

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
      try {
        const result = await listBlueprints({ quotationId, page: 1, limit: 1 });
        if (result.items && result.items.length > 0) {
          navigate(`/blueprint/${result.items[0].blueprint_id}`);
        } else {
          toast.error('Blueprint untuk quotation ini tidak ditemukan.');
        }
      } catch (err: any) {
        toast.error('Gagal memuat blueprint yang ada: ' + (err.message || 'Error'));
      }
    },
    [navigate]
  );

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
      </Stack>
    </DashboardContent>
  );
}

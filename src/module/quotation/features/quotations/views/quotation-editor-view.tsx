import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { useQuotationDraft } from '../hooks/use-quotation-draft';
import { QuotationEditor } from '../components/quotation-editor';

type Props = {
  id?: string;
};

export function QuotationEditorView({ id }: Props) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuotationDraft(id);

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => navigate(paths.dashboard.quotation.root)}
            >
              Back to Prompt
            </Button>
            <Typography variant="h4">{data?.subject || 'Quotation Editor'}</Typography>
          </Stack>
          {data && (
            <Typography variant="body2" color="text.secondary">
              Nomor: <strong>{data.quotation_number}</strong> (v{data.content_version})
            </Typography>
          )}
        </Stack>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="subtitle1">
              Failed to load draft: {error.message}
            </Typography>
          </Card>
        ) : (
          <QuotationEditor
            content={data?.content_html || '<p>No document content generated.</p>'}
          />
        )}
      </Stack>
    </DashboardContent>
  );
}

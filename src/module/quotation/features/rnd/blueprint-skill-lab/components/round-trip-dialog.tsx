import type { RoundTripResult } from '../types';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  result: RoundTripResult | null;
  onClose: () => void;
};

export function RoundTripDialog({ open, result, onClose }: Props) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(result.serializedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Icon
            icon={result.isMatch ? 'solar:check-circle-bold' : 'solar:danger-triangle-bold'}
            width={28}
            color={result.isMatch ? theme.palette.success.main : theme.palette.error.main}
          />
          <Typography variant="h6">Round-Trip Serialization Verification</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <Icon icon="solar:close-circle-bold" width={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {result.isMatch ? (
            <Alert
              severity="success"
              variant="filled"
              sx={{ color: '#fff', '& .MuiAlert-icon': { color: '#fff' } }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                PASS: 100% Identical Round-Trip State
              </Typography>
              <Typography variant="body2">
                Seluruh data visual dari User Journey, System Architecture, State Machine,
                Workflows, WBS, dan Cross References berhasil diserialisasi ke JSON v1.0 dan dimuat
                ulang tanpa kehilangan atribut atau perubahan tipe data.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="error" variant="filled">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                MISMATCH: Ditemukan {result.diffs.length} Perbedaan State
              </Typography>
              <Typography variant="body2">
                Serialisasi menghasilkan perbedaan nilai atau struktur properti yang tidak sinkron.
              </Typography>
            </Alert>
          )}

          {/* Diffs Table if any */}
          {result.diffs.length > 0 && (
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'error.main' }}>
                Daftar Mismatch Properti:
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Path Properti</TableCell>
                    <TableCell>State Asal (Expected)</TableCell>
                    <TableCell>Parsed State (Actual)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.diffs.map((d, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {d.path}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {JSON.stringify(d.expected)}
                      </TableCell>
                      <TableCell sx={{ color: 'error.main' }}>{JSON.stringify(d.actual)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* JSON Summary Metrics & Viewer */}
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle2">
                Serialized JSON Payload (bundle-schema v1.0):
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Icon icon={copied ? 'solar:check-read-bold' : 'solar:copy-bold'} />}
                onClick={handleCopyJson}
              >
                {copied ? 'Tersalin!' : 'Salin JSON'}
              </Button>
            </Box>

            <Box
              component="pre"
              sx={{
                p: 2,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.grey[900], 0.95),
                color: '#38bdf8',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.75rem',
                lineHeight: 1.45,
                maxHeight: 320,
                overflowY: 'auto',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {result.serializedJson}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import React, { useEffect, useState } from 'react';
import axiosInstance from 'src/shared/lib/axios';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, Stack, Chip } from '@mui/material';
import { Icon } from '@iconify/react';

interface LegalTemplate {
  id: string;
  title: string;
  version: string;
}

export const LegalTemplateViewer = () => {
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/quotation/v1/legal-templates?status=active')
      .then(res => {
        const data = res.data?.data || res.data;
        setTemplates(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setTemplates([
          { id: 'lt-1', title: 'Standard Terms & Conditions', version: 'v1.2' },
          { id: 'lt-2', title: 'MSA Template - Enterprise', version: 'v2.0' },
          { id: 'lt-3', title: 'SLA Addendum', version: 'v1.0' }
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'secondary.main', color: 'secondary.contrastText', display: 'flex' }}>
            <Icon icon="eva:file-text-outline" width={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="600" lineHeight={1.2}>Legal Templates</Typography>
            <Typography variant="caption" color="text.secondary">Active document bases</Typography>
          </Box>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={32} thickness={4} />
        </Box>
      ) : templates.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No legal templates found.</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral', textAlign: 'right' }}>Version</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((lt) => (
                <TableRow key={lt.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.875rem' }}>{lt.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{lt.title}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={lt.version} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', borderRadius: 1, color: 'text.secondary' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

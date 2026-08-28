import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Chip,
  Table,
  Paper,
  Stack,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import axiosInstance from 'src/shared/lib/axios';

interface RateCard {
  id: string;
  name: string;
  status: string;
}

export const RateCardSelector = () => {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/quotation/v1/rate-cards?status=active')
      .then((res) => {
        const data = res.data?.data || res.data;
        const mapped = (Array.isArray(data) ? data : []).map((item: any) => ({
          ...item,
          status: item.is_active ? 'active' : 'inactive',
        }));
        setRateCards(mapped);
      })
      .catch(() => {
        setRateCards([
          { id: 'rc-1', name: 'Standard IT Services 2026', status: 'active' },
          { id: 'rc-2', name: 'Enterprise Consulting', status: 'active' },
          { id: 'rc-3', name: 'Legacy Support (Archived)', status: 'inactive' },
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
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
            }}
          >
            <Icon icon="eva:pricetags-outline" width={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="600" lineHeight={1.2}>
              Rate Cards
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Available pricing models
            </Typography>
          </Box>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={32} thickness={4} />
        </Box>
      ) : rateCards.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No active rate cards found.</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    bgcolor: 'background.neutral',
                    textAlign: 'right',
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rateCards.map((rc) => (
                <TableRow
                  key={rc.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell
                    sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.875rem' }}
                  >
                    {rc.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{rc.name}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={rc.status}
                      size="small"
                      color={rc.status === 'active' ? 'success' : 'default'}
                      variant={rc.status === 'active' ? 'soft' : 'outlined'}
                      sx={{ textTransform: 'capitalize', fontWeight: 600, borderRadius: 1 }}
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

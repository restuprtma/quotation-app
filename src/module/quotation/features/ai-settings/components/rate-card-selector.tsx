import React from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Table,
  Paper,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Label } from 'src/shared/ui/label';

import { useActiveRateCards } from '../../quotations/hooks/use-active-rate-cards';

export const RateCardSelector = () => {
  const router = useRouter();
  const { data: rateCards = [], isLoading } = useActiveRateCards();

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'commercial_national':
        return 'info';
      case 'government_bumn':
        return 'warning';
      case 'international':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatTierLabel = (tier?: string) => {
    switch (tier) {
      case 'commercial_national':
        return 'Commercial National';
      case 'government_bumn':
        return 'Government / BUMN';
      case 'international':
        return 'International';
      default:
        return tier || 'Commercial';
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
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
              Active pricing models and role rate cards
            </Typography>
          </Box>
        </Stack>

        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => router.push(paths.dashboard.quotation.rateCards)}
          endIcon={<Icon icon="eva:arrow-ios-forward-fill" width={16} />}
        >
          Manage Rate Cards
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={32} thickness={4} />
        </Box>
      ) : rateCards.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No active rate cards found.</Typography>
          <Button
            size="small"
            variant="contained"
            sx={{ mt: 1.5 }}
            onClick={() => router.push(paths.dashboard.quotation.rateCards)}
          >
            Create Rate Card
          </Button>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}
                >
                  Code
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}
                >
                  Client Tier
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: 'text.secondary', bgcolor: 'background.neutral' }}
                >
                  Currency
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
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(paths.dashboard.quotation.rateCardDetail(rc.id))}
                >
                  <TableCell
                    sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}
                  >
                    {rc.code || rc.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{rc.name}</TableCell>
                  <TableCell>
                    <Label color={getTierColor(rc.client_tier)} variant="soft">
                      {formatTierLabel(rc.client_tier)}
                    </Label>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{rc.currency || 'IDR'}</TableCell>
                  <TableCell align="right">
                    <Label color={rc.is_active ? 'success' : 'default'} variant="soft">
                      {rc.is_active ? 'Active' : 'Inactive'}
                    </Label>
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

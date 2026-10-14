import type { RateCardSummaryResponse } from '../types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';

import { getClientTierColor } from '../utils/format';

interface Props {
  row: RateCardSummaryResponse;
  onView: (id: string) => void;
  onDelete: (row: RateCardSummaryResponse) => void;
  onSetDefault?: (id: string) => void;
}

export function RateCardTableRow({ row, onView, onDelete, onSetDefault }: Props) {
  const { t } = useTranslate('rate_card');

  const formatClientTier = (tier: string) => {
    switch (tier) {
      case 'commercial_national':
        return t('tiers.commercialNational');
      case 'government_bumn':
        return t('tiers.governmentBumn');
      case 'international':
        return t('tiers.international');
      default:
        return tier;
    }
  };

  return (
    <TableRow hover>
      {/* Code */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Typography
          variant="subtitle2"
          fontWeight="600"
          sx={{
            fontFamily: 'monospace',
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
          onClick={() => onView(row.id)}
        >
          {row.code}
        </Typography>
      </TableCell>

      {/* Name */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            fontWeight="600"
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => onView(row.id)}
          >
            {row.name}
          </Typography>
          {row.is_default && (
            <Label color="primary" variant="soft">
              {t('table.default')}
            </Label>
          )}
        </Box>
      </TableCell>

      {/* Client Tier */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Label color={getClientTierColor(row.client_tier)} variant="soft">
          {formatClientTier(row.client_tier)}
        </Label>
      </TableCell>

      {/* Market */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Label
          color={row.market === 'international' ? 'secondary' : 'default'}
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        >
          {row.market === 'international' ? t('markets.international') : t('markets.national')}
        </Label>
      </TableCell>

      {/* Currency */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Typography variant="body2" fontWeight="500">
          {row.currency || 'IDR'}
        </Typography>
      </TableCell>

      {/* Items Count */}
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Label color="default" variant="soft">
          {row.item_count || 0} {t('table.rolesCount')}
        </Label>
      </TableCell>

      {/* Status */}
      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        <Label color={row.is_active ? 'success' : 'default'} variant="soft">
          {row.is_active ? t('status.active') : t('status.inactive')}
        </Label>
      </TableCell>

      {/* Actions */}
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {!row.is_default && onSetDefault && (
            <Tooltip title={t('actions.setDefault')}>
              <IconButton
                size="small"
                color="warning"
                onClick={() => onSetDefault(row.id)}
                aria-label={t('actions.setDefault')}
              >
                <Iconify icon="solar:star-bold" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={t('actions.viewDetails')}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onView(row.id)}
              aria-label={t('actions.viewDetails')}
            >
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('actions.delete')}>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(row)}
              aria-label={t('actions.delete')}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

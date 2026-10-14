import type { RateCardItem } from '../types';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Iconify } from 'src/shared/ui/iconify';

import { CostBreakdownCard } from './cost-breakdown-card';
import {
  getTermTypeColor,
  getSeniorityColor,
  getDisciplineColor,
  formatCurrencyValue,
} from '../utils/format';

interface Props {
  item: RateCardItem;
  currency?: string;
  onEdit?: (item: RateCardItem) => void;
  onDelete?: (item: RateCardItem) => void;
}

export function RateCardItemRow({ item, currency = 'IDR', onEdit, onDelete }: Props) {
  const { t } = useTranslate('rate_card');
  const [open, setOpen] = useState(false);

  const dailyRate =
    item.daily_rate || (item.amount_per_month ? Math.round(item.amount_per_month / 22) : 0);
  const hourlyRate =
    item.hourly_rate || (item.amount_per_month ? Math.round(item.amount_per_month / 173) : 0);

  return (
    <>
      <TableRow
        hover
        sx={{
          '& > *': { borderBottom: 'unset' },
          bgcolor: open ? 'background.neutral' : 'inherit',
          transition: 'background-color 0.2s',
        }}
      >
        {/* Expand / Collapse Button */}
        <TableCell sx={{ width: 48, pr: 0 }}>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            aria-label="expand row"
            sx={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <Iconify icon="eva:arrow-ios-downward-fill" />
          </IconButton>
        </TableCell>

        {/* Role & Requirements */}
        <TableCell>
          <Box>
            <Typography variant="subtitle2" fontWeight="600" noWrap>
              {item.display_name || item.role}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {item.role}
              {(item.education_requirement || item.experience_requirement) && (
                <>
                  {' • '}
                  {[item.education_requirement, item.experience_requirement]
                    .filter(Boolean)
                    .join(' | ')}
                </>
              )}
            </Typography>
          </Box>
        </TableCell>

        {/* Discipline */}
        <TableCell>
          <Label
            color={getDisciplineColor(item.discipline)}
            variant="soft"
            sx={{ textTransform: 'uppercase' }}
          >
            {item.discipline}
          </Label>
        </TableCell>

        {/* Seniority */}
        <TableCell>
          <Label
            color={getSeniorityColor(item.seniority)}
            variant="soft"
            sx={{ textTransform: 'capitalize' }}
          >
            {item.seniority}
          </Label>
        </TableCell>

        {/* Term Type */}
        <TableCell>
          <Label color={getTermTypeColor(item.term_type)} variant="soft">
            {item.term_type === 'short_term' ? t('terms.shortTerm') : t('terms.longTerm')}
          </Label>
        </TableCell>

        {/* Monthly Rate */}
        <TableCell align="right">
          <Typography variant="body2" fontWeight="700">
            {formatCurrencyValue(item.amount_per_month, currency)}
          </Typography>
        </TableCell>

        {/* Daily Rate */}
        <TableCell align="right">
          <Typography variant="body2" color="text.secondary">
            {formatCurrencyValue(dailyRate, currency)}
          </Typography>
        </TableCell>

        {/* Hourly Rate */}
        <TableCell align="right">
          <Typography variant="body2" color="text.secondary">
            {formatCurrencyValue(hourlyRate, currency)}
          </Typography>
        </TableCell>

        {/* Actions */}
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {onEdit && (
            <IconButton
              size="small"
              color="inherit"
              onClick={() => onEdit(item)}
              aria-label="edit role"
            >
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(item)}
              aria-label="delete role"
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded Breakdown Row */}
      <TableRow>
        <TableCell
          sx={{ py: 0, px: 2, borderBottom: open ? 1 : 0, borderColor: 'divider' }}
          colSpan={9}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2 }}>
              <CostBreakdownCard item={item} currency={currency} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

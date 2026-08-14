import type { Quotation } from '../types';

import { useState } from 'react';

import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { CustomPopover } from 'src/shared/ui/custom-popover';

import { formatDate, formatCurrency } from '../utils/format';
import { QuotationStatusLabel } from './quotation-status-label';

type Props = {
  row: Quotation;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
};

export function QuotationTableRow({ row, onView, onEdit }: Props) {
  const { t } = useTranslate('quotation');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const closeMenu = () => setAnchorEl(null);

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.quotation_number}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.client_name ?? row.client_id}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.revision ? formatCurrency(row.revision.budget) : '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{t(`projectTypes.${row.project_type}`)}</Typography>
        </TableCell>
        <TableCell>
          <QuotationStatusLabel status={row.status} />
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap>
            {formatDate(row.created_at)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {t('table.revisionValue', { number: row.current_revision })}
          </Typography>
        </TableCell>
        <TableCell align="right" onClick={(event) => event.stopPropagation()}>
          <IconButton
            aria-label={t('table.actions')}
            onClick={(event) => setAnchorEl(event.currentTarget)}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={closeMenu}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              closeMenu();
              onView(row.id);
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('rowActions.viewDetail')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onEdit(row.id);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('rowActions.edit')}
          </MenuItem>
          <Divider sx={{ borderStyle: 'dashed' }} />
        </MenuList>
      </CustomPopover>
    </>
  );
}

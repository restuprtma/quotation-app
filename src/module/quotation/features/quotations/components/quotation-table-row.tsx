import type { Quotation } from '../types';

import { toast } from 'sonner';
import { useState } from 'react';

import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { CustomPopover } from 'src/shared/ui/custom-popover';

import { QuotationStatusLabel } from './quotation-status-label';
import { formatDate, formatCurrency, formatCommercialScheme } from '../utils/format';

type Props = {
  row: Quotation;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
};

export function QuotationTableRow({ row, onView, onEdit }: Props) {
  const { t } = useTranslate('quotation');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const closeMenu = () => setAnchorEl(null);

  const rawAmount = row.total_investment ?? row.budget_maximum ?? row.revision?.budget;
  const amount = typeof rawAmount === 'number' && !Number.isNaN(rawAmount) && rawAmount > 0
    ? rawAmount
    : null;
  const displayInvestment = amount !== null ? formatCurrency(amount) : '—';

  const clientName = row.client_name?.trim();
  const picName = row.pic_name?.trim();
  const primaryClient = clientName || picName || '—';
  const showPicSubtitle = !!(clientName && picName && clientName !== picName);

  const isPublicAvailable =
    (row.status === 'published' || row.status === 'signed') && Boolean(row.public_token);
  const publicUrl = isPublicAvailable
    ? `${window.location.origin}${paths.public.quotation(row.public_token)}`
    : '';

  const handleCopyLink = async (event: React.MouseEvent) => {
    event.stopPropagation();
    closeMenu();
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t('editor.publicLinkCopied') || 'Link berhasil disalin!');
    } catch {
      toast.error(t('editor.copyFailed') || 'Gagal menyalin link');
    }
  };

  const handleOpenLink = (event: React.MouseEvent) => {
    event.stopPropagation();
    closeMenu();
    if (!publicUrl) return;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => onView(row.id)}>
        <TableCell>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {row.quotation_number}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {primaryClient}
          </Typography>
          {showPicSubtitle && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {picName}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap>
            {displayInvestment}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {formatCommercialScheme(row.commercial_scheme, row.solution_type, t)}
          </Typography>
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
          {isPublicAvailable && (
            <Tooltip title={t('rowActions.copyPublicLink') || 'Salin Link Publik'}>
              <IconButton
                data-testid="copy-public-link-btn"
                aria-label="copy-public-link"
                color="primary"
                onClick={handleCopyLink}
              >
                <Iconify icon="eva:link-2-fill" />
              </IconButton>
            </Tooltip>
          )}

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
              if (onEdit) {
                onEdit(row.id);
              } else {
                onView(row.id);
              }
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('rowActions.edit')}
          </MenuItem>

          {isPublicAvailable && (
            <MenuItem onClick={handleCopyLink}>
              <Iconify icon="eva:link-2-fill" />
              {t('rowActions.copyPublicLink') || 'Salin Link Publik'}
            </MenuItem>
          )}

          {isPublicAvailable && (
            <MenuItem onClick={handleOpenLink}>
              <Iconify icon="eva:external-link-fill" />
              {t('rowActions.openPublicLink') || 'Buka Link Publik'}
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>
    </>
  );
}

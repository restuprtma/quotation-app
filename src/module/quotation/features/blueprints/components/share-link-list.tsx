import type { ShareLinkItem } from '../types/share-links';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/shared/ui/iconify';
import { fDateTime } from 'src/shared/utils/format-time';

export interface ShareLinkListProps {
  links: ShareLinkItem[];
  onRevoke: (linkId: string) => void;
}

export function ShareLinkList({ links, onRevoke }: ShareLinkListProps) {
  if (links.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Belum ada tautan berbagi aktif.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Label</TableCell>
            <TableCell>Revisi</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Terakhir Diakses</TableCell>
            <TableCell>Dibuat Pada</TableCell>
            <TableCell align="right">Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{link.label}</TableCell>
              <TableCell>Revisi {link.revision_number}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={link.is_revoked ? 'Dicabut' : 'Aktif'}
                  color={link.is_revoked ? 'default' : 'success'}
                  variant="soft"
                />
              </TableCell>
              <TableCell>
                {link.last_accessed_at ? fDateTime(link.last_accessed_at) : 'Belum Pernah'}
              </TableCell>
              <TableCell>{fDateTime(link.created_at)}</TableCell>
              <TableCell align="right">
                {!link.is_revoked && (
                  <IconButton
                    size="small"
                    color="error"
                    title="Cabut Akses"
                    onClick={() => onRevoke(link.id)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

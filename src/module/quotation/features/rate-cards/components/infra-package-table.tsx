import type { InfrastructurePackage } from '../types';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';
import { Label } from 'src/shared/ui/label';
import { Scrollbar } from 'src/shared/ui/scrollbar';

import { formatCurrencyValue } from '../utils/format';

interface Props {
  packages: InfrastructurePackage[];
  currency?: string;
}

export function InfraPackageTable({ packages, currency = 'IDR' }: Props) {
  const { t } = useTranslate('rate_card');

  if (packages.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('infra.noPackages')}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer>
        <Scrollbar>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.neutral' }}>
                <TableCell sx={{ fontWeight: 600 }}>{t('infra.packageName')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('infra.category')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('infra.vcpu')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('infra.ram')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('infra.storage')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {t('infra.amountPerMonth')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.map((pkg, idx) => (
                <TableRow key={pkg.id || idx} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="600">
                      {pkg.package_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Label
                      color={pkg.category === 'vps_cloud' ? 'primary' : 'default'}
                      variant="soft"
                    >
                      {pkg.category === 'vps_cloud' ? 'VPS / Cloud' : 'Shared Hosting'}
                    </Label>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{pkg.vcpu ? `${pkg.vcpu} vCPU` : '-'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{pkg.ram_gb ? `${pkg.ram_gb} GB` : '-'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {pkg.storage_gb ? `${pkg.storage_gb} GB SSD` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      {formatCurrencyValue(pkg.amount_per_month, currency)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Paper>
  );
}

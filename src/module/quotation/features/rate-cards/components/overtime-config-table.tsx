import type { OvertimeRateConfig } from '../types';

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

import {
  getTermTypeColor,
  getSeniorityColor,
  formatCurrencyValue,
} from '../utils/format';

interface Props {
  configs: OvertimeRateConfig[];
  currency?: string;
}

export function OvertimeConfigTable({ configs, currency = 'IDR' }: Props) {
  const { t } = useTranslate('rate_card');

  if (configs.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('overtime.noConfigs')}
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
                <TableCell sx={{ fontWeight: 600 }}>{t('table.role')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('table.seniority')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('table.termType')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {t('overtime.baseMonthlyRate')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {t('overtime.hourlyDivisor')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {t('overtime.hourlyRate')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('overtime.workdayRate')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('overtime.holidayRate')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((cfg, idx) => (
                <TableRow key={cfg.id || idx} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="600">
                      {cfg.role}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Label color={getSeniorityColor(cfg.seniority)} variant="soft">
                      {cfg.seniority}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Label color={getTermTypeColor(cfg.term_type)} variant="soft">
                      {cfg.term_type === 'short_term' ? t('terms.shortTerm') : t('terms.longTerm')}
                    </Label>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="600">
                      {formatCurrencyValue(cfg.base_monthly_rate, currency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {cfg.hourly_divisor || 173} hrs
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      {formatCurrencyValue(
                        cfg.hourly_rate || Math.round(cfg.base_monthly_rate / (cfg.hourly_divisor || 173)),
                        currency
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      1.5x (h1) / 2.0x (h2+)
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      2.0x (1-8h) / 3.0x (9h) / 4.0x (10h+)
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

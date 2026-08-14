import type { ChipProps } from '@mui/material/Chip';
import type { QuotationStatus } from '../types';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { statusColor } from '../utils/format';

type Props = Omit<ChipProps, 'color' | 'label'> & { status: QuotationStatus };

export function QuotationStatusLabel({ status, ...other }: Props) {
  const { t } = useTranslate('quotation');

  return (
    <Chip size="small" color={statusColor(status)} label={t(`statuses.${status}`)} {...other} />
  );
}

import type { RoundTripReport } from '../types';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

type RoundTripReportViewProps = {
  report: RoundTripReport | null;
};

export function RoundTripReportView({ report }: RoundTripReportViewProps) {
  const { t } = useTranslate('quotation-skill-lab');

  if (!report) return null;

  return (
    <Stack spacing={2}>
      <Alert severity={report.passed ? 'success' : 'error'}>
        <Typography variant="subtitle2">
          {t(`report.status.${report.passed ? 'passed' : 'failed'}`)}
        </Typography>
        <Typography variant="body2">{t(`scenarios.${report.scenario}`)}</Typography>
      </Alert>

      <Stack component="ul" spacing={1} sx={{ p: 0, m: 0, listStyle: 'none' }}>
        {report.invariants.map((invariant) => (
          <Stack
            component="li"
            direction="row"
            spacing={1}
            key={invariant.id}
            sx={{ alignItems: 'flex-start' }}
          >
            <Iconify
              width={20}
              icon={invariant.passed ? 'solar:check-circle-bold' : 'solar:danger-bold'}
              sx={{
                mt: 0.25,
                flexShrink: 0,
                color: invariant.passed ? 'success.main' : 'error.main',
              }}
            />
            <Stack spacing={0.25}>
              <Typography variant="body2">{t(invariant.labelKey)}</Typography>
              {invariant.detail && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}
                >
                  {invariant.detail}
                </Typography>
              )}
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Typography variant="subtitle2">{t('report.evidence.title')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <ReadOnlyHTML label={t('report.evidence.source')} html={report.sourceHTML} />
            <ReadOnlyHTML label={t('report.evidence.recreated')} html={report.recreatedHTML} />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

function ReadOnlyHTML({ label, html }: { label: string; html: string }) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography
        component="pre"
        variant="caption"
        sx={{
          p: 1.5,
          m: 0,
          maxHeight: 320,
          overflow: 'auto',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.neutral',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {html}
      </Typography>
    </Stack>
  );
}

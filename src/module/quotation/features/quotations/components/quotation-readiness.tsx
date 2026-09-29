import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

type Props = {
  readiness: string;
};

const readinessCopy = {
  incomplete: {
    severity: 'warning' as const,
    title: 'More information required',
    description: 'More information is required before this quotation can be finalized.',
  },
  priceable: {
    severity: 'info' as const,
    title: 'Price ready for review',
    description: 'Initial price is available; review remaining assumptions before finalization.',
  },
  ready_for_final: {
    severity: 'success' as const,
    title: 'Ready for review and finalization',
    description: 'All current prompt-first inputs are confirmed and reconciled.',
  },
};

// This indicator is intentionally display-only. Readiness is not a lifecycle
// transition and never exposes share or publish controls.
export function QuotationReadiness({ readiness }: Props) {
  const copy = readinessCopy[readiness as keyof typeof readinessCopy] ?? readinessCopy.incomplete;

  return (
    <Alert severity={copy.severity} variant="outlined" role="status">
      <AlertTitle>{copy.title}</AlertTitle>
      {copy.description}
    </Alert>
  );
}

import type { DraftIssue } from '../types/prompt-first';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = {
  issues: DraftIssue[];
  blockingLabel: string;
  warningLabel: string;
};

export function PromptIssueList({ issues, blockingLabel, warningLabel }: Props) {
  if (!issues.length) return null;

  return (
    <Stack spacing={1} aria-live="polite">
      {issues.map((issue) => {
        const blocking = issue.severity === 'blocking';
        return (
          <Alert
            key={`${issue.code}-${issue.field}`}
            severity={blocking ? 'error' : 'warning'}
            variant="outlined"
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Chip
                size="small"
                color={blocking ? 'error' : 'warning'}
                label={blocking ? blockingLabel : warningLabel}
              />
              <Typography variant="body2">{issue.message}</Typography>
            </Stack>
          </Alert>
        );
      })}
    </Stack>
  );
}

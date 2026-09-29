import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

type Props = {
  message: string;
  focusLabel: string;
  onFocusEditor?: () => void;
};

export function PromptCommercialLock({ message, focusLabel, onFocusEditor }: Props) {
  return (
    <Alert
      role="note"
      severity="info"
      sx={{ mb: 1 }}
      action={
        <Button color="inherit" size="small" onClick={onFocusEditor}>
          {focusLabel}
        </Button>
      }
    >
      <Stack component="span" direction="row" alignItems="center" spacing={1}>
        {message}
      </Stack>
    </Alert>
  );
}

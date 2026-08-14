import type { AIBlueprint } from '../types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

type Props = {
  blueprint?: AIBlueprint | null;
  compact?: boolean;
};

export function BlueprintRenderer({ blueprint, compact = false }: Props) {
  const { t } = useTranslate('quotation');
  
  if (!blueprint) {
    return (
      <Box sx={{ py: compact ? 2 : 5, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('blueprint.empty')}
        </Typography>
      </Box>
    );
  }

  const diagrams = blueprint.diagrams || [];

  return (
    <Stack spacing={compact ? 1.5 : 2.5}>
      <Stack spacing={1}>
        <Typography variant={compact ? 'subtitle2' : 'subtitle1'}>{blueprint.title}</Typography>
        <Typography variant="body2">{blueprint.summary}</Typography>
      </Stack>

      <Stack spacing={compact ? 1.5 : 2}>
        {diagrams.map((diagram, index) => (
          <Card
            key={index}
            variant="outlined"
            sx={{ p: compact ? 1.5 : 2.5 }}
          >
            <Stack spacing={1.5}>
              <Typography variant={compact ? 'subtitle2' : 'h6'}>{diagram.title} ({diagram.type})</Typography>
              {diagram.description && (
                <Typography variant="body2" color="text.secondary">
                  {diagram.description}
                </Typography>
              )}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

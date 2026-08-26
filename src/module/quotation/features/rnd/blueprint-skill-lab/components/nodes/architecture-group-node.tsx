import type { NodeProps } from '@xyflow/react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type ArchitectureGroupNodeData = {
  id: string;
  label: string;
  order: number;
};

export function ArchitectureGroupNode({
  data,
  selected,
}: NodeProps & { data: ArchitectureGroupNodeData }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 2,
        border: `2px dashed ${
          selected ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.24)
        }`,
        backgroundColor: alpha(theme.palette.background.neutral, 0.35),
        boxShadow: selected ? theme.customShadows?.z8 || 3 : 'none',
        p: 2,
        position: 'relative',
        transition: theme.transitions.create(['border-color', 'box-shadow', 'background-color'], {
          duration: theme.transitions.duration.shorter,
        }),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
          userSelect: 'none',
        }}
      >
        <Chip
          label={`Tier ${data.order || 1}`}
          size="small"
          color="primary"
          variant="soft"
          sx={{
            height: 22,
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {data.label}
        </Typography>
      </Box>
    </Box>
  );
}

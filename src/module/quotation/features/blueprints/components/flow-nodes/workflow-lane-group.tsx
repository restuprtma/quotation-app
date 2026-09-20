import type { NodeProps } from '@xyflow/react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type WorkflowLaneGroupData = {
  id: string;
  label: string;
  order: number;
  highlighted?: boolean;
};

export function WorkflowLaneGroup({ data, selected }: NodeProps & { data: WorkflowLaneGroupData }) {
  const theme = useTheme();
  const isHighlighted = Boolean(data.highlighted);
  const neutralBg =
    (theme.palette.background as any)?.neutral || theme.palette.grey?.[200] || '#f4f6f8';

  return (
    <Box
      data-testid={`lane-group-${data.id}`}
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 2,
        border: `1.5px dashed ${
          selected || isHighlighted
            ? theme.palette.primary.main
            : alpha(theme.palette.text.secondary, 0.24)
        }`,
        backgroundColor: alpha(neutralBg, (data.order || 1) % 2 === 0 ? 0.35 : 0.2),
        boxShadow: selected || isHighlighted ? theme.customShadows?.z8 || 3 : 'none',
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
          label={`Lane ${data.order || 1}`}
          size="small"
          color="info"
          variant="soft"
          sx={{
            height: 20,
            fontSize: '0.675rem',
            fontWeight: 700,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            letterSpacing: 0.5,
            fontSize: '0.825rem',
          }}
        >
          {data.label}
        </Typography>
      </Box>
    </Box>
  );
}

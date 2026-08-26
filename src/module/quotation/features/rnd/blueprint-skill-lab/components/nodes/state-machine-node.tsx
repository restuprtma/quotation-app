import type { NodeProps } from '@xyflow/react';
import type { StateType } from '../../types';

import { Icon } from '@iconify/react';
import { Handle, Position } from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type StateMachineNodeData = {
  id: string;
  label: string;
  type: StateType;
  isInitial?: boolean;
  entity?: string;
};

const STATE_CONFIG: Record<
  StateType,
  {
    icon: string;
    label: string;
    colorHex: string;
    bgAlpha: number;
  }
> = {
  normal: {
    icon: 'solar:round-transfer-vertical-bold',
    label: 'Normal',
    colorHex: '#2065d1', // primary blue
    bgAlpha: 0.08,
  },
  terminal: {
    icon: 'solar:check-circle-bold',
    label: 'Terminal',
    colorHex: '#22c55e', // success green
    bgAlpha: 0.1,
  },
  exception: {
    icon: 'solar:danger-triangle-bold',
    label: 'Exception',
    colorHex: '#ef4444', // error red
    bgAlpha: 0.1,
  },
};

export function StateMachineNode({ data, selected }: NodeProps & { data: StateMachineNodeData }) {
  const theme = useTheme();
  const config = STATE_CONFIG[data.type] || STATE_CONFIG.normal;
  const isInitial = Boolean(data.isInitial);

  return (
    <Card
      sx={{
        width: 200,
        minHeight: 76,
        p: 1.5,
        borderRadius: 2,
        border: isInitial
          ? `2.5px solid ${selected ? theme.palette.warning.dark : theme.palette.warning.main}`
          : data.type === 'terminal'
            ? `2.5px double ${selected ? theme.palette.success.dark : config.colorHex}`
            : `2px solid ${selected ? theme.palette.primary.main : alpha(config.colorHex, 0.45)}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: selected ? theme.customShadows?.z12 || 4 : theme.customShadows?.z4 || 1,
        transition: theme.transitions.create(['border-color', 'box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          boxShadow: theme.customShadows?.z8 || 3,
          borderColor: config.colorHex,
        },
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: 8,
          height: 8,
          backgroundColor: config.colorHex,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          width: 8,
          height: 8,
          backgroundColor: config.colorHex,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: 8,
          height: 8,
          backgroundColor: config.colorHex,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: 8,
          height: 8,
          backgroundColor: config.colorHex,
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />

      {/* Initial Badge Indicator */}
      {isInitial && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: 10,
            zIndex: 2,
          }}
        >
          <Chip
            size="small"
            label="INITIAL"
            icon={<Icon icon="solar:play-circle-bold" width={12} />}
            sx={{
              height: 18,
              fontSize: '0.625rem',
              fontWeight: 800,
              letterSpacing: 0.5,
              color: '#fff',
              backgroundColor: theme.palette.warning.main,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pt: isInitial ? 0.5 : 0 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: alpha(config.colorHex, config.bgAlpha),
            color: config.colorHex,
            border: `1px solid ${alpha(config.colorHex, 0.25)}`,
          }}
        >
          <Icon icon={config.icon} width={22} height={22} />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.25,
            }}
          >
            <Chip
              label={config.label}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                fontWeight: 700,
                color: config.colorHex,
                backgroundColor: alpha(config.colorHex, 0.12),
                px: 0.25,
              }}
            />
          </Box>

          <Tooltip title={`${data.label} (${data.id})`} arrow placement="top">
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: '0.85rem',
                color: 'text.primary',
                fontFamily: 'monospace',
                letterSpacing: 0.5,
              }}
            >
              {data.label}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
}

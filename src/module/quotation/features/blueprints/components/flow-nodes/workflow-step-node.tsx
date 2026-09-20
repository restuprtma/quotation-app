import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeType } from '../../types/bundle';

import { Handle, Position } from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/shared/ui/iconify';

// ----------------------------------------------------------------------

export type WorkflowStepNodeData = {
  id: string;
  label: string;
  description?: string;
  type: WorkflowNodeType;
  lane_id: string;
  lane_label?: string;
  outgoingEdgesCount?: number;
  highlighted?: boolean;
};

const STEP_CONFIG: Record<
  WorkflowNodeType,
  {
    icon: string;
    label: string;
    colorHex: string;
    bgAlpha: number;
  }
> = {
  start: {
    icon: 'solar:play-circle-bold',
    label: 'Start',
    colorHex: '#22c55e',
    bgAlpha: 0.12,
  },
  action: {
    icon: 'solar:user-hand-up-bold',
    label: 'User Action',
    colorHex: '#2065d1',
    bgAlpha: 0.1,
  },
  system_action: {
    icon: 'solar:settings-bold',
    label: 'System Action',
    colorHex: '#6366f1',
    bgAlpha: 0.1,
  },
  decision: {
    icon: 'solar:branching-paths-down-bold',
    label: 'Decision',
    colorHex: '#f59e0b',
    bgAlpha: 0.12,
  },
  wait: {
    icon: 'solar:clock-circle-bold',
    label: 'Wait / Delay',
    colorHex: '#ea580c',
    bgAlpha: 0.1,
  },
  end: {
    icon: 'solar:stop-circle-bold',
    label: 'End',
    colorHex: '#ef4444',
    bgAlpha: 0.12,
  },
};

export function WorkflowStepNode({ data, selected }: NodeProps & { data: WorkflowStepNodeData }) {
  const theme = useTheme();
  const config = STEP_CONFIG[data.type] || STEP_CONFIG.action;
  const isHighlighted = Boolean(data.highlighted);

  const isDecision = data.type === 'decision';
  const isStart = data.type === 'start';
  const isEnd = data.type === 'end';
  const isWait = data.type === 'wait';

  const outgoingCount = data.outgoingEdgesCount ?? 0;
  const hasDecisionWarning = isDecision && outgoingCount < 2;

  return (
    <Card
      data-testid={`step-node-${data.id}`}
      sx={{
        width: isStart || isEnd ? 180 : 220,
        minHeight: 76,
        p: 1.5,
        borderRadius: isStart || isEnd ? 4 : isDecision ? 2.5 : 2,
        border: hasDecisionWarning
          ? `2px solid ${theme.palette.error.main}`
          : isEnd
            ? `2.5px double ${selected || isHighlighted ? theme.palette.error.dark : config.colorHex}`
            : isWait
              ? `2px dashed ${selected || isHighlighted ? theme.palette.warning.dark : config.colorHex}`
              : `2px solid ${selected || isHighlighted ? theme.palette.primary.main : alpha(config.colorHex, 0.45)}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow:
          selected || isHighlighted
            ? theme.customShadows?.z12 || 4
            : hasDecisionWarning
              ? '0 0 8px rgba(239, 68, 68, 0.35)'
              : theme.customShadows?.z4 || 1,
        transition: theme.transitions.create(['border-color', 'box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          boxShadow: theme.customShadows?.z8 || 3,
          borderColor: hasDecisionWarning ? theme.palette.error.main : config.colorHex,
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

      {/* Decision Validation Alert Badge */}
      {hasDecisionWarning && (
        <Tooltip
          title={`Validasi Alur: Decision node memiliki ${outgoingCount} cabang. Wajib minimal 2 cabang keluar.`}
          arrow
          placement="top"
        >
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              right: 10,
              zIndex: 2,
            }}
          >
            <Chip
              size="small"
              color="error"
              icon={<Iconify icon="solar:danger-triangle-bold" width={12} />}
              label={`Cabang ${outgoingCount}/2 (Wajib ≥ 2)`}
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 800,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            />
          </Box>
        </Tooltip>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: isStart || isEnd ? 3 : 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: alpha(config.colorHex, config.bgAlpha),
            color: config.colorHex,
            border: `1px solid ${alpha(config.colorHex, 0.25)}`,
          }}
        >
          <Iconify icon={config.icon} width={20} height={20} />
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
            {data.lane_label && (
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: 'text.disabled',
                  fontSize: '0.625rem',
                  maxWidth: 80,
                }}
              >
                {data.lane_label}
              </Typography>
            )}
          </Box>

          <Tooltip title={data.label || data.id} arrow placement="top">
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: '0.825rem',
                color: 'text.primary',
              }}
            >
              {data.label || data.id}
            </Typography>
          </Tooltip>

          {data.description && (
            <Tooltip title={data.description} arrow placement="bottom">
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                  mt: 0.25,
                }}
              >
                {data.description}
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Card>
  );
}

import type { NodeProps } from '@xyflow/react';
import type { ArchitectureNodeType } from '../../types/bundle';

import { Handle, Position } from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/shared/ui/iconify';

// ----------------------------------------------------------------------

export type ArchitectureTypedNodeData = {
  id: string;
  type: ArchitectureNodeType;
  label: string;
  description?: string;
  group_id?: string;
  highlighted?: boolean;
};

const NODE_TYPE_CONFIG: Record<
  ArchitectureNodeType,
  {
    icon: string;
    label: string;
    colorHex: string;
  }
> = {
  channel: {
    icon: 'solar:tv-bold-duotone',
    label: 'Channel',
    colorHex: '#0288d1',
  },
  application: {
    icon: 'solar:window-frame-bold-duotone',
    label: 'App',
    colorHex: '#2065d1',
  },
  service: {
    icon: 'solar:server-square-bold-duotone',
    label: 'Service',
    colorHex: '#22c55e',
  },
  database: {
    icon: 'solar:database-bold-duotone',
    label: 'Database',
    colorHex: '#f59e0b',
  },
  cache: {
    icon: 'solar:bolt-bold-duotone',
    label: 'Cache',
    colorHex: '#ea580c',
  },
  storage: {
    icon: 'solar:folder-with-files-bold-duotone',
    label: 'Storage',
    colorHex: '#06b6d4',
  },
  integration: {
    icon: 'solar:cloud-square-bold-duotone',
    label: 'Integration',
    colorHex: '#8b5cf6',
  },
  device: {
    icon: 'solar:printer-bold-duotone',
    label: 'Device',
    colorHex: '#64748b',
  },
};

export function ArchitectureTypedNode({
  data,
  selected,
}: NodeProps & { data: ArchitectureTypedNodeData }) {
  const theme = useTheme();
  const config = NODE_TYPE_CONFIG[data.type] || NODE_TYPE_CONFIG.service;
  const isHighlighted = Boolean(data.highlighted);

  return (
    <Card
      data-testid={`arch-node-${data.id}`}
      sx={{
        width: 220,
        minHeight: 80,
        p: 1.5,
        borderRadius: 1.75,
        border: `2px solid ${
          selected || isHighlighted ? theme.palette.primary.main : alpha(config.colorHex, 0.45)
        }`,
        backgroundColor: theme.palette.background.paper,
        boxShadow:
          selected || isHighlighted ? theme.customShadows?.z12 || 4 : theme.customShadows?.z4 || 1,
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
      {/* React Flow Handles */}
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

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: alpha(config.colorHex, 0.12),
            color: config.colorHex,
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
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                color: config.colorHex,
                backgroundColor: alpha(config.colorHex, 0.12),
                px: 0.5,
              }}
            />
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

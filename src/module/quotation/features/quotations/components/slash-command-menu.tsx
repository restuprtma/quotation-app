import type { ActiveSkill } from '../types';

import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/shared/ui/iconify';

type Props = {
  open: boolean;
  filterText: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onExecute: (skill: ActiveSkill) => void;
  onClose: () => void;
  skills: ActiveSkill[];
  isLoading?: boolean;
};

export function SlashCommandMenu({
  open,
  filterText,
  selectedIndex,
  onSelectIndex,
  onExecute,
  onClose,
  skills,
  isLoading,
}: Props) {
  const navigate = useNavigate();

  const commandItems = useMemo(() => {
    // Normalise filter (remove leading /)
    const query = filterText.startsWith('/')
      ? filterText.slice(1).toLowerCase().trim()
      : filterText.toLowerCase().trim();

    // Built-in defaults list ensuring /quotation and /blueprint are discoverable
    const allItems: (ActiveSkill & { isBuiltin?: boolean; disabled?: boolean })[] = [
      {
        id: 'cmd-quotation',
        name: 'Quotation AI (Dedicated Squad)',
        command: '/quotation',
        content_instruction: 'Generate a complete quotation document for a Dedicated Squad scheme',
        is_active: true,
        isBuiltin: true,
        disabled: false,
      },
      {
        id: 'cmd-blueprint',
        name: 'Blueprint Generator',
        command: '/blueprint',
        content_instruction: 'Generate system architecture and workflow blueprint',
        is_active: true,
        isBuiltin: true,
        disabled: false,
      },
    ];

    // Merge API skills if any exist with unique commands
    skills.forEach((sk) => {
      const formattedCommand = sk.command.startsWith('/') ? sk.command : `/${sk.command}`;
      const existingIdx = allItems.findIndex((item) => item.command === formattedCommand);
      if (existingIdx >= 0) {
        allItems[existingIdx] = {
          ...allItems[existingIdx],
          id: sk.id,
          name: sk.name || allItems[existingIdx].name,
          content_instruction: sk.content_instruction || allItems[existingIdx].content_instruction,
          is_active: sk.is_active,
        };
      } else {
        allItems.push({
          id: sk.id,
          name: sk.name,
          command: formattedCommand,
          content_instruction: sk.content_instruction,
          is_active: sk.is_active,
          disabled: !sk.is_active,
        });
      }
    });

    if (!query) return allItems;

    return allItems.filter(
      (item) =>
        item.command.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        (item.content_instruction && item.content_instruction.toLowerCase().includes(query))
    );
  }, [filterText, skills]);

  useEffect(() => {
    if (selectedIndex >= commandItems.length && commandItems.length > 0) {
      onSelectIndex(0);
    }
  }, [commandItems.length, selectedIndex, onSelectIndex]);

  if (!open) return null;

  return (
    <Card
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        zIndex: 1300,
        maxHeight: 340,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        boxShadow: (theme) =>
          `0 12px 28px -4px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.6)'}`,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: 'background.neutral',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:atom-bold-duotone" width={18} sx={{ color: 'primary.main' }} />
          <Typography
            variant="caption"
            fontWeight={700}
            textTransform="uppercase"
            color="text.secondary"
          >
            AI Skills & Slash Commands
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.disabled">
          ↑↓ navigate • Enter select • Esc cancel
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : commandItems.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No matching command found.
          </Typography>
          <Button
            size="small"
            variant="text"
            color="primary"
            sx={{ mt: 1 }}
            startIcon={<Iconify icon="solar:settings-bold-duotone" />}
            onClick={() => navigate(paths.dashboard.quotation.aiSettings)}
          >
            Configure AI Settings
          </Button>
        </Box>
      ) : (
        <List disablePadding sx={{ overflowY: 'auto', py: 0.5 }}>
          {commandItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;

            return (
              <ListItem key={item.id} disablePadding sx={{ px: 1, py: 0.25 }}>
                <ListItemButton
                  selected={isSelected}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      onExecute(item);
                    }
                  }}
                  onMouseEnter={() => onSelectIndex(idx)}
                  sx={{
                    borderRadius: 1,
                    py: 1,
                    px: 1.5,
                    transition: (theme) => theme.transitions.create(['background-color']),
                    '&.Mui-selected': {
                      bgcolor: (theme) =>
                        theme.palette.mode === 'light' ? 'primary.lighter' : 'primary.dark',
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'light' ? 'primary.lighter' : 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: 1,
                        bgcolor: item.disabled ? 'action.hover' : 'primary.main',
                        color: item.disabled ? 'text.secondary' : 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:file-check-bold-duotone" width={18} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: item.disabled ? 'text.disabled' : 'text.primary',
                          }}
                        >
                          {item.command}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={item.disabled ? 'text.disabled' : 'text.secondary'}
                          noWrap
                        >
                          — {item.name}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      item.content_instruction && (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.content_instruction}
                        </Typography>
                      )
                    }
                  />
                  {item.is_active ? (
                    <Chip
                      size="small"
                      label="Active"
                      color="success"
                      variant="soft"
                      sx={{ fontSize: '0.675rem', height: 20, fontWeight: 600 }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      label="Inactive"
                      variant="outlined"
                      sx={{ fontSize: '0.675rem', height: 20 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Card>
  );
}

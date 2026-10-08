import type { ReactNode } from 'react';

import { useEffect } from 'react';

import Box from '@mui/material/Box';

import { useSettingsContext } from 'src/module/core/features/settings/context';

type Props = {
  children: ReactNode;
};

export function PublicThemeScope({ children }: Props) {
  const { state } = useSettingsContext();

  useEffect(() => {
    const root = document.documentElement;
    const previousScheme = root.getAttribute('data-color-scheme');

    root.setAttribute('data-color-scheme', 'light');

    return () => {
      // Restore previous scheme or user's active settings mode
      const targetScheme = state?.mode || previousScheme || 'light';
      root.setAttribute('data-color-scheme', targetScheme);
    };
  }, [state?.mode]);

  return (
    <Box
      data-color-scheme="light"
      sx={{
        colorScheme: 'light',
        width: 1,
        minHeight: '100vh',
      }}
    >
      {children}
    </Box>
  );
}

import '../styles/dedicated-document.css';
import '../styles/subscription-document.css';
import '../styles/white-label-document.css';
import '../styles/standalone-maintenance-document.css';
import '../styles/custom-development-document.css';
import '../styles/kiosk-queue-document.css';

import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

type Props = {
  children: ReactNode;
};

export function DocumentCanvas({ children }: Props) {
  return (
    <Paper
      className="quotation-document"
      elevation={0}
      sx={{
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        width: '100%',
        maxWidth: '210mm',
        mx: 'auto',
      }}
    >
      <Box
        className="quotation-document__surface"
        sx={{
          position: 'relative',
          p: { xs: 2, sm: 3, md: 5 },
          minHeight: { xs: 420, md: 620 },
          overflowX: 'auto',
          '& .ProseMirror': {
            minHeight: { xs: 380, md: 560 },
            outline: 'none',
            color: 'text.primary',
            fontFamily: 'inherit',
            fontSize: '1rem',
            lineHeight: 1.7,
            overflowWrap: 'anywhere',
            '& > :first-child': { mt: 0 },
            '& > :last-child': { mb: 0 },
            '& h1, & h2, & h3': { color: 'text.primary', fontWeight: 700, lineHeight: 1.25 },
            '& h1': { mt: 4, mb: 1.5, fontSize: { xs: '1.75rem', md: '2.125rem' } },
            '& h2': { mt: 3, mb: 1.25, fontSize: { xs: '1.4rem', md: '1.75rem' } },
            '& h3': { mt: 2.5, mb: 1, fontSize: { xs: '1.2rem', md: '1.4rem' } },
            '& p': { my: 1.25 },
            '& ul, & ol': { pl: 3, my: 1.5 },
            '& li': { pl: 0.5, my: 0.5 },
            '& a': { color: 'primary.main', textDecoration: 'underline' },
            '& hr': { my: 3, border: 0, borderTop: 1, borderColor: 'divider' },
            '& .tableWrapper': {
              overflowX: 'auto',
              my: 2.5,
            },
            '& table': {
              width: '100%',
              minWidth: 480,
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
              my: 2.5,
            },
            '& th, & td': {
              position: 'relative',
              border: 1,
              borderColor: 'divider',
              p: { xs: 1, sm: 1.5 },
              verticalAlign: 'top',
              overflowWrap: 'anywhere',
            },
            '& th': { bgcolor: 'action.hover', fontWeight: 700 },
            '& .column-resize-handle': {
              position: 'absolute',
              right: -2,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: 'primary.main',
              pointerEvents: 'none',
              zIndex: 20,
            },
            '& .selectedCell:after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              bgcolor: 'primary.main',
              opacity: 0.12,
              pointerEvents: 'none',
            },
            '& .qtr-legal-block': {
              position: 'relative',
              p: { xs: 2, sm: 2.5 },
              my: 2.5,
              borderRadius: 1,
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'divider',
              bgcolor: 'background.neutral',
            },
            '& .qtr-legal-locked': {
              borderColor: 'divider',
            },
            '& .qtr-legal-unlocked': {
              borderColor: 'warning.main',
              bgcolor: (theme) =>
                theme.palette.mode === 'light' ? '#fffdf5' : 'rgba(255, 171, 0, 0.08)',
            },
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

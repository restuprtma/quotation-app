import type { ActiveTabId, BlueprintBundle, RoundTripResult } from '../types';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import { alpha, useTheme } from '@mui/material/styles';

import { WBSLab } from './wbs-lab';
import { FlowLab } from './flow-lab';
import { JourneyLab } from './journey-lab';
import { BundleReport } from './bundle-report';
import { ArchitectureLab } from './architecture-lab';
import { StateMachineLab } from './state-machine-lab';
import { RoundTripDialog } from './round-trip-dialog';
import { SAMPLE_BUNDLES } from '../fixtures/sample-bundles';
import { executeRoundTripTest } from '../utils/compare-bundle';

// ----------------------------------------------------------------------

export function BlueprintSkillLab() {
  const theme = useTheme();

  const [activeFixtureKey, setActiveFixtureKey] = useState<string>('01-public-service-queue');
  const [bundle, setBundle] = useState<BlueprintBundle>(SAMPLE_BUNDLES['01-public-service-queue']);
  const [activeTab, setActiveTab] = useState<ActiveTabId>(0);

  // Round-trip state
  const [roundTripDialogOpen, setRoundTripDialogOpen] = useState(false);
  const [roundTripResult, setRoundTripResult] = useState<RoundTripResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFixtureChange = (key: string) => {
    setActiveFixtureKey(key);
    if (SAMPLE_BUNDLES[key]) {
      setBundle(JSON.parse(JSON.stringify(SAMPLE_BUNDLES[key])));
    }
  };

  const handleResetBundle = () => {
    if (SAMPLE_BUNDLES[activeFixtureKey]) {
      setBundle(JSON.parse(JSON.stringify(SAMPLE_BUNDLES[activeFixtureKey])));
    }
  };

  const handleRunRoundTrip = () => {
    const result = executeRoundTripTest(bundle);
    setRoundTripResult(result);
    setRoundTripDialogOpen(true);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top Banner & Control Header */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.darker || theme.palette.primary.main, 0.9)} 0%, ${theme.palette.primary.main} 100%)`,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.customShadows?.z16 || 5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Blueprint Skill Visual Lab
              </Typography>
              <Chip
                label="Fase 3 R&D"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 680 }}>
              Lingkungan prototipe visual interaktif untuk perancangan dokumen Blueprint arsitektur
              teknis. Mendukung pengeditan User Journey, System Architecture, State Machine,
              Workflows, WBS Tree, Bundle Report & Cross-Validation, serta validasi Round-Trip JSON.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            {/* Fixture Selector */}
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <Select
                value={activeFixtureKey}
                onChange={(e) => handleFixtureChange(e.target.value)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontWeight: 600,
                  '& .MuiSelect-icon': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <MenuItem value="01-public-service-queue">01. Antrian Publik (Kompleks)</MenuItem>
                <MenuItem value="10-small-simple-system">10. Buku Tamu (Sederhana)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              sx={{
                backgroundColor: theme.palette.common.white,
                color: theme.palette.primary.main,
                fontWeight: 700,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.9),
                },
              }}
              startIcon={<Icon icon="solar:play-circle-bold" />}
              onClick={handleRunRoundTrip}
            >
              Run Round-Trip Test
            </Button>

            <Button
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: '#fff',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              startIcon={<Icon icon={copySuccess ? 'solar:check-read-bold' : 'solar:copy-bold'} />}
              onClick={handleCopyJson}
            >
              {copySuccess ? 'Tersalin' : 'Export JSON'}
            </Button>

            <Button
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: '#fff',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              startIcon={<Icon icon="solar:restart-bold" />}
              onClick={handleResetBundle}
            >
              Reset
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Blueprint Title & Metadata Card */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {bundle.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {bundle.summary}
        </Typography>
      </Card>

      {/* 6 Tabs Navigation */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newVal) => setActiveTab(newVal as ActiveTabId)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab
            icon={<Icon icon="solar:user-hand-up-bold" width={20} />}
            iconPosition="start"
            label="1. User Journey"
          />
          <Tab
            icon={<Icon icon="solar:server-square-bold" width={20} />}
            iconPosition="start"
            label="2. System Architecture"
          />
          <Tab
            icon={<Icon icon="solar:refresh-circle-bold" width={20} />}
            iconPosition="start"
            label="3. State Machine"
          />
          <Tab
            icon={<Icon icon="solar:routing-2-bold" width={20} />}
            iconPosition="start"
            label="4. Business Workflows"
          />
          <Tab
            icon={<Icon icon="solar:structure-bold" width={20} />}
            iconPosition="start"
            label="5. WBS Hierarchy"
          />
          <Tab
            icon={<Icon icon="solar:document-text-bold" width={20} />}
            iconPosition="start"
            label="6. Bundle Report & Cross-Validation"
          />
        </Tabs>
      </Card>

      {/* Tab Panels */}
      {activeTab === 0 && (
        <JourneyLab
          journey={bundle.journey}
          onChange={(updatedJourney) => setBundle((prev) => ({ ...prev, journey: updatedJourney }))}
        />
      )}

      {activeTab === 1 && (
        <ArchitectureLab
          architecture={bundle.architecture}
          onChange={(updatedArchitecture) =>
            setBundle((prev) => ({ ...prev, architecture: updatedArchitecture }))
          }
        />
      )}

      {activeTab === 2 && (
        <StateMachineLab
          stateMachine={bundle.state_machine}
          onChange={(updatedStateMachine) =>
            setBundle((prev) => ({ ...prev, state_machine: updatedStateMachine }))
          }
        />
      )}

      {activeTab === 3 && (
        <FlowLab
          workflows={bundle.workflows}
          onChange={(updatedWorkflows) =>
            setBundle((prev) => ({ ...prev, workflows: updatedWorkflows }))
          }
        />
      )}

      {activeTab === 4 && (
        <WBSLab
          wbs={bundle.wbs}
          onChange={(updatedWBS) => setBundle((prev) => ({ ...prev, wbs: updatedWBS }))}
        />
      )}

      {activeTab === 5 && (
        <BundleReport
          bundle={bundle}
          onUpdateBundle={(updatedBundle) => setBundle(updatedBundle)}
          onNavigateTab={(tabIdx) => setActiveTab(tabIdx)}
        />
      )}

      {/* Round-Trip Dialog Modal */}
      <RoundTripDialog
        open={roundTripDialogOpen}
        result={roundTripResult}
        onClose={() => setRoundTripDialogOpen(false)}
      />
    </Container>
  );
}

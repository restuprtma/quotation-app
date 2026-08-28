import { Icon } from '@iconify/react';
import React, { useState } from 'react';

import {
  Box,
  Tab,
  Grid,
  Tabs,
  Fade,
  Stack,
  Paper,
  Divider,
  Accordion,
  Container,
  Typography,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { useGetAISkills } from '../hooks/use-ai-skills';
import { SkillEditor } from '../components/skill-editor';
import { RateCardSelector } from '../components/rate-card-selector';
import { LegalTemplateViewer } from '../components/legal-template-viewer';
import { ProviderSettingsForm } from '../components/provider-settings-form';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-settings-tabpanel-${index}`}
      aria-labelledby={`ai-settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={value === index} timeout={500}>
          <Box sx={{ pt: 3, pb: 6 }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `ai-settings-tab-${index}`,
    'aria-controls': `ai-settings-tabpanel-${index}`,
  };
}

export const AISettingsView = () => {
  const { data: skills } = useGetAISkills();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon="eva:settings-2-fill" width={28} height={28} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="700" letterSpacing="-0.02em">
                AI Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure your AI integration, fine-tune skills, and manage underlying assets.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="ai settings tabs">
            <Tab
              icon={<Icon icon="eva:cube-outline" width={20} />}
              iconPosition="start"
              label="Provider & Models"
              {...a11yProps(0)}
            />
            <Tab
              icon={<Icon icon="eva:book-open-outline" width={20} />}
              iconPosition="start"
              label="AI Skills"
              {...a11yProps(1)}
            />
            <Tab
              icon={<Icon icon="eva:folder-outline" width={20} />}
              iconPosition="start"
              label="Context Assets"
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        <CustomTabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <ProviderSettingsForm />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                variant="outlined"
                sx={{ p: 3, borderRadius: 2, bgcolor: 'background.default' }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  gutterBottom
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon icon="eva:info-outline" width={20} />
                  About Providers
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  The AI provider is responsible for processing your prompts. Make sure you use a
                  valid model name supported by the provider (e.g.,{' '}
                  <strong>gemini-1.5-flash</strong> or <strong>gemini-1.5-pro</strong> for Gemini).
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  API Keys are securely stored and will never be returned to the client once set.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Skill Configurations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customize the tone, vocabulary, and instructions that the AI uses for specific
              commands.
            </Typography>
          </Box>

          {!skills || skills.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 6, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}
            >
              <Icon icon="eva:inbox-outline" width={48} color="#9e9e9e" />
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2 }}>
                No skills configured yet.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {skills?.map((skill) => (
                <Accordion
                  key={skill.id}
                  variant="outlined"
                  sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
                >
                  <AccordionSummary
                    expandIcon={<Icon icon="eva:arrow-ios-downward-fill" />}
                    sx={{ px: 3, py: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover', display: 'flex' }}>
                        <Icon icon="eva:edit-2-outline" width={20} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          /{skill.command}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Skill Configuration
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <Divider />
                  <AccordionDetails sx={{ p: 3, bgcolor: 'background.default' }}>
                    <SkillEditor skillId={skill.id} />
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </CustomTabPanel>

        <CustomTabPanel value={tabValue} index={2}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <RateCardSelector />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LegalTemplateViewer />
            </Grid>
          </Grid>
        </CustomTabPanel>
      </Stack>
    </Container>
  );
};

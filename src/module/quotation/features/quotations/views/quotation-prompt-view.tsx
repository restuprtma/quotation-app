import type { ActiveSkill, GenerateQuotationPayload } from '../types';

import { useNavigate } from 'react-router';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { toast } from 'src/shared/ui/snackbar';
import { Iconify } from 'src/shared/ui/iconify';
import { DashboardContent } from 'src/layouts/dashboard';

import { useActiveSkills } from '../hooks/use-active-skills';
import { SlashCommandMenu } from '../components/slash-command-menu';
import { useGenerateQuotation } from '../hooks/use-quotation-generation';
import { QuotationGenerationForm } from '../components/quotation-generation-form';
import { WhiteLabelGenerationForm } from '../components/white-label-generation-form';
import { SubscriptionSaaSGenerationForm } from '../components/subscription-saas-generation-form';
import { GENERATION_STAGES, GenerationProgressCard } from '../components/generation-progress-card';

// ----------------------------------------------------------------------

export function QuotationPromptView() {
  const { t } = useTranslate('quotation');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: activeSkills = [], isLoading: isLoadingSkills } = useActiveSkills();
  const generateMutation = useGenerateQuotation();

  // Prompt state
  const [promptText, setPromptText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);

  // Form view state
  const [activeSkill, setActiveSkill] = useState<ActiveSkill | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [commercialScheme, setCommercialScheme] = useState<
    'dedicated_squad' | 'subscription_saas' | 'white_label' | null
  >(null);

  // Generation state machine
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [generationError, setGenerationError] = useState<{
    code?: string;
    message?: string;
  } | null>(null);
  const [generatedQuotationId, setGeneratedQuotationId] = useState<string | null>(null);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<GenerateQuotationPayload | null>(
    null
  );

  // Check input change to trigger menu
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPromptText(value);

    if (value.startsWith('/')) {
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
    }
  };

  const resolveQuotationSkill = useCallback(
    (command = '/quotation'): ActiveSkill => {
      const match = activeSkills.find(
        (s) =>
          s.command === command ||
          s.command === command.replace(/^\//, '') ||
          `/${s.command}` === command
      );
      if (match && match.id && !match.id.startsWith('cmd-')) {
        return match;
      }
      return (
        activeSkills[0] || {
          id: '',
          name: 'Quotation AI (Dedicated Squad)',
          command: '/quotation',
          is_active: true,
        }
      );
    },
    [activeSkills]
  );

  // Keyboard navigation for prompt input
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isMenuOpen) {
      if (event.key === '/' && promptText === '') {
        setIsMenuOpen(true);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const trimmed = promptText.trim().toLowerCase();
        if (trimmed === '/quotation') {
          handleExecuteSkill(resolveQuotationSkill('/quotation'));
        } else if (trimmed === '/blueprint') {
          toast.info('Blueprint generation will be available in Phase 8.');
        } else if (trimmed) {
          toast.warning('Unrecognized slash command. Type / to see available AI skills.');
        }
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedMenuIndex((prev) => prev + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedMenuIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsMenuOpen(false);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // Let menu item execution handle this via menu index
    }
  };

  const handleExecuteSkill = useCallback(
    (skill: ActiveSkill) => {
      setIsMenuOpen(false);
      setPromptText(skill.command);

      if (skill.command === '/blueprint') {
        toast.info('Blueprint generator is scheduled for Phase 8. Please select /quotation.');
        return;
      }

      const resolved = resolveQuotationSkill(skill.command);
      setActiveSkill(resolved.id ? resolved : skill);
      setCommercialScheme(null);
      setIsFormOpen(true);
    },
    [resolveQuotationSkill]
  );

  // Submit Handler
  const handleFormSubmit = async (payload: GenerateQuotationPayload) => {
    setLastSubmittedPayload(payload);
    setIsProgressOpen(true);
    setActiveStageIndex(0);
    setGenerationError(null);
    setGeneratedQuotationId(null);

    // Step progression animation ticker
    const timer1 = setTimeout(() => setActiveStageIndex(1), 400);
    const timer2 = setTimeout(() => setActiveStageIndex(2), 1200);
    const timer3 = setTimeout(() => setActiveStageIndex(3), 2200);
    const timer4 = setTimeout(() => setActiveStageIndex(4), 3200);
    const timer5 = setTimeout(() => setActiveStageIndex(5), 4200);

    try {
      const response = await generateMutation.mutateAsync(payload);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);

      setActiveStageIndex(GENERATION_STAGES.length - 1); // Completed
      setGeneratedQuotationId(response.quotation_id);

      toast.success('Quotation draft generated successfully!');

      // Auto-navigate to editor after short delay
      setTimeout(() => {
        navigate(paths.dashboard.quotation.edit(response.quotation_id));
      }, 1200);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);

      const responseData = err.response?.data;
      let errCode = 'generation_failed';
      let errMessage = err?.message || 'Failed to generate quotation draft';

      if (
        responseData?.errors?.detail &&
        Array.isArray(responseData.errors.detail) &&
        responseData.errors.detail.length > 0
      ) {
        errCode = responseData.errors.detail[0];
      } else if (typeof responseData?.errors === 'string') {
        errCode = responseData.errors;
      } else if (responseData?.message) {
        errMessage = responseData.message;
      } else {
        const extractedCode = err?.message?.includes(':') ? err.message.split(':')[0].trim() : null;
        if (extractedCode) errCode = extractedCode;
      }

      const errorMap: Record<string, string> = {
        invalid_rate_card:
          'Rate card tidak valid atau belum memiliki role (kosong). Silakan periksa Rate Card di AI Settings.',
        rate_item_missing:
          'Rate card yang dipilih tidak memiliki item tarif untuk role/senioritas yang dibutuhkan. Silakan periksa Rate Card di AI Settings.',
        settings_incomplete: 'Pengaturan AI tidak lengkap (Model atau API Key salah/belum diatur).',
        budget_unfeasible:
          'Budget maksimum yang Anda tentukan tidak mencukupi untuk memenuhi ekspektasi durasi dan scope yang diminta.',
        allocation_invalid: 'Alokasi sumber daya AI tidak memenuhi batasan mandatory scope.',
        settings_invalid: 'Pengaturan AI tidak valid, pastikan model dan provider sesuai.',
      };

      if (errorMap[errCode]) {
        errMessage = errorMap[errCode];
      }

      setGenerationError({
        code: errCode,
        message: errMessage,
      });
    }
  };

  const handleRetry = () => {
    if (lastSubmittedPayload) {
      handleFormSubmit(lastSubmittedPayload);
    }
  };

  return (
    <DashboardContent maxWidth="lg">
      <Stack spacing={4} sx={{ py: { xs: 2, md: 4 } }}>
        {/* If Form is NOT open -> Show Prompt-First Search Hero */}
        {!isFormOpen ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 500,
              textAlign: 'center',
              px: 2,
            }}
          >
            {/* AI Icon Header */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '50%',
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? 'primary.lighter' : 'primary.dark',
                color: 'primary.main',
                display: 'inline-flex',
                boxShadow: (theme) => `0 0 32px 4px ${theme.palette.primary.main}22`,
              }}
            >
              <Iconify icon="solar:atom-bold-duotone" width={48} />
            </Box>

            <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5 }}>
              {t('prompt.heroTitle')}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mb: 4 }}>
              {t('prompt.heroSubtitle')}
            </Typography>

            {/* Prompt Input Box Container */}
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 680 }}>
              <SlashCommandMenu
                open={isMenuOpen}
                filterText={promptText}
                selectedIndex={selectedMenuIndex}
                onSelectIndex={setSelectedMenuIndex}
                onExecute={handleExecuteSkill}
                onClose={() => setIsMenuOpen(false)}
                skills={activeSkills}
                isLoading={isLoadingSkills}
              />

              <Card
                elevation={3}
                sx={{
                  p: 0.75,
                  borderRadius: 2.5,
                  border: (theme) => `1.5px solid ${theme.palette.divider}`,
                  transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
                  '&:focus-within': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 0 0 4px ${theme.palette.primary.main}18`,
                  },
                }}
              >
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  value={promptText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('prompt.placeholder')}
                  variant="standard"
                  slotProps={{
                    input: {
                      disableUnderline: true,
                      sx: {
                        px: 2,
                        py: 1.5,
                        fontSize: '1.0625rem',
                      },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify
                            icon="solar:atom-bold-duotone"
                            width={24}
                            sx={{ color: promptText ? 'primary.main' : 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => {
                              if (promptText.trim().toLowerCase() === '/quotation') {
                                handleExecuteSkill(resolveQuotationSkill('/quotation'));
                              } else {
                                setIsMenuOpen(true);
                              }
                            }}
                            sx={{ borderRadius: 1.5, px: 2 }}
                          >
                            {t('prompt.start')}
                          </Button>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Card>
            </Box>

            {/* Quick Chips Suggestions */}
            <Stack
              direction="row"
              spacing={1.5}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mt: 3 }}
            >
              <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center' }}>
                {t('prompt.quickSkills')}
              </Typography>
              <Chip
                icon={<Iconify icon="solar:atom-bold-duotone" width={16} />}
                label="/quotation — Quotation Generator"
                clickable
                color="primary"
                variant="outlined"
                onClick={() => handleExecuteSkill(resolveQuotationSkill('/quotation'))}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<Iconify icon="solar:file-bold-duotone" width={16} />}
                label="/blueprint — System Blueprint"
                variant="outlined"
                onClick={() => toast.info('Blueprint generator will be available in Phase 8.')}
                sx={{ color: 'text.secondary', borderColor: 'divider' }}
              />
            </Stack>

            {/* Link to Historical List or Settings */}
            <Stack direction="row" spacing={2} sx={{ mt: 6 }}>
              <Button
                variant="text"
                color="inherit"
                size="small"
                startIcon={<Iconify icon="solar:file-text-bold" />}
                onClick={() => navigate('/quotation/list')}
              >
                {t('prompt.archiveLink')}
              </Button>
              <Button
                variant="text"
                color="inherit"
                size="small"
                startIcon={<Iconify icon="solar:settings-bold-duotone" />}
                onClick={() => navigate(paths.dashboard.quotation.aiSettings)}
              >
                {t('prompt.settingsLink')}
              </Button>
            </Stack>
          </Box>
        ) : /* When Form is Open -> Render Scheme Selector or Selected Scheme Form */
        commercialScheme === null ? (
          <Box sx={{ maxWidth: 960, mx: 'auto', width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => {
                  setIsFormOpen(false);
                  setPromptText('');
                }}
              >
                {t('prompt.backToPrompt')}
              </Button>
            </Stack>

            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {t('prompt.schemeSelectorTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('prompt.schemeSelectorSubtitle')}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}22`,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => setCommercialScheme('dedicated_squad')}
                    sx={{
                      p: 4,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        mb: 2.5,
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: (theme) =>
                          theme.palette.mode === 'light' ? 'primary.lighter' : 'primary.dark',
                        color: 'primary.main',
                        display: 'inline-flex',
                      }}
                    >
                      <Iconify icon="solar:users-group-two-rounded-bold-duotone" width={36} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {t('prompt.dedicatedSquadTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('prompt.dedicatedSquadDesc')}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}22`,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => setCommercialScheme('subscription_saas')}
                    sx={{
                      p: 4,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        mb: 2.5,
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: (theme) =>
                          theme.palette.mode === 'light' ? 'info.lighter' : 'info.dark',
                        color: 'info.main',
                        display: 'inline-flex',
                      }}
                    >
                      <Iconify icon="solar:cloud-square-bold-duotone" width={36} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {t('prompt.subscriptionSaaSTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('prompt.subscriptionSaaSDesc')}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}22`,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => setCommercialScheme('white_label')}
                    sx={{
                      p: 4,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        mb: 2.5,
                        p: 1.5,
                        borderRadius: '12px',
                        bgcolor: (theme) =>
                          theme.palette.mode === 'light' ? 'secondary.lighter' : 'secondary.dark',
                        color: 'secondary.main',
                        display: 'inline-flex',
                      }}
                    >
                      <Iconify icon="solar:tag-price-bold-duotone" width={36} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {t('prompt.whiteLabelTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('prompt.whiteLabelDesc')}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : commercialScheme === 'dedicated_squad' ? (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => setCommercialScheme(null)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('dedicatedSquadForm.title')}
              </Typography>
            </Stack>

            <QuotationGenerationForm
              selectedSkill={activeSkill}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => setCommercialScheme(null)}
            />
          </Box>
        ) : commercialScheme === 'subscription_saas' ? (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => setCommercialScheme(null)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('subscriptionSaaSForm.title')}
              </Typography>
            </Stack>

            <SubscriptionSaaSGenerationForm
              selectedSkill={activeSkill}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => setCommercialScheme(null)}
            />
          </Box>
        ) : (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => setCommercialScheme(null)}
              >
                {t('prompt.backToSchemes')}
              </Button>
              <Typography variant="h5" fontWeight={700}>
                {t('whiteLabelForm.title')}
              </Typography>
            </Stack>

            <WhiteLabelGenerationForm
              selectedSkill={activeSkill}
              isSubmitting={generateMutation.isPending}
              onSubmit={handleFormSubmit}
              onCancel={() => setCommercialScheme(null)}
            />
          </Box>
        )}
      </Stack>

      {/* Generation Progress State UI Modal */}
      <GenerationProgressCard
        open={isProgressOpen}
        activeStageIndex={activeStageIndex}
        isError={Boolean(generationError)}
        errorCode={generationError?.code}
        errorMessage={generationError?.message}
        quotationId={generatedQuotationId}
        onRetry={handleRetry}
        onClose={() => setIsProgressOpen(false)}
        onOpenEditor={(id) => navigate(paths.dashboard.quotation.edit(id))}
      />
    </DashboardContent>
  );
}

import type { Theme } from '@mui/material/styles';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';
import CardActionArea from '@mui/material/CardActionArea';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';

// ----------------------------------------------------------------------

export type CommercialSchemeType =
  | 'dedicated_squad'
  | 'subscription_saas'
  | 'white_label'
  | 'standalone_maintenance'
  | 'custom_development'
  | 'kiosk_queue_system'
  | 'talent_outsourcing'
  | 'cloud_infrastructure';

type SchemeCategory = 'all' | 'dev' | 'product' | 'ops' | 'hardware';

interface SchemeDefinition {
  id: CommercialSchemeType;
  titleKey: string;
  descKey: string;
  badgeKey: string;
  icon: string;
  color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  category: Exclude<SchemeCategory, 'all'>;
  fallbackTitle: string;
  fallbackDesc: string;
  fallbackBadge: string;
  tags: string[];
}

const SCHEME_DEFINITIONS: SchemeDefinition[] = [
  {
    id: 'dedicated_squad',
    titleKey: 'prompt.dedicatedSquadTitle',
    descKey: 'prompt.dedicatedSquadDesc',
    badgeKey: 'prompt.badgeSquad',
    icon: 'solar:users-group-two-rounded-bold-duotone',
    color: 'primary',
    category: 'dev',
    fallbackTitle: 'Dedicated Programmer Squad',
    fallbackDesc:
      'Dedicated programmer capacity (FTE) with official Venturo rate card pricing, sprint/calendar timelines, and maintenance options.',
    fallbackBadge: 'Squad & FTE',
    tags: ['FTE Capacity', 'Venturo Rate Card', 'Sprint & Calendar'],
  },
  {
    id: 'custom_development',
    titleKey: 'prompt.customDevelopmentTitle',
    descKey: 'prompt.customDevelopmentDesc',
    badgeKey: 'prompt.badgeCustom',
    icon: 'solar:code-square-bold-duotone',
    color: 'info',
    category: 'dev',
    fallbackTitle: 'Custom Software Development',
    fallbackDesc:
      'Tailored application development with structured cost groups, optional recurring operational fees, feature modules, timeline, and staged payment terms.',
    fallbackBadge: 'Custom Build',
    tags: ['Milestone Terms', 'Cost Breakdown', 'Feature Modules'],
  },
  {
    id: 'talent_outsourcing',
    titleKey: 'prompt.talentOutsourcingTitle',
    descKey: 'prompt.talentOutsourcingDesc',
    badgeKey: 'prompt.badgeTalent',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'success',
    category: 'dev',
    fallbackTitle: 'Talent Outsourcing',
    fallbackDesc:
      'Personnel procurement or managed squads with explicit costs, payment terms, and taxes.',
    fallbackBadge: 'Staff Augmentation',
    tags: ['Staff Augmentation', 'Explicit Terms', 'Tax Transparent'],
  },
  {
    id: 'subscription_saas',
    titleKey: 'prompt.subscriptionSaaSTitle',
    descKey: 'prompt.subscriptionSaaSDesc',
    badgeKey: 'prompt.badgeSaaS',
    icon: 'solar:cloud-square-bold-duotone',
    color: 'secondary',
    category: 'product',
    fallbackTitle: 'Software Subscription / SaaS',
    fallbackDesc:
      'Recurring software subscription (monthly/quarterly/yearly), one-time fees, income sharing partnerships, and intellectual property rights.',
    fallbackBadge: 'SaaS & Cloud',
    tags: ['Recurring Billing', 'Income Sharing', 'IP Protection'],
  },
  {
    id: 'white_label',
    titleKey: 'prompt.whiteLabelTitle',
    descKey: 'prompt.whiteLabelDesc',
    badgeKey: 'prompt.badgeWhiteLabel',
    icon: 'solar:tag-price-bold-duotone',
    color: 'warning',
    category: 'product',
    fallbackTitle: 'White Label Product',
    fallbackDesc:
      'Ready-to-use software license with optional license packages, maintenance support, managed hosting, and operational boundaries.',
    fallbackBadge: 'Ready License',
    tags: ['Turnkey License', 'Hosting & SLA', 'Brand Customization'],
  },
  {
    id: 'standalone_maintenance',
    titleKey: 'prompt.standaloneMaintenanceTitle',
    descKey: 'prompt.standaloneMaintenanceDesc',
    badgeKey: 'prompt.badgeMaintenance',
    icon: 'solar:tuning-square-2-bold-duotone',
    color: 'error',
    category: 'ops',
    fallbackTitle: 'Standalone Maintenance & Support',
    fallbackDesc:
      'Technical maintenance of existing systems with Retainer Squad or Hourly Task options, prioritized defect backlog matrix, and structured task details.',
    fallbackBadge: 'Maintenance & SLA',
    tags: ['Retainer Squad', 'Hourly Tasks', 'Defect Matrix'],
  },
  {
    id: 'cloud_infrastructure',
    titleKey: 'prompt.cloudInfrastructureTitle',
    descKey: 'prompt.cloudInfrastructureDesc',
    badgeKey: 'prompt.badgeCloud',
    icon: 'solar:server-square-cloud-bold-duotone',
    color: 'info',
    category: 'ops',
    fallbackTitle: 'Cloud Infrastructure',
    fallbackDesc: 'Shared hosting, VPS, and managed cloud services.',
    fallbackBadge: 'Cloud & Server',
    tags: ['VPS & Dedicated', 'Managed Cloud', 'Service Levels'],
  },
  {
    id: 'kiosk_queue_system',
    titleKey: 'prompt.kioskQueueTitle',
    descKey: 'prompt.kioskQueueDesc',
    badgeKey: 'prompt.badgeHardware',
    icon: 'solar:devices-bold-duotone',
    color: 'secondary',
    category: 'hardware',
    fallbackTitle: 'Sistem & Integrasi Perangkat Keras',
    fallbackDesc: 'Kiosk, sistem antrian, integrasi printer/display, dan perangkat kondisional.',
    fallbackBadge: 'Hardware & IoT',
    tags: ['Kiosk & Queue', 'Driver Integration', 'MPP / Private'],
  },
];

interface Props {
  onSelectScheme: (scheme: CommercialSchemeType) => void;
  onBack: () => void;
}

export function CommercialSchemeSelector({ onSelectScheme, onBack }: Props) {
  const { t } = useTranslate('quotation');
  const theme = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Category tab counts
  const categoryCounts = useMemo(() => {
    const counts: Record<SchemeCategory, number> = {
      all: SCHEME_DEFINITIONS.length,
      dev: 0,
      product: 0,
      ops: 0,
      hardware: 0,
    };
    SCHEME_DEFINITIONS.forEach((s) => {
      counts[s.category] += 1;
    });
    return counts;
  }, []);

  // Filtered schemes
  const filteredSchemes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SCHEME_DEFINITIONS.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCategory) return false;

      if (!q) return true;

      const title = t(item.titleKey, item.fallbackTitle).toLowerCase();
      const desc = t(item.descKey, item.fallbackDesc).toLowerCase();
      const badge = t(item.badgeKey, item.fallbackBadge).toLowerCase();
      const tags = item.tags.join(' ').toLowerCase();

      return (
        title.includes(q) ||
        desc.includes(q) ||
        badge.includes(q) ||
        tags.includes(q) ||
        item.id.includes(q)
      );
    });
  }, [selectedCategory, searchQuery, t]);

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: SchemeCategory) => {
    setSelectedCategory(newValue);
  };

  const getThemePaletteColor = (colorName: SchemeDefinition['color'], muiTheme: Theme) => {
    switch (colorName) {
      case 'primary':
        return muiTheme.palette.primary;
      case 'secondary':
        return muiTheme.palette.secondary;
      case 'info':
        return muiTheme.palette.info;
      case 'success':
        return muiTheme.palette.success;
      case 'warning':
        return muiTheme.palette.warning;
      case 'error':
        return muiTheme.palette.error;
      default:
        return muiTheme.palette.primary;
    }
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%', pb: 4 }}>
      {/* Top Navigation Bar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          onClick={onBack}
          sx={{
            borderRadius: 1.5,
            borderColor: 'divider',
            px: 1.75,
            py: 0.75,
            fontWeight: 600,
            '&:hover': {
              borderColor: 'text.primary',
              bgcolor: 'action.hover',
            },
          }}
        >
          {t('prompt.backToPrompt')}
        </Button>

        <Chip
          icon={<Iconify icon="solar:widget-bold-duotone" width={16} />}
          label={t('prompt.schemesCount', { count: SCHEME_DEFINITIONS.length })}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: (th) => alpha(th.palette.primary.main, 0.08),
            color: 'primary.main',
            border: (th) => `1px solid ${alpha(th.palette.primary.main, 0.2)}`,
          }}
        />
      </Stack>

      {/* Hero Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
            mb: 1.25,
            color: 'text.primary',
          }}
        >
          {t('prompt.schemeSelectorTitle')}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 620,
            mx: 'auto',
            fontSize: { xs: '0.9375rem', md: '1.0625rem' },
            lineHeight: 1.6,
          }}
        >
          {t('prompt.schemeSelectorSubtitle')}
        </Typography>
      </Box>

      {/* Filter & Search Bar */}
      <Card
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 4,
          borderRadius: 2.5,
          bgcolor: (th) =>
            th.palette.mode === 'light'
              ? 'background.paper'
              : alpha(th.palette.background.paper, 0.6),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                minWidth: 'auto',
                px: 2,
                py: 0.75,
                borderRadius: 1.5,
                fontWeight: 600,
                fontSize: '0.875rem',
                textTransform: 'none',
                mr: 0.75,
                transition: (th) => th.transitions.create(['background-color', 'color']),
                '&.Mui-selected': {
                  bgcolor: (th) => alpha(th.palette.primary.main, 0.12),
                  color: 'primary.main',
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab
              value="all"
              label={`${t('prompt.allCategories', 'Semua Skema')} (${categoryCounts.all})`}
              icon={<Iconify icon="solar:widget-bold-duotone" width={18} />}
              iconPosition="start"
            />
            <Tab
              value="dev"
              label={`${t('prompt.catDev', 'Pengembangan & Squad')} (${categoryCounts.dev})`}
              icon={<Iconify icon="solar:code-square-bold-duotone" width={18} />}
              iconPosition="start"
            />
            <Tab
              value="product"
              label={`${t('prompt.catProduct', 'Software & SaaS')} (${categoryCounts.product})`}
              icon={<Iconify icon="solar:cloud-square-bold-duotone" width={18} />}
              iconPosition="start"
            />
            <Tab
              value="ops"
              label={`${t('prompt.catOps', 'Pemeliharaan & Cloud')} (${categoryCounts.ops})`}
              icon={<Iconify icon="solar:tuning-square-2-bold-duotone" width={18} />}
              iconPosition="start"
            />
            <Tab
              value="hardware"
              label={`${t('prompt.catHardware', 'Hardware & IoT')} (${categoryCounts.hardware})`}
              icon={<Iconify icon="solar:devices-bold-duotone" width={18} />}
              iconPosition="start"
            />
          </Tabs>

          {/* Search Box */}
          <TextField
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('prompt.searchSchemePlaceholder', 'Cari skema layanan...')}
            sx={{
              minWidth: { xs: '100%', md: 280 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: (th) => (th.palette.mode === 'light' ? 'grey.50' : 'background.neutral'),
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="solar:magnifer-linear"
                      width={18}
                      sx={{ color: 'text.disabled' }}
                    />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                      <Iconify
                        icon="solar:close-circle-bold"
                        width={16}
                        sx={{ color: 'text.disabled' }}
                      />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        </Stack>
      </Card>

      {/* Grid of Commercial Scheme Cards */}
      {filteredSchemes.length > 0 ? (
        <Grid container spacing={2.5}>
          {filteredSchemes.map((scheme) => {
            const paletteColor = getThemePaletteColor(scheme.color, theme);
            const title = t(scheme.titleKey, scheme.fallbackTitle);
            const description = t(scheme.descKey, scheme.fallbackDesc);
            const badge = t(scheme.badgeKey, scheme.fallbackBadge);

            return (
              <Grid key={scheme.id} size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2.5,
                    borderWidth: '1.5px',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: (th) =>
                      th.transitions.create(
                        ['transform', 'box-shadow', 'border-color', 'background-color'],
                        { duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
                      ),
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: paletteColor.main,
                      boxShadow: (th) =>
                        `0 16px 32px -8px ${alpha(paletteColor.main, 0.2)}, 0 0 0 1px ${paletteColor.main}`,
                      '& .scheme-action-arrow': {
                        transform: 'translateX(4px)',
                      },
                      '& .scheme-icon-wrapper': {
                        transform: 'scale(1.05)',
                        bgcolor: alpha(
                          paletteColor.main,
                          theme.palette.mode === 'light' ? 0.16 : 0.28
                        ),
                      },
                    },
                    '&:focus-within': {
                      borderColor: paletteColor.main,
                      boxShadow: (th) => `0 0 0 3px ${alpha(paletteColor.main, 0.25)}`,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => onSelectScheme(scheme.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectScheme(scheme.id);
                      }
                    }}
                    aria-label={title}
                    sx={{
                      p: 2.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                    }}
                  >
                    {/* Top Header: Icon & Category Badge */}
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1.5}
                        sx={{ mb: 2 }}
                      >
                        <Box
                          className="scheme-icon-wrapper"
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(
                              paletteColor.main,
                              theme.palette.mode === 'light' ? 0.1 : 0.18
                            ),
                            color: paletteColor.main,
                            transition: (th) =>
                              th.transitions.create(['transform', 'background-color'], {
                                duration: 200,
                              }),
                            flexShrink: 0,
                          }}
                        >
                          <Iconify icon={scheme.icon} width={28} />
                        </Box>

                        <Chip
                          label={badge}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            height: 24,
                            px: 0.5,
                            bgcolor: alpha(paletteColor.main, 0.08),
                            color: paletteColor.main,
                            border: `1px solid ${alpha(paletteColor.main, 0.2)}`,
                          }}
                        />
                      </Stack>

                      {/* Scheme Title */}
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.0625rem',
                          lineHeight: 1.35,
                          mb: 1,
                          color: 'text.primary',
                        }}
                      >
                        {title}
                      </Typography>

                      {/* Scheme Description */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.84375rem',
                          lineHeight: 1.55,
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '3.9em',
                        }}
                      >
                        {description}
                      </Typography>

                      {/* Feature Tags */}
                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mb: 2.5 }}
                      >
                        {scheme.tags.map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 22,
                              fontWeight: 500,
                              borderColor: (th) => alpha(th.palette.text.primary, 0.12),
                              color: 'text.secondary',
                              bgcolor: (th) => alpha(th.palette.text.primary, 0.02),
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    {/* Bottom Action Affordance */}
                    <Box
                      sx={{
                        pt: 1.75,
                        borderTop: (th) => `1px dashed ${th.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          color: paletteColor.main,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {t('prompt.selectScheme', 'Pilih Skema')}
                      </Typography>

                      <Box
                        className="scheme-action-arrow"
                        sx={{
                          color: paletteColor.main,
                          display: 'flex',
                          alignItems: 'center',
                          transition: (th) => th.transitions.create('transform', { duration: 200 }),
                        }}
                      >
                        <Iconify icon="solar:arrow-right-linear" width={18} />
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Empty Filter / Search Result State */
        <Card
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2.5,
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (th) => alpha(th.palette.warning.main, 0.1),
              color: 'warning.main',
            }}
          >
            <Iconify icon="solar:magnifer-broken" width={32} />
          </Box>

          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            {t('prompt.noResults', 'Tidak ada skema layanan yang cocok')}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}
          >
            {t(
              'prompt.noResultsDesc',
              'Coba sesuaikan kata kunci pencarian atau ubah filter kategori.'
            )}
          </Typography>

          <Button
            variant="soft"
            color="primary"
            startIcon={<Iconify icon="solar:refresh-linear" />}
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            {t('prompt.clearFilter', 'Reset Filter')}
          </Button>
        </Card>
      )}
    </Box>
  );
}

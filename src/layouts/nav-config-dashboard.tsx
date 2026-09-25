import type { NavSectionProps } from 'src/shared/ui/nav-section';

import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';
import { SvgColor } from 'src/shared/ui/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  quotation: icon('ic-file'),
  blueprint: icon('ic-subpaths'),
  contract: icon('ic-folder'),
};

// ----------------------------------------------------------------------

export function useNavData(): NavSectionProps['data'] {
  const { t } = useTranslate('navigation');

  return useMemo(() => {
    const sections: NavSectionProps['data'] = [
      {
        items: [
          {
            title: t('quotation'),
            path: paths.dashboard.quotation.root,
            icon: ICONS.quotation,
            children: [
              {
                title: t('quotation_create', { defaultValue: 'Buat Quotation' }),
                path: paths.dashboard.quotation.prompt,
              },
              {
                title: t('quotation_list', { defaultValue: 'Daftar Quotation' }),
                path: paths.dashboard.quotation.list,
              },
            ],
          },
          {
            title: t('blueprint'),
            path: paths.dashboard.blueprint.root,
            icon: ICONS.blueprint,
            children: [
              {
                title: t('blueprint_create', { defaultValue: 'Buat Blueprint' }),
                path: paths.dashboard.blueprint.create,
              },
              {
                title: t('blueprint_process', { defaultValue: 'Proses Blueprint' }),
                path: paths.dashboard.blueprint.process,
              },
              {
                title: t('blueprint_list', { defaultValue: 'Daftar Blueprint' }),
                path: paths.dashboard.blueprint.list,
              },
            ],
          },
          {
            title: t('rate_cards', { defaultValue: 'Rate Cards' }),
            path: paths.dashboard.quotation.rateCards,
            icon: icon('ic-invoice'),
          },
          {
            title: t('ai_settings', { defaultValue: 'AI Settings' }),
            path: paths.dashboard.quotation.aiSettings,
            icon: icon('ic-setting'),
          },
          {
            title: t('contract'),
            path: paths.dashboard.contract.root,
            icon: ICONS.contract,
          },
        ],
      },
    ];

    return sections;
  }, [t]);
}

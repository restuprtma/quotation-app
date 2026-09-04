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

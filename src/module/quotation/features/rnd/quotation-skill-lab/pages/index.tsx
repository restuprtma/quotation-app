import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { QuotationSkillLab } from '../components/quotation-skill-lab';

export default function Page() {
  const { t } = useTranslate('quotation-skill-lab');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <QuotationSkillLab />
    </>
  );
}

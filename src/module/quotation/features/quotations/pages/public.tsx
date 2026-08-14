import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { QuotationPublicView } from '../views/quotation-public-view';

export default function Page() {
  const { t } = useTranslate('quotation');
  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <QuotationPublicView />
    </>
  );
}

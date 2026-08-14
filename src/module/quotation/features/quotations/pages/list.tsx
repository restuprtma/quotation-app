import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { QuotationListView } from '../views/quotation-list-view';

export default function Page() {
  const { t } = useTranslate('quotation');
  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <QuotationListView />
    </>
  );
}

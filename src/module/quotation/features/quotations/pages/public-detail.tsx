import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { DetailPublicView } from '../views/detail-public-view';

export default function Page() {
  const { t } = useTranslate('quotation');
  return (
    <>
      <title>{`${t('detail.title')} - ${CONFIG.appName}`}</title>
      <DetailPublicView />
    </>
  );
}

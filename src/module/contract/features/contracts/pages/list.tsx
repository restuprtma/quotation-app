import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { ContractListView } from '../views/contract-list-view';

export default function Page() {
  const { t } = useTranslate('contract');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <ContractListView />
    </>
  );
}

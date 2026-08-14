import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { BlueprintPublicView } from '../views/blueprint-public-view';

export default function Page() {
  const { t } = useTranslate('quotation');
  return (
    <>
      <title>{`${t('blueprint.title')} - ${CONFIG.appName}`}</title>
      <BlueprintPublicView />
    </>
  );
}

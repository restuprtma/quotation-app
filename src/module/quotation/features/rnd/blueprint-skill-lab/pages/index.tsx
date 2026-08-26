import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';

import { BlueprintSkillLab } from '../components/blueprint-skill-lab';

export default function Page() {
  const { t } = useTranslate('blueprint-skill-lab');

  return (
    <>
      <title>{`${t('title')} - ${CONFIG.appName}`}</title>
      <BlueprintSkillLab />
    </>
  );
}

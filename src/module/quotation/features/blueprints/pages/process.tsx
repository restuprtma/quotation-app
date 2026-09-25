import { CONFIG } from 'src/shared/config';

import { BlueprintListView } from '../views/blueprint-list-view';

export default function BlueprintProcessPage() {
  return (
    <>
      <title>{`Proses Blueprint - ${CONFIG.appName}`}</title>
      <BlueprintListView mode="process" />
    </>
  );
}

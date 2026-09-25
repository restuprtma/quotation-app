import { CONFIG } from 'src/shared/config';

import { BlueprintListView } from '../views/blueprint-list-view';

export default function BlueprintListPage() {
  return (
    <>
      <title>{`Daftar Blueprint - ${CONFIG.appName}`}</title>
      <BlueprintListView mode="completed" />
    </>
  );
}

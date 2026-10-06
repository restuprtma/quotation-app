import { useParams } from 'react-router';

import { SharedBlueprintView } from '../views/shared-blueprint-view';

export default function SharedBlueprintPublicPage() {
  const { token = '' } = useParams<{ token: string }>();
  return <SharedBlueprintView token={token} />;
}

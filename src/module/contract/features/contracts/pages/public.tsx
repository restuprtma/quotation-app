import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/shared/config';

import { PublicContractView } from '../views/public-contract-view';

export default function Page() {
  const params = useParams();
  const token = params.token as string;

  return (
    <>
      <title>{`Contract Details - ${CONFIG.appName}`}</title>
      <PublicContractView token={token} />
    </>
  );
}

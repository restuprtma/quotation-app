import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/shared/config';

import { ContractEditView } from '../views/contract-edit-view';

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  return (
    <>
      <title>{`Edit Contract - ${CONFIG.appName}`}</title>
      <ContractEditView id={id} />
    </>
  );
}

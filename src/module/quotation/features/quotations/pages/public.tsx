import { useParams } from 'react-router';
import { QuotationPublicView } from '../views/quotation-public-view';

export default function QuotationPublicPage() {
  const { token = '' } = useParams<{ token: string }>();
  return <QuotationPublicView token={token} />;
}

import { useParams } from 'react-router';

import { QuotationEditorView } from '../views/quotation-editor-view';

export default function QuotationEditorPage() {
  const { id } = useParams<{ id: string }>();
  return <QuotationEditorView id={id} />;
}

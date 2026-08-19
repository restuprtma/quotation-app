export type RoundTripScenarioId = 'simple' | 'table-heavy' | 'legal';

export type OperationId =
  | 'paragraph-edited'
  | 'heading-edited'
  | 'list-edited'
  | 'row-added'
  | 'row-deleted'
  | 'column-added'
  | 'column-deleted'
  | 'cell-merged'
  | 'cell-split'
  | 'column-resized'
  | 'legal-unlocked'
  | 'legal-edited'
  | 'legal-restored';

export type RoundTripFixture = {
  id: RoundTripScenarioId;
  html: string;
  requiredOperations: OperationId[];
};

export type InvariantResult = {
  id: string;
  labelKey: string;
  passed: boolean;
  detail?: string;
};

export type RoundTripReport = {
  scenario: RoundTripScenarioId;
  sourceHTML: string;
  recreatedHTML: string;
  operations: Record<OperationId, boolean>;
  invariants: InvariantResult[];
  passed: boolean;
};

export declare function canonicalizeHTML(html: string): string;
export declare function compareRoundTrip(
  scenario: RoundTripScenarioId,
  sourceHTML: string,
  recreatedHTML: string,
  operations: Record<OperationId, boolean>
): RoundTripReport;

export const OPERATION_IDS: OperationId[] = [
  'paragraph-edited',
  'heading-edited',
  'list-edited',
  'row-added',
  'row-deleted',
  'column-added',
  'column-deleted',
  'cell-merged',
  'cell-split',
  'column-resized',
  'legal-unlocked',
  'legal-edited',
  'legal-restored',
];

export function createOperationState(): Record<OperationId, boolean> {
  return Object.fromEntries(OPERATION_IDS.map((id) => [id, false])) as Record<OperationId, boolean>;
}

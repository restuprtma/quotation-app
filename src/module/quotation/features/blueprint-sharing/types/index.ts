export interface SharedBlueprintData {
  title: string;
  revision_number: number;
  completeness_status: 'partial' | 'complete';
  published_at: string;
  summary: string;
  assumptions: string[];
  open_questions: string[];
  journey?: Record<string, any>;
  architecture?: Record<string, any>;
  state_machine?: Record<string, any>;
  workflow?: Record<string, any>;
  wbs?: Record<string, any>;
  completeness_matrix: Record<string, string>;
  warnings: string[];
}

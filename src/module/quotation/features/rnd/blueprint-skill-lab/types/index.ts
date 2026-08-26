// ----------------------------------------------------------------------
// Blueprint Skill R&D - Type Definitions (Contract v1.0)
// ----------------------------------------------------------------------

export type LayoutCoordinate = {
  x: number;
  y: number;
};

// 1. User Journey & Service Blueprint Section
export type JourneyPhase = {
  id: string;
  label: string;
  order: number;
};

export type JourneyActor = {
  id: string;
  label: string;
  order: number;
};

export type JourneyActivity = {
  id: string;
  phase_id: string;
  actor_id: string;
  label: string;
  description: string;
  touchpoints: string[];
  references: string[];
};

export type JourneySection = {
  phases: JourneyPhase[];
  actors: JourneyActor[];
  activities: JourneyActivity[];
};

// 2. System Architecture Section
export type ArchGroup = {
  id: string;
  label: string;
  order: number;
};

export type ArchNodeType =
  | 'channel'
  | 'application'
  | 'service'
  | 'database'
  | 'cache'
  | 'storage'
  | 'integration'
  | 'device';

export type ArchNode = {
  id: string;
  group_id: string;
  type: ArchNodeType;
  label: string;
  description: string;
  layout: LayoutCoordinate;
};

export type ArchEdgeType = 'sync' | 'async' | 'data_flow' | 'event';

export type ArchEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: ArchEdgeType;
};

export type ArchitectureSection = {
  groups: ArchGroup[];
  nodes: ArchNode[];
  edges: ArchEdge[];
};

// 3. State Machine Section
export type StateType = 'normal' | 'terminal' | 'exception';

export type StateNode = {
  id: string;
  label: string;
  type: StateType;
  layout: LayoutCoordinate;
};

export type StateTransition = {
  id: string;
  source: string;
  target: string;
  event: string;
  actor: string;
  guard: string;
  actions: string[];
};

export type StateMachineSection = {
  entity: string;
  initial_state: string;
  states: StateNode[];
  transitions: StateTransition[];
};

// 4. Workflow Section
export type WorkflowLane = {
  id: string;
  label: string;
  order: number;
};

export type WorkflowNodeType = 'start' | 'action' | 'system_action' | 'decision' | 'wait' | 'end';

export type WorkflowNode = {
  id: string;
  lane_id: string;
  type: WorkflowNodeType;
  label: string;
  description: string;
  layout: LayoutCoordinate;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type WorkflowProcess = {
  id: string;
  name: string;
  description: string;
  lanes: WorkflowLane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type WorkflowSection = WorkflowProcess[];

// 5. WBS Section
export type WBSFeature = {
  id: string;
  name: string;
  description: string;
  acceptance_criteria: string[];
};

export type WBSModulePriority = 'high' | 'medium' | 'low';

export type WBSModule = {
  id: string;
  name: string;
  description: string;
  priority: WBSModulePriority;
  dependencies: string[];
  references: string[];
  features: WBSFeature[];
};

export type WBSSection = {
  modules: WBSModule[];
};

// 6. Open Questions & Cross References
export type OpenQuestionSectionTarget =
  | 'journey'
  | 'architecture'
  | 'state_machine'
  | 'workflow'
  | 'wbs'
  | 'general';

export type OpenQuestionStatus = 'open' | 'answered' | 'deferred';

export type OpenQuestion = {
  id: string;
  question: string;
  target_section: OpenQuestionSectionTarget;
  impact: string;
  status: OpenQuestionStatus;
};

export type CrossReferenceRelationType =
  | 'implements'
  | 'transitions_on'
  | 'interacts_with'
  | 'deploys_to'
  | 'depends_on';

export type CrossReference = {
  id: string;
  source_ref: string;
  target_ref: string;
  relation_type: CrossReferenceRelationType;
  description: string;
};

// Root Blueprint Bundle
export type BlueprintBundle = {
  schema_version: '1.0';
  title: string;
  summary: string;
  journey: JourneySection;
  architecture: ArchitectureSection;
  state_machine: StateMachineSection;
  workflows: WorkflowSection;
  wbs: WBSSection;
  assumptions: string[];
  open_questions: OpenQuestion[];
  cross_references: CrossReference[];
};

// ----------------------------------------------------------------------
// Visual Lab State Types
// ----------------------------------------------------------------------

export type ActiveTabId = 0 | 1 | 2 | 3 | 4 | 5;

export type RoundTripDiff = {
  path: string;
  expected: unknown;
  actual: unknown;
};

export type RoundTripResult = {
  isMatch: boolean;
  serializedJson: string;
  parsedBundle: BlueprintBundle | null;
  diffs: RoundTripDiff[];
};

export type SelectedElement =
  | { type: 'activity'; id: string; data: JourneyActivity }
  | { type: 'phase'; id: string; data: JourneyPhase }
  | { type: 'actor'; id: string; data: JourneyActor }
  | { type: 'node'; id: string; data: ArchNode }
  | { type: 'edge'; id: string; data: ArchEdge }
  | { type: 'group'; id: string; data: ArchGroup }
  | null;

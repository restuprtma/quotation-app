export type BlueprintLayout = {
  x: number;
  y: number;
};

// ==========================================
// 1. User Journey
// ==========================================

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

export type Journey = {
  phases: JourneyPhase[];
  actors: JourneyActor[];
  activities: JourneyActivity[];
};

// ==========================================
// 2. System Architecture
// ==========================================

export type ArchitectureGroup = {
  id: string;
  label: string;
  order: number;
};

export type ArchitectureNodeType =
  | 'channel'
  | 'application'
  | 'service'
  | 'database'
  | 'cache'
  | 'storage'
  | 'integration'
  | 'device';

export type ArchitectureNode = {
  id: string;
  group_id: string;
  type: ArchitectureNodeType;
  label: string;
  description: string;
  layout: BlueprintLayout;
};

export type ArchitectureEdgeType = 'sync' | 'async' | 'data_flow' | 'event';

export type ArchitectureEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: ArchitectureEdgeType;
};

export type Architecture = {
  groups: ArchitectureGroup[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
};

// ==========================================
// 3. State Machine
// ==========================================

export type StateType = 'normal' | 'terminal' | 'exception';

export type State = {
  id: string;
  label: string;
  type: StateType;
  layout: BlueprintLayout;
};

export type Transition = {
  id: string;
  source: string;
  target: string;
  event: string;
  actor: string;
  guard: string;
  actions: string[];
};

export type StateMachine = {
  entity: string;
  initial_state: string;
  states: State[];
  transitions: Transition[];
};

// ==========================================
// 4. Business Process Workflows
// ==========================================

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
  layout: BlueprintLayout;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  lanes: WorkflowLane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

// ==========================================
// 5. Work Breakdown Structure (WBS)
// ==========================================

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

export type WBS = {
  modules: WBSModule[];
};

// ==========================================
// Supplementary: Open Questions & Cross References
// ==========================================

export type OpenQuestionTargetSection =
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
  target_section: OpenQuestionTargetSection;
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

// ==========================================
// Bundle & Manual Content Transport Envelopes
// ==========================================

export type BundlePartial = {
  schema_version?: string;
  title?: string;
  summary?: string;
  context?: Record<string, any>;
  journey?: Journey;
  architecture?: Architecture;
  state_machine?: StateMachine;
  workflows?: Workflow[];
  wbs?: WBS;
  assumptions?: string[];
  open_questions?: OpenQuestion[];
  cross_references?: CrossReference[];
  [key: string]: any;
};

export type ManualContentMap = {
  journey: { journey: Journey };
  architecture: { architecture: Architecture };
  state_machine: { state_machine: StateMachine };
  workflow: { workflows: Workflow[] };
  wbs: { wbs: WBS; cross_references: CrossReference[] };
};

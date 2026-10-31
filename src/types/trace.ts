import type { SupportedLanguage } from './algorithm';

export type ElementState = 
  | 'default'
  | 'comparing'
  | 'sorted'
  | 'swapped'
  | 'selected'
  | 'discarded';

export interface ArrayElement {
  id: string;
  value: number;
  originalIndex: number;
  state: ElementState;
  label?: string;
  nonColorIndicator?: string;
}

export interface NamedArrayState {
  name: string;
  elements: ArrayElement[];
}

export interface MemoryFrame {
  id: string;
  name: string;
  isActive: boolean;
  variables: Record<string, string | number | boolean | null | undefined>;
  variableTypes?: Record<string, string>;
  returnValue?: string | number | boolean | null;
}

export type OperationType = 
  | 'init'
  | 'iterate_outer'
  | 'iterate_inner'
  | 'compare'
  | 'swap'
  | 'assign'
  | 'check'
  | 'finish';

export interface ComplexityInfo {
  timeComplexity: string;
  spaceComplexity: string;
  bestCase?: string;
  worstCase?: string;
  averageCase?: string;
}

export interface StepMetrics {
  comparisons: number;
  swaps: number;
  operations: number;
}

export type LineHighlightType = 'active' | 'executed' | 'next' | 'evaluating';

export interface StepLineHighlight {
  lineNumber: number;
  type: LineHighlightType;
  badgeText?: string;
  lineByLanguage?: Record<SupportedLanguage, number>;
}

export interface Step {
  stepIndex: number;
  totalSteps: number;
  activeLine: number;
  activeLineByLang: Record<SupportedLanguage, number>;
  highlights: StepLineHighlight[];
  array: ArrayElement[];
  namedArrays?: NamedArrayState[];
  frames: MemoryFrame[];
  explanation: string;
  metrics: StepMetrics;
  complexity: ComplexityInfo;
  activeIndices: {
    i?: number;
    j?: number;
    min?: number;
    keyVal?: number;
    keyIndex?: number;
    pivot?: number;
    left?: number;
    right?: number;
    mid?: number;
    [key: string]: number | undefined;
  };
  operationType: OperationType;
  divideAndConquer?: DivideAndConquerState;
}

export type RecursionNodeState = 
  | 'idle'
  | 'dividing'
  | 'processing'
  | 'base_case'
  | 'combining'
  | 'solved'
  | 'completed';

export interface RecursionTreeNode {
  id: string;
  parentId?: string;
  depth: number;
  range: [number, number]; // [start, end]
  values: number[];
  currentValues?: number[];
  state: RecursionNodeState;
  leftId?: string;
  rightId?: string;
  label: string;
  isLeftChild?: boolean;
}

export interface ParallelWorkerTask {
  id: string;
  workerId: number;
  range: [number, number];
  values: number[];
  status: 'idle' | 'working' | 'merging' | 'done';
  description: string;
}

export interface ParallelQueueItem {
  id: string;
  range: [number, number];
  values: number[];
  action: 'divide' | 'conquer' | 'merge';
  description: string;
}

export interface ParallelWorkerState {
  id: number;
  name: string;
  status: 'idle' | 'active' | 'merging';
  currentTask?: ParallelWorkerTask;
}

export interface ParallelState {
  taskQueue: ParallelQueueItem[];
  workers: ParallelWorkerState[];
  completedTasks: string[];
}

export interface DivideAndConquerState {
  nodes: Record<string, RecursionTreeNode>;
  activeNodeId?: string;
  activePhase: 'divide' | 'conquer' | 'combine' | 'completed';
  phaseDescription?: string;
  parallel: ParallelState;
}

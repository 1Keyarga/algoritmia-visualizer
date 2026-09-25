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

export interface MemoryFrame {
  id: string;
  name: string;
  isActive: boolean;
  variables: Record<string, string | number | boolean | null | undefined>;
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
    [key: string]: number | undefined;
  };
  operationType: OperationType;
  isSorted?: boolean;
}

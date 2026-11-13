import type { Step } from '../../types/trace';

export type ComparisonSyncMode = 'milestones' | 'raw';

export interface ComparisonTraceEntry {
  step: Step;
  rawIndex: number;
}

export interface ComparisonDeltaSummary {
  primaryComparisons: number;
  secondaryComparisons: number;
  primaryWrites: number;
  secondaryWrites: number;
  primaryMilestones: number;
  secondaryMilestones: number;
}

/**
 * Extrae únicamente hitos algorítmicos relevantes (inicio, comparaciones reales,
 * escrituras/intercambios en el arreglo y fin) para evitar que líneas sintácticas
 * auxiliares distorsionen el ritmo relativo en modo Comparación.
 */
export function buildComparisonEntries(
  steps: Step[],
  mode: ComparisonSyncMode
): ComparisonTraceEntry[] {
  if (steps.length === 0) return [];
  if (mode === 'raw') {
    return steps.map((step, rawIndex) => ({ step, rawIndex }));
  }

  const entries: ComparisonTraceEntry[] = [{ step: steps[0], rawIndex: 0 }];
  let prevComparisons = steps[0].metrics.comparisons;
  let prevValuesSig = steps[0].array.map(e => e.value).join(',');

  for (let i = 1; i < steps.length - 1; i++) {
    const step = steps[i];
    const currentValuesSig = step.array.map(e => e.value).join(',');
    const comparisonAdvanced = step.metrics.comparisons > prevComparisons;
    const arrayMutated = currentValuesSig !== prevValuesSig;
    const isEffectiveSwap = step.operationType === 'swap' && arrayMutated;

    if (comparisonAdvanced || arrayMutated || isEffectiveSwap) {
      entries.push({ step, rawIndex: i });
    }

    prevComparisons = step.metrics.comparisons;
    prevValuesSig = currentValuesSig;
  }

  if (steps.length > 1) {
    const lastIdx = steps.length - 1;
    entries.push({ step: steps[lastIdx], rawIndex: lastIdx });
  }

  return entries;
}

export function computeComparisonSummary(
  primaryEntries: ComparisonTraceEntry[],
  secondaryEntries: ComparisonTraceEntry[]
): ComparisonDeltaSummary | null {
  const lastA = primaryEntries[primaryEntries.length - 1]?.step;
  const lastB = secondaryEntries[secondaryEntries.length - 1]?.step;
  if (!lastA || !lastB) return null;

  return {
    primaryComparisons: lastA.metrics.comparisons,
    secondaryComparisons: lastB.metrics.comparisons,
    primaryWrites: lastA.metrics.swaps,
    secondaryWrites: lastB.metrics.swaps,
    primaryMilestones: primaryEntries.length,
    secondaryMilestones: secondaryEntries.length,
  };
}

import type { ArrayElement, Step } from '../../../types/trace';

export interface BinaryIterationRecord {
  iteration: number;
  left: number;
  right: number;
  mid: number;
  midValue: number;
  outcome: 'match' | 'go_right' | 'go_left';
}

export interface SearchTelemetry {
  target: number;
  currI?: number;
  inicio?: number;
  fin?: number;
  medio?: number;
  resultado?: number;
  isFound: boolean;
  isFinalNotFound: boolean;
  checkedIndices: Set<number>;
  lastEvaluatedI?: number;
  binaryIterations: BinaryIterationRecord[];
  prevMid?: number;
  activeRangeCount: number;
  discardedCount: number;
}

export function deriveSearchTelemetry(
  array: ArrayElement[],
  algorithmType: 'linear' | 'binary',
  currentStep: Step | null,
  traceHistory?: Step[],
  fallbackTarget: number = 45
): SearchTelemetry {
  const n = array.length;
  const vars = currentStep?.frames?.[0]?.variables || {};

  const inicio = typeof vars.inicio === 'number' ? vars.inicio : undefined;
  const fin = typeof vars.fin === 'number' ? vars.fin : undefined;
  const medio = typeof vars.medio === 'number' ? vars.medio : undefined;
  const currI = typeof vars.i === 'number' ? vars.i : undefined;
  const target = typeof vars.clave === 'number' ? vars.clave : fallbackTarget;
  const resultado = typeof vars.resultado === 'number' ? vars.resultado : undefined;

  const isFound = resultado !== undefined && resultado !== -1;
  const isFinalNotFound =
    resultado === -1 && currentStep?.operationType === 'finish';

  const history = traceHistory && traceHistory.length > 0
    ? traceHistory
    : currentStep
      ? [currentStep]
      : [];

  const checkedIndices = new Set<number>();
  let lastEvaluatedI: number | undefined;
  const binaryIterations: BinaryIterationRecord[] = [];
  let prevMid: number | undefined;

  if (algorithmType === 'linear') {
    for (const st of history) {
      const stVars = st.frames?.[0]?.variables || {};
      const stI = typeof stVars.i === 'number' ? stVars.i : undefined;
      if (stI !== undefined) {
        lastEvaluatedI = stI;
        if (st.operationType === 'compare' && st.array[stI]?.value !== target) {
          checkedIndices.add(stI);
        }
      }
    }
    if (currI !== undefined) {
      for (let k = 0; k < currI; k++) {
        checkedIndices.add(k);
      }
    }
    if (isFinalNotFound) {
      for (let k = 0; k < n; k++) {
        checkedIndices.add(k);
      }
    }
  } else {
    for (const st of history) {
      const stVars = st.frames?.[0]?.variables || {};
      const l = typeof stVars.inicio === 'number' ? stVars.inicio : undefined;
      const r = typeof stVars.fin === 'number' ? stVars.fin : undefined;
      const m = typeof stVars.medio === 'number' ? stVars.medio : undefined;

      if (l !== undefined && r !== undefined && m !== undefined && m >= 0 && m < st.array.length) {
        const val = st.array[m].value;
        const outcome: BinaryIterationRecord['outcome'] =
          val === target ? 'match' : val < target ? 'go_right' : 'go_left';

        const prev = binaryIterations[binaryIterations.length - 1];
        if (!prev || prev.mid !== m || prev.left !== l || prev.right !== r) {
          if (
            prev &&
            prev.mid === m &&
            prev.left <= l &&
            prev.right >= r
          ) {
            // Actualización post-decisión de límites en el mismo pivote: no duplicar iteración
            continue;
          }
          if (prev && prev.mid !== m) {
            prevMid = prev.mid;
          }
          binaryIterations.push({
            iteration: binaryIterations.length + 1,
            left: l,
            right: r,
            mid: m,
            midValue: val,
            outcome,
          });
        }
      }
    }

    if (binaryIterations.length >= 2 && medio !== undefined) {
      const last = binaryIterations[binaryIterations.length - 1];
      const beforeLast = binaryIterations[binaryIterations.length - 2];
      prevMid = last.mid === medio ? beforeLast.mid : last.mid;
    } else if (binaryIterations.length === 1 && medio !== undefined && binaryIterations[0].mid !== medio) {
      prevMid = binaryIterations[0].mid;
    }
  }

  let activeRangeCount = n;
  let discardedCount = 0;

  if (isFound) {
    activeRangeCount = 1;
    discardedCount = Math.max(0, n - 1);
  } else if (isFinalNotFound) {
    activeRangeCount = 0;
    discardedCount = n;
  } else if (algorithmType === 'binary') {
    const lb = inicio !== undefined ? inicio : 0;
    const rb = fin !== undefined ? fin : n - 1;
    activeRangeCount = Math.max(0, rb - lb + 1);
    discardedCount = Math.max(0, n - activeRangeCount);
  } else {
    discardedCount = currI !== undefined ? Math.min(n, checkedIndices.size) : 0;
    activeRangeCount = Math.max(0, n - discardedCount);
  }

  return {
    target,
    currI,
    inicio,
    fin,
    medio,
    resultado,
    isFound,
    isFinalNotFound,
    checkedIndices,
    lastEvaluatedI,
    binaryIterations,
    prevMid,
    activeRangeCount,
    discardedCount,
  };
}

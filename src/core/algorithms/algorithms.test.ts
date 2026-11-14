import { describe, expect, it } from 'vitest';
import type { Step } from '../../types/trace';
import { generateBubbleSortTrace } from './bubbleSort';
import { generateSelectionSortTrace } from './selectionSort';
import { generateInsertionSortTrace } from './insertionSort';
import { generateMergeSortTrace } from './mergeSort';
import { generateQuickSortTrace } from './quickSort';
import { generateLinearSearchTrace } from './linearSearch';
import { generateBinarySearchTrace } from './binarySearch';

function assertTraceInvariants(steps: Step[]) {
  expect(steps.length).toBeGreaterThan(0);

  let prevComparisons = 0;
  let prevSwaps = 0;
  let prevOperations = 0;

  steps.forEach((step, idx) => {
    expect(step.stepIndex).toBe(idx + 1);
    expect(step.totalSteps).toBe(steps.length);
    expect(step.explanation.trim().length).toBeGreaterThan(0);
    expect(step.frames.length).toBeGreaterThan(0);
    expect(step.metrics.comparisons).toBeGreaterThanOrEqual(prevComparisons);
    expect(step.metrics.swaps).toBeGreaterThanOrEqual(prevSwaps);
    expect(step.metrics.operations).toBeGreaterThanOrEqual(prevOperations);

    prevComparisons = step.metrics.comparisons;
    prevSwaps = step.metrics.swaps;
    prevOperations = step.metrics.operations;
  });

  expect(steps[steps.length - 1].operationType).toBe('finish');
}

describe('RNF-03: Verificación integral de trazas y salidas de los 7 algoritmos', () => {
  const sortingAlgorithms: Array<{
    name: string;
    run: (data: number[]) => Step[];
    recursive?: boolean;
  }> = [
    { name: 'Bubble Sort Optimizado', run: (d) => generateBubbleSortTrace(d, true) },
    { name: 'Bubble Sort Clásico', run: (d) => generateBubbleSortTrace(d, false) },
    { name: 'Selection Sort', run: generateSelectionSortTrace },
    { name: 'Insertion Sort', run: generateInsertionSortTrace },
    { name: 'Merge Sort', run: generateMergeSortTrace, recursive: true },
    { name: 'Quick Sort', run: generateQuickSortTrace, recursive: true },
  ];

  const sortCases: Array<{ label: string; input: number[] }> = [
    { label: 'desordenado con negativos y cero', input: [38, -5, 27, 43, 0, 9, -5] },
    { label: 'ya ordenado', input: [1, 2, 3, 4, 5, 6] },
    { label: 'orden inverso', input: [9, 7, 5, 3, 1] },
    { label: 'duplicados', input: [5, 2, 5, 1, 5, 2] },
    { label: 'todos iguales', input: [4, 4, 4, 4] },
    { label: 'un solo elemento', input: [42] },
    { label: 'arreglo vacío', input: [] },
  ];

  for (const algo of sortingAlgorithms) {
    describe(algo.name, () => {
      for (const testCase of sortCases) {
        it(`ordena correctamente el caso: ${testCase.label}`, () => {
          const snapshot = [...testCase.input];
          const steps = algo.run(snapshot);

          // No debe mutar el arreglo de entrada
          expect(snapshot).toEqual(testCase.input);

          assertTraceInvariants(steps);

          const expectedSorted = [...testCase.input].sort((a, b) => a - b);
          const finalStep = steps[steps.length - 1];
          const actualValues = finalStep.array.map((el) => el.value);

          expect(actualValues).toEqual(expectedSorted);
          for (const el of finalStep.array) {
            expect(el.state).toBe('sorted');
          }

          if (algo.recursive && testCase.input.length > 0) {
            expect(finalStep.divideAndConquer).toBeDefined();
            const rootKey = `node-0-${testCase.input.length - 1}`;
            expect(finalStep.divideAndConquer?.nodes[rootKey]?.state).toBe('completed');
          }
        });
      }
    });
  }

  describe('Búsqueda Lineal', () => {
    it('encuentra valores presentes al inicio, medio y final', () => {
      const data = [14, 7, 45, 23, 9];
      for (const [idx, target] of data.entries()) {
        const steps = generateLinearSearchTrace(data, target);
        assertTraceInvariants(steps);
        const last = steps[steps.length - 1];
        expect(last.frames[0].variables.resultado).toBe(idx);
      }
    });

    it('devuelve -1 cuando el objetivo no existe, en 1 elemento y en arreglo vacío', () => {
      const miss = generateLinearSearchTrace([10, 20, 30], 99);
      assertTraceInvariants(miss);
      expect(miss[miss.length - 1].frames[0].variables.resultado).toBe(-1);

      const singleHit = generateLinearSearchTrace([42], 42);
      assertTraceInvariants(singleHit);
      expect(singleHit[singleHit.length - 1].frames[0].variables.resultado).toBe(0);

      const singleMiss = generateLinearSearchTrace([42], 7);
      assertTraceInvariants(singleMiss);
      expect(singleMiss[singleMiss.length - 1].frames[0].variables.resultado).toBe(-1);

      const empty = generateLinearSearchTrace([], 10);
      assertTraceInvariants(empty);
      expect(empty[empty.length - 1].frames[0].variables.resultado).toBe(-1);
    });
  });

  describe('Búsqueda Binaria', () => {
    it('encuentra correctamente en extremos, centro y duplicados sobre arreglo ordenado', () => {
      const data = [-10, 3, 12, 27, 27, 44, 90];
      for (const target of [-10, 12, 27, 90]) {
        const steps = generateBinarySearchTrace(data, target);
        assertTraceInvariants(steps);
        const last = steps[steps.length - 1];
        const resultIdx = Number(last.frames[0].variables.resultado);
        expect(resultIdx).toBeGreaterThanOrEqual(0);
        expect(data[resultIdx]).toBe(target);
      }
    });

    it('devuelve -1 cuando el objetivo no está presente, en 1 elemento y en arreglo vacío', () => {
      const missLow = generateBinarySearchTrace([5, 10, 15, 20], 1);
      assertTraceInvariants(missLow);
      expect(missLow[missLow.length - 1].frames[0].variables.resultado).toBe(-1);

      const missMid = generateBinarySearchTrace([5, 10, 15, 20], 12);
      assertTraceInvariants(missMid);
      expect(missMid[missMid.length - 1].frames[0].variables.resultado).toBe(-1);

      const singleHit = generateBinarySearchTrace([27], 27);
      assertTraceInvariants(singleHit);
      expect(singleHit[singleHit.length - 1].frames[0].variables.resultado).toBe(0);

      const singleMiss = generateBinarySearchTrace([27], 15);
      assertTraceInvariants(singleMiss);
      expect(singleMiss[singleMiss.length - 1].frames[0].variables.resultado).toBe(-1);

      const empty = generateBinarySearchTrace([], 27);
      assertTraceInvariants(empty);
      expect(empty[empty.length - 1].frames[0].variables.resultado).toBe(-1);
    });
  });
});

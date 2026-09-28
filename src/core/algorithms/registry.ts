import type { AlgorithmMetadata } from '../../types/algorithm';
import { BUBBLE_SORT_CLASSIC_METADATA, BUBBLE_SORT_OPTIMIZED_METADATA } from './bubbleSort';
import { SELECTION_SORT_METADATA } from './selectionSort';
import { INSERTION_SORT_METADATA } from './insertionSort';
import { MERGE_SORT_METADATA } from './mergeSort';

export const ALGORITHMS_CATALOG: AlgorithmMetadata[] = [
  BUBBLE_SORT_CLASSIC_METADATA,
  BUBBLE_SORT_OPTIMIZED_METADATA,
  SELECTION_SORT_METADATA,
  INSERTION_SORT_METADATA,
  MERGE_SORT_METADATA,
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    family: 'divide_and_conquer',
    categoryName: 'Divide y Vencerás',
    description: 'Selecciona un pivote y particiona los elementos menores a la izquierda y mayores a la derecha recursivamente.',
    defaultDataset: [29, 10, 14, 37, 13, 85, 42, 60, 75, 5],
    complexity: { time: 'O(n log n)', space: 'O(log n)', bestCase: 'O(n log n)', worstCase: 'O(n²)' },
    codeByLanguage: {
      pseudocode: [],
      python: [],
      cpp: [],
      java: [],
    },
  },
];

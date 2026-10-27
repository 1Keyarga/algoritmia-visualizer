import type { AlgorithmMetadata } from '../../types/algorithm';
import { BUBBLE_SORT_CLASSIC_METADATA, BUBBLE_SORT_OPTIMIZED_METADATA } from './bubbleSort';
import { SELECTION_SORT_METADATA } from './selectionSort';
import { INSERTION_SORT_METADATA } from './insertionSort';
import { MERGE_SORT_METADATA } from './mergeSort';
import { LINEAR_SEARCH_METADATA } from './linearSearch';
import { BINARY_SEARCH_METADATA } from './binarySearch';

export const CUSTOM_AST_METADATA: AlgorithmMetadata = {
  id: 'custom-ast',
  name: 'Código Personalizado (Acorn AST)',
  family: 'custom',
  categoryName: 'Editor de Estudiante (AST)',
  description: 'Escribe o edita tu propio algoritmo en JavaScript. El analizador sintáctico Acorn.js analiza el AST e instrumenta generadores paso a paso para visualizar comparaciones, asignaciones y memoria.',
  defaultDataset: [12, 23, 67, 12, 56, 11, 45, 23, 78, 56, 78, 89, 98, 45],
  complexity: {
    time: 'Variable',
    space: 'Variable',
    bestCase: 'O(1) a O(n)',
    worstCase: 'O(n²)',
  },
  codeByLanguage: {
    pseudocode: [],
    python: [],
    cpp: [],
    java: [],
  },
};

export const ALGORITHMS_CATALOG: AlgorithmMetadata[] = [
  BUBBLE_SORT_CLASSIC_METADATA,
  BUBBLE_SORT_OPTIMIZED_METADATA,
  SELECTION_SORT_METADATA,
  INSERTION_SORT_METADATA,
  MERGE_SORT_METADATA,
  LINEAR_SEARCH_METADATA,
  BINARY_SEARCH_METADATA,
  CUSTOM_AST_METADATA,
];

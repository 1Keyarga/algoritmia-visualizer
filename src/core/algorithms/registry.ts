import type { AlgorithmMetadata } from '../../types/algorithm';
import { BUBBLE_SORT_CLASSIC_METADATA, BUBBLE_SORT_OPTIMIZED_METADATA } from './bubbleSort';
import { SELECTION_SORT_METADATA } from './selectionSort';
import { INSERTION_SORT_METADATA } from './insertionSort';
import { MERGE_SORT_METADATA } from './mergeSort';
import { QUICK_SORT_METADATA } from './quickSort';
import { LINEAR_SEARCH_METADATA } from './linearSearch';
import { BINARY_SEARCH_METADATA } from './binarySearch';

export const CUSTOM_AST_METADATA: AlgorithmMetadata = {
  id: 'custom-ast',
  name: 'Código del Estudiante',
  family: 'custom',
  categoryName: 'Editor de Código',
  description: 'Escribe o edita tu propio algoritmo en C o JavaScript. El sistema analiza la sintaxis, traza el flujo de ejecución e instrumenta la memoria para visualizar paso a paso las comparaciones, intercambios y registros de variables.',
  defaultDataset: [64, 34, 25, 12, 22, 11, 90],
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
  QUICK_SORT_METADATA,
  LINEAR_SEARCH_METADATA,
  BINARY_SEARCH_METADATA,
];

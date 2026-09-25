import type { AlgorithmMetadata } from '../../types/algorithm';
import { BUBBLE_SORT_CLASSIC_METADATA, BUBBLE_SORT_OPTIMIZED_METADATA } from './bubbleSort';
import { SELECTION_SORT_METADATA } from './selectionSort';
import { INSERTION_SORT_METADATA } from './insertionSort';

export const ALGORITHMS_CATALOG: AlgorithmMetadata[] = [
  BUBBLE_SORT_CLASSIC_METADATA,
  BUBBLE_SORT_OPTIMIZED_METADATA,
  SELECTION_SORT_METADATA,
  INSERTION_SORT_METADATA,
  {
    id: 'linear-search',
    name: 'Búsqueda Lineal',
    family: 'searching',
    categoryName: 'Algoritmos de Búsqueda',
    description: 'Recorre secuencialmente cada elemento del arreglo hasta encontrar el elemento objetivo o terminar el recorrido.',
    defaultDataset: [12, 23, 34, 45, 56, 67, 78, 89, 98],
    complexity: { time: 'O(n)', space: 'O(1)', bestCase: 'O(1)', worstCase: 'O(n)' },
    codeByLanguage: {
      pseudocode: [],
      python: [],
      cpp: [],
      java: [],
    },
  },
  {
    id: 'binary-search',
    name: 'Búsqueda Binaria',
    family: 'searching',
    categoryName: 'Algoritmos de Búsqueda',
    description: 'Divide repetidamente a la mitad el espacio de búsqueda en un arreglo previamente ordenado.',
    defaultDataset: [11, 12, 23, 34, 45, 56, 67, 78, 89, 98],
    complexity: { time: 'O(log n)', space: 'O(1)', bestCase: 'O(1)', worstCase: 'O(log n)' },
    codeByLanguage: {
      pseudocode: [],
      python: [],
      cpp: [],
      java: [],
    },
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    family: 'divide_and_conquer',
    categoryName: 'Divide y Vencerás',
    description: 'Divide el arreglo recursivamente a la mitad hasta subarreglos unitarios y luego los combina ordenadamente.',
    defaultDataset: [38, 27, 43, 3, 9, 82, 10, 19, 50, 61],
    complexity: { time: 'O(n log n)', space: 'O(n)', bestCase: 'O(n log n)', worstCase: 'O(n log n)' },
    codeByLanguage: {
      pseudocode: [],
      python: [],
      cpp: [],
      java: [],
    },
  },
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

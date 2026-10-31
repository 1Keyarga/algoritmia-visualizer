import type { Step, ArrayElement, MemoryFrame, StepLineHighlight } from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';

export const SELECTION_SORT_METADATA: AlgorithmMetadata = {
  id: 'selection-sort',
  name: 'Selection Sort',
  family: 'sorting',
  categoryName: 'Algoritmos de Ordenamiento',
  description: 'Busca iterativamente el elemento mínimo en el subarreglo no ordenado y lo coloca al inicio de este intercambiándolo con el elemento en la posición i.',
  defaultDataset: [45, 12, 89, 23, 56, 11, 78, 98, 67, 34, 52, 18, 71, 29],
  complexity: {
    time: 'O(n²)',
    space: 'O(1)',
    bestCase: 'O(n²)',
    worstCase: 'O(n²)',
    averageCase: 'O(n²)',
  },
  codeByLanguage: {
    pseudocode: [
      { lineNumber: 1, code: 'funcion intercambiar(arr, i, j):', indent: 0 },
      { lineNumber: 2, code: '    temp ← arr[i]', indent: 1 },
      { lineNumber: 3, code: '    arr[i] ← arr[j]', indent: 1 },
      { lineNumber: 4, code: '    arr[j] ← temp', indent: 1 },
      { lineNumber: 5, code: '', indent: 0 },
      { lineNumber: 6, code: 'algoritmo ordenamiento_seleccion(arr):', indent: 0 },
      { lineNumber: 7, code: '    n ← longitud(arr)', indent: 1 },
      { lineNumber: 8, code: '    para i ← 0 hasta n - 2 hacer:', indent: 1 },
      { lineNumber: 9, code: '        min ← i', indent: 2 },
      { lineNumber: 10, code: '        para j ← i + 1 hasta n - 1 hacer:', indent: 2 },
      { lineNumber: 11, code: '            si arr[j] < arr[min] entonces:', indent: 3 },
      { lineNumber: 12, code: '                min ← j', indent: 4 },
      { lineNumber: 13, code: '        intercambiar(arr, i, min)', indent: 2 },
      { lineNumber: 14, code: '    retornar arr', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def swap(arr, i, j):', indent: 0 },
      { lineNumber: 2, code: '    arr[i], arr[j] = arr[j], arr[i]', indent: 1 },
      { lineNumber: 3, code: '', indent: 0 },
      { lineNumber: 4, code: 'def selection_sort(arr):', indent: 0 },
      { lineNumber: 5, code: '    n = len(arr)', indent: 1 },
      { lineNumber: 6, code: '    for i in range(n - 1):', indent: 1 },
      { lineNumber: 7, code: '        min_idx = i', indent: 2 },
      { lineNumber: 8, code: '        for j in range(i + 1, n):', indent: 2 },
      { lineNumber: 9, code: '            if arr[j] < arr[min_idx]:', indent: 3 },
      { lineNumber: 10, code: '                min_idx = j', indent: 4 },
      { lineNumber: 11, code: '        swap(arr, i, min_idx)', indent: 2 },
      { lineNumber: 12, code: '    return arr', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'void swap(int& a, int& b) {', indent: 0 },
      { lineNumber: 2, code: '    int temp = a; a = b; b = temp;', indent: 1 },
      { lineNumber: 3, code: '}', indent: 0 },
      { lineNumber: 4, code: '', indent: 0 },
      { lineNumber: 5, code: 'void selectionSort(vector<int>& arr) {', indent: 0 },
      { lineNumber: 6, code: '    int n = arr.size();', indent: 1 },
      { lineNumber: 7, code: '    for (int i = 0; i < n - 1; i++) {', indent: 1 },
      { lineNumber: 8, code: '        int min = i;', indent: 2 },
      { lineNumber: 9, code: '        for (int j = i + 1; j < n; j++) {', indent: 2 },
      { lineNumber: 10, code: '            if (arr[j] < arr[min]) {', indent: 3 },
      { lineNumber: 11, code: '                min = j;', indent: 4 },
      { lineNumber: 12, code: '            }', indent: 3 },
      { lineNumber: 13, code: '        }', indent: 2 },
      { lineNumber: 14, code: '        swap(arr[i], arr[min]);', indent: 2 },
      { lineNumber: 15, code: '    }', indent: 1 },
      { lineNumber: 16, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'static void swap(int[] arr, int i, int j) {', indent: 0 },
      { lineNumber: 2, code: '    int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;', indent: 1 },
      { lineNumber: 3, code: '}', indent: 0 },
      { lineNumber: 4, code: '', indent: 0 },
      { lineNumber: 5, code: 'public static void selectionSort(int[] arr) {', indent: 0 },
      { lineNumber: 6, code: '    int n = arr.length;', indent: 1 },
      { lineNumber: 7, code: '    for (int i = 0; i < n - 1; i++) {', indent: 1 },
      { lineNumber: 8, code: '        int min = i;', indent: 2 },
      { lineNumber: 9, code: '        for (int j = i + 1; j < n; j++) {', indent: 2 },
      { lineNumber: 10, code: '            if (arr[j] < arr[min]) {', indent: 3 },
      { lineNumber: 11, code: '                min = j;', indent: 4 },
      { lineNumber: 12, code: '            }', indent: 3 },
      { lineNumber: 13, code: '        }', indent: 2 },
      { lineNumber: 14, code: '        swap(arr, i, min);', indent: 2 },
      { lineNumber: 15, code: '    }', indent: 1 },
      { lineNumber: 16, code: '}', indent: 0 },
    ],
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateSelectionSortTrace(initialData: number[]): Step[] {
  const steps: Step[] = [];
  const n = initialData.length;

  let currentArray: ArrayElement[] = initialData.map((val, idx) => ({
    id: `item-${idx}-${val}`,
    value: val,
    originalIndex: idx,
    state: 'default',
    label: LETTERS[idx % LETTERS.length],
  }));

  let comparisonsCount = 0;
  let swapsCount = 0;
  let operationsCount = 0;

  const createFrames = (iVal?: number, jVal?: number, minVal?: number): MemoryFrame[] => [
    {
      id: 'frame-selection',
      name: 'selectionSort',
      isActive: true,
      variables: {
        i: iVal !== undefined ? iVal : null,
        j: jVal !== undefined ? jVal : null,
        min: minVal !== undefined ? minVal : null,
        n: n,
        arr: '→ [0..' + (n - 1) + ']',
      },
    },
    {
      id: 'frame-global',
      name: 'Entorno Global',
      isActive: false,
      variables: {},
    },
  ];

  const cloneArray = (arr: ArrayElement[]): ArrayElement[] =>
    arr.map(item => ({ ...item }));

  const pushStep = (
    lines: Record<SupportedLanguage, number>,
    highlights: StepLineHighlight[],
    explanation: string,
    operationType: Step['operationType'],
    iVal?: number,
    jVal?: number,
    minVal?: number,
    customArray?: ArrayElement[]
  ) => {
    operationsCount++;
    steps.push({
      stepIndex: steps.length + 1,
      totalSteps: 0,
      activeLine: lines.pseudocode,
      activeLineByLang: lines,
      highlights,
      array: cloneArray(customArray || currentArray),
      frames: createFrames(iVal, jVal, minVal),
      explanation,
      metrics: {
        comparisons: comparisonsCount,
        swaps: swapsCount,
        operations: operationsCount,
      },
      complexity: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
        bestCase: 'O(n²)',
      },
      activeIndices: {
        i: iVal,
        j: jVal,
        min: minVal,
      },
      operationType,
    });
  };

  // Inicio
  pushStep(
    { pseudocode: 6, python: 4, cpp: 5, java: 5 },
    [{ lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 4, cpp: 5, java: 5 } }],
    `Iniciando ejecución de Selection Sort con ${n} elementos.`,
    'init'
  );

  // Asignación de n
  pushStep(
    { pseudocode: 7, python: 5, cpp: 6, java: 6 },
    [{ lineNumber: 7, type: 'active', lineByLanguage: { pseudocode: 7, python: 5, cpp: 6, java: 6 } }],
    `Obteniendo la longitud del arreglo: n = ${n}.`,
    'assign'
  );

  const sortedIndices = new Set<number>();
  let lastI = 0;

  for (let i = 0; i < n - 1; i++) {
    lastI = i;

    // Bucle exterior i
    pushStep(
      { pseudocode: 8, python: 6, cpp: 7, java: 7 },
      [{ lineNumber: 8, type: 'active', lineByLanguage: { pseudocode: 8, python: 6, cpp: 7, java: 7 } }],
      `Iniciando pasada i = ${i}. Se buscará el elemento mínimo en el subarreglo restante [${i}..${n - 1}].`,
      'iterate_outer',
      i
    );

    let min = i;

    // Asignación min = i
    currentArray = currentArray.map((item, idx) => {
      if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
      if (idx === min) return { ...item, state: 'selected', nonColorIndicator: 'min' };
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });

    pushStep(
      { pseudocode: 9, python: 7, cpp: 8, java: 8 },
      [{ lineNumber: 9, type: 'active', lineByLanguage: { pseudocode: 9, python: 7, cpp: 8, java: 8 } }],
      `Suponiendo inicialmente que el mínimo está en el índice min = ${i} (valor: ${currentArray[i].value}).`,
      'assign',
      i,
      undefined,
      min
    );

    for (let j = i + 1; j < n; j++) {
      // Marcar j como comparing y min como selected
      currentArray = currentArray.map((item, idx) => {
        if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
        if (idx === min) return { ...item, state: 'selected', nonColorIndicator: 'min' };
        if (idx === j) return { ...item, state: 'comparing', nonColorIndicator: '(j)' };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });

      // Bucle interno j
      pushStep(
        { pseudocode: 10, python: 8, cpp: 9, java: 9 },
        [{ lineNumber: 10, type: 'active', lineByLanguage: { pseudocode: 10, python: 8, cpp: 9, java: 9 } }],
        `Bucle interno: comparando elemento en j = ${j} frente al mínimo actual en min = ${min}.`,
        'iterate_inner',
        i,
        j,
        min
      );

      comparisonsCount++;
      const valJ = currentArray[j].value;
      const valMin = currentArray[min].value;
      const isNewMin = valJ < valMin;

      if (isNewMin) {
        // if arr[j] < arr[min] -> verdadero
        pushStep(
          { pseudocode: 11, python: 9, cpp: 10, java: 10 },
          [
            { lineNumber: 11, type: 'active', lineByLanguage: { pseudocode: 11, python: 9, cpp: 10, java: 10 } },
            { lineNumber: 12, type: 'next', badgeText: 'siguiente', lineByLanguage: { pseudocode: 12, python: 10, cpp: 11, java: 11 } },
          ],
          `Comparando arr[${j}] (${valJ}) < arr[${min}] (${valMin}): Condición VERDADERA. Se encontró un nuevo mínimo.`,
          'compare',
          i,
          j,
          min
        );

        min = j;

        currentArray = currentArray.map((item, idx) => {
          if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
          if (idx === min) return { ...item, state: 'selected', nonColorIndicator: 'min' };
          return { ...item, state: 'default', nonColorIndicator: undefined };
        });

        // Actualizar min = j
        pushStep(
          { pseudocode: 12, python: 10, cpp: 11, java: 11 },
          [
            { lineNumber: 11, type: 'evaluating', lineByLanguage: { pseudocode: 11, python: 9, cpp: 10, java: 10 } },
            { lineNumber: 12, type: 'executed', badgeText: 'ejecutado', lineByLanguage: { pseudocode: 12, python: 10, cpp: 11, java: 11 } },
          ],
          `Actualizando índice mínimo: min = ${j} (valor: ${valJ}).`,
          'assign',
          i,
          j,
          min
        );
      } else {
        // if arr[j] < arr[min] -> falso
        pushStep(
          { pseudocode: 11, python: 9, cpp: 10, java: 10 },
          [{ lineNumber: 11, type: 'active', lineByLanguage: { pseudocode: 11, python: 9, cpp: 10, java: 10 } }],
          `Comparando arr[${j}] (${valJ}) < arr[${min}] (${valMin}): Condición FALSA (${valJ} >= ${valMin}). El mínimo sigue siendo ${valMin}.`,
          'compare',
          i,
          j,
          min
        );
      }

      currentArray = currentArray.map((item, idx) => {
        if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
        if (idx === min) return { ...item, state: 'selected', nonColorIndicator: 'min' };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });
    }

    // Intercambiar arr[i] con arr[min]
    swapsCount++;
    const temp = currentArray[i];
    currentArray[i] = currentArray[min];
    currentArray[min] = temp;

    currentArray[i].state = 'swapped';
    currentArray[i].nonColorIndicator = undefined;
    if (i !== min) {
      currentArray[min].state = 'swapped';
      currentArray[min].nonColorIndicator = undefined;
    }

    pushStep(
      { pseudocode: 13, python: 11, cpp: 14, java: 14 },
      [
        { lineNumber: 13, type: 'executed', badgeText: 'ejecutado', lineByLanguage: { pseudocode: 13, python: 11, cpp: 14, java: 14 } },
      ],
      `Intercambiando arr[${i}] (${temp.value}) con el mínimo encontrado arr[${min}] (${currentArray[i].value}).`,
      'swap',
      i,
      undefined,
      min
    );

    // Fijar elemento i como ordenado
    sortedIndices.add(i);
    currentArray[i] = {
      ...currentArray[i],
      state: 'sorted',
      nonColorIndicator: undefined,
    };

    currentArray = currentArray.map((item, idx) => {
      if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });
  }

  // El último elemento restante queda automáticamente ordenado
  sortedIndices.add(n - 1);
  currentArray = currentArray.map(item => ({
    ...item,
    state: 'sorted',
    nonColorIndicator: undefined,
  }));

  // Retornar arr
  pushStep(
    { pseudocode: 14, python: 12, cpp: 16, java: 16 },
    [{ lineNumber: 14, type: 'active', lineByLanguage: { pseudocode: 14, python: 12, cpp: 16, java: 16 } }],
    `Ordenamiento por Selección completado. Total comparaciones: ${comparisonsCount}, Intercambios: ${swapsCount}.`,
    'finish',
    lastI,
    undefined,
    undefined
  );

  const total = steps.length;
  steps.forEach(s => {
    s.totalSteps = total;
  });

  return steps;
}

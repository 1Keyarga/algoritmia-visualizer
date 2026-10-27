import type { Step, ArrayElement, MemoryFrame, StepLineHighlight } from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';

export const INSERTION_SORT_METADATA: AlgorithmMetadata = {
  id: 'insertion-sort',
  name: 'Insertion Sort',
  family: 'sorting',
  categoryName: 'Algoritmos de Ordenamiento',
  description: 'Construye el arreglo ordenado de a un elemento por vez. Toma cada elemento (clave) y lo inserta en su posición relativa correcta dentro del subarreglo ya ordenado.',
  defaultDataset: [45, 12, 89, 23, 56, 11, 78, 98, 67, 34, 52, 18, 71, 29],
  complexity: {
    time: 'O(n²)',
    space: 'O(1)',
    bestCase: 'O(n)',
    worstCase: 'O(n²)',
    averageCase: 'O(n²)',
  },
  codeByLanguage: {
    pseudocode: [
      { lineNumber: 1, code: 'algoritmo ordenamiento_insercion(arr):', indent: 0 },
      { lineNumber: 2, code: '    n ← longitud(arr)', indent: 1 },
      { lineNumber: 3, code: '    para i ← 1 hasta n - 1 hacer:', indent: 1 },
      { lineNumber: 4, code: '        clave ← arr[i]', indent: 2 },
      { lineNumber: 5, code: '        j ← i - 1', indent: 2 },
      { lineNumber: 6, code: '        mientras j >= 0 y arr[j] > clave hacer:', indent: 2 },
      { lineNumber: 7, code: '            arr[j + 1] ← arr[j]', indent: 3 },
      { lineNumber: 8, code: '            j ← j - 1', indent: 3 },
      { lineNumber: 9, code: '        arr[j + 1] ← clave', indent: 2 },
      { lineNumber: 10, code: '    retornar arr', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def insertion_sort(arr):', indent: 0 },
      { lineNumber: 2, code: '    n = len(arr)', indent: 1 },
      { lineNumber: 3, code: '    for i in range(1, n):', indent: 1 },
      { lineNumber: 4, code: '        key = arr[i]', indent: 2 },
      { lineNumber: 5, code: '        j = i - 1', indent: 2 },
      { lineNumber: 6, code: '        while j >= 0 and arr[j] > key:', indent: 2 },
      { lineNumber: 7, code: '            arr[j + 1] = arr[j]', indent: 3 },
      { lineNumber: 8, code: '            j -= 1', indent: 3 },
      { lineNumber: 9, code: '        arr[j + 1] = key', indent: 2 },
      { lineNumber: 10, code: '    return arr', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'void insertionSort(vector<int>& arr) {', indent: 0 },
      { lineNumber: 2, code: '    int n = arr.size();', indent: 1 },
      { lineNumber: 3, code: '    for (int i = 1; i < n; i++) {', indent: 1 },
      { lineNumber: 4, code: '        int key = arr[i];', indent: 2 },
      { lineNumber: 5, code: '        int j = i - 1;', indent: 2 },
      { lineNumber: 6, code: '        while (j >= 0 && arr[j] > key) {', indent: 2 },
      { lineNumber: 7, code: '            arr[j + 1] = arr[j];', indent: 3 },
      { lineNumber: 8, code: '            j--;', indent: 3 },
      { lineNumber: 9, code: '        }', indent: 2 },
      { lineNumber: 10, code: '        arr[j + 1] = key;', indent: 2 },
      { lineNumber: 11, code: '    }', indent: 1 },
      { lineNumber: 12, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'public static void insertionSort(int[] arr) {', indent: 0 },
      { lineNumber: 2, code: '    int n = arr.length;', indent: 1 },
      { lineNumber: 3, code: '    for (int i = 1; i < n; i++) {', indent: 1 },
      { lineNumber: 4, code: '        int key = arr[i];', indent: 2 },
      { lineNumber: 5, code: '        int j = i - 1;', indent: 2 },
      { lineNumber: 6, code: '        while (j >= 0 && arr[j] > key) {', indent: 2 },
      { lineNumber: 7, code: '            arr[j + 1] = arr[j];', indent: 3 },
      { lineNumber: 8, code: '            j--;', indent: 3 },
      { lineNumber: 9, code: '        }', indent: 2 },
      { lineNumber: 10, code: '        arr[j + 1] = key;', indent: 2 },
      { lineNumber: 11, code: '    }', indent: 1 },
      { lineNumber: 12, code: '}', indent: 0 },
    ],
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateInsertionSortTrace(initialData: number[]): Step[] {
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
  let shiftsCount = 0;
  let operationsCount = 0;

  const createFrames = (iVal?: number, jVal?: number, keyVal?: number): MemoryFrame[] => [
    {
      id: 'frame-insertion',
      name: 'insertionSort',
      isActive: true,
      variables: {
        i: iVal !== undefined ? iVal : null,
        j: jVal !== undefined ? jVal : null,
        clave: keyVal !== undefined ? keyVal : null,
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
    keyVal?: number,
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
      frames: createFrames(iVal, jVal, keyVal),
      explanation,
      metrics: {
        comparisons: comparisonsCount,
        swaps: shiftsCount,
        operations: operationsCount,
      },
      complexity: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
        bestCase: 'O(n)',
        worstCase: 'O(n²)',
      },
      activeIndices: {
        i: iVal,
        j: jVal,
        keyVal: keyVal,
        keyIndex: iVal,
      },
      operationType,
    });
  };

  // Inicio
  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'active', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Iniciando ejecución de Insertion Sort con ${n} elementos.`,
    'init'
  );

  // Longitud n
  pushStep(
    { pseudocode: 2, python: 2, cpp: 2, java: 2 },
    [{ lineNumber: 2, type: 'active', lineByLanguage: { pseudocode: 2, python: 2, cpp: 2, java: 2 } }],
    `Obteniendo la longitud del arreglo: n = ${n}.`,
    'assign'
  );

  // Inicialmente el primer elemento (índice 0) se considera un subarreglo ordenado de 1 elemento
  const sortedIndices = new Set<number>([0]);
  currentArray[0] = { ...currentArray[0], state: 'sorted', nonColorIndicator: undefined };

  let lastI = 1;

  for (let i = 1; i < n; i++) {
    lastI = i;

    // Bucle para i
    pushStep(
      { pseudocode: 3, python: 3, cpp: 3, java: 3 },
      [{ lineNumber: 3, type: 'active', lineByLanguage: { pseudocode: 3, python: 3, cpp: 3, java: 3 } }],
      `Iniciando pasada i = ${i}. Elemento a insertar en el subarreglo ordenado [0..${i - 1}].`,
      'iterate_outer',
      i
    );

    const key = currentArray[i].value;

    // clave = arr[i]
    currentArray = currentArray.map((item, idx) => {
      if (sortedIndices.has(idx) && idx !== i) return { ...item, state: 'sorted', nonColorIndicator: undefined };
      if (idx === i) return { ...item, state: 'selected', nonColorIndicator: 'clave' };
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });

    pushStep(
      { pseudocode: 4, python: 4, cpp: 4, java: 4 },
      [{ lineNumber: 4, type: 'active', lineByLanguage: { pseudocode: 4, python: 4, cpp: 4, java: 4 } }],
      `Extrayendo elemento clave = arr[${i}] (valor: ${key}) para buscar su posición ordenada.`,
      'assign',
      i,
      undefined,
      key
    );

    let j = i - 1;

    // j = i - 1
    pushStep(
      { pseudocode: 5, python: 5, cpp: 5, java: 5 },
      [{ lineNumber: 5, type: 'active', lineByLanguage: { pseudocode: 5, python: 5, cpp: 5, java: 5 } }],
      `Inicializando índice de comparación: j = ${j}.`,
      'assign',
      i,
      j,
      key
    );

    // Bucle mientras j >= 0 y arr[j] > clave
    while (j >= 0) {
      currentArray = currentArray.map((item, idx) => {
        if (sortedIndices.has(idx) && idx !== i) return { ...item, state: 'sorted', nonColorIndicator: undefined };
        if (idx === i) return { ...item, state: 'selected', nonColorIndicator: 'clave' };
        if (idx === j) return { ...item, state: 'comparing', nonColorIndicator: 'j' };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });

      comparisonsCount++;
      const valJ = currentArray[j].value;
      const conditionMet = valJ > key;

      if (conditionMet) {
        pushStep(
          { pseudocode: 6, python: 6, cpp: 6, java: 6 },
          [
            { lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 6, cpp: 6, java: 6 } },
            { lineNumber: 7, type: 'next', badgeText: 'siguiente', lineByLanguage: { pseudocode: 7, python: 7, cpp: 7, java: 7 } },
          ],
          `Evaluando mientras: j = ${j} >= 0 y arr[${j}] (${valJ}) > clave (${key}): Condición VERDADERA.`,
          'compare',
          i,
          j,
          key
        );

        // Desplazamiento: arr[j + 1] = arr[j]
        shiftsCount++;
        currentArray[j + 1] = {
          ...currentArray[j],
          id: `item-${j + 1}-${currentArray[j].value}`,
          state: 'swapped',
        };

        pushStep(
          { pseudocode: 7, python: 7, cpp: 7, java: 7 },
          [
            { lineNumber: 6, type: 'evaluating', lineByLanguage: { pseudocode: 6, python: 6, cpp: 6, java: 6 } },
            { lineNumber: 7, type: 'executed', badgeText: 'ejecutado', lineByLanguage: { pseudocode: 7, python: 7, cpp: 7, java: 7 } },
          ],
          `Desplazando arr[${j}] (${valJ}) a la derecha en la posición arr[${j + 1}].`,
          'swap',
          i,
          j,
          key
        );

        j--;

        // j = j - 1
        pushStep(
          { pseudocode: 8, python: 8, cpp: 8, java: 8 },
          [{ lineNumber: 8, type: 'active', lineByLanguage: { pseudocode: 8, python: 8, cpp: 8, java: 8 } }],
          `Decrementando índice de comparación: j = ${j}.`,
          'assign',
          i,
          j,
          key
        );
      } else {
        pushStep(
          { pseudocode: 6, python: 6, cpp: 6, java: 6 },
          [{ lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 6, cpp: 6, java: 6 } }],
          `Evaluando mientras: arr[${j}] (${valJ}) <= clave (${key}): Condición FALSA. Se encontró la posición de inserción.`,
          'compare',
          i,
          j,
          key
        );
        break;
      }
    }

    // Inserción de la clave: arr[j + 1] = clave
    shiftsCount++;
    currentArray[j + 1] = {
      id: `item-${j + 1}-${key}`,
      value: key,
      originalIndex: i,
      state: 'swapped',
      label: LETTERS[(j + 1) % LETTERS.length],
      nonColorIndicator: undefined,
    };

    for (let k = 0; k <= i; k++) {
      sortedIndices.add(k);
    }

    pushStep(
      { pseudocode: 9, python: 9, cpp: 10, java: 10 },
      [
        { lineNumber: 9, type: 'executed', badgeText: 'insertado', lineByLanguage: { pseudocode: 9, python: 9, cpp: 10, java: 10 } },
      ],
      `Insertando clave (${key}) en la posición arr[${j + 1}]. El subarreglo [0..${i}] queda ordenado.`,
      'assign',
      i,
      j,
      key
    );

    currentArray = currentArray.map((item, idx) => {
      if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });
  }

  currentArray = currentArray.map(item => ({
    ...item,
    state: 'sorted',
    nonColorIndicator: '✔',
  }));

  // Retornar arr
  pushStep(
    { pseudocode: 10, python: 10, cpp: 12, java: 12 },
    [{ lineNumber: 10, type: 'active', lineByLanguage: { pseudocode: 10, python: 10, cpp: 12, java: 12 } }],
    `Ordenamiento por Inserción completado. Comparaciones: ${comparisonsCount}, Desplazamientos: ${shiftsCount}.`,
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

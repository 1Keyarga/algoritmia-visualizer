import type { Step, ArrayElement, MemoryFrame, StepLineHighlight } from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';

export const BUBBLE_SORT_METADATA: AlgorithmMetadata = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  family: 'sorting',
  categoryName: 'Algoritmos de Ordenamiento',
  description: 'Compara elementos adyacentes y los intercambia si están en el orden incorrecto. En cada pasada, el elemento más grande "burbujea" hasta su posición final.',
  defaultDataset: [12, 23, 67, 12, 56, 11, 45, 23, 78, 56, 78, 89, 98, 45],
  complexity: {
    time: 'O(n²)',
    space: 'O(1)',
    bestCase: 'O(n)',
    worstCase: 'O(n²)',
    averageCase: 'O(n²)',
  },
  codeByLanguage: {
    pseudocode: [
      { lineNumber: 1, code: 'algoritmo ordenamiento_burbuja(arr):', indent: 0 },
      { lineNumber: 2, code: '    n ← longitud(arr)', indent: 1 },
      { lineNumber: 3, code: '    para i ← 0 hasta n - 1 hacer:', indent: 1 },
      { lineNumber: 4, code: '        intercambiado ← Falso', indent: 2 },
      { lineNumber: 5, code: '        para j ← 0 hasta n - i - 2 hacer:', indent: 2 },
      { lineNumber: 6, code: '            // Comparar adyacentes', indent: 3 },
      { lineNumber: 7, code: '            si arr[j] > arr[j + 1] entonces:', indent: 3 },
      { lineNumber: 8, code: '                intercambiar(arr[j], arr[j + 1])', indent: 4 },
      { lineNumber: 9, code: '                intercambiado ← Verdadero', indent: 4 },
      { lineNumber: 10, code: '', indent: 0 },
      { lineNumber: 11, code: '        // Si no hubo intercambios', indent: 2 },
      { lineNumber: 12, code: '        si no intercambiado entonces:', indent: 2 },
      { lineNumber: 13, code: '            interrumpir', indent: 3 },
      { lineNumber: 14, code: '', indent: 0 },
      { lineNumber: 15, code: '    retornar arr', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def bubble_sort(arr):', indent: 0 },
      { lineNumber: 2, code: '    n = len(arr)', indent: 1 },
      { lineNumber: 3, code: '    for i in range(n):', indent: 1 },
      { lineNumber: 4, code: '        swapped = False', indent: 2 },
      { lineNumber: 5, code: '        for j in range(n - i - 1):', indent: 2 },
      { lineNumber: 6, code: '            # Comparar elementos adyacentes', indent: 3 },
      { lineNumber: 7, code: '            if arr[j] > arr[j + 1]:', indent: 3 },
      { lineNumber: 8, code: '                swap(arr[j], arr[j + 1])', indent: 4 },
      { lineNumber: 9, code: '                swapped = True', indent: 4 },
      { lineNumber: 10, code: '', indent: 0 },
      { lineNumber: 11, code: '        # Si no hubo intercambios, terminar', indent: 2 },
      { lineNumber: 12, code: '        if not swapped:', indent: 2 },
      { lineNumber: 13, code: '            break', indent: 3 },
      { lineNumber: 14, code: '', indent: 0 },
      { lineNumber: 15, code: '    return arr', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'void bubbleSort(vector<int>& arr) {', indent: 0 },
      { lineNumber: 2, code: '    int n = arr.size();', indent: 1 },
      { lineNumber: 3, code: '    for (int i = 0; i < n; i++) {', indent: 1 },
      { lineNumber: 4, code: '        bool swapped = false;', indent: 2 },
      { lineNumber: 5, code: '        for (int j = 0; j < n - i - 1; j++) {', indent: 2 },
      { lineNumber: 6, code: '            // Comparar adyacentes', indent: 3 },
      { lineNumber: 7, code: '            if (arr[j] > arr[j + 1]) {', indent: 3 },
      { lineNumber: 8, code: '                swap(arr[j], arr[j + 1]);', indent: 4 },
      { lineNumber: 9, code: '                swapped = true;', indent: 4 },
      { lineNumber: 10, code: '            }', indent: 3 },
      { lineNumber: 11, code: '        }', indent: 2 },
      { lineNumber: 12, code: '        if (!swapped) break;', indent: 2 },
      { lineNumber: 13, code: '    }', indent: 1 },
      { lineNumber: 14, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'public static void bubbleSort(int[] arr) {', indent: 0 },
      { lineNumber: 2, code: '    int n = arr.length;', indent: 1 },
      { lineNumber: 3, code: '    for (int i = 0; i < n; i++) {', indent: 1 },
      { lineNumber: 4, code: '        boolean swapped = false;', indent: 2 },
      { lineNumber: 5, code: '        for (int j = 0; j < n - i - 1; j++) {', indent: 2 },
      { lineNumber: 6, code: '            // Comparar adyacentes', indent: 3 },
      { lineNumber: 7, code: '            if (arr[j] > arr[j + 1]) {', indent: 3 },
      { lineNumber: 8, code: '                swap(arr, j, j + 1);', indent: 4 },
      { lineNumber: 9, code: '                swapped = true;', indent: 4 },
      { lineNumber: 10, code: '            }', indent: 3 },
      { lineNumber: 11, code: '        }', indent: 2 },
      { lineNumber: 12, code: '        if (!swapped) break;', indent: 2 },
      { lineNumber: 13, code: '    }', indent: 1 },
      { lineNumber: 14, code: '}', indent: 0 },
    ],
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateBubbleSortTrace(initialData: number[]): Step[] {
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

  const createFrames = (iVal?: number, jVal?: number, swappedVal?: boolean): MemoryFrame[] => [
    {
      id: 'frame-bubble',
      name: 'bubbleSort',
      isActive: true,
      variables: {
        i: iVal !== undefined ? iVal : null,
        j: jVal !== undefined ? jVal : null,
        n: n,
        swapped: swappedVal !== undefined ? (swappedVal ? 'Verdadero' : 'Falso') : null,
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
    swappedVal?: boolean,
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
      frames: createFrames(iVal, jVal, swappedVal),
      explanation,
      metrics: {
        comparisons: comparisonsCount,
        swaps: swapsCount,
        operations: operationsCount,
      },
      complexity: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
      },
      activeIndices: {
        i: iVal,
        j: jVal,
      },
      operationType,
    });
  };

  // 1: Inicio
  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'active', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Iniciando ejecución de Bubble Sort con ${n} elementos.`,
    'init'
  );

  // 2: Asignación de n
  pushStep(
    { pseudocode: 2, python: 2, cpp: 2, java: 2 },
    [{ lineNumber: 2, type: 'active', lineByLanguage: { pseudocode: 2, python: 2, cpp: 2, java: 2 } }],
    `Obteniendo la longitud del arreglo: n = ${n}.`,
    'assign'
  );

  const sortedIndices = new Set<number>();

  for (let i = 0; i < n; i++) {
    // 3: Bucle exterior
    pushStep(
      { pseudocode: 3, python: 3, cpp: 3, java: 3 },
      [{ lineNumber: 3, type: 'active', lineByLanguage: { pseudocode: 3, python: 3, cpp: 3, java: 3 } }],
      `Iniciando pasada exterior i = ${i}. En esta pasada se colocará el elemento mayor en su posición final.`,
      'iterate_outer',
      i
    );

    let swapped = false;
    // 4: swapped = false
    pushStep(
      { pseudocode: 4, python: 4, cpp: 4, java: 4 },
      [{ lineNumber: 4, type: 'active', lineByLanguage: { pseudocode: 4, python: 4, cpp: 4, java: 4 } }],
      `Inicializando bandera intercambiado = Falso.`,
      'assign',
      i,
      undefined,
      false
    );

    const limit = n - i - 1;

    for (let j = 0; j < limit; j++) {
      currentArray = currentArray.map((item, idx) => {
        if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: '✔' };
        if (idx === j || idx === j + 1) return { ...item, state: 'comparing', nonColorIndicator: idx === j ? '(j)' : '(j+1)' };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });

      // 5: for j in range
      pushStep(
        { pseudocode: 5, python: 5, cpp: 5, java: 5 },
        [{ lineNumber: 5, type: 'active', lineByLanguage: { pseudocode: 5, python: 5, cpp: 5, java: 5 } }],
        `Bucle interno: evaluando posición j = ${j} frente a j + 1 = ${j + 1}.`,
        'iterate_inner',
        i,
        j,
        swapped
      );

      comparisonsCount++;
      const valJ = currentArray[j].value;
      const valJ1 = currentArray[j + 1].value;
      const needsSwap = valJ > valJ1;

      if (needsSwap) {
        // 7: if condition
        pushStep(
          { pseudocode: 7, python: 7, cpp: 7, java: 7 },
          [
            { lineNumber: 7, type: 'active', lineByLanguage: { pseudocode: 7, python: 7, cpp: 7, java: 7 } },
            { lineNumber: 8, type: 'next', badgeText: 'siguiente', lineByLanguage: { pseudocode: 8, python: 8, cpp: 8, java: 8 } },
          ],
          `Comparando arr[${j}] (${valJ}) > arr[${j + 1}] (${valJ1}): Condición VERDADERA. Se requiere intercambio.`,
          'compare',
          i,
          j,
          swapped
        );

        // 8: swap
        swapsCount++;
        const temp = currentArray[j];
        currentArray[j] = currentArray[j + 1];
        currentArray[j + 1] = temp;
        currentArray[j].state = 'swapped';
        currentArray[j + 1].state = 'swapped';

        pushStep(
          { pseudocode: 8, python: 8, cpp: 8, java: 8 },
          [
            { lineNumber: 7, type: 'evaluating', lineByLanguage: { pseudocode: 7, python: 7, cpp: 7, java: 7 } },
            { lineNumber: 8, type: 'executed', badgeText: 'ejecutado', lineByLanguage: { pseudocode: 8, python: 8, cpp: 8, java: 8 } },
            { lineNumber: 9, type: 'next', badgeText: 'siguiente', lineByLanguage: { pseudocode: 9, python: 9, cpp: 9, java: 9 } },
          ],
          `Intercambiando arr[${j}] y arr[${j + 1}]: ${valJ} se desplaza hacia la derecha.`,
          'swap',
          i,
          j,
          swapped
        );

        // 9: swapped = true
        swapped = true;
        pushStep(
          { pseudocode: 9, python: 9, cpp: 9, java: 9 },
          [
            { lineNumber: 8, type: 'executed', badgeText: 'ejecutado', lineByLanguage: { pseudocode: 8, python: 8, cpp: 8, java: 8 } },
            { lineNumber: 9, type: 'active', lineByLanguage: { pseudocode: 9, python: 9, cpp: 9, java: 9 } },
          ],
          `Marcando intercambiado = Verdadero.`,
          'assign',
          i,
          j,
          true
        );
      } else {
        pushStep(
          { pseudocode: 7, python: 7, cpp: 7, java: 7 },
          [{ lineNumber: 7, type: 'active', lineByLanguage: { pseudocode: 7, python: 7, cpp: 7, java: 7 } }],
          `Comparando arr[${j}] (${valJ}) > arr[${j + 1}] (${valJ1}): Condición FALSA (${valJ} <= ${valJ1}). No hay intercambio.`,
          'compare',
          i,
          j,
          swapped
        );
      }

      currentArray = currentArray.map((item, idx) => {
        if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: '✔' };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });
    }

    const sortedIdx = n - i - 1;
    sortedIndices.add(sortedIdx);
    currentArray[sortedIdx] = {
      ...currentArray[sortedIdx],
      state: 'sorted',
      nonColorIndicator: '✔',
    };

    // 12: if not swapped
    pushStep(
      { pseudocode: 12, python: 12, cpp: 12, java: 12 },
      [{ lineNumber: 12, type: 'active', lineByLanguage: { pseudocode: 12, python: 12, cpp: 12, java: 12 } }],
      `Fin de la pasada i = ${i}. El elemento en índice ${sortedIdx} (${currentArray[sortedIdx].value}) queda fijado como ORDENADO.`,
      'check',
      i,
      undefined,
      swapped
    );

    if (!swapped) {
      for (let k = 0; k < n; k++) {
        sortedIndices.add(k);
        currentArray[k] = { ...currentArray[k], state: 'sorted', nonColorIndicator: '✔' };
      }

      pushStep(
        { pseudocode: 13, python: 13, cpp: 12, java: 12 },
        [{ lineNumber: 13, type: 'active', lineByLanguage: { pseudocode: 13, python: 13, cpp: 12, java: 12 } }],
        `Optimización: No se realizaron intercambios. El arreglo completo ya está ordenado.`,
        'finish',
        i,
        undefined,
        false
      );
      break;
    }
  }

  currentArray = currentArray.map(item => ({
    ...item,
    state: 'sorted',
    nonColorIndicator: '✔',
  }));

  pushStep(
    { pseudocode: 15, python: 15, cpp: 14, java: 14 },
    [{ lineNumber: 15, type: 'active', lineByLanguage: { pseudocode: 15, python: 15, cpp: 14, java: 14 } }],
    `Algoritmo completado. Comparaciones: ${comparisonsCount}, Intercambios: ${swapsCount}.`,
    'finish',
    n,
    undefined,
    undefined
  );

  const total = steps.length;
  steps.forEach(s => {
    s.totalSteps = total;
  });

  return steps;
}

import type { Step, ArrayElement, MemoryFrame, StepLineHighlight } from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';

export type BubbleSortVariant = 'optimized' | 'classic';

export const BUBBLE_SORT_OPTIMIZED_METADATA: AlgorithmMetadata = {
  id: 'bubble-sort',
  name: 'Bubble Sort (Optimizado)',
  family: 'sorting',
  categoryName: 'Algoritmos de Ordenamiento',
  description: 'Compara elementos adyacentes y los intercambia si están desordenados. Usa una bandera booleana para detenerse anticipadamente en O(n) si el arreglo ya está ordenado.',
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
      { lineNumber: 1, code: 'funcion intercambiar(arr, i, j):', indent: 0 },
      { lineNumber: 2, code: '    temp ← arr[i]', indent: 1 },
      { lineNumber: 3, code: '    arr[i] ← arr[j]', indent: 1 },
      { lineNumber: 4, code: '    arr[j] ← temp', indent: 1 },
      { lineNumber: 5, code: '', indent: 0 },
      { lineNumber: 6, code: 'algoritmo ordenamiento_burbuja_optimizado(arr):', indent: 0 },
      { lineNumber: 7, code: '    n ← longitud(arr)', indent: 1 },
      { lineNumber: 8, code: '    para i ← 0 hasta n - 1 hacer:', indent: 1 },
      { lineNumber: 9, code: '        intercambiado ← Falso', indent: 2 },
      { lineNumber: 10, code: '        para j ← 0 hasta n - i - 2 hacer:', indent: 2 },
      { lineNumber: 11, code: '            si arr[j] > arr[j + 1] entonces:', indent: 3 },
      { lineNumber: 12, code: '                intercambiar(arr, j, j + 1)', indent: 4 },
      { lineNumber: 13, code: '                intercambiado ← Verdadero', indent: 4 },
      { lineNumber: 14, code: '        si no intercambiado entonces:', indent: 2 },
      { lineNumber: 15, code: '            interrumpir', indent: 3 },
      { lineNumber: 16, code: '    retornar arr', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def swap(arr, i, j):', indent: 0 },
      { lineNumber: 2, code: '    arr[i], arr[j] = arr[j], arr[i]', indent: 1 },
      { lineNumber: 3, code: '', indent: 0 },
      { lineNumber: 4, code: 'def bubble_sort(arr):', indent: 0 },
      { lineNumber: 5, code: '    n = len(arr)', indent: 1 },
      { lineNumber: 6, code: '    for i in range(n):', indent: 1 },
      { lineNumber: 7, code: '        swapped = False', indent: 2 },
      { lineNumber: 8, code: '        for j in range(n - i - 1):', indent: 2 },
      { lineNumber: 9, code: '            if arr[j] > arr[j + 1]:', indent: 3 },
      { lineNumber: 10, code: '                swap(arr, j, j + 1)', indent: 4 },
      { lineNumber: 11, code: '                swapped = True', indent: 4 },
      { lineNumber: 12, code: '        if not swapped:', indent: 2 },
      { lineNumber: 13, code: '            break', indent: 3 },
      { lineNumber: 14, code: '    return arr', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'void swap(int& a, int& b) {', indent: 0 },
      { lineNumber: 2, code: '    int temp = a; a = b; b = temp;', indent: 1 },
      { lineNumber: 3, code: '}', indent: 0 },
      { lineNumber: 4, code: '', indent: 0 },
      { lineNumber: 5, code: 'void bubbleSort(vector<int>& arr) {', indent: 0 },
      { lineNumber: 6, code: '    int n = arr.size();', indent: 1 },
      { lineNumber: 7, code: '    for (int i = 0; i < n; i++) {', indent: 1 },
      { lineNumber: 8, code: '        bool swapped = false;', indent: 2 },
      { lineNumber: 9, code: '        for (int j = 0; j < n - i - 1; j++) {', indent: 2 },
      { lineNumber: 10, code: '            if (arr[j] > arr[j + 1]) {', indent: 3 },
      { lineNumber: 11, code: '                swap(arr[j], arr[j + 1]);', indent: 4 },
      { lineNumber: 12, code: '                swapped = true;', indent: 4 },
      { lineNumber: 13, code: '            }', indent: 3 },
      { lineNumber: 14, code: '        }', indent: 2 },
      { lineNumber: 15, code: '        if (!swapped) break;', indent: 2 },
      { lineNumber: 16, code: '    }', indent: 1 },
      { lineNumber: 17, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'static void swap(int[] arr, int i, int j) {', indent: 0 },
      { lineNumber: 2, code: '    int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;', indent: 1 },
      { lineNumber: 3, code: '}', indent: 0 },
      { lineNumber: 4, code: '', indent: 0 },
      { lineNumber: 5, code: 'public static void bubbleSort(int[] arr) {', indent: 0 },
      { lineNumber: 6, code: '    int n = arr.length;', indent: 1 },
      { lineNumber: 7, code: '    for (int i = 0; i < n; i++) {', indent: 1 },
      { lineNumber: 8, code: '        boolean swapped = false;', indent: 2 },
      { lineNumber: 9, code: '        for (int j = 0; j < n - i - 1; j++) {', indent: 2 },
      { lineNumber: 10, code: '            if (arr[j] > arr[j + 1]) {', indent: 3 },
      { lineNumber: 11, code: '                swap(arr, j, j + 1);', indent: 4 },
      { lineNumber: 12, code: '                swapped = true;', indent: 4 },
      { lineNumber: 13, code: '            }', indent: 3 },
      { lineNumber: 14, code: '        }', indent: 2 },
      { lineNumber: 15, code: '        if (!swapped) break;', indent: 2 },
      { lineNumber: 16, code: '    }', indent: 1 },
      { lineNumber: 17, code: '}', indent: 0 },
    ],
  },
};

export const BUBBLE_SORT_CLASSIC_METADATA: AlgorithmMetadata = {
  id: 'bubble-sort-classic',
  name: 'Bubble Sort (Clásico)',
  family: 'sorting',
  categoryName: 'Algoritmos de Ordenamiento',
  description: 'Versión original sin bandera booleana. Ejecuta siempre todos los bucles anidados completos, realizando exactamente n(n-1)/2 comparaciones.',
  defaultDataset: [12, 23, 67, 12, 56, 11, 45, 23, 78, 56, 78, 89, 98, 45],
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
      { lineNumber: 6, code: 'algoritmo ordenamiento_burbuja_clasico(arr):', indent: 0 },
      { lineNumber: 7, code: '    n ← longitud(arr)', indent: 1 },
      { lineNumber: 8, code: '    para i ← 0 hasta n - 1 hacer:', indent: 1 },
      { lineNumber: 9, code: '        para j ← 0 hasta n - i - 2 hacer:', indent: 2 },
      { lineNumber: 10, code: '            si arr[j] > arr[j + 1] entonces:', indent: 3 },
      { lineNumber: 11, code: '                intercambiar(arr, j, j + 1)', indent: 4 },
      { lineNumber: 12, code: '    retornar arr', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def swap(arr, i, j):', indent: 0 },
      { lineNumber: 2, code: '    arr[i], arr[j] = arr[j], arr[i]', indent: 1 },
      { lineNumber: 3, code: '', indent: 0 },
      { lineNumber: 4, code: 'def bubble_sort_classic(arr):', indent: 0 },
      { lineNumber: 5, code: '    n = len(arr)', indent: 1 },
      { lineNumber: 6, code: '    for i in range(n):', indent: 1 },
      { lineNumber: 7, code: '        for j in range(n - i - 1):', indent: 2 },
      { lineNumber: 8, code: '            if arr[j] > arr[j + 1]:', indent: 3 },
      { lineNumber: 9, code: '                swap(arr, j, j + 1)', indent: 4 },
      { lineNumber: 10, code: '    return arr', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'void swap(int& a, int& b) {', indent: 0 },
      { lineNumber: 2, code: '    int temp = a; a = b; b = temp;', indent: 1 },
      { lineNumber: 3, code: '}', indent: 0 },
      { lineNumber: 4, code: '', indent: 0 },
      { lineNumber: 5, code: 'void bubbleSortClassic(vector<int>& arr) {', indent: 0 },
      { lineNumber: 6, code: '    int n = arr.size();', indent: 1 },
      { lineNumber: 7, code: '    for (int i = 0; i < n; i++) {', indent: 1 },
      { lineNumber: 8, code: '        for (int j = 0; j < n - i - 1; j++) {', indent: 2 },
      { lineNumber: 9, code: '            if (arr[j] > arr[j + 1]) {', indent: 3 },
      { lineNumber: 10, code: '                swap(arr[j], arr[j + 1]);', indent: 4 },
      { lineNumber: 11, code: '            }', indent: 3 },
      { lineNumber: 12, code: '        }', indent: 2 },
      { lineNumber: 13, code: '    }', indent: 1 },
      { lineNumber: 14, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'static void swap(int[] arr, int i, int j) {', indent: 0 },
      { lineNumber: 2, code: '    int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;', indent: 1 },
      { lineNumber: 3, code: '}', indent: 0 },
      { lineNumber: 4, code: '', indent: 0 },
      { lineNumber: 5, code: 'public static void bubbleSortClassic(int[] arr) {', indent: 0 },
      { lineNumber: 6, code: '    int n = arr.length;', indent: 1 },
      { lineNumber: 7, code: '    for (int i = 0; i < n; i++) {', indent: 1 },
      { lineNumber: 8, code: '        for (int j = 0; j < n - i - 1; j++) {', indent: 2 },
      { lineNumber: 9, code: '            if (arr[j] > arr[j + 1]) {', indent: 3 },
      { lineNumber: 10, code: '                swap(arr, j, j + 1);', indent: 4 },
      { lineNumber: 11, code: '            }', indent: 3 },
      { lineNumber: 12, code: '        }', indent: 2 },
      { lineNumber: 13, code: '    }', indent: 1 },
      { lineNumber: 14, code: '}', indent: 0 },
    ],
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateBubbleSortTrace(initialData: number[], isOptimized: boolean = true): Step[] {
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

  const createFrames = (iVal?: number, jVal?: number, swappedVal?: boolean): MemoryFrame[] => {
    const vars: Record<string, string | number | boolean | null | undefined> = {
      i: iVal !== undefined ? iVal : null,
      j: jVal !== undefined ? jVal : null,
      n: n,
    };

    if (isOptimized) {
      vars.swapped = swappedVal !== undefined ? (swappedVal ? 'Verdadero' : 'Falso') : null;
    }
    vars.arr = '→ [0..' + (n - 1) + ']';

    return [
      {
        id: 'frame-bubble',
        name: isOptimized ? 'bubbleSort (optimizado)' : 'bubbleSort (clásico)',
        isActive: true,
        variables: vars,
      },
      {
        id: 'frame-global',
        name: 'Entorno Global',
        isActive: false,
        variables: {},
      },
    ];
  };

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
        bestCase: isOptimized ? 'O(n)' : 'O(n²)',
      },
      activeIndices: {
        i: iVal,
        j: jVal,
      },
      operationType,
    });
  };

  // Inicio
  pushStep(
    { pseudocode: 6, python: 4, cpp: 5, java: 5 },
    [{ lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 4, cpp: 5, java: 5 } }],
    `Iniciando ejecución de Bubble Sort (${isOptimized ? 'Optimizado' : 'Clásico'}) con ${n} elementos.`,
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

  for (let i = 0; i < n; i++) {
    lastI = i;

    // Bucle exterior
    pushStep(
      { pseudocode: 8, python: 6, cpp: 7, java: 7 },
      [{ lineNumber: 8, type: 'active', lineByLanguage: { pseudocode: 8, python: 6, cpp: 7, java: 7 } }],
      `Iniciando pasada exterior i = ${i}.`,
      'iterate_outer',
      i
    );

    let swapped = false;
    if (isOptimized) {
      // swapped = false
      pushStep(
        { pseudocode: 9, python: 7, cpp: 8, java: 8 },
        [{ lineNumber: 9, type: 'active', lineByLanguage: { pseudocode: 9, python: 7, cpp: 8, java: 8 } }],
        `Inicializando bandera intercambiado = Falso.`,
        'assign',
        i,
        undefined,
        false
      );
    }

    const limit = n - i - 1;

    for (let j = 0; j < limit; j++) {
      currentArray = currentArray.map((item, idx) => {
        if (sortedIndices.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: '✔' };
        if (idx === j || idx === j + 1) return { ...item, state: 'comparing', nonColorIndicator: idx === j ? '(j)' : '(j+1)' };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });

      // for j in range
      const jLine = isOptimized
        ? { pseudocode: 10, python: 8, cpp: 9, java: 9 }
        : { pseudocode: 9, python: 7, cpp: 8, java: 8 };

      pushStep(
        jLine,
        [{ lineNumber: jLine.pseudocode, type: 'active', lineByLanguage: jLine }],
        `Evaluando adyacentes: posición j = ${j} frente a j + 1 = ${j + 1}.`,
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
        // if condition
        const ifLine = isOptimized
          ? { pseudocode: 11, python: 9, cpp: 10, java: 10 }
          : { pseudocode: 10, python: 8, cpp: 9, java: 9 };
        const swapLine = isOptimized
          ? { pseudocode: 12, python: 10, cpp: 11, java: 11 }
          : { pseudocode: 11, python: 9, cpp: 10, java: 10 };

        pushStep(
          ifLine,
          [
            { lineNumber: ifLine.pseudocode, type: 'active', lineByLanguage: ifLine },
            { lineNumber: swapLine.pseudocode, type: 'next', badgeText: 'siguiente', lineByLanguage: swapLine },
          ],
          `Comparando arr[${j}] (${valJ}) > arr[${j + 1}] (${valJ1}): Condición VERDADERA. Se requiere intercambio.`,
          'compare',
          i,
          j,
          swapped
        );

        // swap
        swapsCount++;
        const temp = currentArray[j];
        currentArray[j] = currentArray[j + 1];
        currentArray[j + 1] = temp;
        currentArray[j].state = 'swapped';
        currentArray[j + 1].state = 'swapped';

        const flagLine = isOptimized ? { pseudocode: 13, python: 11, cpp: 12, java: 12 } : null;

        pushStep(
          swapLine,
          [
            { lineNumber: ifLine.pseudocode, type: 'evaluating', lineByLanguage: ifLine },
            { lineNumber: swapLine.pseudocode, type: 'executed', badgeText: 'ejecutado', lineByLanguage: swapLine },
            ...(flagLine ? [{ lineNumber: flagLine.pseudocode, type: 'next' as const, badgeText: 'siguiente', lineByLanguage: flagLine }] : []),
          ],
          `Intercambiando arr[${j}] y arr[${j + 1}]: ${valJ} pasa a la derecha.`,
          'swap',
          i,
          j,
          swapped
        );

        if (isOptimized && flagLine) {
          swapped = true;
          pushStep(
            flagLine,
            [
              { lineNumber: swapLine.pseudocode, type: 'executed', badgeText: 'ejecutado', lineByLanguage: swapLine },
              { lineNumber: flagLine.pseudocode, type: 'active', lineByLanguage: flagLine },
            ],
            `Marcando intercambiado = Verdadero.`,
            'assign',
            i,
            j,
            true
          );
        }
      } else {
        const ifLine = isOptimized
          ? { pseudocode: 11, python: 9, cpp: 10, java: 10 }
          : { pseudocode: 10, python: 8, cpp: 9, java: 9 };

        pushStep(
          ifLine,
          [{ lineNumber: ifLine.pseudocode, type: 'active', lineByLanguage: ifLine }],
          `Comparando arr[${j}] (${valJ}) > arr[${j + 1}] (${valJ1}): Condición FALSA (${valJ} <= ${valJ1}). Sin cambios.`,
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

    if (isOptimized) {
      // if not swapped
      pushStep(
        { pseudocode: 14, python: 12, cpp: 15, java: 15 },
        [{ lineNumber: 14, type: 'active', lineByLanguage: { pseudocode: 14, python: 12, cpp: 15, java: 15 } }],
        `Fin de la pasada i = ${i}. El elemento en índice ${sortedIdx} (${currentArray[sortedIdx].value}) queda fijado como ordenado.`,
        'check',
        i,
        undefined,
        swapped
      );

      if (!swapped) {
        pushStep(
          { pseudocode: 15, python: 13, cpp: 15, java: 15 },
          [{ lineNumber: 15, type: 'active', lineByLanguage: { pseudocode: 15, python: 13, cpp: 15, java: 15 } }],
          `Optimización por bandera: al no haber intercambios en esta pasada, los ${sortedIdx} elementos restantes ya se encuentran en orden.`,
          'finish',
          i,
          undefined,
          false
        );

        for (let k = sortedIdx - 1; k >= 0; k--) {
          sortedIndices.add(k);
          currentArray[k] = { ...currentArray[k], state: 'sorted', nonColorIndicator: '✔' };
        }

        pushStep(
          { pseudocode: 15, python: 13, cpp: 15, java: 15 },
          [{ lineNumber: 15, type: 'active', lineByLanguage: { pseudocode: 15, python: 13, cpp: 15, java: 15 } }],
          `Confirmando orden final: todos los elementos del arreglo han sido verificados y marcados como ordenados.`,
          'finish',
          i,
          undefined,
          false
        );
        break;
      }
    }
  }

  currentArray = currentArray.map(item => ({
    ...item,
    state: 'sorted',
    nonColorIndicator: '✔',
  }));

  const returnLine = isOptimized
    ? { pseudocode: 16, python: 14, cpp: 16, java: 16 }
    : { pseudocode: 12, python: 10, cpp: 13, java: 13 };

  pushStep(
    returnLine,
    [{ lineNumber: returnLine.pseudocode, type: 'active', lineByLanguage: returnLine }],
    `Algoritmo completado. Total comparaciones: ${comparisonsCount}, Intercambios: ${swapsCount}.`,
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

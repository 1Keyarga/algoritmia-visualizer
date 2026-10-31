import type { Step, ArrayElement, MemoryFrame, StepLineHighlight } from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';

export const LINEAR_SEARCH_METADATA: AlgorithmMetadata = {
  id: 'linear-search',
  name: 'Búsqueda Lineal (Linear Search)',
  family: 'searching',
  categoryName: 'Algoritmos de Búsqueda',
  description: 'Escaneo secuencial de territorio: recorre el arreglo elemento por elemento comparando con la clave buscada. Tiempo O(n) en el peor caso.',
  defaultDataset: [12, 23, 67, 12, 56, 11, 45, 23, 78, 56, 78, 89, 98, 45],
  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    bestCase: 'O(1)',
    worstCase: 'O(n)',
    averageCase: 'O(n)',
  },
  codeByLanguage: {
    pseudocode: [
      { lineNumber: 1, code: 'algoritmo busqueda_lineal(arr, clave):', indent: 0 },
      { lineNumber: 2, code: '    para i ← 0 hasta longitud(arr) - 1 hacer:', indent: 1 },
      { lineNumber: 3, code: '        si arr[i] = clave entonces:', indent: 2 },
      { lineNumber: 4, code: '            retornar i', indent: 3 },
      { lineNumber: 5, code: '    retornar -1', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def linear_search(arr, key):', indent: 0 },
      { lineNumber: 2, code: '    for i in range(len(arr)):', indent: 1 },
      { lineNumber: 3, code: '        if arr[i] == key:', indent: 2 },
      { lineNumber: 4, code: '            return i', indent: 3 },
      { lineNumber: 5, code: '    return -1', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'int linearSearch(vector<int>& arr, int key) {', indent: 0 },
      { lineNumber: 2, code: '    for (int i = 0; i < arr.size(); i++) {', indent: 1 },
      { lineNumber: 3, code: '        if (arr[i] == key) {', indent: 2 },
      { lineNumber: 4, code: '            return i;', indent: 3 },
      { lineNumber: 5, code: '        }', indent: 2 },
      { lineNumber: 6, code: '    }', indent: 1 },
      { lineNumber: 7, code: '    return -1;', indent: 1 },
      { lineNumber: 8, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'public static int linearSearch(int[] arr, int key) {', indent: 0 },
      { lineNumber: 2, code: '    for (int i = 0; i < arr.length; i++) {', indent: 1 },
      { lineNumber: 3, code: '        if (arr[i] == key) {', indent: 2 },
      { lineNumber: 4, code: '            return i;', indent: 3 },
      { lineNumber: 5, code: '        }', indent: 2 },
      { lineNumber: 6, code: '    }', indent: 1 },
      { lineNumber: 7, code: '    return -1;', indent: 1 },
      { lineNumber: 8, code: '}', indent: 0 },
    ],
  },
};

export function generateLinearSearchTrace(initialData: number[], target: number = 45): Step[] {
  const steps: Step[] = [];
  const n = initialData.length;

  let currentArray: ArrayElement[] = initialData.map((val, idx) => ({
    id: `item-${idx}-${val}`,
    value: val,
    originalIndex: idx,
    state: 'default',
    label: String(idx),
  }));

  let comparisonsCount = 0;
  let operationsCount = 0;

  const createFrames = (iVal?: number, foundVal?: boolean): MemoryFrame[] => {
    const vars: Record<string, string | number | boolean | null | undefined> = {
      i: iVal !== undefined ? iVal : null,
      clave: target,
      n: n,
    };

    if (foundVal !== undefined) {
      vars.resultado = foundVal ? iVal : -1;
    }

    return [
      {
        id: 'frame-linear',
        name: 'linearSearch',
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
    foundVal?: boolean,
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
      frames: createFrames(iVal, foundVal),
      explanation,
      metrics: {
        comparisons: comparisonsCount,
        swaps: 0,
        operations: operationsCount,
      },
      complexity: {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        bestCase: 'O(1)',
      },
      activeIndices: {
        i: iVal,
      },
      operationType,
    });
  };

  // Inicio
  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'active', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Iniciando Búsqueda Lineal en arreglo de ${n} elementos buscando el valor ${target}.`,
    'init'
  );

  // Escaneo secuencial
  let foundIndex = -1;
  for (let i = 0; i < n; i++) {
    // Marcar posición actual como escaneando y anteriores como descartadas
    currentArray = currentArray.map((item, idx) => {
      if (idx < i) return { ...item, state: 'discarded', nonColorIndicator: undefined };
      if (idx === i) return { ...item, state: 'comparing', nonColorIndicator: 'i' };
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });

    // for loop
    pushStep(
      { pseudocode: 2, python: 2, cpp: 2, java: 2 },
      [{ lineNumber: 2, type: 'active', lineByLanguage: { pseudocode: 2, python: 2, cpp: 2, java: 2 } }],
      `Escaneando posición i = ${i}. Valor actual: ${currentArray[i].value}.`,
      'iterate_inner',
      i
    );

    comparisonsCount++;
    const val = currentArray[i].value;
    const isMatch = val === target;

    if (isMatch) {
      // if condition true
      pushStep(
        { pseudocode: 3, python: 3, cpp: 3, java: 3 },
        [
          { lineNumber: 3, type: 'active', lineByLanguage: { pseudocode: 3, python: 3, cpp: 3, java: 3 } },
          { lineNumber: 4, type: 'next', badgeText: 'encontrado', lineByLanguage: { pseudocode: 4, python: 4, cpp: 4, java: 4 } },
        ],
        `Comparando arr[${i}] (${val}) = clave (${target}): coincidencia en índice ${i}.`,
        'compare',
        i,
        true
      );

      foundIndex = i;
      currentArray[i] = { ...currentArray[i], state: 'sorted', nonColorIndicator: undefined };

      pushStep(
        { pseudocode: 4, python: 4, cpp: 4, java: 4 },
        [{ lineNumber: 4, type: 'active', lineByLanguage: { pseudocode: 4, python: 4, cpp: 4, java: 4 } }],
        `Retornando índice ${i} donde se encontró el valor ${target}.`,
        'finish',
        i,
        true
      );
      break;
    } else {
      // if condition false
      pushStep(
        { pseudocode: 3, python: 3, cpp: 3, java: 3 },
        [{ lineNumber: 3, type: 'active', lineByLanguage: { pseudocode: 3, python: 3, cpp: 3, java: 3 } }],
        `Comparando arr[${i}] (${val}) = clave (${target}): No coincide. Continuando escaneo.`,
        'compare',
        i,
        false
      );
    }
  }

  // No encontrado
  if (foundIndex === -1) {
    currentArray = currentArray.map(item => ({ ...item, state: 'discarded', nonColorIndicator: undefined }));

    pushStep(
      { pseudocode: 5, python: 5, cpp: 7, java: 7 },
      [{ lineNumber: 5, type: 'active', lineByLanguage: { pseudocode: 5, python: 5, cpp: 7, java: 7 } }],
      `Valor no encontrado: se recorrió todo el arreglo (${n} elementos) y ${target} no existe. Retornando -1.`,
      'finish',
      undefined,
      false
    );
  }

  const total = steps.length;
  steps.forEach(s => {
    s.totalSteps = total;
  });

  return steps;
}

import type { Step, ArrayElement, MemoryFrame, StepLineHighlight } from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';

export const BINARY_SEARCH_METADATA: AlgorithmMetadata = {
  id: 'binary-search',
  name: 'Búsqueda Binaria (Binary Search)',
  family: 'searching',
  categoryName: 'Algoritmos de Búsqueda',
  description: 'Contracción de territorio: divide el espacio de búsqueda en mitades descartando la mitad donde no puede estar el valor. Tiempo O(log n). Requiere arreglo ordenado.',
  defaultDataset: [3, 9, 10, 19, 27, 38, 43, 56, 78, 82, 89, 98],
  complexity: {
    time: 'O(log n)',
    space: 'O(1)',
    bestCase: 'O(1)',
    worstCase: 'O(log n)',
    averageCase: 'O(log n)',
  },
  codeByLanguage: {
    pseudocode: [
      { lineNumber: 1, code: 'algoritmo busqueda_binaria(arr, clave):', indent: 0 },
      { lineNumber: 2, code: '    inicio ← 0', indent: 1 },
      { lineNumber: 3, code: '    fin ← longitud(arr) - 1', indent: 1 },
      { lineNumber: 4, code: '    mientras inicio ≤ fin hacer:', indent: 1 },
      { lineNumber: 5, code: '        medio ← (inicio + fin) / 2', indent: 2 },
      { lineNumber: 6, code: '        si arr[medio] = clave entonces:', indent: 2 },
      { lineNumber: 7, code: '            retornar medio', indent: 3 },
      { lineNumber: 8, code: '        si arr[medio] < clave entonces:', indent: 2 },
      { lineNumber: 9, code: '            inicio ← medio + 1', indent: 3 },
      { lineNumber: 10, code: '        si no:', indent: 2 },
      { lineNumber: 11, code: '            fin ← medio - 1', indent: 3 },
      { lineNumber: 12, code: '    retornar -1', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def binary_search(arr, key):', indent: 0 },
      { lineNumber: 2, code: '    left = 0', indent: 1 },
      { lineNumber: 3, code: '    right = len(arr) - 1', indent: 1 },
      { lineNumber: 4, code: '    while left <= right:', indent: 1 },
      { lineNumber: 5, code: '        mid = (left + right) // 2', indent: 2 },
      { lineNumber: 6, code: '        if arr[mid] == key:', indent: 2 },
      { lineNumber: 7, code: '            return mid', indent: 3 },
      { lineNumber: 8, code: '        if arr[mid] < key:', indent: 2 },
      { lineNumber: 9, code: '            left = mid + 1', indent: 3 },
      { lineNumber: 10, code: '        else:', indent: 2 },
      { lineNumber: 11, code: '            right = mid - 1', indent: 3 },
      { lineNumber: 12, code: '    return -1', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'int binarySearch(vector<int>& arr, int key) {', indent: 0 },
      { lineNumber: 2, code: '    int left = 0;', indent: 1 },
      { lineNumber: 3, code: '    int right = arr.size() - 1;', indent: 1 },
      { lineNumber: 4, code: '    while (left <= right) {', indent: 1 },
      { lineNumber: 5, code: '        int mid = (left + right) / 2;', indent: 2 },
      { lineNumber: 6, code: '        if (arr[mid] == key) {', indent: 2 },
      { lineNumber: 7, code: '            return mid;', indent: 3 },
      { lineNumber: 8, code: '        }', indent: 2 },
      { lineNumber: 9, code: '        if (arr[mid] < key) {', indent: 2 },
      { lineNumber: 10, code: '            left = mid + 1;', indent: 3 },
      { lineNumber: 11, code: '        } else {', indent: 2 },
      { lineNumber: 12, code: '            right = mid - 1;', indent: 3 },
      { lineNumber: 13, code: '        }', indent: 2 },
      { lineNumber: 14, code: '    }', indent: 1 },
      { lineNumber: 15, code: '    return -1;', indent: 1 },
      { lineNumber: 16, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'public static int binarySearch(int[] arr, int key) {', indent: 0 },
      { lineNumber: 2, code: '    int left = 0;', indent: 1 },
      { lineNumber: 3, code: '    int right = arr.length - 1;', indent: 1 },
      { lineNumber: 4, code: '    while (left <= right) {', indent: 1 },
      { lineNumber: 5, code: '        int mid = (left + right) / 2;', indent: 2 },
      { lineNumber: 6, code: '        if (arr[mid] == key) {', indent: 2 },
      { lineNumber: 7, code: '            return mid;', indent: 3 },
      { lineNumber: 8, code: '        }', indent: 2 },
      { lineNumber: 9, code: '        if (arr[mid] < key) {', indent: 2 },
      { lineNumber: 10, code: '            left = mid + 1;', indent: 3 },
      { lineNumber: 11, code: '        } else {', indent: 2 },
      { lineNumber: 12, code: '            right = mid - 1;', indent: 3 },
      { lineNumber: 13, code: '        }', indent: 2 },
      { lineNumber: 14, code: '    }', indent: 1 },
      { lineNumber: 15, code: '    return -1;', indent: 1 },
      { lineNumber: 16, code: '}', indent: 0 },
    ],
  },
};

export function generateBinarySearchTrace(initialData: number[], target: number = 27): Step[] {
  const steps: Step[] = [];
  // Binary search requiere arreglo ordenado
  const sortedData = [...initialData].sort((a, b) => a - b);
  const n = sortedData.length;

  let currentArray: ArrayElement[] = sortedData.map((val, idx) => ({
    id: `item-${idx}-${val}`,
    value: val,
    originalIndex: idx,
    state: 'default',
    label: String(idx),
  }));

  let comparisonsCount = 0;
  let operationsCount = 0;

  const createFrames = (leftVal?: number, rightVal?: number, midVal?: number, foundVal?: boolean): MemoryFrame[] => {
    const vars: Record<string, string | number | boolean | null | undefined> = {
      inicio: leftVal !== undefined ? leftVal : null,
      fin: rightVal !== undefined ? rightVal : null,
      medio: midVal !== undefined ? midVal : null,
      clave: target,
      n: n,
    };

    if (foundVal !== undefined) {
      vars.resultado = foundVal ? midVal : -1;
    }

    return [
      {
        id: 'frame-binary',
        name: 'binarySearch',
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
    leftVal?: number,
    rightVal?: number,
    midVal?: number,
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
      frames: createFrames(leftVal, rightVal, midVal, foundVal),
      explanation,
      metrics: {
        comparisons: comparisonsCount,
        swaps: 0,
        operations: operationsCount,
      },
      complexity: {
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        bestCase: 'O(1)',
      },
      activeIndices: {
        left: leftVal,
        right: rightVal,
        mid: midVal,
      },
      operationType,
    });
  };

  // Inicio
  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'active', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Iniciando Búsqueda Binaria en arreglo ordenado de ${n} elementos buscando el valor ${target}.`,
    'init'
  );

  let left = 0;
  let right = n - 1;
  let foundIndex = -1;

  // Inicialización de límites
  pushStep(
    { pseudocode: 2, python: 2, cpp: 2, java: 2 },
    [{ lineNumber: 2, type: 'active', lineByLanguage: { pseudocode: 2, python: 2, cpp: 2, java: 2 } }],
    `Inicializando inicio = 0 (primer índice).`,
    'assign',
    left,
    right
  );

  pushStep(
    { pseudocode: 3, python: 3, cpp: 3, java: 3 },
    [{ lineNumber: 3, type: 'active', lineByLanguage: { pseudocode: 3, python: 3, cpp: 3, java: 3 } }],
    `Inicializando fin = ${right} (último índice).`,
    'assign',
    left,
    right
  );

  // Bucle while
  let iteration = 0;
  while (left <= right) {
    iteration++;

    // while condition
    pushStep(
      { pseudocode: 4, python: 4, cpp: 4, java: 4 },
      [{ lineNumber: 4, type: 'active', lineByLanguage: { pseudocode: 4, python: 4, cpp: 4, java: 4 } }],
      `Iteración ${iteration}: Verificando inicio (${left}) ≤ fin (${right}): VERDADERO. Continuando búsqueda.`,
      'iterate_inner',
      left,
      right
    );

    // Calcular medio
    const mid = Math.floor((left + right) / 2);

    currentArray = currentArray.map((item, idx) => {
      if (idx < left || idx > right) {
        return { ...item, state: 'discarded', nonColorIndicator: '✗' }; // Fuera de rango (descartado)
      }
      if (idx === mid) {
        return { ...item, state: 'comparing', nonColorIndicator: '?' }; // Punto medio
      }
      if (idx === left) {
        return { ...item, state: 'selected', nonColorIndicator: 'ini' }; // Límite izquierdo
      }
      if (idx === right) {
        return { ...item, state: 'selected', nonColorIndicator: 'fin' }; // Límite derecho
      }
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });

    pushStep(
      { pseudocode: 5, python: 5, cpp: 5, java: 5 },
      [{ lineNumber: 5, type: 'active', lineByLanguage: { pseudocode: 5, python: 5, cpp: 5, java: 5 } }],
      `Calculando punto medio: medio = (${left} + ${right}) / 2 = ${mid}. Valor en medio: ${currentArray[mid].value}.`,
      'assign',
      left,
      right,
      mid
    );

    comparisonsCount++;
    const midValue = currentArray[mid].value;
    const isMatch = midValue === target;

    if (isMatch) {
      // if arr[mid] == key
      pushStep(
        { pseudocode: 6, python: 6, cpp: 6, java: 6 },
        [
          { lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 6, cpp: 6, java: 6 } },
          { lineNumber: 7, type: 'next', badgeText: 'encontrado', lineByLanguage: { pseudocode: 7, python: 7, cpp: 7, java: 7 } },
        ],
        `Comparando arr[${mid}] (${midValue}) = clave (${target}): ¡COINCIDENCIA! Valor encontrado en índice ${mid}.`,
        'compare',
        left,
        right,
        mid,
        true
      );

      foundIndex = mid;
      currentArray[mid] = { ...currentArray[mid], state: 'sorted', nonColorIndicator: '✔' };

      pushStep(
        { pseudocode: 7, python: 7, cpp: 7, java: 7 },
        [{ lineNumber: 7, type: 'active', lineByLanguage: { pseudocode: 7, python: 7, cpp: 7, java: 7 } }],
        `Retornando índice ${mid} donde se encontró el valor ${target}.`,
        'finish',
        left,
        right,
        mid,
        true
      );
      break;
    } else {
      pushStep(
        { pseudocode: 6, python: 6, cpp: 6, java: 6 },
        [{ lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 6, cpp: 6, java: 6 } }],
        `Comparando arr[${mid}] (${midValue}) = clave (${target}): No coincide.`,
        'compare',
        left,
        right,
        mid,
        false
      );

      if (midValue < target) {
        // arr[mid] < key - buscar en mitad derecha
        pushStep(
          { pseudocode: 8, python: 8, cpp: 9, java: 9 },
          [
            { lineNumber: 8, type: 'active', lineByLanguage: { pseudocode: 8, python: 8, cpp: 9, java: 9 } },
            { lineNumber: 9, type: 'next', badgeText: 'descartar izquierda', lineByLanguage: { pseudocode: 9, python: 9, cpp: 10, java: 10 } },
          ],
          `Como arr[${mid}] (${midValue}) < clave (${target}), el valor debe estar en la mitad derecha. Descartando índices [${left}..${mid}].`,
          'compare',
          left,
          right,
          mid,
          false
        );

        // Marcar mitad izquierda como descartada
        currentArray = currentArray.map((item, idx) => {
          if (idx <= mid) {
            return { ...item, state: 'discarded', nonColorIndicator: '✗' };
          }
          return item;
        });

        left = mid + 1;

        pushStep(
          { pseudocode: 9, python: 9, cpp: 10, java: 10 },
          [{ lineNumber: 9, type: 'active', lineByLanguage: { pseudocode: 9, python: 9, cpp: 10, java: 10 } }],
          `Actualizando inicio = ${left} (medio + 1). Nuevo rango de búsqueda: [${left}..${right}].`,
          'assign',
          left,
          right,
          mid,
          false
        );
      } else {
        // arr[mid] > key - buscar en mitad izquierda
        pushStep(
          { pseudocode: 10, python: 10, cpp: 11, java: 11 },
          [
            { lineNumber: 10, type: 'active', lineByLanguage: { pseudocode: 10, python: 10, cpp: 11, java: 11 } },
            { lineNumber: 11, type: 'next', badgeText: 'descartar derecha', lineByLanguage: { pseudocode: 11, python: 11, cpp: 12, java: 12 } },
          ],
          `Como arr[${mid}] (${midValue}) > clave (${target}), el valor debe estar en la mitad izquierda. Descartando índices [${mid}..${right}].`,
          'compare',
          left,
          right,
          mid,
          false
        );

        // Marcar mitad derecha como descartada
        currentArray = currentArray.map((item, idx) => {
          if (idx >= mid) {
            return { ...item, state: 'discarded', nonColorIndicator: '✗' };
          }
          return item;
        });

        right = mid - 1;

        pushStep(
          { pseudocode: 11, python: 11, cpp: 12, java: 12 },
          [{ lineNumber: 11, type: 'active', lineByLanguage: { pseudocode: 11, python: 11, cpp: 12, java: 12 } }],
          `Actualizando fin = ${right} (medio - 1). Nuevo rango de búsqueda: [${left}..${right}].`,
          'assign',
          left,
          right,
          mid,
          false
        );
      }
    }
  }

  // No encontrado
  if (foundIndex === -1) {
    currentArray = currentArray.map(item => ({ ...item, state: 'discarded', nonColorIndicator: '✗' }));

    pushStep(
      { pseudocode: 4, python: 4, cpp: 4, java: 4 },
      [{ lineNumber: 4, type: 'active', lineByLanguage: { pseudocode: 4, python: 4, cpp: 4, java: 4 } }],
      `Condición inicio (${left}) ≤ fin (${right}): FALSA. Rango de búsqueda vacío.`,
      'finish',
      left,
      right,
      undefined,
      false
    );

    pushStep(
      { pseudocode: 12, python: 12, cpp: 15, java: 15 },
      [{ lineNumber: 12, type: 'active', lineByLanguage: { pseudocode: 12, python: 12, cpp: 15, java: 15 } }],
      `❌ VALOR NO ENCONTRADO: Se contrajo el espacio de búsqueda completamente sin encontrar el valor ${target}. Retornando -1.`,
      'finish',
      left,
      right,
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

import type {
  Step,
  ArrayElement,
  MemoryFrame,
  StepLineHighlight,
  RecursionTreeNode,
  ParallelState,
  ParallelQueueItem,
  ParallelWorkerState,
} from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';

export const QUICK_SORT_METADATA: AlgorithmMetadata = {
  id: 'quick-sort',
  name: 'Quick Sort',
  family: 'divide_and_conquer',
  categoryName: 'Divide y Vencerás',
  description:
    'Selecciona un elemento pivote, particiona el subarreglo ubicando los menores a la izquierda y los mayores a la derecha (esquema de Lomuto), y ordena recursivamente ambas particiones in-situ.',
  defaultDataset: [38, 27, 43, 3, 9, 82, 10, 19],
  complexity: {
    time: 'O(n log n)',
    space: 'O(log n)',
    bestCase: 'O(n log n)',
    worstCase: 'O(n²)',
    averageCase: 'O(n log n)',
  },
  codeByLanguage: {
    pseudocode: [
      { lineNumber: 1, code: 'algoritmo quick_sort(arr, bajo, alto):', indent: 0 },
      { lineNumber: 2, code: '    si bajo >= alto entonces:', indent: 1 },
      { lineNumber: 3, code: '        retornar', indent: 2 },
      { lineNumber: 4, code: '    pi ← particionar(arr, bajo, alto)', indent: 1 },
      { lineNumber: 5, code: '    quick_sort(arr, bajo, pi - 1)', indent: 1 },
      { lineNumber: 6, code: '    quick_sort(arr, pi + 1, alto)', indent: 1 },
      { lineNumber: 7, code: '', indent: 0 },
      { lineNumber: 8, code: 'funcion particionar(arr, bajo, alto):', indent: 0 },
      { lineNumber: 9, code: '    pivote ← arr[alto]', indent: 1 },
      { lineNumber: 10, code: '    i ← bajo - 1', indent: 1 },
      { lineNumber: 11, code: '    para j ← bajo hasta alto - 1 hacer:', indent: 1 },
      { lineNumber: 12, code: '        si arr[j] <= pivote entonces:', indent: 2 },
      { lineNumber: 13, code: '            i ← i + 1', indent: 3 },
      { lineNumber: 14, code: '            intercambiar(arr, i, j)', indent: 3 },
      { lineNumber: 15, code: '    intercambiar(arr, i + 1, alto)', indent: 1 },
      { lineNumber: 16, code: '    retornar i + 1', indent: 1 },
    ],
    python: [
      { lineNumber: 1, code: 'def quick_sort(arr, bajo, alto):', indent: 0 },
      { lineNumber: 2, code: '    if bajo >= alto:', indent: 1 },
      { lineNumber: 3, code: '        return', indent: 2 },
      { lineNumber: 4, code: '    pi = particionar(arr, bajo, alto)', indent: 1 },
      { lineNumber: 5, code: '    quick_sort(arr, bajo, pi - 1)', indent: 1 },
      { lineNumber: 6, code: '    quick_sort(arr, pi + 1, alto)', indent: 1 },
      { lineNumber: 7, code: '', indent: 0 },
      { lineNumber: 8, code: 'def particionar(arr, bajo, alto):', indent: 0 },
      { lineNumber: 9, code: '    pivote = arr[alto]', indent: 1 },
      { lineNumber: 10, code: '    i = bajo - 1', indent: 1 },
      { lineNumber: 11, code: '    for j in range(bajo, alto):', indent: 1 },
      { lineNumber: 12, code: '        if arr[j] <= pivote:', indent: 2 },
      { lineNumber: 13, code: '            i += 1', indent: 3 },
      { lineNumber: 14, code: '            arr[i], arr[j] = arr[j], arr[i]', indent: 3 },
      { lineNumber: 15, code: '    arr[i + 1], arr[alto] = arr[alto], arr[i + 1]', indent: 1 },
      { lineNumber: 16, code: '    return i + 1', indent: 1 },
    ],
    cpp: [
      { lineNumber: 1, code: 'void quickSort(vector<int>& arr, int bajo, int alto) {', indent: 0 },
      { lineNumber: 2, code: '    if (bajo >= alto) return;', indent: 1 },
      { lineNumber: 3, code: '    int pi = particionar(arr, bajo, alto);', indent: 1 },
      { lineNumber: 4, code: '    quickSort(arr, bajo, pi - 1);', indent: 1 },
      { lineNumber: 5, code: '    quickSort(arr, pi + 1, alto);', indent: 1 },
      { lineNumber: 6, code: '}', indent: 0 },
      { lineNumber: 7, code: 'int particionar(vector<int>& arr, int bajo, int alto) {', indent: 0 },
      { lineNumber: 8, code: '    int pivote = arr[alto];', indent: 1 },
      { lineNumber: 9, code: '    int i = bajo - 1;', indent: 1 },
      { lineNumber: 10, code: '    for (int j = bajo; j < alto; j++) {', indent: 1 },
      { lineNumber: 11, code: '        if (arr[j] <= pivote) {', indent: 2 },
      { lineNumber: 12, code: '            i++;', indent: 3 },
      { lineNumber: 13, code: '            swap(arr[i], arr[j]);', indent: 3 },
      { lineNumber: 14, code: '        }', indent: 2 },
      { lineNumber: 15, code: '    }', indent: 1 },
      { lineNumber: 16, code: '    swap(arr[i + 1], arr[alto]);', indent: 1 },
      { lineNumber: 17, code: '    return i + 1;', indent: 1 },
      { lineNumber: 18, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'public static void quickSort(int[] arr, int bajo, int alto) {', indent: 0 },
      { lineNumber: 2, code: '    if (bajo >= alto) return;', indent: 1 },
      { lineNumber: 3, code: '    int pi = particionar(arr, bajo, alto);', indent: 1 },
      { lineNumber: 4, code: '    quickSort(arr, bajo, pi - 1);', indent: 1 },
      { lineNumber: 5, code: '    quickSort(arr, pi + 1, alto);', indent: 1 },
      { lineNumber: 6, code: '}', indent: 0 },
      { lineNumber: 7, code: 'static int particionar(int[] arr, int bajo, int alto) {', indent: 0 },
      { lineNumber: 8, code: '    int pivote = arr[alto];', indent: 1 },
      { lineNumber: 9, code: '    int i = bajo - 1;', indent: 1 },
      { lineNumber: 10, code: '    for (int j = bajo; j < alto; j++) {', indent: 1 },
      { lineNumber: 11, code: '        if (arr[j] <= pivote) {', indent: 2 },
      { lineNumber: 12, code: '            i++;', indent: 3 },
      { lineNumber: 13, code: '            swap(arr, i, j);', indent: 3 },
      { lineNumber: 14, code: '        }', indent: 2 },
      { lineNumber: 15, code: '    }', indent: 1 },
      { lineNumber: 16, code: '    swap(arr, i + 1, alto);', indent: 1 },
      { lineNumber: 17, code: '    return i + 1;', indent: 1 },
      { lineNumber: 18, code: '}', indent: 0 },
    ],
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateQuickSortTrace(initialData: number[]): Step[] {
  const steps: Step[] = [];
  const n = initialData.length;

  let currentArray: ArrayElement[] = initialData.map((val, idx) => ({
    id: `item-${idx}-${val}`,
    value: val,
    originalIndex: idx,
    state: 'default',
    label: LETTERS[idx % LETTERS.length],
  }));

  const sortedPositions = new Set<number>();
  let comparisonsCount = 0;
  let swapsCount = 0;
  let operationsCount = 0;

  const treeNodes: Record<string, RecursionTreeNode> = {};
  const taskQueue: ParallelQueueItem[] = [];
  const workers: ParallelWorkerState[] = [
    { id: 1, name: 'Partición Izquierda', status: 'idle' },
    { id: 2, name: 'Partición Derecha', status: 'idle' },
  ];
  const completedTasks: string[] = [];
  const callStack: Array<{ bajo: number; alto: number; name: string; vars?: Record<string, any> }> = [];

  const getActiveFrames = (activeVars?: Record<string, any>): MemoryFrame[] => {
    const frames: MemoryFrame[] = callStack.map((call, idx) => {
      const isCurrent = idx === callStack.length - 1;
      return {
        id: `frame-qs-${call.bajo}-${call.alto}-${idx}`,
        name: call.name,
        isActive: isCurrent,
        variables: {
          bajo: call.bajo,
          alto: call.alto,
          ...(call.vars || {}),
          ...(isCurrent && activeVars ? activeVars : {}),
        },
      };
    });

    frames.unshift({
      id: 'frame-global',
      name: 'Entorno Global',
      isActive: frames.length === 0,
      variables: {
        n,
        arr: `→ [0..${n - 1}]`,
      },
    });

    return frames.reverse();
  };

  const cloneArray = (arr: ArrayElement[]): ArrayElement[] =>
    arr.map((item, idx) => {
      if (sortedPositions.has(idx) && item.state === 'default') {
        return { ...item, state: 'sorted', nonColorIndicator: undefined };
      }
      return { ...item };
    });

  const cloneNodes = (): Record<string, RecursionTreeNode> => {
    const copy: Record<string, RecursionTreeNode> = {};
    for (const [k, v] of Object.entries(treeNodes)) {
      copy[k] = {
        ...v,
        values: [...v.values],
        currentValues: v.currentValues ? [...v.currentValues] : undefined,
      };
    }
    return copy;
  };

  const cloneParallel = (): ParallelState => ({
    taskQueue: taskQueue.map(t => ({ ...t, values: [...t.values] })),
    workers: workers.map(w => ({
      ...w,
      currentTask: w.currentTask ? { ...w.currentTask, values: [...w.currentTask.values] } : undefined,
    })),
    completedTasks: [...completedTasks],
  });

  const pushStep = (
    lines: Record<SupportedLanguage, number>,
    highlights: StepLineHighlight[],
    explanation: string,
    operationType: Step['operationType'],
    activeNodeId?: string,
    activePhase: 'divide' | 'conquer' | 'combine' | 'completed' = 'divide',
    phaseDescription?: string,
    activeIndices?: Step['activeIndices'],
    frameVars?: Record<string, any>
  ) => {
    operationsCount++;
    steps.push({
      stepIndex: steps.length + 1,
      totalSteps: 0,
      activeLine: lines.pseudocode,
      activeLineByLang: lines,
      highlights,
      array: cloneArray(currentArray),
      frames: getActiveFrames(frameVars),
      explanation,
      metrics: {
        comparisons: comparisonsCount,
        swaps: swapsCount,
        operations: operationsCount,
      },
      complexity: {
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(log n)',
        bestCase: 'O(n log n)',
        worstCase: 'O(n²)',
        averageCase: 'O(n log n)',
      },
      activeIndices: activeIndices || {},
      operationType,
      divideAndConquer: {
        nodes: cloneNodes(),
        activeNodeId,
        activePhase,
        phaseDescription,
        parallel: cloneParallel(),
      },
    });
  };

  const rootId = `node-0-${n - 1}`;
  const initialValues = initialData.slice(0, n);

  treeNodes[rootId] = {
    id: rootId,
    depth: 0,
    range: [0, n - 1],
    values: [...initialValues],
    currentValues: [...initialValues],
    state: 'processing',
    label: `arr[0..${n - 1}]`,
  };

  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'active', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Iniciando Quick Sort (Esquema de Lomuto) con ${n} elementos en el rango [0..${n - 1}].`,
    'init',
    rootId,
    'divide',
    'Fase de Inicio: Selección de rango completo [0..' + (n - 1) + ']'
  );

  function partition(bajo: number, alto: number, nodeId: string): number {
    const pivotVal = currentArray[alto].value;
    let i = bajo - 1;

    treeNodes[nodeId].state = 'dividing';
    treeNodes[nodeId].pivotValue = pivotVal;
    treeNodes[nodeId].pivotIndex = alto;

    callStack.push({
      bajo,
      alto,
      name: `particionar(${bajo}, ${alto})`,
      vars: { pivote: pivotVal, i },
    });

    // Resaltar pivote en arr[alto]
    currentArray = currentArray.map((item, idx) => {
      if (idx === alto) return { ...item, state: 'selected', nonColorIndicator: 'pivote' };
      if (sortedPositions.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });

    pushStep(
      { pseudocode: 9, python: 9, cpp: 8, java: 8 },
      [
        { lineNumber: 9, type: 'active', lineByLanguage: { pseudocode: 9, python: 9, cpp: 8, java: 8 } },
        { lineNumber: 10, type: 'next', lineByLanguage: { pseudocode: 10, python: 10, cpp: 9, java: 9 } },
      ],
      `Seleccionando pivote = arr[${alto}] (${pivotVal}) e inicializando puntero de menores i = ${i}.`,
      'assign',
      nodeId,
      'divide',
      `Pivote seleccionado: arr[${alto}] = ${pivotVal} | i = ${i}`,
      { left: bajo, right: alto, pivot: alto, i: i >= 0 ? i : undefined },
      { pivote: pivotVal, i }
    );

    for (let j = bajo; j < alto; j++) {
      comparisonsCount++;
      const valJ = currentArray[j].value;

      currentArray = currentArray.map((item, idx) => {
        if (idx === alto) return { ...item, state: 'selected', nonColorIndicator: 'pivote' };
        if (idx === j) return { ...item, state: 'comparing', nonColorIndicator: 'j' };
        if (idx === i && i >= bajo) return { ...item, state: 'selected', nonColorIndicator: 'i' };
        if (sortedPositions.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });

      const isLessOrEqual = valJ <= pivotVal;

      pushStep(
        { pseudocode: 12, python: 12, cpp: 11, java: 11 },
        [
          { lineNumber: 11, type: 'evaluating', lineByLanguage: { pseudocode: 11, python: 11, cpp: 10, java: 10 } },
          { lineNumber: 12, type: 'active', lineByLanguage: { pseudocode: 12, python: 12, cpp: 11, java: 11 } },
        ],
        `Comparando arr[${j}] (${valJ}) <= pivote (${pivotVal}): ${isLessOrEqual ? 'VERDADERO (pertenece a partición izquierda)' : 'FALSO (se mantiene en partición derecha)'}.`,
        'compare',
        nodeId,
        'divide',
        `Comparando arr[${j}] (${valJ}) <= pivote (${pivotVal})`,
        { left: bajo, right: alto, pivot: alto, i: i >= 0 ? i : undefined, j },
        { pivote: pivotVal, i, j }
      );

      if (isLessOrEqual) {
        i++;
        if (i !== j) {
          swapsCount++;
          const temp = currentArray[i];
          currentArray[i] = { ...currentArray[j], state: 'swapped', nonColorIndicator: undefined };
          currentArray[j] = { ...temp, state: 'swapped', nonColorIndicator: undefined };
          currentArray[alto] = { ...currentArray[alto], state: 'selected', nonColorIndicator: 'pivote' };
          treeNodes[nodeId].currentValues = currentArray.slice(bajo, alto + 1).map(x => x.value);

          pushStep(
            { pseudocode: 14, python: 14, cpp: 13, java: 13 },
            [
              { lineNumber: 13, type: 'executed', lineByLanguage: { pseudocode: 13, python: 13, cpp: 12, java: 12 } },
              { lineNumber: 14, type: 'active', badgeText: 'swap', lineByLanguage: { pseudocode: 14, python: 14, cpp: 13, java: 13 } },
            ],
            `Incrementando i = ${i} e intercambiando arr[${i}] (${currentArray[i].value}) y arr[${j}] (${currentArray[j].value}).`,
            'swap',
            nodeId,
            'divide',
            `Intercambio en partición: arr[${i}] y arr[${j}]`,
            { left: bajo, right: alto, pivot: alto, i, j },
            { pivote: pivotVal, i, j }
          );
        } else {
          currentArray[i] = { ...currentArray[i], state: 'swapped', nonColorIndicator: 'i,j' };
          pushStep(
            { pseudocode: 13, python: 13, cpp: 12, java: 12 },
            [{ lineNumber: 13, type: 'active', lineByLanguage: { pseudocode: 13, python: 13, cpp: 12, java: 12 } }],
            `Incrementando frontera de menores i = ${i} (i coincide con j=${j}, el elemento ${valJ} permanece en su lugar).`,
            'assign',
            nodeId,
            'divide',
            `Frontera de menores avanza: i = ${i}`,
            { left: bajo, right: alto, pivot: alto, i, j },
            { pivote: pivotVal, i, j }
          );
        }
      }
    }

    // Colocar el pivote en su posición definitiva pi = i + 1
    const pi = i + 1;
    if (pi !== alto) {
      swapsCount++;
      const temp = currentArray[pi];
      currentArray[pi] = { ...currentArray[alto], state: 'swapped', nonColorIndicator: 'pivote' };
      currentArray[alto] = { ...temp, state: 'swapped', nonColorIndicator: undefined };
    }

    sortedPositions.add(pi);
    currentArray = currentArray.map((item, idx) => {
      if (idx === pi) return { ...item, state: 'sorted', nonColorIndicator: undefined };
      if (sortedPositions.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
      return { ...item, state: 'default', nonColorIndicator: undefined };
    });

    treeNodes[nodeId].currentValues = currentArray.slice(bajo, alto + 1).map(x => x.value);
    treeNodes[nodeId].pivotIndex = pi;

    pushStep(
      { pseudocode: 15, python: 15, cpp: 16, java: 16 },
      [
        { lineNumber: 15, type: 'active', badgeText: 'pivote fijo', lineByLanguage: { pseudocode: 15, python: 15, cpp: 16, java: 16 } },
        { lineNumber: 16, type: 'next', lineByLanguage: { pseudocode: 16, python: 16, cpp: 17, java: 17 } },
      ],
      `Ubicando el pivote ${pivotVal} en su posición final ordenada pi = ${pi}. Retornando índice ${pi}.`,
      'swap',
      nodeId,
      'combine',
      `Pivote ${pivotVal} fijado en índice definitivo pi = ${pi}`,
      { left: bajo, right: alto, pivot: pi, i: pi },
      { pivote: pivotVal, pi }
    );

    callStack.pop();
    return pi;
  }

  function recursiveQuickSort(bajo: number, alto: number, parentId?: string, depth: number = 0, isLeft: boolean = true) {
    if (bajo > alto) return;

    const nodeId = `node-${bajo}-${alto}`;
    const subValues = currentArray.slice(bajo, alto + 1).map(x => x.value);

    if (!treeNodes[nodeId]) {
      treeNodes[nodeId] = {
        id: nodeId,
        parentId,
        depth,
        range: [bajo, alto],
        values: [...subValues],
        currentValues: [...subValues],
        state: 'processing',
        label: `arr[${bajo}..${alto}]`,
        isLeftChild: isLeft,
      };
      if (parentId && treeNodes[parentId]) {
        if (isLeft) treeNodes[parentId].leftId = nodeId;
        else treeNodes[parentId].rightId = nodeId;
      }
    }

    callStack.push({ bajo, alto, name: `quickSort(${bajo}, ${alto})` });

    // Caso base: subarreglo de 1 elemento
    if (bajo === alto) {
      sortedPositions.add(bajo);
      treeNodes[nodeId].state = 'base_case';
      currentArray = currentArray.map((item, idx) => {
        if (sortedPositions.has(idx)) return { ...item, state: 'sorted', nonColorIndicator: undefined };
        return { ...item, state: 'default', nonColorIndicator: undefined };
      });

      pushStep(
        { pseudocode: 2, python: 2, cpp: 2, java: 2 },
        [
          { lineNumber: 2, type: 'active', lineByLanguage: { pseudocode: 2, python: 2, cpp: 2, java: 2 } },
          { lineNumber: 3, type: 'executed', badgeText: 'caso base', lineByLanguage: { pseudocode: 3, python: 3, cpp: 2, java: 2 } },
        ],
        `Caso Base en [${bajo}..${alto}]: subarreglo de un solo elemento (${currentArray[bajo].value}), ya está en su posición final.`,
        'check',
        nodeId,
        'conquer',
        `Caso Base: Elemento arr[${bajo}] = ${currentArray[bajo].value} ordenado`,
        { left: bajo, right: alto }
      );

      treeNodes[nodeId].state = 'solved';
      callStack.pop();
      return;
    }

    // Llamada a particionar
    pushStep(
      { pseudocode: 4, python: 4, cpp: 3, java: 3 },
      [{ lineNumber: 4, type: 'active', lineByLanguage: { pseudocode: 4, python: 4, cpp: 3, java: 3 } }],
      `Particionando el subarreglo [${bajo}..${alto}] alrededor del pivote arr[${alto}] (${currentArray[alto].value}).`,
      'iterate_outer',
      nodeId,
      'divide',
      `Fase Divide: Particionando rango [${bajo}..${alto}]`,
      { left: bajo, right: alto, pivot: alto }
    );

    const pi = partition(bajo, alto, nodeId);
    callStack[callStack.length - 1].vars = { pi };

    // Recursión izquierda
    if (bajo <= pi - 1) {
      pushStep(
        { pseudocode: 5, python: 5, cpp: 4, java: 4 },
        [{ lineNumber: 5, type: 'active', lineByLanguage: { pseudocode: 5, python: 5, cpp: 4, java: 4 } }],
        `Ordenando recursivamente la sub-partición izquierda [${bajo}..${pi - 1}] (elementos menores o iguales a ${currentArray[pi].value}).`,
        'iterate_inner',
        nodeId,
        'divide',
        `Recursión Izquierda: quickSort(${bajo}, ${pi - 1})`,
        { left: bajo, right: pi - 1, pivot: pi },
        { pi }
      );
      recursiveQuickSort(bajo, pi - 1, nodeId, depth + 1, true);
    }

    // Recursión derecha
    if (pi + 1 <= alto) {
      pushStep(
        { pseudocode: 6, python: 6, cpp: 5, java: 5 },
        [{ lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 6, cpp: 5, java: 5 } }],
        `Ordenando recursivamente la sub-partición derecha [${pi + 1}..${alto}] (elementos mayores a ${currentArray[pi].value}).`,
        'iterate_inner',
        nodeId,
        'divide',
        `Recursión Derecha: quickSort(${pi + 1}, ${alto})`,
        { left: pi + 1, right: alto, pivot: pi },
        { pi }
      );
      recursiveQuickSort(pi + 1, alto, nodeId, depth + 1, false);
    }

    treeNodes[nodeId].state = depth === 0 ? 'completed' : 'solved';
    treeNodes[nodeId].currentValues = currentArray.slice(bajo, alto + 1).map(x => x.value);
    callStack.pop();
  }

  recursiveQuickSort(0, n - 1, undefined, 0, true);

  currentArray = currentArray.map(item => ({
    ...item,
    state: 'sorted',
    nonColorIndicator: undefined,
  }));
  treeNodes[rootId].state = 'completed';

  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'executed', badgeText: 'completado', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Quick Sort finalizado. Todos los elementos están ordenados tras ${comparisonsCount} comparaciones y ${swapsCount} intercambios.`,
    'finish',
    rootId,
    'completed',
    'Ordenamiento Quick Sort Completado'
  );

  const total = steps.length;
  steps.forEach(s => {
    s.totalSteps = total;
  });

  return steps;
}

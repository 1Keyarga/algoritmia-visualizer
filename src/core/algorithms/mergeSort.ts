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

export const MERGE_SORT_METADATA: AlgorithmMetadata = {
  id: 'merge-sort',
  name: 'Merge Sort',
  family: 'divide_and_conquer',
  categoryName: 'Divide y Vencerás',
  description:
    'Divide recursivamente el arreglo en mitades hasta subarreglos unitarios (Divide) y los combina ordenadamente mediante un arreglo temporal (Combine).',
  defaultDataset: [38, 27, 43, 3, 9, 82, 10, 19],
  complexity: {
    time: 'O(n log n)',
    space: 'O(n)',
    bestCase: 'O(n log n)',
    worstCase: 'O(n log n)',
    averageCase: 'O(n log n)',
  },
  codeByLanguage: {
    pseudocode: [
      { lineNumber: 1, code: 'algoritmo merge_sort(arr, inicio, fin):', indent: 0 },
      { lineNumber: 2, code: '    si inicio >= fin entonces:', indent: 1 },
      { lineNumber: 3, code: '        retornar', indent: 2 },
      { lineNumber: 4, code: '    medio ← piso((inicio + fin) / 2)', indent: 1 },
      { lineNumber: 5, code: '    merge_sort(arr, inicio, medio)', indent: 1 },
      { lineNumber: 6, code: '    merge_sort(arr, medio + 1, fin)', indent: 1 },
      { lineNumber: 7, code: '    combinar(arr, inicio, medio, fin)', indent: 1 },
      { lineNumber: 8, code: '', indent: 0 },
      { lineNumber: 9, code: 'funcion combinar(arr, inicio, medio, fin):', indent: 0 },
      { lineNumber: 10, code: '    temp ← crear_arreglo(fin - inicio + 1)', indent: 1 },
      { lineNumber: 11, code: '    i ← inicio, j ← medio + 1, k ← 0', indent: 1 },
      { lineNumber: 12, code: '    mientras i <= medio y j <= fin hacer:', indent: 1 },
      { lineNumber: 13, code: '        si arr[i] <= arr[j] entonces:', indent: 2 },
      { lineNumber: 14, code: '            temp[k] ← arr[i]', indent: 3 },
      { lineNumber: 15, code: '            i ← i + 1', indent: 3 },
      { lineNumber: 16, code: '        sino:', indent: 2 },
      { lineNumber: 17, code: '            temp[k] ← arr[j]', indent: 3 },
      { lineNumber: 18, code: '            j ← j + 1', indent: 3 },
      { lineNumber: 19, code: '        k ← k + 1', indent: 2 },
      { lineNumber: 20, code: '    mientras i <= medio hacer:', indent: 1 },
      { lineNumber: 21, code: '        temp[k] ← arr[i]; i ← i + 1; k ← k + 1', indent: 2 },
      { lineNumber: 22, code: '    mientras j <= fin hacer:', indent: 1 },
      { lineNumber: 23, code: '        temp[k] ← arr[j]; j ← j + 1; k ← k + 1', indent: 2 },
      { lineNumber: 24, code: '    para idx ← 0 hasta k - 1 hacer:', indent: 1 },
      { lineNumber: 25, code: '        arr[inicio + idx] ← temp[idx]', indent: 2 },
    ],
    python: [
      { lineNumber: 1, code: 'def merge_sort(arr, inicio, fin):', indent: 0 },
      { lineNumber: 2, code: '    if inicio >= fin:', indent: 1 },
      { lineNumber: 3, code: '        return', indent: 2 },
      { lineNumber: 4, code: '    medio = (inicio + fin) // 2', indent: 1 },
      { lineNumber: 5, code: '    merge_sort(arr, inicio, medio)', indent: 1 },
      { lineNumber: 6, code: '    merge_sort(arr, medio + 1, fin)', indent: 1 },
      { lineNumber: 7, code: '    merge(arr, inicio, medio, fin)', indent: 1 },
      { lineNumber: 8, code: '', indent: 0 },
      { lineNumber: 9, code: 'def merge(arr, inicio, medio, fin):', indent: 0 },
      { lineNumber: 10, code: '    temp = [0] * (fin - inicio + 1)', indent: 1 },
      { lineNumber: 11, code: '    i, j, k = inicio, medio + 1, 0', indent: 1 },
      { lineNumber: 12, code: '    while i <= medio and j <= fin:', indent: 1 },
      { lineNumber: 13, code: '        if arr[i] <= arr[j]:', indent: 2 },
      { lineNumber: 14, code: '            temp[k] = arr[i]', indent: 3 },
      { lineNumber: 15, code: '            i += 1', indent: 3 },
      { lineNumber: 16, code: '        else:', indent: 2 },
      { lineNumber: 17, code: '            temp[k] = arr[j]', indent: 3 },
      { lineNumber: 18, code: '            j += 1', indent: 3 },
      { lineNumber: 19, code: '        k += 1', indent: 2 },
      { lineNumber: 20, code: '    while i <= medio:', indent: 1 },
      { lineNumber: 21, code: '        temp[k] = arr[i]; i += 1; k += 1', indent: 2 },
      { lineNumber: 22, code: '    while j <= fin:', indent: 1 },
      { lineNumber: 23, code: '        temp[k] = arr[j]; j += 1; k += 1', indent: 2 },
      { lineNumber: 24, code: '    for idx in range(k):', indent: 1 },
      { lineNumber: 25, code: '        arr[inicio + idx] = temp[idx]', indent: 2 },
    ],
    cpp: [
      { lineNumber: 1, code: 'void mergeSort(vector<int>& arr, int inicio, int fin) {', indent: 0 },
      { lineNumber: 2, code: '    if (inicio >= fin) return;', indent: 1 },
      { lineNumber: 3, code: '    int medio = inicio + (fin - inicio) / 2;', indent: 1 },
      { lineNumber: 4, code: '    mergeSort(arr, inicio, medio);', indent: 1 },
      { lineNumber: 5, code: '    mergeSort(arr, medio + 1, fin);', indent: 1 },
      { lineNumber: 6, code: '    merge(arr, inicio, medio, fin);', indent: 1 },
      { lineNumber: 7, code: '}', indent: 0 },
      { lineNumber: 8, code: 'void merge(vector<int>& arr, int inicio, int medio, int fin) {', indent: 0 },
      { lineNumber: 9, code: '    vector<int> temp(fin - inicio + 1);', indent: 1 },
      { lineNumber: 10, code: '    int i = inicio, j = medio + 1, k = 0;', indent: 1 },
      { lineNumber: 11, code: '    while (i <= medio && j <= fin) {', indent: 1 },
      { lineNumber: 12, code: '        if (arr[i] <= arr[j]) temp[k] = arr[i++];', indent: 2 },
      { lineNumber: 13, code: '        else temp[k] = arr[j++];', indent: 2 },
      { lineNumber: 14, code: '        k++;', indent: 2 },
      { lineNumber: 15, code: '    }', indent: 1 },
      { lineNumber: 16, code: '    while (i <= medio) temp[k++] = arr[i++];', indent: 1 },
      { lineNumber: 17, code: '    while (j <= fin) temp[k++] = arr[j++];', indent: 1 },
      { lineNumber: 18, code: '    for (int idx = 0; idx < k; idx++) {', indent: 1 },
      { lineNumber: 19, code: '        arr[inicio + idx] = temp[idx];', indent: 2 },
      { lineNumber: 20, code: '    }', indent: 1 },
      { lineNumber: 21, code: '}', indent: 0 },
    ],
    java: [
      { lineNumber: 1, code: 'public static void mergeSort(int[] arr, int inicio, int fin) {', indent: 0 },
      { lineNumber: 2, code: '    if (inicio >= fin) return;', indent: 1 },
      { lineNumber: 3, code: '    int medio = (inicio + fin) / 2;', indent: 1 },
      { lineNumber: 4, code: '    mergeSort(arr, inicio, medio);', indent: 1 },
      { lineNumber: 5, code: '    mergeSort(arr, medio + 1, fin);', indent: 1 },
      { lineNumber: 6, code: '    merge(arr, inicio, medio, fin);', indent: 1 },
      { lineNumber: 7, code: '}', indent: 0 },
      { lineNumber: 8, code: 'static void merge(int[] arr, int inicio, int medio, int fin) {', indent: 0 },
      { lineNumber: 9, code: '    int[] temp = new int[fin - inicio + 1];', indent: 1 },
      { lineNumber: 10, code: '    int i = inicio, j = medio + 1, k = 0;', indent: 1 },
      { lineNumber: 11, code: '    while (i <= medio && j <= fin) {', indent: 1 },
      { lineNumber: 12, code: '        if (arr[i] <= arr[j]) temp[k] = arr[i++];', indent: 2 },
      { lineNumber: 13, code: '        else temp[k] = arr[j++];', indent: 2 },
      { lineNumber: 14, code: '        k++;', indent: 2 },
      { lineNumber: 15, code: '    }', indent: 1 },
      { lineNumber: 16, code: '    while (i <= medio) temp[k++] = arr[i++];', indent: 1 },
      { lineNumber: 17, code: '    while (j <= fin) temp[k++] = arr[j++];', indent: 1 },
      { lineNumber: 18, code: '    for (int idx = 0; idx < k; idx++) {', indent: 1 },
      { lineNumber: 19, code: '        arr[inicio + idx] = temp[idx];', indent: 2 },
      { lineNumber: 20, code: '    }', indent: 1 },
      { lineNumber: 21, code: '}', indent: 0 },
    ],
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateMergeSortTrace(initialData: number[]): Step[] {
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
  let movesCount = 0;
  let operationsCount = 0;

  const treeNodes: Record<string, RecursionTreeNode> = {};
  const taskQueue: ParallelQueueItem[] = [];
  const workers: ParallelWorkerState[] = [
    { id: 1, name: 'Worker A (Hilo 1)', status: 'idle' },
    { id: 2, name: 'Worker B (Hilo 2)', status: 'idle' },
  ];
  const completedTasks: string[] = [];
  const callStack: Array<{ inicio: number; fin: number; name: string }> = [];

  const getActiveFrames = (activeVars?: Record<string, any>): MemoryFrame[] => {
    const frames: MemoryFrame[] = callStack.map((call, idx) => {
      const isCurrent = idx === callStack.length - 1;
      return {
        id: `frame-${call.inicio}-${call.fin}-${idx}`,
        name: `mergeSort(${call.inicio}, ${call.fin})`,
        isActive: isCurrent,
        variables: {
          inicio: call.inicio,
          fin: call.fin,
          medio: Math.floor((call.inicio + call.fin) / 2),
          ...(isCurrent && activeVars ? activeVars : {}),
        },
      };
    });

    frames.unshift({
      id: 'frame-global',
      name: 'Entorno Global',
      isActive: false,
      variables: {
        n: n,
        arr: `→ [0..${n - 1}]`,
      },
    });

    return frames.reverse();
  };

  const cloneArray = (arr: ArrayElement[]): ArrayElement[] =>
    arr.map(item => ({ ...item }));

  const cloneNodes = (): Record<string, RecursionTreeNode> => {
    const copy: Record<string, RecursionTreeNode> = {};
    for (const [k, v] of Object.entries(treeNodes)) {
      copy[k] = { ...v, values: [...v.values], currentValues: v.currentValues ? [...v.currentValues] : undefined };
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
        swaps: movesCount,
        operations: operationsCount,
      },
      complexity: {
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(n)',
        bestCase: 'O(n log n)',
        worstCase: 'O(n log n)',
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

  taskQueue.push({
    id: `task-0-${n - 1}`,
    range: [0, n - 1],
    values: [...initialValues],
    action: 'divide',
    description: `Dividir problema principal [0..${n - 1}]`,
  });

  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'active', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Iniciando Merge Sort con ${n} elementos. Problema inicial: [0..${n - 1}].`,
    'init',
    rootId,
    'divide',
    'Fase de Inicio: Planteamiento del Problema Original'
  );

  function recursiveMergeSort(inicio: number, fin: number, parentId?: string, depth: number = 0, isLeft: boolean = true) {
    const nodeId = `node-${inicio}-${fin}`;
    const subValues = currentArray.slice(inicio, fin + 1).map(x => x.value);

    if (!treeNodes[nodeId]) {
      treeNodes[nodeId] = {
        id: nodeId,
        parentId,
        depth,
        range: [inicio, fin],
        values: [...subValues],
        currentValues: [...subValues],
        state: 'processing',
        label: `arr[${inicio}..${fin}]`,
        isLeftChild: isLeft,
      };
      if (parentId && treeNodes[parentId]) {
        if (isLeft) treeNodes[parentId].leftId = nodeId;
        else treeNodes[parentId].rightId = nodeId;
      }
    }

    callStack.push({ inicio, fin, name: `mergeSort(${inicio}, ${fin})` });

    const workerIdx = isLeft ? 0 : 1;
    workers[workerIdx].status = 'active';
    workers[workerIdx].currentTask = {
      id: `task-${inicio}-${fin}`,
      workerId: workerIdx + 1,
      range: [inicio, fin],
      values: [...subValues],
      status: 'working',
      description: `Procesando subarreglo [${inicio}..${fin}]`,
    };

    currentArray = currentArray.map((item, idx) => {
      if (idx >= inicio && idx <= fin) return { ...item, state: 'selected' };
      return { ...item, state: 'default' };
    });

    // Línea 1: Llamada recursiva
    pushStep(
      { pseudocode: 1, python: 1, cpp: 1, java: 1 },
      [{ lineNumber: 1, type: 'active', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
      `Llamada recursiva merge_sort(arr, inicio=${inicio}, fin=${fin}).`,
      'iterate_outer',
      nodeId,
      'divide',
      `Fase Divide: Evaluando subproblema [${inicio}..${fin}]`,
      { left: inicio, right: fin }
    );

    // Línea 2 & 3: Caso Base
    if (inicio >= fin) {
      treeNodes[nodeId].state = 'base_case';
      currentArray[inicio] = {
        ...currentArray[inicio],
        state: 'sorted',
        nonColorIndicator: undefined,
      };

      if (workers[workerIdx].currentTask) {
        workers[workerIdx].currentTask!.status = 'done';
      }
      completedTasks.push(`Caso Base [${inicio}]: ${currentArray[inicio].value}`);

      pushStep(
        { pseudocode: 2, python: 2, cpp: 2, java: 2 },
        [
          { lineNumber: 2, type: 'active', lineByLanguage: { pseudocode: 2, python: 2, cpp: 2, java: 2 } },
          { lineNumber: 3, type: 'executed', badgeText: 'retornar', lineByLanguage: { pseudocode: 3, python: 3, cpp: 2, java: 2 } },
        ],
        `Caso Base: inicio (${inicio}) >= fin (${fin}). El elemento [${currentArray[inicio].value}] ya está ordenado.`,
        'check',
        nodeId,
        'conquer',
        `Caso Base: Subarreglo unitario [${inicio}] resuelto`,
        { left: inicio, right: fin }
      );

      treeNodes[nodeId].state = 'solved';
      callStack.pop();
      return;
    }

    // Línea 4: Calcular punto medio
    const medio = Math.floor((inicio + fin) / 2);
    treeNodes[nodeId].state = 'dividing';

    taskQueue.push(
      {
        id: `task-${inicio}-${medio}`,
        range: [inicio, medio],
        values: currentArray.slice(inicio, medio + 1).map(x => x.value),
        action: 'divide',
        description: `Subproblema Izquierdo [${inicio}..${medio}]`,
      },
      {
        id: `task-${medio + 1}-${fin}`,
        range: [medio + 1, fin],
        values: currentArray.slice(medio + 1, fin + 1).map(x => x.value),
        action: 'divide',
        description: `Subproblema Derecho [${medio + 1}..${fin}]`,
      }
    );

    pushStep(
      { pseudocode: 4, python: 4, cpp: 3, java: 3 },
      [{ lineNumber: 4, type: 'active', lineByLanguage: { pseudocode: 4, python: 4, cpp: 3, java: 3 } }],
      `Calculando medio = ⌊(${inicio} + ${fin}) / 2⌋ = ${medio}. Dividiendo en [${inicio}..${medio}] y [${medio + 1}..${fin}].`,
      'assign',
      nodeId,
      'divide',
      `Dividiendo [${inicio}..${fin}] en [${inicio}..${medio}] y [${medio + 1}..${fin}]`,
      { left: inicio, right: fin, mid: medio }
    );

    // Línea 5: merge_sort(arr, inicio, medio)
    pushStep(
      { pseudocode: 5, python: 5, cpp: 4, java: 4 },
      [{ lineNumber: 5, type: 'active', lineByLanguage: { pseudocode: 5, python: 5, cpp: 4, java: 4 } }],
      `Llamada recursiva izquierda: merge_sort(arr, ${inicio}, ${medio}).`,
      'iterate_inner',
      nodeId,
      'divide',
      `Recursión Izquierda: merge_sort(${inicio}, ${medio})`,
      { left: inicio, right: fin, mid: medio }
    );

    recursiveMergeSort(inicio, medio, nodeId, depth + 1, true);

    // Línea 6: merge_sort(arr, medio + 1, fin)
    pushStep(
      { pseudocode: 6, python: 6, cpp: 5, java: 5 },
      [{ lineNumber: 6, type: 'active', lineByLanguage: { pseudocode: 6, python: 6, cpp: 5, java: 5 } }],
      `Llamada recursiva derecha: merge_sort(arr, ${medio + 1}, ${fin}).`,
      'iterate_inner',
      nodeId,
      'divide',
      `Recursión Derecha: merge_sort(${medio + 1}, ${fin})`,
      { left: inicio, right: fin, mid: medio }
    );

    recursiveMergeSort(medio + 1, fin, nodeId, depth + 1, false);

    // Línea 7: combinar(arr, inicio, medio, fin)
    treeNodes[nodeId].state = 'combining';
    workers[0].status = 'merging';
    workers[1].status = 'merging';

    pushStep(
      { pseudocode: 7, python: 7, cpp: 6, java: 6 },
      [
        { lineNumber: 7, type: 'active', lineByLanguage: { pseudocode: 7, python: 7, cpp: 6, java: 6 } },
        { lineNumber: 9, type: 'next', badgeText: 'combinar', lineByLanguage: { pseudocode: 9, python: 9, cpp: 8, java: 8 } },
      ],
      `Mitades resueltas. Invocando combinar(arr, inicio=${inicio}, medio=${medio}, fin=${fin}).`,
      'swap',
      nodeId,
      'combine',
      `Fase Combine: Mezclando subarreglos ordenados hacia [${inicio}..${fin}]`,
      { left: inicio, right: fin, mid: medio }
    );

    // Función detallada de combinación sin push
    mergeDetailed(inicio, medio, fin, nodeId);

    treeNodes[nodeId].state = depth === 0 ? 'completed' : 'solved';
    const sortedVals = currentArray.slice(inicio, fin + 1).map(x => x.value);
    treeNodes[nodeId].currentValues = [...sortedVals];

    workers[0].status = 'idle';
    workers[1].status = 'idle';
    completedTasks.push(`Combinado [${inicio}..${fin}]: [${sortedVals.join(', ')}]`);

    callStack.pop();
  }

  function mergeDetailed(inicio: number, medio: number, fin: number, parentNodeId: string) {
    const len = fin - inicio + 1;
    const temp: number[] = new Array(len);

    // Línea 10: temp = crear_arreglo(fin - inicio + 1)
    pushStep(
      { pseudocode: 10, python: 10, cpp: 9, java: 9 },
      [{ lineNumber: 10, type: 'active', lineByLanguage: { pseudocode: 10, python: 10, cpp: 9, java: 9 } }],
      `Creando arreglo auxiliar temp de tamaño ${len} para almacenar elementos ordenados.`,
      'assign',
      parentNodeId,
      'combine',
      `Creando arreglo auxiliar temp[0..${len - 1}]`,
      { left: inicio, right: fin, mid: medio },
      { tempLength: len }
    );

    let i = inicio;
    let j = medio + 1;
    let k = 0;

    // Línea 11: i = inicio, j = medio + 1, k = 0
    pushStep(
      { pseudocode: 11, python: 11, cpp: 10, java: 10 },
      [{ lineNumber: 11, type: 'active', lineByLanguage: { pseudocode: 11, python: 11, cpp: 10, java: 10 } }],
      `Inicializando punteros de combinación: i = ${i} (izq), j = ${j} (der), k = 0 (temp).`,
      'assign',
      parentNodeId,
      'combine',
      `Punteros: i=${i}, j=${j}, k=${k}`,
      { i, j, left: inicio, right: fin, mid: medio },
      { i, j, k }
    );

    // Línea 12: mientras i <= medio y j <= fin
    while (i <= medio && j <= fin) {
      comparisonsCount++;
      const valI = currentArray[i].value;
      const valJ = currentArray[j].value;

      currentArray = currentArray.map((item, idx) => {
        if (idx === i) return { ...item, state: 'comparing', nonColorIndicator: 'i' };
        if (idx === j) return { ...item, state: 'comparing', nonColorIndicator: 'j' };
        if (idx >= inicio && idx < inicio + k) return { ...item, state: 'sorted', nonColorIndicator: undefined };
        return { ...item, state: 'default' };
      });

      if (valI <= valJ) {
        // Línea 13: si arr[i] <= arr[j]
        pushStep(
          { pseudocode: 13, python: 13, cpp: 12, java: 12 },
          [
            { lineNumber: 13, type: 'active', lineByLanguage: { pseudocode: 13, python: 13, cpp: 12, java: 12 } },
            { lineNumber: 14, type: 'next', lineByLanguage: { pseudocode: 14, python: 14, cpp: 12, java: 12 } },
          ],
          `Comparando arr[${i}] (${valI}) <= arr[${j}] (${valJ}): Condición VERDADERA.`,
          'compare',
          parentNodeId,
          'combine',
          `Comparación: arr[${i}] (${valI}) <= arr[${j}] (${valJ})`,
          { i, j, left: inicio, right: fin, mid: medio },
          { i, j, k, 'arr[i]': valI, 'arr[j]': valJ }
        );

        // Línea 14 & 15: temp[k] = arr[i]; i = i + 1
        temp[k] = valI;
        movesCount++;

        pushStep(
          { pseudocode: 14, python: 14, cpp: 12, java: 12 },
          [
            { lineNumber: 14, type: 'executed', badgeText: 'temp[k] ← arr[i]', lineByLanguage: { pseudocode: 14, python: 14, cpp: 12, java: 12 } },
            { lineNumber: 15, type: 'active', lineByLanguage: { pseudocode: 15, python: 15, cpp: 12, java: 12 } },
          ],
          `Asignando temp[${k}] = arr[${i}] (${valI}) e incrementando i de ${i} a ${i + 1}.`,
          'assign',
          parentNodeId,
          'combine',
          `temp[${k}] = ${valI}, i = ${i + 1}`,
          { i, j, left: inicio, right: fin, mid: medio },
          { i: i + 1, j, k, 'temp[k]': valI }
        );

        i++;
      } else {
        // Línea 16 & 17 & 18: sino: temp[k] = arr[j]; j = j + 1
        pushStep(
          { pseudocode: 13, python: 13, cpp: 13, java: 13 },
          [
            { lineNumber: 13, type: 'active', lineByLanguage: { pseudocode: 13, python: 13, cpp: 13, java: 13 } },
            { lineNumber: 17, type: 'next', lineByLanguage: { pseudocode: 17, python: 17, cpp: 13, java: 13 } },
          ],
          `Comparando arr[${i}] (${valI}) > arr[${j}] (${valJ}): Condición FALSA. Seleccionando menor arr[${j}].`,
          'compare',
          parentNodeId,
          'combine',
          `Comparación: arr[${j}] (${valJ}) < arr[${i}] (${valI})`,
          { i, j, left: inicio, right: fin, mid: medio },
          { i, j, k, 'arr[i]': valI, 'arr[j]': valJ }
        );

        temp[k] = valJ;
        movesCount++;

        pushStep(
          { pseudocode: 17, python: 17, cpp: 13, java: 13 },
          [
            { lineNumber: 17, type: 'executed', badgeText: 'temp[k] ← arr[j]', lineByLanguage: { pseudocode: 17, python: 17, cpp: 13, java: 13 } },
            { lineNumber: 18, type: 'active', lineByLanguage: { pseudocode: 18, python: 18, cpp: 13, java: 13 } },
          ],
          `Asignando temp[${k}] = arr[${j}] (${valJ}) e incrementando j de ${j} a ${j + 1}.`,
          'assign',
          parentNodeId,
          'combine',
          `temp[${k}] = ${valJ}, j = ${j + 1}`,
          { i, j, left: inicio, right: fin, mid: medio },
          { i, j: j + 1, k, 'temp[k]': valJ }
        );

        j++;
      }

      k++;

      // Línea 19: k = k + 1
      pushStep(
        { pseudocode: 19, python: 19, cpp: 14, java: 14 },
        [{ lineNumber: 19, type: 'active', lineByLanguage: { pseudocode: 19, python: 19, cpp: 14, java: 14 } }],
        `Incrementando índice del arreglo temporal: k = ${k}.`,
        'assign',
        parentNodeId,
        'combine',
        `Avanzando índice temporal k = ${k}`,
        { i, j, left: inicio, right: fin, mid: medio },
        { i, j, k }
      );
    }

    // Línea 20 & 21: Copiar restantes de la izquierda
    while (i <= medio) {
      const valI = currentArray[i].value;
      temp[k] = valI;
      movesCount++;

      pushStep(
        { pseudocode: 21, python: 21, cpp: 16, java: 16 },
        [{ lineNumber: 21, type: 'active', lineByLanguage: { pseudocode: 21, python: 21, cpp: 16, java: 16 } }],
        `Copiando elemento restante izquierdo: temp[${k}] = arr[${i}] (${valI}).`,
        'assign',
        parentNodeId,
        'combine',
        `Copiando restante izq: temp[${k}] = arr[${i}] (${valI})`,
        { i, left: inicio, right: fin, mid: medio },
        { i: i + 1, j, k: k + 1, 'temp[k]': valI }
      );

      i++;
      k++;
    }

    // Línea 22 & 23: Copiar restantes de la derecha
    while (j <= fin) {
      const valJ = currentArray[j].value;
      temp[k] = valJ;
      movesCount++;

      pushStep(
        { pseudocode: 23, python: 23, cpp: 17, java: 17 },
        [{ lineNumber: 23, type: 'active', lineByLanguage: { pseudocode: 23, python: 23, cpp: 17, java: 17 } }],
        `Copiando elemento restante derecho: temp[${k}] = arr[${j}] (${valJ}).`,
        'assign',
        parentNodeId,
        'combine',
        `Copiando restante der: temp[${k}] = arr[${j}] (${valJ})`,
        { j, left: inicio, right: fin, mid: medio },
        { i, j: j + 1, k: k + 1, 'temp[k]': valJ }
      );

      j++;
      k++;
    }

    // Línea 24 & 25: Copiar temporal de vuelta al arreglo original
    for (let idx = 0; idx < k; idx++) {
      currentArray[inicio + idx] = {
        ...currentArray[inicio + idx],
        value: temp[idx],
        state: 'swapped',
        nonColorIndicator: undefined,
      };
      movesCount++;

      pushStep(
        { pseudocode: 25, python: 25, cpp: 19, java: 19 },
        [
          { lineNumber: 24, type: 'active', lineByLanguage: { pseudocode: 24, python: 24, cpp: 18, java: 18 } },
          { lineNumber: 25, type: 'executed', badgeText: 'copiado', lineByLanguage: { pseudocode: 25, python: 25, cpp: 19, java: 19 } },
        ],
        `Copiando temporal al arreglo original: arr[${inicio + idx}] = temp[${idx}] (${temp[idx]}).`,
        'assign',
        parentNodeId,
        'combine',
        `Volcando temp[${idx}] (${temp[idx]}) a arr[${inicio + idx}]`,
        { i: inicio + idx, left: inicio, right: fin, mid: medio },
        { idx, 'arr[inicio+idx]': temp[idx] }
      );
    }

    for (let idx = 0; idx < k; idx++) {
      currentArray[inicio + idx].state = 'sorted';
    }
  }

  recursiveMergeSort(0, n - 1, undefined, 0, true);

  currentArray = currentArray.map(item => ({
    ...item,
    state: 'sorted',
    nonColorIndicator: undefined,
  }));

  treeNodes[rootId].state = 'completed';

  pushStep(
    { pseudocode: 1, python: 1, cpp: 1, java: 1 },
    [{ lineNumber: 1, type: 'executed', badgeText: 'completado', lineByLanguage: { pseudocode: 1, python: 1, cpp: 1, java: 1 } }],
    `Ordenamiento Merge Sort completado exitosamente. Comparaciones: ${comparisonsCount}, Movimientos: ${movesCount}.`,
    'finish',
    rootId,
    'completed',
    'Problema Resuelto: Arreglo Global Ordenado'
  );

  const total = steps.length;
  steps.forEach(s => {
    s.totalSteps = total;
  });

  return steps;
}

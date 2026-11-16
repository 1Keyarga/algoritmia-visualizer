import type { TaskAttemptCategory } from '../../components/tasks/InteractiveTaskPanel';

export type CompetencyKey = 'C1' | 'C2' | 'C3' | 'C4';

export interface PostestVisualizerScenario {
  algorithmId: string;
  dataset: number[];
  searchTarget?: number;
  compareWithAlgorithmId?: string;
  helperNote: string;
}

export interface EvaluationItem {
  id: string;
  number: number;
  competencyKey: CompetencyKey;
  competencyName: string;
  descriptorCode: string;
  algorithm: string;
  title: string;
  prompt: string;
  codeSnippet?: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  visualizerScenario?: PostestVisualizerScenario;
}

export interface EvaluationAttemptResult {
  completedAt: string;
  durationSeconds: number;
  totalScore: number; // 0..9
  percentage: number; // 0..100
  byCompetency: Record<CompetencyKey, { earned: number; max: number }>;
  itemScores: Record<string, number>; // 0 o 1
  rawAnswers: Record<
    string,
    {
      optionIndex: number | null;
    }
  >;
}

export interface ParticipantSession {
  participantId: string; // Ej. P-8F3A2C
  consentedAt: string;
  startedAt: string;
  pretest?: EvaluationAttemptResult;
  postest?: EvaluationAttemptResult;
  remotePretestCompletedAt?: string;
  remotePostestCompletedAt?: string;
  inProgressAnswers?: {
    testType: 'pretest' | 'postest';
    startedAtMs: number;
    answers: EvaluationAttemptResult['rawAnswers'];
  };
  sheetsSynced?: boolean;
}

export interface RemoteParticipantRecord {
  found: boolean;
  participantId?: string;
  consentedAt?: string;
  pretestCompletedAt?: string;
  postestCompletedAt?: string;
  tasksDetail?: string;
}

export interface TaskProgressState {
  completedTaskIds: string[];
  taskOutcomes: Record<string, TaskAttemptCategory>;
  taskAttemptsById: Record<string, number>;
}

export const EMPTY_TASK_PROGRESS: TaskProgressState = {
  completedTaskIds: [],
  taskOutcomes: {},
  taskAttemptsById: {},
};

export const EVALUATION_STORAGE_KEY = 'visurithm_evaluation_session_v2';
export const EVALUATION_HISTORY_STORAGE_KEY = 'visurithm_evaluation_all_records_v2';
export const TASK_PROGRESS_BY_PARTICIPANT_KEY = 'visurithm_task_progress_by_participant_v1';
export const GUEST_TASK_PROGRESS_KEY = 'visurithm_guest_task_progress_v1';

function normalizeTaskProgressState(raw: Partial<TaskProgressState> | null | undefined): TaskProgressState {
  if (!raw || typeof raw !== 'object') {
    return {
      completedTaskIds: [],
      taskOutcomes: {},
      taskAttemptsById: {},
    };
  }
  return {
    completedTaskIds: Array.isArray(raw.completedTaskIds) ? [...raw.completedTaskIds] : [],
    taskOutcomes: raw.taskOutcomes && typeof raw.taskOutcomes === 'object' ? { ...raw.taskOutcomes } : {},
    taskAttemptsById:
      raw.taskAttemptsById && typeof raw.taskAttemptsById === 'object' ? { ...raw.taskAttemptsById } : {},
  };
}

export function readGuestTaskProgress(): TaskProgressState {
  try {
    const raw = localStorage.getItem(GUEST_TASK_PROGRESS_KEY);
    if (!raw) return normalizeTaskProgressState(null);
    return normalizeTaskProgressState(JSON.parse(raw) as Partial<TaskProgressState>);
  } catch {
    return normalizeTaskProgressState(null);
  }
}

export function persistGuestTaskProgress(progress: TaskProgressState): void {
  try {
    localStorage.setItem(GUEST_TASK_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

export function clearGuestTaskProgress(): void {
  try {
    localStorage.removeItem(GUEST_TASK_PROGRESS_KEY);
  } catch {
    // Ignorar errores de almacenamiento
  }
}

export function readParticipantTaskProgress(participantId: string): TaskProgressState {
  if (!participantId) return normalizeTaskProgressState(null);
  try {
    const raw = localStorage.getItem(TASK_PROGRESS_BY_PARTICIPANT_KEY);
    if (!raw) return normalizeTaskProgressState(null);
    const map = JSON.parse(raw) as Record<string, Partial<TaskProgressState>>;
    return normalizeTaskProgressState(map[participantId]);
  } catch {
    return normalizeTaskProgressState(null);
  }
}

export function persistParticipantTaskProgress(
  participantId: string,
  progress: TaskProgressState
): void {
  if (!participantId) return;
  try {
    const raw = localStorage.getItem(TASK_PROGRESS_BY_PARTICIPANT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, TaskProgressState>) : {};
    map[participantId] = progress;
    localStorage.setItem(TASK_PROGRESS_BY_PARTICIPANT_KEY, JSON.stringify(map));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

export function makeTaskProgressSignature(progress: TaskProgressState): string {
  const solved = progress.completedTaskIds.slice().sort().join(',');
  const outcomes = Object.keys(progress.taskOutcomes)
    .sort()
    .map(k => `${k}=${progress.taskOutcomes[k]}`)
    .join(',');
  return `${solved}::${outcomes}`;
}

export function mergeTaskProgress(
  base: TaskProgressState,
  incoming: TaskProgressState
): TaskProgressState {
  const taskOutcomes: Record<string, TaskAttemptCategory> = { ...base.taskOutcomes };
  for (const [taskId, category] of Object.entries(incoming.taskOutcomes)) {
    if (!taskOutcomes[taskId]) {
      taskOutcomes[taskId] = category;
    }
  }

  const allAttemptIds = new Set([
    ...Object.keys(base.taskAttemptsById),
    ...Object.keys(incoming.taskAttemptsById),
    ...Object.keys(taskOutcomes),
  ]);
  const taskAttemptsById: Record<string, number> = {};
  for (const taskId of allAttemptIds) {
    if (base.taskOutcomes[taskId]) {
      if (base.taskAttemptsById[taskId] !== undefined) {
        taskAttemptsById[taskId] = base.taskAttemptsById[taskId];
      }
    } else {
      const baseAttempts = base.taskAttemptsById[taskId] ?? 0;
      const incomingAttempts = incoming.taskAttemptsById[taskId] ?? 0;
      const maxAttempts = Math.max(baseAttempts, incomingAttempts);
      if (
        maxAttempts > 0 ||
        base.taskAttemptsById[taskId] !== undefined ||
        incoming.taskAttemptsById[taskId] !== undefined
      ) {
        taskAttemptsById[taskId] = maxAttempts;
      }
    }
  }

  const solvedSet = new Set<string>();
  for (const taskId of [...base.completedTaskIds, ...incoming.completedTaskIds]) {
    if (taskOutcomes[taskId] !== 'failed') {
      solvedSet.add(taskId);
    }
  }
  for (const [taskId, category] of Object.entries(taskOutcomes)) {
    if (category !== 'failed') {
      solvedSet.add(taskId);
    }
  }

  return {
    completedTaskIds: Array.from(solvedSet).sort(),
    taskOutcomes,
    taskAttemptsById,
  };
}

export function loadSavedParticipantSession(
  participantId: string
): ParticipantSession | null {
  try {
    const raw = localStorage.getItem(EVALUATION_HISTORY_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, ParticipantSession>;
    return map[participantId] || null;
  } catch {
    return null;
  }
}

export function saveParticipantSessionRecord(session: ParticipantSession): void {
  try {
    const raw = localStorage.getItem(EVALUATION_HISTORY_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, ParticipantSession>) : {};
    map[session.participantId] = session;
    localStorage.setItem(EVALUATION_HISTORY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

export function removeSavedParticipantSession(participantId: string): void {
  try {
    const raw = localStorage.getItem(EVALUATION_HISTORY_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, ParticipantSession>;
    delete map[participantId];
    localStorage.setItem(EVALUATION_HISTORY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

export function parseTasksDetailFromSheets(tasksDetail: string): {
  completedTaskIds: string[];
  taskOutcomes: Record<string, TaskAttemptCategory>;
  taskAttemptsById: Record<string, number>;
} {
  const completedTaskIds: string[] = [];
  const taskOutcomes: Record<string, TaskAttemptCategory> = {};
  const taskAttemptsById: Record<string, number> = {};

  if (!tasksDetail || typeof tasksDetail !== 'string') {
    return { completedTaskIds, taskOutcomes, taskAttemptsById };
  }

  for (const part of tasksDetail.split('|')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [taskId, status] = trimmed.split(':').map(s => s.trim());
    if (!taskId || !status) continue;
    if (status === '1er_intento') {
      taskOutcomes[taskId] = 'first_attempt';
      completedTaskIds.push(taskId);
      taskAttemptsById[taskId] = 0;
    } else if (status === '2do_intento') {
      taskOutcomes[taskId] = 'second_attempt';
      completedTaskIds.push(taskId);
      taskAttemptsById[taskId] = 1;
    } else if (status === '3er_intento') {
      taskOutcomes[taskId] = 'multiple_attempts';
      completedTaskIds.push(taskId);
      taskAttemptsById[taskId] = 2;
    } else if (status === 'no_logrado') {
      taskOutcomes[taskId] = 'failed';
      taskAttemptsById[taskId] = 3;
    }
  }

  return { completedTaskIds, taskOutcomes, taskAttemptsById };
}

// URL fija de Google Apps Script para guardar automáticamente los resultados en la hoja de cálculo
export const DEFAULT_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzOAWjvaAK0XDkMudWR-ewy5398lafxb57M2BAX30LDSKGRQl8BW2vdfsU_qV0hJLZiGw/exec';

// Enlace al formulario externo de motivación IMI (R3.4); configurable aquí o vía VITE_IMI_FORM_URL en Vercel
export const DEFAULT_IMI_FORM_URL = 'https://forms.gle/7ZqCniCRg3ijqBiA6';

// Tiempo máximo por intento individual: 5 minutos (300 s) en Pretest y 8 minutos (480 s) en Postest
export const PRETEST_TIME_LIMIT_SECONDS = 5 * 60;
export const POSTEST_TIME_LIMIT_SECONDS = 8 * 60;

export function getImiFormUrl(overrideUrl?: string): string {
  if (overrideUrl !== undefined) {
    const cleanOverride = overrideUrl.trim();
    return /^https?:\/\//i.test(cleanOverride) ? cleanOverride : '';
  }
  const rawEnv = import.meta.env.VITE_IMI_FORM_URL;
  const cleanEnv = typeof rawEnv === 'string' ? rawEnv.trim() : '';
  if (/^https?:\/\//i.test(cleanEnv)) {
    return cleanEnv;
  }
  return DEFAULT_IMI_FORM_URL;
}

/**
 * Genera un código seudonimizado determinista (ej. P-8F3A2C) a partir del código ingresado
 * sin almacenar el código original del estudiante.
 */
export async function generateParticipantCode(rawInput: string): Promise<string> {
  const normalized = rawInput.trim().toUpperCase();
  if (!normalized) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`visurithm-pucp-salt-2026::${normalized}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray
      .slice(0, 3)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return `P-${hex}`;
  } catch {
    let hash = 2166136261;
    for (let i = 0; i < normalized.length; i++) {
      hash ^= normalized.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const hex = (hash >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
    return `P-${hex}`;
  }
}

export const PRETEST_ITEMS: EvaluationItem[] = [
  {
    id: 'PRE-01',
    number: 1,
    competencyKey: 'C1',
    competencyName: 'Pensar lógicamente',
    descriptorCode: 'D1.1',
    algorithm: 'Selection Sort',
    title: 'Principio de funcionamiento de Selection Sort',
    prompt:
      'Los algoritmos de ordenamiento elemental organizan el arreglo progresivamente mediante distintas estrategias de comparación y movimiento de datos.',
    question:
      '¿Cuál describe correctamente el mecanismo que ejecuta Selection Sort en cada iteración externa (i)?',
    options: [
      'Compara únicamente pares de elementos vecinos e intercambia aquellos que estén desordenados.',
      'Recorre el subarreglo no ordenado para localizar el índice del valor mínimo (min_idx) y realiza un único intercambio al final de la pasada para colocarlo en arr[i].',
      'Divide el arreglo en dos mitades iguales y las ordena de manera independiente mediante recursión.',
      'Toma el elemento arr[i] y desplaza hacia la derecha los valores mayores del subarreglo izquierdo ya ordenado.',
    ],
    correctOptionIndex: 1,
  },
  {
    id: 'PRE-02',
    number: 2,
    competencyKey: 'C1',
    competencyName: 'Pensar lógicamente',
    descriptorCode: 'D1.2',
    algorithm: 'Quick Sort',
    title: 'Propiedad de la partición alrededor del pivote',
    prompt:
      'En Quick Sort, la operación central es la función particionar(arr, bajo, alto), la cual reorganiza el subarreglo tomando un elemento como pivote.',
    question:
      '¿Qué propiedad lógica se garantiza siempre en el arreglo inmediatamente después de finalizar una partición alrededor del pivote?',
    options: [
      'El pivote queda ubicado en su posición final definitiva, con todos los elementos menores o iguales a su izquierda y todos los mayores a su derecha.',
      'Tanto el subarreglo a la izquierda del pivote como el subarreglo a su derecha quedan completamente ordenados de menor a mayor.',
      'El pivote queda siempre situado exactamente en el índice central del arreglo para dividirlo en dos partes iguales.',
      'El elemento menor de todo el arreglo pasa al índice 0 y el mayor pasa al último índice en ese mismo paso.',
    ],
    correctOptionIndex: 0,
  },
  {
    id: 'PRE-03',
    number: 3,
    competencyKey: 'C2',
    competencyName: 'Diseñar algoritmos',
    descriptorCode: 'D2.1',
    algorithm: 'Merge Sort',
    title: 'Secuencia de fases en el diseño de Merge Sort',
    prompt:
      'Merge Sort aplica el paradigma Divide y Vencerás para ordenar un arreglo en tiempo O(n log n).',
    question:
      '¿Cuál es la secuencia correcta de pasos que estructura una llamada recursiva de Merge Sort?',
    options: [
      '1) Elegir un pivote, 2) separar elementos menores y mayores que el pivote, y 3) intercambiar extremos.',
      '1) Buscar el mínimo global del arreglo, 2) colocarlo al inicio, y 3) dividir el resto por la mitad.',
      '1) Calcular el punto medio (mid) para dividir el rango en dos mitades, 2) ordenar recursivamente la mitad izquierda y la derecha, y 3) fusionar (merge) ambas mitades ordenadas.',
      '1) Fusionar primero los elementos adyacentes desordenados y 2) dividir el arreglo resultante en subarreglos de tamaño 1.',
    ],
    correctOptionIndex: 2,
  },
  {
    id: 'PRE-04',
    number: 4,
    competencyKey: 'C2',
    competencyName: 'Diseñar algoritmos',
    descriptorCode: 'D2.2',
    algorithm: 'Búsqueda Binaria',
    title: 'Criterio de decisión para reducir el espacio de búsqueda',
    prompt:
      'Se aplica Búsqueda Binaria sobre un arreglo ordenado de menor a mayor. En la iteración actual se inspecciona el elemento central arr[mid] y se observa que arr[mid] < target (el valor central es menor que el buscado).',
    question:
      '¿Qué acción debe tomar el algoritmo para continuar la búsqueda en la siguiente iteración?',
    options: [
      'Retroceder una sola posición haciendo high = high - 1 para no omitir ningún valor.',
      'Descartar la mitad derecha actualizando high = mid - 1, ya que el valor buscado debe ser menor.',
      'Descartar la mitad izquierda completa (incluyendo mid) actualizando low = mid + 1, pues todos los valores en [low..mid] son menores que target.',
      'Reiniciar low = 0 y cambiar el cálculo de mid para buscar de forma secuencial.',
    ],
    correctOptionIndex: 2,
  },
  {
    id: 'PRE-05',
    number: 5,
    competencyKey: 'C2',
    competencyName: 'Diseñar algoritmos',
    descriptorCode: 'D2.3',
    algorithm: 'Recursión (Merge Sort / Quick Sort)',
    title: 'Función del caso base en algoritmos recursivos',
    prompt:
      'En la implementación recursiva de Merge Sort y Quick Sort, la primera instrucción de la función verifica la condición if (left >= right) return;.',
    question:
      '¿Por qué es indispensable incluir esta condición de caso base en el diseño del algoritmo?',
    options: [
      'Para ordenar de forma inversa los subarreglos cuando el índice izquierdo es mayor que el derecho.',
      'Porque un subarreglo de 0 o 1 elemento ya está ordenado por definición y detiene las llamadas recursivas, evitando una recursión infinita (Stack Overflow).',
      'Para liberar los elementos duplicados que puedan existir dentro del arreglo.',
      'Porque permite que el algoritmo omita la mitad derecha del árbol de llamadas y reduzca su memoria a la mitad.',
    ],
    correctOptionIndex: 1,
  },
  {
    id: 'PRE-06',
    number: 6,
    competencyKey: 'C3',
    competencyName: 'Pensar iterativamente',
    descriptorCode: 'D3.1',
    algorithm: 'Bubble Sort',
    title: 'Efecto garantizado al finalizar cada pasada de Bubble Sort',
    prompt:
      'En Bubble Sort, el ciclo interno recorre el arreglo comparando pares adyacentes arr[j] y arr[j + 1] e intercambiándolos cuando arr[j] > arr[j + 1].',
    question:
      'Al concluir la primera pasada completa (i = 0) sobre un arreglo desordenado de n elementos, ¿qué resultado queda garantizado?',
    options: [
      'El elemento menor de todo el arreglo queda ubicado en la primera posición arr[0].',
      'La primera mitad del arreglo queda completamente ordenada de forma definitiva.',
      'Todos los elementos pares quedan agrupados a la izquierda y los impares a la derecha.',
      'El elemento de mayor valor de todo el arreglo ha "burbujeado" hasta quedar fijo en la última posición arr[n - 1].',
    ],
    correctOptionIndex: 3,
  },
  {
    id: 'PRE-07',
    number: 7,
    competencyKey: 'C3',
    competencyName: 'Pensar iterativamente',
    descriptorCode: 'D3.2',
    algorithm: 'Bubble Sort',
    title: 'Propósito de la bandera booleana swapped en el control de ciclos',
    prompt:
      'En la versión optimizada de Bubble Sort se incorpora una variable booleana swapped que se inicializa en false al comenzar cada pasada externa y cambia a true si ocurre algún intercambio.',
    question:
      '¿Cuál es el objetivo de verificar if (!swapped) break; al final de cada pasada del ciclo externo?',
    options: [
      'Detectar que en toda la pasada no hubo ningún par desordenado, confirmando que el arreglo ya está ordenado para detener el algoritmo en tiempo O(n) en el mejor caso.',
      'Invertir el sentido de recorrido del bucle interno de derecha a izquierda en la siguiente iteración.',
      'Evitar comparar elementos con valores repetidos dentro del mismo arreglo.',
      'Reemplazar el ciclo interno por una llamada recursiva cuando el arreglo supera los 10 elementos.',
    ],
    correctOptionIndex: 0,
  },
  {
    id: 'PRE-08',
    number: 8,
    competencyKey: 'C4',
    competencyName: 'Abstracción',
    descriptorCode: 'D4.1',
    algorithm: 'Merge Sort',
    title: 'Interpretación de las hojas en el árbol de recursión de Merge Sort',
    prompt:
      'La ejecución de Merge Sort puede representarse como un árbol binario de llamadas recursivas que primero desciende dividiendo el arreglo y luego asciende combinando resultados.',
    question:
      'Dentro de esta representación estructural, ¿qué representan las hojas (el nivel más profundo del árbol) antes de iniciar las fusiones?',
    options: [
      'Los elementos que ya estaban ordenados desde el inicio y no necesitaron dividirse.',
      'Los subarreglos unitarios (de 1 solo elemento) obtenidos tras las divisiones sucesivas, los cuales constituyen los casos base listos para ser fusionados en orden.',
      'Los valores descartados por ser mayores que el elemento central mid.',
      'Las variables auxiliares de memoria que se eliminan al terminar la ejecución.',
    ],
    correctOptionIndex: 1,
  },
  {
    id: 'PRE-09',
    number: 9,
    competencyKey: 'C4',
    competencyName: 'Abstracción',
    descriptorCode: 'D4.2',
    algorithm: 'Bubble Sort vs. Selection Sort',
    title: 'Contraste de operaciones de intercambio entre algoritmos cuadráticos',
    prompt:
      'Tanto Bubble Sort como Selection Sort tienen una complejidad temporal O(n²) en el caso promedio, pero difieren en la cantidad de escrituras (swaps) que realizan en memoria.',
    question:
      '¿Cuál es la diferencia fundamental entre ambos respecto a los intercambios de elementos?',
    options: [
      'Bubble Sort realiza un solo intercambio por pasada, mientras que Selection Sort intercambia elementos en cada comparación.',
      'Ambos algoritmos realizan exactamente la misma cantidad de intercambios sobre cualquier arreglo de entrada.',
      'Selection Sort no realiza ningún intercambio porque copia los elementos en un segundo arreglo auxiliar.',
      'Selection Sort ejecuta a lo sumo un intercambio por cada pasada externa (tras identificar min_idx), mientras que Bubble Sort puede ejecutar múltiples intercambios adyacentes en una misma pasada.',
    ],
    correctOptionIndex: 3,
  },
];

export const POSTEST_ITEMS: EvaluationItem[] = [
  {
    id: 'POS-01',
    number: 1,
    competencyKey: 'C1',
    competencyName: 'Pensar lógicamente',
    descriptorCode: 'D1.1',
    algorithm: 'Insertion Sort',
    title: 'Principio de funcionamiento de Insertion Sort',
    prompt:
      'En el visualizador de la derecha se ha cargado Insertion Sort con el arreglo {34, 8, 64, 51, 32, 21}. Usa los controles de reproducción para observar cómo crece el subarreglo prefijo ordenado arr[0..i - 1] en cada iteración.',
    question:
      'Según lo que observas en la simulación, ¿qué operación realiza exactamente Insertion Sort en cada iteración externa para incorporar el elemento clave = arr[i]?',
    options: [
      'Busca el elemento mínimo en el resto del arreglo [i..n - 1] y lo intercambia directamente con arr[i].',
      'Compara únicamente el primer y el último elemento del arreglo y los intercambia si están invertidos.',
      'Desplaza una posición hacia la derecha todos los elementos del prefijo ordenado arr[0..i - 1] que sean mayores que clave, e inserta clave en el hueco resultante.',
      'Divide el prefijo ordenado por la mitad y fusiona ambas partes en un arreglo temporal.',
    ],
    correctOptionIndex: 2,
    visualizerScenario: {
      algorithmId: 'insertion-sort',
      dataset: [34, 8, 64, 51, 32, 21],
      helperNote:
        'Avanza paso a paso y observa cómo cada nuevo elemento (clave) se compara hacia atrás contra la zona izquierda ya ordenada, desplazando los valores mayores.',
    },
  },
  {
    id: 'POS-02',
    number: 2,
    competencyKey: 'C1',
    competencyName: 'Pensar lógicamente',
    descriptorCode: 'D1.2',
    algorithm: 'Quick Sort',
    title: 'Función de los punteros durante la partición en Quick Sort',
    prompt:
      'En el visualizador de la derecha se ha cargado Quick Sort sobre el arreglo {22, 6, 19, 8, 12}, tomando inicialmente el último elemento (12) como pivote. Avanza los pasos de la primera partición.',
    question:
      '¿Con qué propósito el algoritmo intercambia arr[i + 1] con el pivote arr[alto] al finalizar el recorrido del puntero explorador j?',
    options: [
      'Para reiniciar el pivote al índice 0 antes de comenzar la siguiente pasada.',
      'Para ordenar automáticamente de menor a mayor todos los elementos mayores al pivote.',
      'Para eliminar el pivote del arreglo y reducir el tamaño de memoria en una unidad.',
      'Para colocar al pivote (12) exactamente entre la región de elementos menores o iguales ({6, 8}) y la de elementos mayores ({22, 19}), fijando su posición definitiva.',
    ],
    correctOptionIndex: 3,
    visualizerScenario: {
      algorithmId: 'quick-sort',
      dataset: [22, 6, 19, 8, 12],
      helperNote:
        'Observa cómo durante la primera partición los elementos 6 y 8 se agrupan a la izquierda y, al cerrar el bucle, el pivote 12 se intercambia hacia el índice 2.',
    },
  },
  {
    id: 'POS-03',
    number: 3,
    competencyKey: 'C2',
    competencyName: 'Diseñar algoritmos',
    descriptorCode: 'D2.1',
    algorithm: 'Merge Sort',
    title: 'Mecanismo de combinación ordenada en la función merge',
    prompt:
      'En el visualizador de la derecha se muestra el árbol de recursión de Merge Sort sobre {38, 15, 42, 9, 27, 6}. Avanza hasta cualquiera de los pasos de fusión (merge) entre dos subarreglos ordenados.',
    question:
      '¿Cómo procede la fase merge para combinar dos subarreglos ordenados (left y right) dentro del arreglo destino manteniendo el orden ascendente?',
    options: [
      'Concatena primero todo el subarreglo left seguido de todo right y luego les aplica Bubble Sort.',
      'Compara los elementos al frente de left y right (left[i] y right[j]), copia el menor al arreglo destino avanzando su índice, y al agotarse una mitad copia el resto de la otra.',
      'Intercambia el último elemento de left con el primero de right y da por terminada la fusión.',
      'Compara únicamente los elementos impares de left contra los elementos pares de right.',
    ],
    correctOptionIndex: 1,
    visualizerScenario: {
      algorithmId: 'merge-sort',
      dataset: [38, 15, 42, 9, 27, 6],
      helperNote:
        'Avanza en el árbol de recursión hasta que dos nodos hijos se fusionen en su nodo padre y observa cómo se comparan sus elementos de menor a mayor.',
    },
  },
  {
    id: 'POS-04',
    number: 4,
    competencyKey: 'C2',
    competencyName: 'Diseñar algoritmos',
    descriptorCode: 'D2.2',
    algorithm: 'Búsqueda Binaria',
    title: 'Criterio de decisión cuando el valor central supera al objetivo',
    prompt:
      'En el visualizador de la derecha se ejecuta Búsqueda Binaria sobre {4, 11, 18, 25, 32, 39, 46, 53, 60} buscando el valor objetivo 18. Avanza al primer paso donde se evalúa el centro mid = 4 (arr[4] = 32 > 18).',
    question:
      'Al comprobar que arr[mid] (32) es mayor que el objetivo (18), ¿cómo actualiza el algoritmo el rango de búsqueda para el siguiente paso y por qué?',
    options: [
      'Actualiza high = mid - 1 (pasando de 8 a 3), descartando toda la mitad derecha (incluido mid) porque todo elemento desde el índice 4 hasta el 8 es mayor que 18.',
      'Actualiza low = mid + 1, porque los elementos menores siempre se ubican hacia la derecha del arreglo.',
      'Incrementa low = low + 1 para revisar los elementos uno por uno desde la izquierda.',
      'Mantiene el mismo rango [low..high] y suma 1 al valor de mid.',
    ],
    correctOptionIndex: 0,
    visualizerScenario: {
      algorithmId: 'binary-search',
      dataset: [4, 11, 18, 25, 32, 39, 46, 53, 60],
      searchTarget: 18,
      helperNote:
        'Avanza un paso para ver la comparación en mid = 4 (valor 32) y observa qué índices quedan descartados cuando 32 > 18.',
    },
  },
  {
    id: 'POS-05',
    number: 5,
    competencyKey: 'C2',
    competencyName: 'Diseñar algoritmos',
    descriptorCode: 'D2.3',
    algorithm: 'Búsqueda Binaria',
    title: 'Condición de término cuando el elemento no existe en el arreglo',
    prompt:
      'En el visualizador de la derecha se ejecuta Búsqueda Binaria sobre {10, 20, 30, 40, 50, 60, 70} buscando el objetivo 35 (que no pertenece al arreglo). Reproduce la simulación hasta el último paso.',
    question:
      'Según lo que ocurre al final de la simulación, ¿qué condición de los punteros detiene el ciclo while (low <= high) confirmando que el 35 no existe?',
    options: [
      'El puntero mid llega al índice 0 del arreglo.',
      'Los punteros low y high toman el mismo valor (low == high) y el algoritmo se detiene sin revisar esa posición.',
      'Tras el último descarte, el puntero low supera a high (low > high), dejando vacío el intervalo de búsqueda sin haber encontrado coincidencias.',
      'El puntero high se multiplica por dos superando el tamaño del arreglo.',
    ],
    correctOptionIndex: 2,
    visualizerScenario: {
      algorithmId: 'binary-search',
      dataset: [10, 20, 30, 40, 50, 60, 70],
      searchTarget: 35,
      helperNote:
        'Avanza hasta el último paso de la búsqueda del valor 35 y observa los valores finales de low y high en el panel de memoria.',
    },
  },
  {
    id: 'POS-06',
    number: 6,
    competencyKey: 'C3',
    competencyName: 'Pensar iterativamente',
    descriptorCode: 'D3.1',
    algorithm: 'Bubble Sort',
    title: 'Reducción progresiva del límite del ciclo interno en Bubble Sort',
    prompt:
      'En el visualizador de la derecha se ejecuta Bubble Sort sobre {45, 12, 38, 9, 27}. Observa qué ocurre con los elementos del extremo derecho a medida que se completa cada pasada i.',
    question:
      '¿Por qué el límite superior del ciclo interno disminuye en una unidad en cada nueva pasada (recorriendo j hasta n - 1 - i)?',
    options: [
      'Porque los primeros i elementos al inicio del arreglo ya quedaron ordenados y no pueden leerse.',
      'Porque al concluir cada pasada i, los últimos i elementos al final del arreglo ya alcanzaron su posición definitiva ordenada y no necesitan volver a compararse.',
      'Porque el tamaño físico del arreglo en memoria se reduce a la mitad en cada iteración.',
      'Para evitar que el puntero j compare números impares en las pasadas siguientes.',
    ],
    correctOptionIndex: 1,
    visualizerScenario: {
      algorithmId: 'bubble-sort-classic',
      dataset: [45, 12, 38, 9, 27],
      helperNote:
        'Observa cómo al terminar la primera pasada el 45 queda fijo al final, luego el 38 en la segunda pasada, acortando la zona pendiente de comparar.',
    },
  },
  {
    id: 'POS-07',
    number: 7,
    competencyKey: 'C3',
    competencyName: 'Pensar iterativamente',
    descriptorCode: 'D3.2',
    algorithm: 'Búsqueda Lineal vs. Búsqueda Binaria',
    title: 'Precondición estructural para aplicar Búsqueda Binaria',
    prompt:
      'En el visualizador de la derecha se busca el valor 23 dentro del arreglo desordenado {42, 15, 8, 91, 23, 67} mediante Búsqueda Lineal.',
    question:
      '¿Por qué sobre este arreglo {42, 15, 8, 91, 23, 67} es obligatorio emplear Búsqueda Lineal y no sería válido aplicar directamente Búsqueda Binaria?',
    options: [
      'Porque el arreglo tiene una cantidad par de elementos.',
      'Porque el valor buscado (23) es un número primo.',
      'Porque el arreglo contiene valores mayores que 50.',
      'Porque el arreglo no está ordenado: sin un orden previo ascendente o descendente, comparar contra el elemento central arr[mid] no permite saber en qué mitad está el 23.',
    ],
    correctOptionIndex: 3,
    visualizerScenario: {
      algorithmId: 'linear-search',
      dataset: [42, 15, 8, 91, 23, 67],
      searchTarget: 23,
      helperNote:
        'Observa cómo al no existir orden en {42, 15, 8, 91, 23, 67}, el algoritmo debe inspeccionar secuencialmente índice por índice hasta hallar el 23.',
    },
  },
  {
    id: 'POS-08',
    number: 8,
    competencyKey: 'C4',
    competencyName: 'Abstracción',
    descriptorCode: 'D4.1',
    algorithm: 'Merge Sort vs. Quick Sort',
    title: 'Uso de estructuras auxiliares en memoria vs. ordenamiento in-place',
    prompt:
      'En el visualizador de la derecha se comparan en paralelo Merge Sort y Quick Sort sobre el mismo arreglo {29, 14, 37, 10, 25, 8}. Avanza la simulación para contrastar ambas estructuras.',
    question:
      '¿Cuál es la diferencia estructural principal entre ambos respecto al uso de memoria al ordenar los elementos?',
    options: [
      'Merge Sort requiere subarreglos auxiliares adicionales O(n) para combinar las mitades en la fase merge, mientras que Quick Sort particiona y reordena los elementos directamente sobre el mismo arreglo (in-place).',
      'Quick Sort necesita crear una copia completa del arreglo en cada comparación, mientras que Merge Sort no utiliza memoria adicional.',
      'Ambos algoritmos duplican el arreglo completo en memoria antes de realizar la primera comparación.',
      'Merge Sort solo utiliza subarreglos auxiliares cuando la cantidad de elementos es impar.',
    ],
    correctOptionIndex: 0,
    visualizerScenario: {
      algorithmId: 'merge-sort',
      compareWithAlgorithmId: 'quick-sort',
      dataset: [29, 14, 37, 10, 25, 8],
      helperNote:
        'Compara en paralelo cómo Merge Sort construye y fusiona subarreglos en su árbol, mientras Quick Sort reorganiza las barras in-place alrededor de cada pivote.',
    },
  },
  {
    id: 'POS-09',
    number: 9,
    competencyKey: 'C4',
    competencyName: 'Abstracción',
    descriptorCode: 'D4.2',
    algorithm: 'Búsqueda Binaria vs. Búsqueda Lineal',
    title: 'Contraste de pasos entre búsqueda logarítmica y búsqueda secuencial',
    prompt:
      'En el visualizador de la derecha se comparan en simultáneo Búsqueda Binaria y Búsqueda Lineal buscando el valor 54 sobre el arreglo ordenado {5, 12, 19, 26, 33, 40, 47, 54, 61}. Reproduce la comparación.',
    question:
      '¿A qué propiedad estructural vista en la simulación se debe que Búsqueda Binaria encuentre el 54 en muchos menos pasos (O(log n)) que Búsqueda Lineal (O(n))?',
    options: [
      'A que Búsqueda Binaria compara dos elementos simultáneamente desde el índice 0.',
      'A que en cada comparación con arr[mid], Búsqueda Binaria descarta de golpe la mitad de los elementos restantes, mientras que Búsqueda Lineal solo descarta un elemento por paso.',
      'A que Búsqueda Binaria modifica los valores del arreglo a medida que avanza.',
      'A que Búsqueda Lineal empieza siempre desde el índice central hacia la izquierda.',
    ],
    correctOptionIndex: 1,
    visualizerScenario: {
      algorithmId: 'binary-search',
      compareWithAlgorithmId: 'linear-search',
      dataset: [5, 12, 19, 26, 33, 40, 47, 54, 61],
      searchTarget: 54,
      helperNote:
        'Dale Play a la comparación en paralelo: observa cómo Búsqueda Binaria salta al centro y descarta la mitad izquierda en el primer paso, mientras Búsqueda Lineal recorre casilla por casilla.',
    },
  },
];

export function gradeEvaluationAttempt(
  items: EvaluationItem[],
  rawAnswers: EvaluationAttemptResult['rawAnswers'],
  durationSeconds: number
): EvaluationAttemptResult {
  const byCompetency: Record<CompetencyKey, { earned: number; max: number }> = {
    C1: { earned: 0, max: 2 },
    C2: { earned: 0, max: 3 },
    C3: { earned: 0, max: 2 },
    C4: { earned: 0, max: 2 },
  };
  const itemScores: Record<string, number> = {};
  let totalScore = 0;

  items.forEach(item => {
    const ans = rawAnswers[item.id];
    const isCorrect = !!ans && ans.optionIndex === item.correctOptionIndex;
    const score = isCorrect ? 1 : 0;

    itemScores[item.id] = score;
    byCompetency[item.competencyKey].earned += score;
    totalScore += score;
  });

  const percentage = Math.round((totalScore / items.length) * 100);

  return {
    completedAt: new Date().toISOString(),
    durationSeconds,
    totalScore,
    percentage,
    byCompetency,
    itemScores,
    rawAnswers,
  };
}

export function summarizeTaskOutcomes(outcomes: Record<string, TaskAttemptCategory>) {
  const vals = Object.values(outcomes);
  return {
    firstAttempt: vals.filter(v => v === 'first_attempt').length,
    secondAttempt: vals.filter(v => v === 'second_attempt').length,
    multipleAttempts: vals.filter(v => v === 'multiple_attempts').length,
    failed: vals.filter(v => v === 'failed').length,
    totalAttempted: vals.length,
  };
}

export function buildEvaluationPayload(
  session: ParticipantSession,
  taskOutcomes: Record<string, TaskAttemptCategory> = {},
  completedTasksCount = 0
) {
  const pre = session.pretest;
  const pos = session.postest;
  const taskSummary = summarizeTaskOutcomes(taskOutcomes);
  const solvedCount = Math.max(
    completedTasksCount,
    taskSummary.firstAttempt + taskSummary.secondAttempt + taskSummary.multipleAttempts
  );
  const outcomeLabel: Record<TaskAttemptCategory, string> = {
    first_attempt: '1er_intento',
    second_attempt: '2do_intento',
    multiple_attempts: '3er_intento',
    failed: 'no_logrado',
  };
  const formatCompetencies = (res?: EvaluationAttemptResult) => {
    if (!res) return '';
    const { C1, C2, C3, C4 } = res.byCompetency;
    return `Logica:${C1.earned}/${C1.max} | Diseno:${C2.earned}/${C2.max} | Iteracion:${C3.earned}/${C3.max} | Abstraccion:${C4.earned}/${C4.max}`;
  };
  const formatItems = (res?: EvaluationAttemptResult) => {
    if (!res) return '';
    return Object.keys(res.itemScores)
      .sort()
      .map(id => `${id}:${res.itemScores[id]}`)
      .join(' | ');
  };
  const tasksDetail = Object.keys(taskOutcomes)
    .sort()
    .map(taskId => `${taskId}:${outcomeLabel[taskOutcomes[taskId]]}`)
    .join(' | ');

  return {
    participantId: session.participantId,
    consentedAt: session.consentedAt,
    pretestCompletedAt: pre?.completedAt || session.remotePretestCompletedAt || '',
    pretestDurationSec: pre?.durationSeconds ?? '',
    pretestTotalScore: pre?.totalScore ?? '',
    pretestPercentage: pre?.percentage ?? '',
    pretestC1: pre?.byCompetency.C1.earned ?? '',
    pretestC2: pre?.byCompetency.C2.earned ?? '',
    pretestC3: pre?.byCompetency.C3.earned ?? '',
    pretestC4: pre?.byCompetency.C4.earned ?? '',
    postestCompletedAt: pos?.completedAt || session.remotePostestCompletedAt || '',
    postestDurationSec: pos?.durationSeconds ?? '',
    postestTotalScore: pos?.totalScore ?? '',
    postestPercentage: pos?.percentage ?? '',
    postestC1: pos?.byCompetency.C1.earned ?? '',
    postestC2: pos?.byCompetency.C2.earned ?? '',
    postestC3: pos?.byCompetency.C3.earned ?? '',
    postestC4: pos?.byCompetency.C4.earned ?? '',
    gainScore:
      pre && pos ? Number((pos.totalScore - pre.totalScore).toFixed(2)) : '',
    gainPercentagePoints:
      pre && pos ? pos.percentage - pre.percentage : '',
    pretestCompetenciesDetail: formatCompetencies(pre),
    postestCompetenciesDetail: formatCompetencies(pos),
    pretestItemScores: formatItems(pre),
    postestItemScores: formatItems(pos),
    tasksCompletedCount: solvedCount,
    tasksFirstAttempt: taskSummary.firstAttempt,
    tasksSecondAttempt: taskSummary.secondAttempt,
    tasksMultipleAttempts: taskSummary.multipleAttempts,
    tasksFailed: taskSummary.failed,
    tasksAttemptedTotal: taskSummary.totalAttempted,
    tasksDetail,
  };
}

export function downloadEvaluationCsv(
  session: ParticipantSession,
  taskOutcomes: Record<string, TaskAttemptCategory>,
  completedTasksCount: number
) {
  const payload = buildEvaluationPayload(session, taskOutcomes, completedTasksCount);
  const headers = Object.keys(payload);
  const values = headers.map(k => {
    const val = (payload as Record<string, unknown>)[k];
    return `"${String(val ?? '').replace(/"/g, '""')}"`;
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + values.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visurithm_${session.participantId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fetchParticipantFromSheets(
  webhookUrl: string,
  participantId: string
): Promise<RemoteParticipantRecord | null> {
  const cleanUrl = webhookUrl.trim();
  if (!cleanUrl || !participantId) return null;
  const separator = cleanUrl.includes('?') ? '&' : '?';
  const queryUrl = `${cleanUrl}${separator}participantId=${encodeURIComponent(participantId)}&t=${Date.now()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(queryUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    const text = await res.text();
    const parsed = JSON.parse(text) as RemoteParticipantRecord;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.found !== 'boolean') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendEvaluationToGoogleSheets(
  webhookUrl: string,
  session: ParticipantSession,
  taskOutcomes: Record<string, TaskAttemptCategory>,
  completedTasksCount: number
): Promise<boolean> {
  const cleanUrl = webhookUrl.trim();
  if (!cleanUrl) return false;
  const payload = buildEvaluationPayload(session, taskOutcomes, completedTasksCount);
  try {
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

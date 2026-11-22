export type TaskAttemptOutcome =
  | 'first_attempt'
  | 'second_attempt'
  | 'multiple_attempts'
  | 'failed';

export function getTaskStarCount(
  taskId: string,
  completedTaskIds: string[],
  taskOutcomes: Record<string, TaskAttemptOutcome>
): 0 | 1 | 2 | 3 {
  const outcome = taskOutcomes[taskId];
  if (outcome === 'first_attempt') return 3;
  if (outcome === 'second_attempt') return 2;
  if (outcome === 'multiple_attempts') return 1;
  if (outcome === 'failed') return 0;
  if (completedTaskIds.includes(taskId)) return 1;
  return 0;
}

export function formatStarBadge(stars: number): string {
  const clamped = Math.max(0, Math.min(3, Math.floor(stars)));
  return '★'.repeat(clamped) + '☆'.repeat(3 - clamped);
}

export interface NumericFieldSpec {
  label: string;
  expectedValue: number;
  placeholder?: string;
}

export interface ArrayPredictionSpec {
  initialArray: number[];
  expectedArray: number[];
  extraFieldLabel: string;
  expectedExtraValue: number;
}

export interface ConceptualQuestionSpec {
  question: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
}

export interface GuidedTask {
  id: string;
  family: 'Ordenamiento' | 'Búsqueda' | 'Divide y vencerás';
  algorithm: string;
  targetAlgorithmId: string;
  presetDataset: number[];
  presetSearchTarget?: number;
  bloom: 'Comprender' | 'Aplicar' | 'Analizar' | 'Evaluar' | 'Crear';
  competence:
    | 'Pensar lógicamente'
    | 'Diseñar algoritmos'
    | 'Abstracción'
    | 'Pensar iterativamente';
  indicator: string;
  descriptor: string;
  abstraction: 'Básico' | 'Intermedio' | 'Avanzado';
  interactionType:
    | 'Predicción'
    | 'Completar código'
    | 'Comparación'
    | 'Construcción manual'
    | 'Justificación'
    | 'Análisis de árbol de recursión';
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  title: string;
  prompt: string;
  codeSnippet: string;
  expectedCriteria: string;

  // Punto de control de reproducción (bloquea el avance hasta resolver o agotar intentos)
  breakpointStepIndex: number;

  // Andamiaje progresivo de 2 pistas (se desbloquean tras intento 1 e intento 2 fallidos)
  hints: [string, string];

  // Diagnóstico conceptual estructurado sobre invariantes, estabilidad o complejidad
  conceptualQuestion: ConceptualQuestionSpec;

  // 1. Completar código con ejecución AST en C
  expectedBlanks?: string[][];
  cExecutableTemplate?: string;
  requiresJustification?: boolean;

  // 2. Construcción manual de arreglo + verificación de invariante/pivote
  manualInitialArray?: number[];
  manualTargetArray?: number[];
  manualExtraField?: NumericFieldSpec;

  // 3. Predicción exacta de estado de arreglo + valor de invariante
  arrayPredictionCheck?: ArrayPredictionSpec;

  // 4. Campos cuantitativos exactos (traza paso a paso, comparaciones, intercambios, cotas, alturas)
  numericFieldsCheck?: NumericFieldSpec[];
}

export const GUIDED_TASKS_REPOSITORY: GuidedTask[] = [
  {
    id: 'T01',
    family: 'Ordenamiento',
    algorithm: 'Bubble Sort',
    targetAlgorithmId: 'bubble-sort-classic',
    presetDataset: [5, 2, 8, 1, 9, 3],
    bloom: 'Comprender',
    competence: 'Pensar lógicamente',
    indicator: 'Encuentra la relación entre objetos reales o abstractos',
    descriptor: 'Identifica la relación entre los elementos del problema y las instrucciones que se derivan de ella',
    abstraction: 'Básico',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el estado del arreglo tras la primera pasada completa de Bubble Sort',
    prompt:
      'Sobre el arreglo int arr[] = {5, 2, 8, 1, 9, 3}, el visualizador se detiene al inicio de la pasada i = 0. Simula mentalmente todas las comparaciones adyacentes desde j = 0 hasta n - 2 e ingresa (a) el estado exacto del arreglo al concluir la primera pasada y (b) el valor que queda garantizado en su posición definitiva.',
    codeSnippet:
      '// Estado inicial\nint arr[] = {5, 2, 8, 1, 9, 3};\nint n = 6;\n// Punto de control: inicio de la pasada i = 0\n// (comparaciones adyacentes j = 0 .. n-2)',
    expectedCriteria:
      '(a) [2, 5, 1, 8, 3, 9]. (b) El 9 (máximo del arreglo) queda garantizado en la última posición: en cada pasada completa, el mayor elemento del subarreglo activo se traslada hacia el extremo derecho mediante intercambios adyacentes sucesivos.',
    breakpointStepIndex: 2,
    hints: [
      'Recuerda que tras intercambiar arr[j] y arr[j+1], el valor mayor avanza a la posición j+1 y participa inmediatamente en la siguiente comparación contra arr[j+2].',
      'Sigue los pares en orden: (5,2)->[2,5,8,1,9,3]; luego (5,8) no cambia; luego (8,1)->[2,5,1,8,9,3]; luego (8,9) no cambia; finalmente (9,3)->[2,5,1,8,3,9].',
    ],
    conceptualQuestion: {
      question: '¿Qué propiedad garantiza el invariante de ciclo externo de Bubble Sort al concluir la pasada i?',
      options: [
        'Los primeros i + 1 elementos a la izquierda ya contienen los menores valores del arreglo en orden final.',
        'Los últimos i + 1 elementos a la derecha contienen los mayores valores del arreglo en sus posiciones definitivas.',
        'Todos los elementos pares quedan ordenados respecto a los elementos impares.',
      ],
      correctIndex: 1,
    },
    arrayPredictionCheck: {
      initialArray: [5, 2, 8, 1, 9, 3],
      expectedArray: [2, 5, 1, 8, 3, 9],
      extraFieldLabel: '(b) Valor garantizado en su posición definitiva tras la pasada i = 0:',
      expectedExtraValue: 9,
    },
    requiresJustification: true,
  },
  {
    id: 'T02',
    family: 'Ordenamiento',
    algorithm: 'Bubble Sort',
    targetAlgorithmId: 'bubble-sort',
    presetDataset: [1, 2, 4, 3, 5, 6],
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona la instrucción secuencial inmediata requerida en un paso específico del procedimiento',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar Bubble Sort con optimización de parada temprana',
    prompt:
      "Completa las dos condiciones faltantes de esta versión optimizada de Bubble Sort en C/C++ que detiene el algoritmo anticipadamente si el arreglo ya quedó ordenado. Al verificar, el motor AST compilará tu código y ejecutará la traza en vivo sobre el visualizador.",
    codeSnippet: `void bubbleSort(int arr[], int n) {
  for (int i = 0; i < n - 1; i++) {
    bool swapped = false;
    for (int j = 0; j < n - 1 - i; j++) {
      if (____) {
        int temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }
    if (____) break;
  }
}`,
    expectedBlanks: [
      ['arr[j]>arr[j+1]', 'arr[j+1]<arr[j]'],
      ['!swapped', 'swapped==false', 'false==swapped', 'swapped==0'],
    ],
    cExecutableTemplate: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            if (__BLANK_1__) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = 1;
            }
        }
        if (__BLANK_2__) break;
    }
}

int main() {
    int arr[] = {1, 2, 4, 3, 5, 6};
    int n = 6;
    bubbleSort(arr, n);
    return 0;
}`,
    expectedCriteria:
      'Primer blanco: arr[j] > arr[j+1]. Segundo blanco: !swapped. Si en una pasada completa no ocurre ningún intercambio, ningún par adyacente está invertido (arr[j] <= arr[j+1] para todo j), reduciendo el mejor caso a O(n).',
    breakpointStepIndex: 1,
    hints: [
      'En orden ascendente, un intercambio adyacente solo debe ocurrir cuando el elemento izquierdo supera estrictamente a su vecino derecho.',
      'La bandera booleana swapped inicia en false en cada pasada y cambia a true si hubo al menos un intercambio; el ciclo externo debe interrumpirse cuando swapped permanece en false (!swapped).',
    ],
    conceptualQuestion: {
      question: '¿Cómo impacta la bandera de parada temprana (!swapped) en la complejidad temporal de Bubble Sort?',
      options: [
        'Reduce el peor caso de O(n²) a O(n log n) al dividir el arreglo en cada pasada.',
        'Reduce el mejor caso (arreglo ya ordenado) a O(n) con n - 1 comparaciones y 0 intercambios, manteniendo O(n²) en el peor caso.',
        'Elimina la necesidad de usar la variable auxiliar temp durante el intercambio.',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'T03',
    family: 'Ordenamiento',
    algorithm: 'Insertion Sort',
    targetAlgorithmId: 'insertion-sort',
    presetDataset: [2, 4, 6, 9, 5],
    bloom: 'Comprender',
    competence: 'Pensar lógicamente',
    indicator: 'Encuentra la relación entre objetos reales o abstractos',
    descriptor: 'Identifica la relación entre los elementos del problema y las instrucciones que se derivan de ella',
    abstraction: 'Básico',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el proceso completo de inserción en Insertion Sort',
    prompt:
      'El subarreglo izquierdo [2, 4, 6, 9] ya se encuentra ordenado y el visualizador se detiene justo al extraer clave = 5 (índice i = 4). Ingresa (a) el estado final del arreglo tras insertar 5 y (b) la cantidad exacta de desplazamientos hacia la derecha (arr[j+1] = arr[j]) que se ejecutan.',
    codeSnippet:
      '// Subarreglo ordenado [0..3]: {2, 4, 6, 9} | Elemento a insertar: clave = 5\nint arr[] = {2, 4, 6, 9, 5};',
    expectedCriteria:
      '(a) [2, 4, 5, 6, 9]. (b) Se compara clave=5 con 9 (9>5, se desplaza 9 a la derecha), luego con 6 (6>5, se desplaza 6 a la derecha), y al comparar con 4 (4<=5) el bucle se detiene. Ocurren exactamente 2 desplazamientos.',
    breakpointStepIndex: 19,
    hints: [
      'Un desplazamiento ocurre únicamente cuando la condición del bucle while (j >= 0 && arr[j] > clave) resulta verdadera.',
      'Con clave = 5, evalúa de derecha a izquierda: j=3 (arr[3]=9 > 5 -> desplazamiento 1), j=2 (arr[2]=6 > 5 -> desplazamiento 2), j=1 (arr[1]=4 > 5 es falso -> fin del bucle).',
    ],
    conceptualQuestion: {
      question: '¿Por qué el índice j debe recorrer el subarreglo ordenado de derecha a izquierda (j = i - 1 hacia 0) durante la inserción?',
      options: [
        'Porque si recorriera de izquierda a derecha, al desplazar un elemento hacia arr[j+1] sobrescribiría el valor de la celda siguiente antes de leerlo.',
        'Porque Insertion Sort siempre coloca los mayores elementos al inicio del arreglo.',
        'Porque el lenguaje C no permite recorrer arreglos con índices crecientes dentro de un bucle while.',
      ],
      correctIndex: 0,
    },
    arrayPredictionCheck: {
      initialArray: [2, 4, 6, 9, 5],
      expectedArray: [2, 4, 5, 6, 9],
      extraFieldLabel: '(b) Cantidad exacta de desplazamientos hacia la derecha al insertar key = 5:',
      expectedExtraValue: 2,
    },
    requiresJustification: true,
  },
  {
    id: 'T04',
    family: 'Ordenamiento',
    algorithm: 'Insertion Sort',
    targetAlgorithmId: 'insertion-sort',
    presetDataset: [4, 3, 4, 1, 2],
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona la instrucción secuencial inmediata requerida en un paso específico del procedimiento',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar y justificar la condición de estabilidad en Insertion Sort',
    prompt:
      "Completa la condición del bucle while en C/C++ para desplazar a la derecha únicamente los elementos estrictamente mayores que 'key', preservando la estabilidad del ordenamiento sobre int arr[] = {4, 3, 4, 1, 2}.",
    codeSnippet: `void insertionSort(int arr[], int n) {
  for (int i = 1; i < n; i++) {
    int key = arr[i];
    int j = i - 1;
    while (j >= 0 && ____) {
      arr[j + 1] = arr[j];
      j = j - 1;
    }
    arr[j + 1] = key;
  }
}`,
    expectedBlanks: [['arr[j]>key', 'key<arr[j]']],
    requiresJustification: true,
    cExecutableTemplate: `#include <stdio.h>

void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && (__BLANK_1__)) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}

int main() {
    int arr[] = {4, 3, 4, 1, 2};
    int n = 5;
    insertionSort(arr, n);
    return 0;
}`,
    expectedCriteria:
      "arr[j] > key. Usar >= rompería la estabilidad: desplazaría también elementos con valor igual a 'key', haciendo que el segundo 4 quede antes que el primer 4 original.",
    breakpointStepIndex: 1,
    hints: [
      'Observa qué ocurre cuando el segundo 4 (índice 2) se compara contra el primer 4 ya presente en el subarreglo ordenado.',
      'Para que el segundo 4 se inserte inmediatamente a la derecha del primer 4 sin desplazarlo, la condición debe detenerse cuando arr[j] == key, es decir, avanzar solo mientras arr[j] > key.',
    ],
    conceptualQuestion: {
      question: '¿Qué ocurriría con los dos elementos de valor 4 en {4, 3, 4, 1, 2} si se escribiera arr[j] >= key en lugar de arr[j] > key?',
      options: [
        'El algoritmo entraría en un bucle infinito y nunca terminaría.',
        'El primer 4 sería desplazado a la derecha del segundo 4, invirtiendo su orden relativo original y perdiendo la estabilidad.',
        'El arreglo final quedaría desordenado con los valores 4 al final.',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'T05',
    family: 'Ordenamiento',
    algorithm: 'Selection Sort',
    targetAlgorithmId: 'selection-sort',
    presetDataset: [6, 3, 8, 1, 5],
    bloom: 'Analizar',
    competence: 'Abstracción',
    indicator: 'Identifica estructuras necesarias para el proceso',
    descriptor: 'Selecciona las instrucciones necesarias para solucionar el problema',
    abstraction: 'Intermedio',
    interactionType: 'Comparación',
    difficulty: 'Avanzado',
    title: 'Comparar Bubble Sort y Selection Sort: comparaciones, intercambios y escritura en memoria',
    prompt:
      'Compara las cotas teóricas del peor caso de Bubble Sort Clásico y Selection Sort para un arreglo de tamaño n = 5. Calcula e ingresa en orden: (1) comparaciones en Bubble Sort, (2) máximo de intercambios en Bubble Sort, (3) comparaciones en Selection Sort y (4) cota máxima de intercambios posibles en Selection Sort (n - 1, independientemente de si el arreglo está invertido).',
    codeSnippet:
      '// Análisis comparativo en el peor caso para tamaño n = 5\nint arr[] = {6, 3, 8, 1, 5}; // referencia de n = 5 elementos\nint n = 5;',
    expectedCriteria:
      '(a) Peor caso para n = 5: Bubble Sort realiza 10 comparaciones y hasta 10 intercambios (n(n-1)/2); Selection Sort realiza 10 comparaciones y como máximo 4 intercambios (n - 1). (b) Ambos evalúan n(n-1)/2 = 10 comparaciones, pero Selection Sort acota las escrituras en memoria a O(n) intercambios.',
    breakpointStepIndex: 2,
    hints: [
      'Tanto en Bubble Sort Clásico como en Selection Sort, el número de comparaciones en el peor caso para n = 5 está dado por la suma 4 + 3 + 2 + 1 = n(n - 1) / 2.',
      'En el peor caso (arreglo en orden inverso), Bubble Sort puede intercambiar en cada comparación (n(n - 1) / 2 intercambios), mientras que Selection Sort efectúa como máximo 1 intercambio por pasada externa (n - 1 en total).',
    ],
    conceptualQuestion: {
      question: '¿En qué escenario de ingeniería resulta preferible Selection Sort frente a Bubble Sort pese a que ambos son O(n²) en tiempo?',
      options: [
        'Cuando el arreglo ya está casi ordenado y se requiere terminar en tiempo O(n).',
        'Cuando se requiere un ordenamiento estable que preserve el orden relativo de claves duplicadas.',
        'Cuando el costo de escritura en memoria física (ej. EEPROM/Flash) es crítico, pues Selection Sort realiza a lo sumo n - 1 intercambios frente a O(n²) en Bubble Sort.',
      ],
      correctIndex: 2,
    },
    numericFieldsCheck: [
      { label: 'Comparaciones en el peor caso en Bubble Sort (n = 5):', expectedValue: 10 },
      { label: 'Máximo de intercambios en el peor caso en Bubble Sort (n = 5):', expectedValue: 10 },
      { label: 'Comparaciones en el peor caso en Selection Sort (n = 5):', expectedValue: 10 },
      { label: 'Máximo de intercambios posibles en Selection Sort (n = 5):', expectedValue: 4 },
    ],
    requiresJustification: true,
  },
  {
    id: 'T06',
    family: 'Ordenamiento',
    algorithm: 'Selection Sort',
    targetAlgorithmId: 'selection-sort',
    presetDataset: [9, 4, 7, 2, 8, 1],
    bloom: 'Crear',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona la instrucción secuencial inmediata requerida en un paso específico del procedimiento',
    abstraction: 'Básico',
    interactionType: 'Construcción manual',
    difficulty: 'Avanzado',
    title: 'Construir manualmente dos pasadas de Selection Sort',
    prompt:
      'Intercambia los elementos de int arr[] = {9, 4, 7, 2, 8, 1} haciendo clic en dos celdas del lienzo interactivo para construir el estado exacto del arreglo al concluir las DOS primeras pasadas de Selection Sort (i = 0 e i = 1).',
    codeSnippet:
      '// Arreglo inicial\nint arr[] = {9, 4, 7, 2, 8, 1};\nint n = 6;\n// Construye el estado exacto tras completar i = 0 e i = 1',
    manualInitialArray: [9, 4, 7, 2, 8, 1],
    manualTargetArray: [1, 2, 7, 4, 8, 9],
    manualExtraField: {
      label: 'Cantidad de elementos del prefijo garantizados en su posición final tras 2 pasadas:',
      expectedValue: 2,
    },
    expectedCriteria:
      '[1, 2, 7, 4, 8, 9]. En i = 0 el mínimo global es 1 (en índice 5) y se intercambia con arr[0]=9 -> [1, 4, 7, 2, 8, 9]. En i = 1 el mínimo de [1..5] es 2 (en índice 3) y se intercambia con arr[1]=4 -> [1, 2, 7, 4, 8, 9].',
    breakpointStepIndex: 2,
    hints: [
      'Selection Sort no desplaza elementos adyacentes: en cada pasada i busca la posición del mínimo en [i..n-1] y realiza un único intercambio directo entre arr[i] y arr[min].',
      'Pasada i=0: intercambia índice 0 (valor 9) con índice 5 (valor 1). Pasada i=1: sobre el resultado anterior, intercambia índice 1 (valor 4) con índice 3 (valor 2).',
    ],
    conceptualQuestion: {
      question: 'Al finalizar la segunda pasada (i = 1) de Selection Sort sobre un arreglo de 6 elementos, ¿qué garantiza su invariante de ciclo?',
      options: [
        'Que los últimos 2 elementos del arreglo contienen los mayores valores ordenados.',
        'Que el prefijo arr[0..1] contiene los 2 menores elementos de todo el arreglo en sus posiciones finales definitivas.',
        'Que todo el arreglo ya está ordenado si no hubo intercambios en la pasada i = 1.',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'T07',
    family: 'Búsqueda',
    algorithm: 'Búsqueda lineal',
    targetAlgorithmId: 'linear-search',
    presetDataset: [4, 9, 2, 9, 6, 1],
    presetSearchTarget: 9,
    bloom: 'Comprender',
    competence: 'Pensar lógicamente',
    indicator: 'Encuentra la relación entre objetos reales o abstractos',
    descriptor: 'Identifica la relación entre los elementos del problema y las instrucciones que se derivan de ella',
    abstraction: 'Básico',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el comportamiento de búsqueda lineal ante valores duplicados',
    prompt:
      'Sobre int arr[] = {4, 9, 2, 9, 6, 1}, se busca clave = 9 mediante búsqueda lineal secuencial. Ingresa (a) el índice exacto que retorna el algoritmo y (b) el número total de comparaciones efectuadas antes de terminar.',
    codeSnippet:
      '// arr[] = {4, 9, 2, 9, 6, 1}\nint clave = 9; // presente en los índices 1 y 3',
    expectedCriteria:
      '(a) Índice 1. (b) Realiza exactamente 2 comparaciones (arr[0]==9 falso y arr[1]==9 verdadero), retornando de inmediato en la primera aparición sin inspeccionar el resto del arreglo.',
    breakpointStepIndex: 1,
    hints: [
      'Observa la instrucción dentro del condicional: cuando arr[i] == clave se ejecuta inmediatamente return i.',
      'En i = 0 compara arr[0] (4) == 9 (1ª comparación). En i = 1 compara arr[1] (9) == 9 (2ª comparación) y retorna el índice 1.',
    ],
    conceptualQuestion: {
      question: '¿Por qué la búsqueda lineal clásica nunca llega a evaluar el segundo 9 ubicado en el índice 3?',
      options: [
        'Porque la instrucción return i dentro del condicional transfiere el control fuera de la función al hallar la primera coincidencia de izquierda a derecha.',
        'Porque la búsqueda lineal descarta automáticamente la mitad derecha del arreglo en cada paso.',
        'Porque el arreglo contiene un número par de elementos.',
      ],
      correctIndex: 0,
    },
    numericFieldsCheck: [
      { label: '(a) Índice exacto donde se detiene y retorna el algoritmo:', expectedValue: 1 },
      { label: '(b) Cantidad total de comparaciones realizadas:', expectedValue: 2 },
    ],
    requiresJustification: true,
  },
  {
    id: 'T08',
    family: 'Búsqueda',
    algorithm: 'Búsqueda lineal',
    targetAlgorithmId: 'linear-search',
    presetDataset: [4, 9, 2, 9, 6, 1],
    presetSearchTarget: 9,
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona estructuras condicionales o de ramificación que determinan la siguiente instrucción a ejecutar',
    abstraction: 'Intermedio',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar búsqueda lineal exhaustiva para registrar todas las ocurrencias',
    prompt:
      "Completa la condición del condicional if en C/C++ para que la función almacene en el arreglo 'indices' todas las posiciones donde aparece 'target' y devuelva la cantidad total de hallazgos.",
    codeSnippet: `int linearSearchAll(int arr[], int n, int target, int indices[]) {
  int count = 0;
  for (int i = 0; i < n; i++) {
    if (____) {
      indices[count] = i;
      count++;
    }
  }
  return count;
}`,
    expectedBlanks: [['arr[i]==target', 'target==arr[i]']],
    requiresJustification: true,
    cExecutableTemplate: `#include <stdio.h>

int main() {
    int arr[] = {4, 9, 2, 9, 6, 1};
    int indices[6] = {0};
    int n = 6;
    int target = 9;
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (__BLANK_1__) {
            indices[count] = i;
            count++;
        }
    }
    return count;
}`,
    expectedCriteria:
      "arr[i] == target. Al sustituir el return anticipado por el acumulador indices[count++] = i, el ciclo recorre obligatoriamente los n elementos en Θ(n) para recolectar todas las apariciones.",
    breakpointStepIndex: 1,
    hints: [
      'En cada iteración i debes verificar si el elemento actual del arreglo coincide exactamente con el valor buscado target.',
      'Usa el operador de igualdad relacional (==) en C: arr[i] == target.',
    ],
    conceptualQuestion: {
      question: '¿Cuál es la complejidad temporal en el mejor y peor caso de esta variante exhaustiva que recolecta todas las ocurrencias?',
      options: [
        'Mejor caso O(1) y peor caso O(n), igual que la búsqueda lineal estándar.',
        'Tanto el mejor caso como el peor caso son Θ(n), ya que no puede detenerse en la primera coincidencia y debe inspeccionar las n posiciones.',
        'Mejor caso O(log n) si el elemento buscado aparece repetido.',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'T09',
    family: 'Búsqueda',
    algorithm: 'Búsqueda binaria',
    targetAlgorithmId: 'binary-search',
    presetDataset: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72],
    presetSearchTarget: 23,
    bloom: 'Comprender',
    competence: 'Pensar lógicamente',
    indicator: 'Encuentra la relación entre objetos reales o abstractos',
    descriptor: 'Establece la secuencia lógica de las instrucciones',
    abstraction: 'Intermedio',
    interactionType: 'Predicción',
    difficulty: 'Intermedio',
    title: 'Trazar paso a paso los punteros de Búsqueda Binaria',
    prompt:
      'Sobre int arr[] = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72} (índices 0..9), buscando clave = 23 con medio = piso((inicio + fin) / 2). El visualizador se detiene tras inicializar los límites. Determina el índice medio (mid) evaluado en cada iteración y el índice final retornado.',
    codeSnippet:
      '// Índices 0..9: {2, 5, 8, 12, 16, 23, 38, 45, 56, 72}\nint clave = 23;\n// medio = piso((inicio + fin) / 2)',
    expectedCriteria:
      'Iteración 1: low=0, high=9, mid=4 (arr[4]=16 < 23 -> low=5). Iteración 2: low=5, high=9, mid=7 (arr[7]=45 > 23 -> high=6). Iteración 3: low=5, high=6, mid=5 (arr[5]=23 == 23 -> retorna índice 5).',
    breakpointStepIndex: 3,
    hints: [
      'En cada paso calcula mid = Math.floor((low + high) / 2). Si arr[mid] < 23, el nuevo límite inferior es low = mid + 1; si arr[mid] > 23, el nuevo límite superior es high = mid - 1.',
      'Paso 1: low=0, high=9 -> mid=4 (valor 16 < 23, por tanto low pasa a 5). Paso 2: low=5, high=9 -> mid=7 (valor 45 > 23, por tanto high pasa a 6). Paso 3: low=5, high=6 -> mid=5 (valor 23 encontrado).',
    ],
    conceptualQuestion: {
      question: 'En la Iteración 1 (mid = 4, arr[4] = 16 < 23), ¿por qué se actualiza inicio = medio + 1 (5) en lugar de inicio = medio (4)?',
      options: [
        'Porque arr[medio] ya fue evaluado y sabemos que es estrictamente menor que 23; incluirlo nuevamente podría causar un ciclo infinito cuando el rango se reduce a 2 elementos.',
        'Porque en lenguaje C los arreglos comienzan en el índice 1.',
        'Para ahorrar memoria en la pila de llamadas recursivas.',
      ],
      correctIndex: 0,
    },
    numericFieldsCheck: [
      { label: 'Iteración 1 (inicio = 0, fin = 9) — índice medio (mid):', expectedValue: 4 },
      { label: 'Iteración 2 (inicio = 5, fin = 9) — índice medio (mid):', expectedValue: 7 },
      { label: 'Iteración 3 (inicio = 5, fin = 6) — índice medio (mid):', expectedValue: 5 },
      { label: 'Índice final retornado por la búsqueda binaria:', expectedValue: 5 },
    ],
  },
  {
    id: 'T10',
    family: 'Búsqueda',
    algorithm: 'Búsqueda binaria',
    targetAlgorithmId: 'binary-search',
    presetDataset: [2, 5, 16, 23, 23, 23, 38, 45, 56, 72],
    presetSearchTarget: 23,
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona la instrucción secuencial inmediata requerida en un paso específico del procedimiento',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: "Completar e interpretar una variante 'lower bound' de búsqueda binaria",
    prompt:
      "Sobre el arreglo ordenado con duplicados int arr[] = {2, 5, 16, 23, 23, 23, 38, 45, 56, 72} y buscando target = 23, completa la condición faltante de esta variante 'lower bound' en C/C++ que halla el primer índice i tal que arr[i] >= target (o la posición de inserción ordenada si no existe).",
    codeSnippet: `int lowerBound(int arr[], int n, int target) {
  int low = 0, high = n;
  while (low < high) {
    int mid = low + (high - low) / 2;
    if (____) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}`,
    expectedBlanks: [['arr[mid]<target', 'target>arr[mid]']],
    requiresJustification: true,
    cExecutableTemplate: `#include <stdio.h>

int lowerBound(int arr[], int n, int target) {
    int low = 0;
    int high = n;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (__BLANK_1__) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

int main() {
    int arr[] = {2, 5, 16, 23, 23, 23, 38, 45, 56, 72};
    int pos = lowerBound(arr, 10, 23);
    return pos;
}`,
    expectedCriteria:
      'arr[mid] < target. Cuando arr[mid] es estrictamente menor que target, la posición buscada está obligatoriamente a la derecha (low = mid + 1); cuando arr[mid] >= target, mid aún puede ser la primera aparición, por lo que se conserva haciendo high = mid.',
    breakpointStepIndex: 2,
    hints: [
      'Observa la rama verdadera del if: descarta mid haciendo low = mid + 1. ¿En qué caso podemos descartar mid con total seguridad cuando buscamos el primer elemento >= target?',
      'Solo podemos descartar mid (low = mid + 1) cuando arr[mid] < target.',
    ],
    conceptualQuestion: {
      question: 'Sobre el arreglo con duplicados {2, 5, 16, 23, 23, 23, 38, 45, 56, 72} y buscando target = 23, ¿qué diferencia a lowerBound de la búsqueda binaria clásica?',
      options: [
        'La búsqueda binaria clásica se detiene al hallar cualquier 23 (por ejemplo en índice 4), mientras que lowerBound converge garantizadamente a la primera aparición (índice 3).',
        'lowerBound retorna -1 cuando existen elementos duplicados.',
        'lowerBound tiene complejidad O(n) mientras que la búsqueda binaria clásica es O(log n).',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'T11',
    family: 'Búsqueda',
    algorithm: 'Búsqueda binaria',
    targetAlgorithmId: 'binary-search',
    presetDataset: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72],
    presetSearchTarget: 23,
    bloom: 'Analizar',
    competence: 'Abstracción',
    indicator: 'Planifica la solución del problema',
    descriptor: 'Planifica la secuencia de pasos o ruta de solución antes de ejecutar el algoritmo',
    abstraction: 'Básico',
    interactionType: 'Comparación',
    difficulty: 'Avanzado',
    title: 'Calcular y comparar la complejidad de búsqueda lineal vs. binaria a distintas escalas',
    prompt:
      'Compara búsqueda lineal y búsqueda binaria sobre arreglos ordenados de n = 1,000 y n = 1,000,000 de elementos. Calcula el número máximo exacto de iteraciones (comparaciones de punto medio) en el peor caso usando techo(log2(n + 1)).',
    codeSnippet:
      '// Escala 1: n = 1,000 elementos (2^10 = 1,024)\n// Escala 2: n = 1,000,000 elementos (2^20 = 1,048,576)\n// Cota de peor caso: techo(log2(n + 1))',
    expectedCriteria:
      '(a) Para n = 1,000: techo(log2(1001)) = 10 comparaciones. Para n = 1,000,000: techo(log2(1000001)) = 20 comparaciones. Multiplicar n por 1,000 apenas duplica los pasos de 10 a 20 gracias al crecimiento logarítmico.',
    breakpointStepIndex: 2,
    hints: [
      'Recuerda las potencias de 2: 2^10 = 1,024 y 2^20 = (2^10)² = 1,048,576.',
      'Como 2^9 = 512 < 1,001 <= 1,024 = 2^10, para n = 1,000 se requieren como máximo 10 divisiones por la mitad; para n = 1,000,000 se requieren como máximo 20.',
    ],
    conceptualQuestion: {
      question: 'Si se recibe un arreglo DESORDENADO de n = 1,000,000 de elementos y solo se necesita realizar UNA única búsqueda, ¿qué estrategia es asintóticamente más eficiente?',
      options: [
        'Ordenar primero el arreglo con Merge Sort O(n log n) y luego aplicar Búsqueda Binaria O(log n).',
        'Aplicar directamente Búsqueda Lineal en O(n), porque ordenar primero cuesta O(n log n), que es mayor que el costo O(n) de una sola búsqueda secuencial.',
        'Aplicar Búsqueda Binaria directamente sin ordenar el arreglo.',
      ],
      correctIndex: 1,
    },
    numericFieldsCheck: [
      { label: '(a.1) Máximo de iteraciones en Búsqueda Binaria para n = 1,000:', expectedValue: 10 },
      { label: '(a.2) Máximo de iteraciones en Búsqueda Binaria para n = 1,000,000:', expectedValue: 20 },
    ],
    requiresJustification: true,
  },
  {
    id: 'T12',
    family: 'Búsqueda',
    algorithm: 'Búsqueda binaria',
    targetAlgorithmId: 'binary-search',
    presetDataset: [9, 2, 7, 1, 5],
    presetSearchTarget: 1,
    bloom: 'Analizar',
    competence: 'Pensar lógicamente',
    indicator: 'Encuentra la relación entre objetos reales o abstractos',
    descriptor: 'Establece la secuencia lógica de las instrucciones',
    abstraction: 'Intermedio',
    interactionType: 'Justificación',
    difficulty: 'Avanzado',
    title: 'Diagnosticar mediante traza el fallo de Búsqueda Binaria sobre un arreglo desordenado',
    prompt:
      'Se invoca Búsqueda Binaria sobre el arreglo DESORDENADO int arr[] = {9, 2, 7, 1, 5} buscando clave = 1 (que sí se encuentra en el índice 3). Analiza qué ejecuta ciegamente el algoritmo: determina los índices medios evaluados, el nuevo límite fin (high) tras la primera comparación y qué valor termina retornando.',
    codeSnippet:
      '// Precondición violada: arr[] = {9, 2, 7, 1, 5} NO está ordenado\nint clave = 1; // presente en arr[3]',
    expectedCriteria:
      'Paso 1: low=0, high=4, mid=2 (arr[2]=7 > 1 -> descarta mitad derecha haciendo high=1, ¡descartando por error el índice 3 donde estaba el 1!). Paso 2: low=0, high=1, mid=0 (arr[0]=9 > 1 -> high=-1). Termina retornando -1.',
    breakpointStepIndex: 3,
    hints: [
      'En el Paso 1, low = 0 y high = 4, por lo que mid = 2 (arr[2] = 7). Como clave = 1 < 7, el algoritmo asume que todos los elementos a la derecha de 7 son mayores que 7 y hace high = mid - 1 = 1.',
      'En el Paso 2, low = 0 y high = 1, por lo que mid = Math.floor((0 + 1) / 2) = 0 (arr[0] = 9 > 1). Hace high = -1, rompe la condición low <= high y retorna -1.',
    ],
    conceptualQuestion: {
      question: '¿En qué instante exacto se pierde irreversiblemente la posibilidad de encontrar el valor 1 (ubicado en el índice 3)?',
      options: [
        'En la Iteración 1: al ver arr[2] = 7 > 1, el algoritmo asume monotonía creciente y descarta el subarreglo derecho [2..4], eliminando el índice 3 donde residía el 1.',
        'Al inicializar la variable resultado = -1 antes del bucle while.',
        'En la última línea al ejecutar return -1.',
      ],
      correctIndex: 0,
    },
    numericFieldsCheck: [
      { label: 'Iteración 1 (inicio = 0, fin = 4) — índice medio (mid):', expectedValue: 2 },
      { label: 'Nuevo límite fin (high) tras descartar la mitad derecha:', expectedValue: 1 },
      { label: 'Iteración 2 — siguiente índice medio (mid) evaluado:', expectedValue: 0 },
      { label: 'Valor final retornado por la función (-1 si no lo encuentra):', expectedValue: -1 },
    ],
    requiresJustification: true,
  },
  {
    id: 'T13',
    family: 'Divide y vencerás',
    algorithm: 'Merge Sort',
    targetAlgorithmId: 'merge-sort',
    presetDataset: [8, 3, 5, 1, 9, 2, 7, 4],
    bloom: 'Comprender',
    competence: 'Abstracción',
    indicator: 'Identifica estructuras necesarias para el proceso',
    descriptor: 'Selecciona las instrucciones necesarias para solucionar el problema',
    abstraction: 'Intermedio',
    interactionType: 'Predicción',
    difficulty: 'Intermedio',
    title: 'Predecir la estructura y profundidad del árbol de recursión en Merge Sort',
    prompt:
      'Sobre int arr[] = {8, 3, 5, 1, 9, 2, 7, 4} (n = 8). Antes de expandir el árbol de recursión completo, calcula (a) cuántos niveles de división se generan debajo de la raíz (log2(8)) y (b) cuántos nodos hoja (casos base de 1 elemento) se alcanzan.',
    codeSnippet: '// arr[] = {8, 3, 5, 1, 9, 2, 7, 4} (n = 8)',
    expectedCriteria:
      'Nivel 0 (raíz): 1 nodo de tamaño 8. Nivel 1: 2 nodos de tamaño 4. Nivel 2: 4 nodos de tamaño 2. Nivel 3: 8 hojas de tamaño 1 (casos base). Son 3 niveles de división (log2(8) = 3) y 8 hojas.',
    breakpointStepIndex: 1,
    hints: [
      'En cada nivel de recursión el tamaño del subarreglo se divide por 2: de 8 pasa a 4, de 4 pasa a 2, y de 2 pasa a 1.',
      'El número de niveles de división desde tamaño n=8 hasta tamaño 1 es log2(8) = 3, y en el nivel más profundo cada elemento individual constituye un caso base (8 hojas).',
    ],
    conceptualQuestion: {
      question: '¿Por qué la complejidad temporal de Merge Sort es O(n log n) tanto en el mejor como en el peor caso?',
      options: [
        'Porque siempre divide el arreglo por la mitad generando log2(n) niveles, y en cada nivel la fusión (combinar) procesa en total exactamente n elementos en tiempo lineal Θ(n).',
        'Porque utiliza una bandera booleana para detener las llamadas recursivas cuando el arreglo está ordenado.',
        'Porque no utiliza memoria adicional durante la fase de combinación.',
      ],
      correctIndex: 0,
    },
    numericFieldsCheck: [
      { label: '(a) Cantidad de niveles de división debajo de la raíz (log2(8)):', expectedValue: 3 },
      { label: '(b) Cantidad de subarreglos caso base (tamaño 1) en las hojas:', expectedValue: 8 },
    ],
    requiresJustification: true,
  },
  {
    id: 'T14',
    family: 'Divide y vencerás',
    algorithm: 'Merge Sort',
    targetAlgorithmId: 'merge-sort',
    presetDataset: [8, 3, 5, 1, 9, 2, 7, 4],
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona la instrucción secuencial inmediata requerida en un paso específico del procedimiento',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar la condición de mezcla estable en la función merge',
    prompt:
      "Completa la condición del if dentro de la función merge en C/C++ para decidir cuándo copiar primero de la mitad izquierda ('left[i]') frente a la mitad derecha ('right[j]'), garantizando que Merge Sort sea un algoritmo ESTABLE.",
    codeSnippet: `void merge(int left[], int leftSize, int right[], int rightSize, int result[]) {
  int i = 0, j = 0, k = 0;
  while (i < leftSize && j < rightSize) {
    if (____) {
      result[k++] = left[i++];
    } else {
      result[k++] = right[j++];
    }
  }
  while (i < leftSize) result[k++] = left[i++];
  while (j < rightSize) result[k++] = right[j++];
}`,
    expectedBlanks: [['left[i]<=right[j]', 'right[j]>=left[i]']],
    requiresJustification: true,
    cExecutableTemplate: `#include <stdio.h>

int main() {
    int left[] = {2, 5, 8};
    int right[] = {1, 5, 9};
    int result[6] = {0};
    int leftSize = 3;
    int rightSize = 3;
    int i = 0, j = 0, k = 0;
    while (i < leftSize && j < rightSize) {
        if (__BLANK_1__) {
            result[k++] = left[i++];
        } else {
            result[k++] = right[j++];
        }
    }
    while (i < leftSize) result[k++] = left[i++];
    while (j < rightSize) result[k++] = right[j++];
    return 0;
}`,
    expectedCriteria:
      "left[i] <= right[j]. Si existen dos elementos empatados (left[i] == right[j]), el elemento de 'left' aparecía antes en el arreglo original; usar '<=' asegura que se copie primero al arreglo fusionado.",
    breakpointStepIndex: 1,
    hints: [
      'Todos los elementos del subarreglo izquierdo (left) tenían índices menores en el arreglo original que los elementos del subarreglo derecho (right).',
      'En caso de empate (left[i] == right[j]), debe ganar el elemento de la izquierda: por tanto la condición para elegir left[i] es left[i] <= right[j].',
    ],
    conceptualQuestion: {
      question: '¿Para qué sirven los dos bucles while secuenciales que aparecen después del bucle principal while (i < leftSize && j < rightSize)?',
      options: [
        'Para volver a ordenar el arreglo result en caso de que haya quedado desordenado.',
        'Para copiar al arreglo temporal los elementos remanentes de la mitad que aún no se agotó (ya sea la izquierda o la derecha).',
        'Para liberar la memoria dinámica reservada por los arreglos left y right.',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'T15',
    family: 'Divide y vencerás',
    algorithm: 'Merge Sort',
    targetAlgorithmId: 'merge-sort',
    presetDataset: [6, 2, 7, 4, 9],
    bloom: 'Analizar',
    competence: 'Abstracción',
    indicator: 'Identifica estructuras necesarias para el proceso',
    descriptor: 'Selecciona las instrucciones necesarias para solucionar el problema',
    abstraction: 'Básico',
    interactionType: 'Análisis de árbol de recursión',
    difficulty: 'Avanzado',
    title: 'Analizar el árbol de recursión de Merge Sort con un arreglo de tamaño impar',
    prompt:
      'Analiza int arr[] = {6, 2, 7, 4, 9} (n = 5, índices 0..4). Calcula (a) el índice medio mid = piso((0 + 4) / 2) en la raíz y (b) la altura del árbol de recursión dada por techo(log2(5)).',
    codeSnippet: '// mergeSort(arr, 0, 4);\n// arr[] = {6, 2, 7, 4, 9} (n = 5)',
    expectedCriteria:
      '(a) En la raíz (inicio=0, fin=4), medio = 2, dividiendo en [0..2] (3 elementos: {6,2,7}) y [3..4] (2 elementos: {4,9}). (b) Altura = techo(log2(5)) = 3 niveles.',
    breakpointStepIndex: 1,
    hints: [
      'Con inicio = 0 y fin = 4, el punto medio es (0 + 4) / 2 = 2. Por tanto, el hijo izquierdo abarca [0..2] (3 elementos) y el derecho [3..4] (2 elementos).',
      'Como 2^2 = 4 < 5 <= 8 = 2^3, el valor de techo(log2(5)) es 3.',
    ],
    conceptualQuestion: {
      question: 'En Merge Sort sobre un arreglo de longitud impar (n = 5), ¿cómo afecta la asimetría entre subarreglos de tamaño 3 y 2 a la complejidad espacial auxiliar?',
      options: [
        'La complejidad espacial auxiliar sigue siendo Θ(n), pues el arreglo temporal temp requiere a lo sumo n celdas y las llamadas en la pila de recursión alcanzan profundidad O(log n).',
        'La complejidad espacial se degrada a O(n²) debido a que las ramas tienen distinta longitud.',
        'La complejidad espacial se reduce a O(1) porque los subarreglos impares se mezclan in-place.',
      ],
      correctIndex: 0,
    },
    numericFieldsCheck: [
      { label: '(a) Índice medio (mid) calculado en la primera división (inicio=0, fin=4):', expectedValue: 2 },
      { label: '(b) Altura del árbol de recursión techo(log2(5)):', expectedValue: 3 },
    ],
    requiresJustification: true,
  },
  {
    id: 'T16',
    family: 'Divide y vencerás',
    algorithm: 'Quick Sort',
    targetAlgorithmId: 'quick-sort',
    presetDataset: [5, 9, 1, 6, 3, 3, 8],
    bloom: 'Comprender',
    competence: 'Pensar lógicamente',
    indicator: 'Encuentra la relación entre objetos reales o abstractos',
    descriptor: 'Establece la secuencia lógica de las instrucciones',
    abstraction: 'Intermedio',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el resultado de la primera partición en Quick Sort',
    prompt:
      'Sobre int arr[] = {5, 9, 1, 6, 3, 3, 8}, usando Quick Sort con pivote = último elemento (8). El visualizador se detiene al iniciar particionar(0, 6). Ingresa (a) el estado del arreglo al concluir esta primera partición y (b) el índice pi donde queda ubicado el pivote 8.',
    codeSnippet:
      '// arr[] = {5, 9, 1, 6, 3, 3, 8}\n// pivote = arr[6] = 8',
    expectedCriteria:
      '(a) [5, 1, 6, 3, 3, 8, 9]. (b) Índice pi = 5. Los cinco elementos menores o iguales a 8 (5, 1, 6, 3, 3) quedan en [0..4], el pivote 8 se intercambia con arr[5] (que tenía al 9), dejando a 9 en el índice 6.',
    breakpointStepIndex: 3,
    hints: [
      'Recorre j desde 0 hasta 5 con pivote = 8: cada vez que arr[j] <= 8, incrementa i e intercambia arr[i] con arr[j]. Al principio (j=0, val=5) i=0; en j=1 (val=9 > 8) i se queda en 0; en j=2 (val=1 <= 8) i pasa a 1 y se intercambia arr[1] (9) con arr[2] (1).',
      'El 9 va siendo empujado hacia la derecha en cada intercambio con 1, 6, 3 y 3, hasta que al final se intercambia arr[i+1] (índice 5, valor 9) con el pivote 8 (índice 6), dando [5, 1, 6, 3, 3, 8, 9].',
    ],
    conceptualQuestion: {
      question: 'Durante la ejecución del ciclo for (j = bajo; j < alto; j++) en la función particionar, ¿qué representa el puntero i?',
      options: [
        'El índice del último elemento encontrado que es menor o igual al pivote (frontera derecha de la región arr[bajo..i] <= pivote).',
        'El índice donde se encuentra actualmente almacenado el pivote.',
        'La cantidad de elementos estrictamente mayores que el pivote.',
      ],
      correctIndex: 0,
    },
    arrayPredictionCheck: {
      initialArray: [5, 9, 1, 6, 3, 3, 8],
      expectedArray: [5, 1, 6, 3, 3, 8, 9],
      extraFieldLabel: '(b) Índice final exacto (pi) donde queda colocado el pivote (8):',
      expectedExtraValue: 5,
    },
  },
  {
    id: 'T17',
    family: 'Divide y vencerás',
    algorithm: 'Quick Sort',
    targetAlgorithmId: 'quick-sort',
    presetDataset: [5, 9, 1, 6, 3, 3, 8],
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona la instrucción secuencial inmediata requerida en un paso específico del procedimiento',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Avanzado',
    title: 'Completar la condición de partición en Quick Sort',
    prompt:
      'Completa la condición dentro de la función partition en C/C++ para ubicar todos los elementos menores o iguales al pivote en la región izquierda sobre el arreglo {5, 9, 1, 6, 3, 3, 8}.',
    codeSnippet: `int partition(int arr[], int low, int high) {
  int pivot = arr[high];
  int i = low - 1;
  for (int j = low; j < high; j++) {
    if (____) {
      i++;
      int temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  int temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  return i + 1;
}`,
    expectedBlanks: [['arr[j]<=pivot', 'arr[j]<pivot', 'pivot>=arr[j]', 'pivot>arr[j]']],
    requiresJustification: true,
    cExecutableTemplate: `#include <stdio.h>

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (__BLANK_1__) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp2 = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp2;
    return i + 1;
}

int main() {
    int arr[] = {5, 9, 1, 6, 3, 3, 8};
    int pi = partition(arr, 0, 6);
    return pi;
}`,
    expectedCriteria:
      'arr[j] <= pivot (o arr[j] < pivot). Cuando un arreglo tiene todos sus elementos iguales, la partición estándar envía todos los duplicados a un solo lado del pivote, degradando el tiempo a O(n²).',
    breakpointStepIndex: 1,
    hints: [
      'El puntero i debe incrementarse e incorporar arr[j] a la región izquierda cada vez que el elemento examinado arr[j] sea menor o igual que pivot.',
      'Escribe la comparación en C entre el elemento actual arr[j] y pivot: arr[j] <= pivot.',
    ],
    conceptualQuestion: {
      question: '¿Qué ocurre con la complejidad de Quick Sort (tomando el último elemento como pivote) si todos los elementos del arreglo son idénticos (ej. {5, 5, 5, 5, 5})?',
      options: [
        'Termina en O(n) porque detecta que todos los elementos son iguales.',
        'Cae en su peor caso O(n²), ya que todos los elementos duplicados quedan concentrados en un solo lado del pivote produciendo un árbol degenerado de altura n.',
        'Mantiene particiones perfectamente equilibradas de tamaño n/2.',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'T18',
    family: 'Divide y vencerás',
    algorithm: 'Quick Sort',
    targetAlgorithmId: 'quick-sort',
    presetDataset: [8, 4, 7, 2, 9, 3],
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona la instrucción secuencial inmediata requerida en un paso específico del procedimiento',
    abstraction: 'Básico',
    interactionType: 'Construcción manual',
    difficulty: 'Avanzado',
    title: 'Construir manualmente la partición de Quick Sort',
    prompt:
      'Intercambia las celdas de int arr[] = {8, 4, 7, 2, 9, 3} haciendo clic sobre dos posiciones para construir el resultado tras aplicar la partición con pivote = 3 (último elemento). Indica además el índice final pi donde queda situado el pivote 3.',
    codeSnippet: '// arr[] = {8, 4, 7, 2, 9, 3}\n// pivote = arr[5] = 3',
    manualInitialArray: [8, 4, 7, 2, 9, 3],
    manualTargetArray: [2, 3, 7, 8, 9, 4],
    manualExtraField: {
      label: 'Índice final (pi) donde queda ubicado el pivote (3):',
      expectedValue: 1,
    },
    expectedCriteria:
      '[2, 3, 7, 8, 9, 4], con pi = 1. Al recorrer j=0..4 con pivote=3, el único elemento <= 3 es 2 (en j=3): i pasa de -1 a 0 y se intercambia arr[0] (8) con arr[3] (2) -> [2, 4, 7, 8, 9, 3]. Finalmente se intercambia arr[i+1] (arr[1]=4) con el pivote arr[5]=3 -> [2, 3, 7, 8, 9, 4].',
    breakpointStepIndex: 3,
    hints: [
      'Recorre el arreglo buscando qué elementos son <= 3: únicamente el valor 2 (ubicado en el índice 3) cumple la condición.',
      'Primero intercambia el índice 0 (valor 8) con el índice 3 (valor 2) para obtener [2, 4, 7, 8, 9, 3]. Luego realiza el intercambio final del pivote: índice 1 (valor 4) con índice 5 (valor 3).',
    ],
    conceptualQuestion: {
      question: 'Tras colocar el pivote 3 en el índice pi = 1 ([2, 3, 7, 8, 9, 4]), ¿participa el índice 1 en las llamadas recursivas posteriores?',
      options: [
        'No: el pivote en el índice pi = 1 ya alcanzó su posición final definitiva en el arreglo ordenado; las llamadas recursivas solo procesan [0..pi-1] y [pi+1..alto].',
        'Sí: debe incluirse en la llamada recursiva derecha quickSort(arr, pi, alto).',
        'Sí: el pivote vuelve a cambiar de posición cuando se ordena el subarreglo derecho.',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'T19',
    family: 'Divide y vencerás',
    algorithm: 'Quick Sort',
    targetAlgorithmId: 'quick-sort',
    presetDataset: [1, 2, 3, 4, 5, 6],
    bloom: 'Evaluar',
    competence: 'Abstracción',
    indicator: 'Planifica la solución del problema',
    descriptor: 'Planifica la secuencia de pasos o ruta de solución antes de ejecutar el algoritmo',
    abstraction: 'Básico',
    interactionType: 'Justificación',
    difficulty: 'Avanzado',
    title: 'Evaluar y cuantificar el peor caso de Quick Sort sobre entradas ordenadas',
    prompt:
      'Analiza Quick Sort (pivote = último elemento) ejecutado sobre el arreglo ya ordenado int arr[] = {1, 2, 3, 4, 5, 6} (n = 6). Calcula (a.1) el número total exacto de comparaciones n(n-1)/2 y (a.2) el tamaño del subarreglo izquierdo tras la primera partición.',
    codeSnippet:
      '// arr[] = {1, 2, 3, 4, 5, 6} (ya ordenado, n = 6)\n// pivote = arr[alto] siempre',
    expectedCriteria:
      '(a.1) 15 comparaciones (5 + 4 + 3 + 2 + 1 = 15, cota O(n²)). (a.2) Tamaño 5 (subarreglo izquierdo [0..4] y subarreglo derecho vacío). La elección de pivote por mediana de tres (inicio, medio, fin) o pivote aleatorio evita este caso degenerado.',
    breakpointStepIndex: 2,
    hints: [
      'En la primera partición el pivote es 6 (el máximo). Los 5 elementos anteriores son menores que 6, por lo que quedan en el subarreglo izquierdo de tamaño 5 y el derecho queda vacío (tamaño 0).',
      'El total de comparaciones suma (n - 1) + (n - 2) + ... + 1 = 6 * 5 / 2 = 15.',
    ],
    conceptualQuestion: {
      question: '¿Qué técnica de selección de pivote mitiga eficazmente este peor caso O(n²) cuando la entrada llega ordenada o casi ordenada?',
      options: [
        'Elegir siempre el primer elemento arr[bajo] como pivote.',
        'Seleccionar el pivote mediante la mediana de tres (arr[bajo], arr[medio], arr[alto]) o de forma aleatoria.',
        'Duplicar el tamaño del arreglo antes de particionar.',
      ],
      correctIndex: 1,
    },
    numericFieldsCheck: [
      { label: '(a.1) Número total exacto de comparaciones para n = 6:', expectedValue: 15 },
      { label: '(a.2) Tamaño del subarreglo izquierdo tras la primera partición (pivote = 6):', expectedValue: 5 },
    ],
    requiresJustification: true,
  },
  {
    id: 'T20',
    family: 'Ordenamiento',
    algorithm: 'Bubble Sort',
    targetAlgorithmId: 'bubble-sort-classic',
    presetDataset: [5, 2, 8, 1, 9, 3],
    bloom: 'Crear',
    competence: 'Pensar iterativamente',
    indicator: 'Identifica un ciclo repetitivo',
    descriptor: 'Agrupa instrucciones dentro de un bloque repetitivo un número determinado de veces',
    abstraction: 'Avanzado',
    interactionType: 'Completar código',
    difficulty: 'Avanzado',
    title: 'Generalizar las cotas de los ciclos anidados de Bubble Sort en función de n e i',
    prompt:
      "Completa las cotas superiores de ambos ciclos anidados de Bubble Sort en función de 'n' e 'i', evitando comparaciones fuera de rango o redundantes sobre los elementos ya ordenados al final del arreglo.",
    codeSnippet: `void bubbleSort(int arr[], int n) {
  for (int i = 0; i < ____; i++) {
    for (int j = 0; j < ____; j++) {
      if (arr[j] > arr[j + 1]) {
        int temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}`,
    expectedBlanks: [
      ['n-1'],
      ['n-1-i', 'n-i-1'],
    ],
    requiresJustification: true,
    cExecutableTemplate: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < (__BLANK_1__); i++) {
        for (int j = 0; j < (__BLANK_2__); j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {5, 2, 8, 1, 9, 3};
    bubbleSort(arr, 6);
    return 0;
}`,
    expectedCriteria:
      'Primer blanco: n - 1 (tras fijar n - 1 elementos, el restante en índice 0 queda ordenado). Segundo blanco: n - 1 - i (los últimos i elementos ya están en su posición final y además evita evaluar arr[j+1] fuera de rango).',
    breakpointStepIndex: 1,
    hints: [
      'En un arreglo de n elementos bastan n - 1 pasadas externas para dejar ordenados todos los elementos.',
      'En la pasada i, los últimos i elementos ya están fijos; como se accede a arr[j + 1], el límite estricto de j es n - 1 - i.',
    ],
    conceptualQuestion: {
      question: '¿Qué error ocurriría en C/C++ si el ciclo interno se escribiera como for (int j = 0; j < n; j++)?',
      options: [
        'En la última iteración (j = n - 1), la expresión arr[j + 1] intentaría leer arr[n], produciendo un acceso fuera de los límites de memoria del arreglo (out-of-bounds).',
        'El algoritmo solo ordenaría la primera mitad del arreglo.',
        'El código no compilaría porque j no puede compararse con n.',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'T21',
    family: 'Divide y vencerás',
    algorithm: 'Merge Sort',
    targetAlgorithmId: 'merge-sort',
    presetDataset: [8, 3, 5, 1, 9, 2, 7, 4],
    bloom: 'Evaluar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Construye una secuencia de instrucciones que finaliza en un número finito de pasos',
    abstraction: 'Avanzado',
    interactionType: 'Completar código',
    difficulty: 'Avanzado',
    title: 'Determinar la condición de caso base que garantiza la finitud en Merge Sort',
    prompt:
      "Completa la condición de parada (caso base) de Merge Sort recursivo para garantizar que las llamadas terminen al llegar a subarreglos de 1 elemento. Si pruebas 'left > right', observarás cómo el motor AST detecta la recursión infinita.",
    codeSnippet: `void mergeSort(int arr[], int left, int right) {
  if (____) return;
  int mid = left + (right - left) / 2;
  mergeSort(arr, left, mid);
  mergeSort(arr, mid + 1, right);
  merge(arr, left, mid, right);
}`,
    expectedBlanks: [['left>=right', 'right<=left']],
    requiresJustification: true,
    cExecutableTemplate: `#include <stdio.h>

void merge(int arr[], int left, int mid, int right) {
    int i = left;
    int j = mid + 1;
    int k = 0;
    int temp[4] = {0};
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k] = arr[i];
            i++;
        } else {
            temp[k] = arr[j];
            j++;
        }
        k++;
    }
    while (i <= mid) {
        temp[k] = arr[i];
        i++;
        k++;
    }
    while (j <= right) {
        temp[k] = arr[j];
        j++;
        k++;
    }
    for (int p = 0; p < k; p++) {
        arr[left + p] = temp[p];
    }
}

void mergeSort(int arr[], int left, int right) {
    if (__BLANK_1__) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}

int main() {
    int arr[] = {8, 3, 5, 1};
    mergeSort(arr, 0, 3);
    return 0;
}`,
    expectedCriteria:
      "left >= right. Un subarreglo de 1 elemento tiene left == right y ya está ordenado por definición; si solo se pusiera 'left > right', al llegar a left == right se calcularía mid = left y se invocaría mergeSort(arr, left, left) indefinidamente (Stack Overflow).",
    breakpointStepIndex: 1,
    hints: [
      '¿Cuál es la relación entre los índices left y right cuando un subarreglo tiene exactamente 1 elemento?',
      'Cuando tiene 1 elemento se cumple left == right; por tanto la recursión debe detenerse cuando left >= right.',
    ],
    conceptualQuestion: {
      question: '¿Por qué la condición if (left > right) return; provoca un desbordamiento de pila (Stack Overflow) en Merge Sort?',
      options: [
        'Porque cuando el subarreglo llega a tamaño 1 (left == right), calcula mid = left y vuelve a llamar a mergeSort(arr, left, left) con los mismos argumentos infinitamente.',
        'Porque reserva demasiada memoria en el arreglo global.',
        'Porque la división entera en C redondea siempre hacia arriba.',
      ],
      correctIndex: 0,
    },
  },
];

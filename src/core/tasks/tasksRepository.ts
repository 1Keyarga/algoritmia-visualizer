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

export interface TraceTableSpec {
  columns: [string, string, string];
  expectedRows: [number, number, number][];
  extraFieldLabel: string;
  expectedExtraValue: number;
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

  // 4. Tabla de traza paso a paso (low, high, mid)
  traceTableCheck?: TraceTableSpec;

  // 5. Campos cuantitativos exactos (comparaciones, intercambios, cotas, alturas)
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
    descriptor: 'Escoge los bloques de instrucciones necesarios para la solución del problema',
    abstraction: 'Básico',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el estado del arreglo tras la primera pasada completa de Bubble Sort',
    prompt:
      'Sobre el arreglo int arr[] = {5, 2, 8, 1, 9, 3}, el visualizador ejecutará la primera pasada completa de Bubble Sort (todas las comparaciones adyacentes desde j=0 hasta n-2). Ingresa en las celdas (a) el estado exacto del arreglo al finalizar la primera pasada (i = 0) y (b) el valor que queda garantizado en su posición final por el invariante de Bubble Sort.',
    codeSnippet:
      '// Estado inicial\nint arr[] = {5, 2, 8, 1, 9, 3};\nint n = 6;\n// Se ejecutará la pasada i = 0 completa\n// (comparaciones adyacentes j = 0 .. n-2)',
    expectedCriteria:
      '(a) [2, 5, 1, 8, 3, 9]. (b) El 9 (máximo del arreglo) queda garantizado en la última posición: en cada pasada completa, el mayor elemento entre los aún no comparados se traslada hacia la derecha mediante intercambios sucesivos — este es el invariante central de Bubble Sort.',
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
    presetDataset: [5, 2, 8, 1, 9, 3],
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona las órdenes en forma ordenada y secuencial',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar Bubble Sort con optimización de parada temprana',
    prompt:
      "Completa las dos condiciones faltantes de esta versión optimizada de Bubble Sort en C++ que se detiene antes si el arreglo ya quedó ordenado. Escribe la condición en cada espacio en blanco y presiona 'Compilar y Verificar' para que el motor AST ejecute tu versión y confirme el resultado.",
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
    int arr[] = {5, 2, 8, 1, 9, 3};
    int n = 6;
    bubbleSort(arr, n);
    return 0;
}`,
    expectedCriteria:
      'Primer blanco: arr[j] > arr[j+1]. Segundo blanco: !swapped. Si en una pasada no hubo intercambios, el arreglo ya está ordenado y el algoritmo puede detenerse antes de completar todas las pasadas, mejorando el mejor caso a O(n).',
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
    descriptor: 'Escoge los bloques de instrucciones necesarios para la solución del problema',
    abstraction: 'Básico',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el proceso completo de inserción en Insertion Sort',
    prompt:
      "El subarreglo ordenado int sorted[] = {2, 4, 6, 9} ya fue procesado y el siguiente elemento a insertar es key = 5 (arreglo completo [2, 4, 6, 9, 5]). Ingresa (a) el estado final del arreglo tras insertar key = 5 y (b) el número exacto de desplazamientos hacia la derecha que ocurren antes de insertar 5.",
    codeSnippet: '// Subarreglo ordenado: {2, 4, 6, 9} | Elemento a insertar: key = 5\nint arr[] = {2, 4, 6, 9, 5};',
    expectedCriteria:
      '(a) [2, 4, 5, 6, 9]. (b) Se compara primero con 9 (9>5, se desplaza), luego con 6 (6>5, se desplaza), luego con 4 (4<5, se detiene y se inserta después de 4). Ocurren exactamente 2 desplazamientos.',
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
    descriptor: 'Selecciona las órdenes en forma ordenada y secuencial',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar y justificar la estabilidad de Insertion Sort',
    prompt:
      "Completa la condición del while en esta implementación en C++ para que los elementos estrictamente mayores que 'key' se desplacen una posición a la derecha. Luego justifica por qué debe usarse arr[j] > key y no arr[j] >= key para preservar la estabilidad del algoritmo.",
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
      "arr[j] > key. Usar >= rompería la estabilidad: desplazaría también elementos iguales a 'key', invirtiendo su orden relativo original respecto al arreglo de entrada.",
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
      'Analiza ambos algoritmos —Bubble Sort Clásico y Selection Sort— sobre int arr[] = {6, 3, 8, 1, 5} (n = 5). Calcula e ingresa el total exacto de comparaciones e intercambios de cada uno, y justifica en qué escenario de hardware (como memoria Flash/EEPROM) Selection Sort resulta preferible pese a compartir complejidad O(n²).',
    codeSnippet: '// Comparación de métricas sobre el mismo dataset\nint arr[] = {6, 3, 8, 1, 5};\nint n = 5;',
    expectedCriteria:
      '(a) Bubble Sort: 10 comparaciones, 6 intercambios. Selection Sort: 10 comparaciones, 2 intercambios. (b) Ambos realizan n(n-1)/2 comparaciones en el peor caso. (c) Selection Sort realiza como máximo n-1 escrituras (intercambios), frente a hasta n(n-1)/2 en Bubble Sort, lo que lo hace preferible cuando cada escritura en memoria es costosa.',
    numericFieldsCheck: [
      { label: 'Total de comparaciones en Bubble Sort (n = 5):', expectedValue: 10 },
      { label: 'Total de intercambios en Bubble Sort sobre {6, 3, 8, 1, 5}:', expectedValue: 6 },
      { label: 'Total de comparaciones en Selection Sort (n = 5):', expectedValue: 10 },
      { label: 'Total de intercambios en Selection Sort sobre {6, 3, 8, 1, 5}:', expectedValue: 2 },
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
    descriptor: 'Selecciona las órdenes en forma ordenada y secuencial',
    abstraction: 'Básico',
    interactionType: 'Construcción manual',
    difficulty: 'Avanzado',
    title: 'Construir manualmente dos pasadas de Selection Sort',
    prompt:
      'Intercambia los elementos de int arr[] = {9, 4, 7, 2, 8, 1} haciendo clic en dos celdas para construir cómo queda el arreglo exactamente después de las DOS primeras pasadas completas de Selection Sort (i = 0 e i = 1). Indica además cuántos elementos del prefijo quedan garantizados en su posición final.',
    codeSnippet:
      '// Arreglo inicial\nint arr[] = {9, 4, 7, 2, 8, 1};\nint n = 6;\n// Construir estado tras 2 pasadas completas (i = 0, i = 1)',
    manualInitialArray: [9, 4, 7, 2, 8, 1],
    manualTargetArray: [1, 2, 7, 4, 8, 9],
    manualExtraField: {
      label: 'Cantidad de elementos del prefijo garantizados en su posición final tras 2 pasadas:',
      expectedValue: 2,
    },
    expectedCriteria:
      '[1, 2, 7, 4, 8, 9]. El prefijo [1, 2] (2 elementos, posiciones 0 y 1) queda garantizado en su posición final: el invariante de Selection Sort establece que tras la pasada i, los primeros i+1 elementos contienen los menores valores ordenados.',
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
    descriptor: 'Escoge los bloques de instrucciones necesarios para la solución del problema',
    abstraction: 'Básico',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el comportamiento de búsqueda lineal ante valores duplicados',
    prompt:
      'Sobre int arr[] = {4, 9, 2, 9, 6, 1}, buscando target = 9 con búsqueda lineal (el arreglo contiene dos ocurrencias de 9 en los índices 1 y 3). Ingresa (a) el índice exacto en que se detiene el algoritmo, (b) cuántas comparaciones realiza en total y justifica por qué no llega al índice 3.',
    codeSnippet: '// arr[] = {4, 9, 2, 9, 6, 1}\nint target = 9; // ocurrencias en índices 1 y 3',
    expectedCriteria:
      '(a) Índice 1. (b) La búsqueda lineal retorna en cuanto encuentra la primera coincidencia, sin continuar hacia la segunda ocurrencia (índice 3). (c) Realiza 2 comparaciones (arr[0] y arr[1]).',
    numericFieldsCheck: [
      { label: '(a) Índice exacto donde se detiene y retorna el algoritmo:', expectedValue: 1 },
      { label: '(c) Cantidad total de comparaciones realizadas:', expectedValue: 2 },
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
    descriptor: 'Selecciona instrucciones que llevan a otra instrucción',
    abstraction: 'Intermedio',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar búsqueda lineal para retornar TODAS las ocurrencias',
    prompt:
      "Completa la condición del if para que la función registre en el arreglo 'indices' TODOS los índices donde aparece 'target'. Luego justifica por qué NO debe usarse 'return' dentro del if, y ejecuta tu código en el visualizador.",
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
      "arr[i] == target. Usar 'return' dentro del if terminaría la función en la primera coincidencia, impidiendo recorrer el resto del arreglo y registrar las demás ocurrencias.",
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
    descriptor: 'Establece el orden lógico de las órdenes',
    abstraction: 'Intermedio',
    interactionType: 'Predicción',
    difficulty: 'Intermedio',
    title: 'Trazar paso a paso una búsqueda binaria sobre un arreglo mayor',
    prompt:
      'Sobre int arr[] = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72} (n = 10), buscando target = 23 con búsqueda binaria. Completa la tabla de traza indicando los valores exactos de los índices low, high y mid en cada una de las 3 iteraciones hasta encontrar el elemento.',
    codeSnippet: '// Índices 0..9: {2, 5, 8, 12, 16, 23, 38, 45, 56, 72}\nint target = 23;',
    expectedCriteria:
      'Paso 1: low=0, high=9, mid=4 (valor 16 < 23, descarta izquierda -> low=5). Paso 2: low=5, high=9, mid=7 (valor 45 > 23, descarta derecha -> high=6). Paso 3: low=5, high=6, mid=5 (valor 23 == 23, retorna índice 5).',
    traceTableCheck: {
      columns: ['low (inicio)', 'high (fin)', 'mid (medio)'],
      expectedRows: [
        [0, 9, 4],
        [5, 9, 7],
        [5, 6, 5],
      ],
      extraFieldLabel: 'Índice final retornado por la búsqueda binaria:',
      expectedExtraValue: 5,
    },
  },
  {
    id: 'T10',
    family: 'Búsqueda',
    algorithm: 'Búsqueda binaria',
    targetAlgorithmId: 'binary-search',
    presetDataset: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72],
    presetSearchTarget: 23,
    bloom: 'Aplicar',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona las órdenes en forma ordenada y secuencial',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: "Completar e interpretar una variante 'lower bound' de búsqueda binaria",
    prompt:
      "Completa la condición faltante de esta variante 'lower bound' en C++ que devuelve el primer índice donde podría insertarse 'target' manteniendo el orden. Presiona 'Compilar y Verificar' y justifica en qué se diferencia de la búsqueda binaria clásica.",
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
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72};
    int pos = lowerBound(arr, 10, 23);
    return pos;
}`,
    expectedCriteria:
      'arr[mid] < target. A diferencia de la búsqueda binaria clásica, esta variante nunca retorna -1: devuelve la posición de inserción y continúa reduciendo el intervalo para hallar la primera aparición posible.',
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
    descriptor: 'Ensaya el camino que va a trazar o la figura que va a realizar',
    abstraction: 'Básico',
    interactionType: 'Comparación',
    difficulty: 'Avanzado',
    title: 'Calcular y comparar la complejidad de búsqueda lineal vs. binaria a distintas escalas',
    prompt:
      'Compara búsqueda lineal y binaria sobre arreglos ordenados de n = 1,000 y n = 1,000,000 elementos. (a) Calcula el número máximo exacto de comparaciones de la búsqueda binaria en cada escala usando techo(log2(n+1)). (b) Justifica por qué para una única consulta sobre datos desordenados NO conviene ordenar primero.',
    codeSnippet: '// Escala 1: n = 1,000 elementos\n// Escala 2: n = 1,000,000 elementos\n// Cota: techo(log2(n + 1))',
    expectedCriteria:
      '(a) Para n=1,000: techo(log2(1001)) = 10 comparaciones. Para n=1,000,000: techo(log2(1000001)) = 20 comparaciones. (b) Si los datos no están ordenados y solo se hará una consulta, el costo de ordenar primero O(n log n) supera a una búsqueda lineal directa O(n).',
    numericFieldsCheck: [
      { label: '(a.1) Máximo de comparaciones en Búsqueda Binaria para n = 1,000:', expectedValue: 10 },
      { label: '(a.2) Máximo de comparaciones en Búsqueda Binaria para n = 1,000,000:', expectedValue: 20 },
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
    bloom: 'Evaluar',
    competence: 'Pensar lógicamente',
    indicator: 'Encuentra la relación entre objetos reales o abstractos',
    descriptor: 'Establece el orden lógico de las órdenes',
    abstraction: 'Intermedio',
    interactionType: 'Justificación',
    difficulty: 'Avanzado',
    title: 'Evaluar con una traza completa el uso incorrecto de búsqueda binaria',
    prompt:
      'Un compañero propone aplicar búsqueda binaria estándar sobre el arreglo DESORDENADO int arr[] = {9, 2, 7, 1, 5} buscando target = 1 (que sí existe en el índice 3). Completa la tabla de traza (low, high, mid) que ejecuta el algoritmo antes de terminar e indica qué valor retorna.',
    codeSnippet: '// arr[] = {9, 2, 7, 1, 5} (desordenado)\nint target = 1; // existe en el índice 3',
    expectedCriteria:
      'Paso 1: low=0, high=4, mid=2 (arr[2]=7 > 1, descarta derecha -> high=1). Paso 2: low=0, high=1, mid=0 (arr[0]=9 > 1, descarta derecha -> high=-1). El bucle termina y retorna -1 (incorrecto), demostrando que la precondición de orden es indispensable.',
    traceTableCheck: {
      columns: ['low (inicio)', 'high (fin)', 'mid (medio)'],
      expectedRows: [
        [0, 4, 2],
        [0, 1, 0],
      ],
      extraFieldLabel: 'Valor final retornado por la función (-1 si falla):',
      expectedExtraValue: -1,
    },
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
    title: 'Predecir el árbol completo de divisiones de Merge Sort',
    prompt:
      'Sobre int arr[] = {8, 3, 5, 1, 9, 2, 7, 4} (n = 8). Antes de recorrer el árbol de recursión, calcula (a) cuántos niveles de división se generan debajo de la raíz (log2(n)) y (b) cuántos nodos hoja (casos base de 1 elemento) se forman en el último nivel.',
    codeSnippet: '// arr[] = {8, 3, 5, 1, 9, 2, 7, 4} (n = 8)',
    expectedCriteria:
      'Nivel 1: [8,3,5,1] y [9,2,7,4]. Nivel 2: [8,3], [5,1], [9,2], [7,4]. Nivel 3: 8 hojas de 1 elemento. Son 3 niveles de división, consistentes con log2(8) = 3.',
    numericFieldsCheck: [
      { label: '(a) Cantidad de niveles de división (log2(8)):', expectedValue: 3 },
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
    descriptor: 'Selecciona las órdenes en forma ordenada y secuencial',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Intermedio',
    title: 'Completar y justificar la estabilidad de la función merge',
    prompt:
      "Completa la condición para decidir qué elemento (de 'left' o 'right') se copia primero al arreglo 'result' durante la mezcla para garantizar que Merge Sort sea ESTABLE. Luego justifica por qué debe usarse '<=' en lugar de '<'.",
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
      "left[i] <= right[j]. Con '<', un elemento igual proveniente de 'right' se insertaría antes que el de 'left', invirtiendo su orden original y perdiendo la estabilidad.",
  },
  {
    id: 'T15',
    family: 'Divide y vencerás',
    algorithm: 'Merge Sort',
    targetAlgorithmId: 'merge-sort',
    presetDataset: [6, 2, 7, 4, 9],
    bloom: 'Analizar',
    competence: 'Pensar iterativamente',
    indicator: 'Identifica un ciclo repetitivo',
    descriptor: 'Identifica las instrucciones que se repiten',
    abstraction: 'Básico',
    interactionType: 'Análisis de árbol de recursión',
    difficulty: 'Avanzado',
    title: 'Analizar el árbol de recursión de Merge Sort con un arreglo de tamaño impar',
    prompt:
      'Analiza int arr[] = {6, 2, 7, 4, 9} (n = 5, índices 0..4). (a) Calcula el índice medio mid = low + (high - low) / 2 en la primera llamada (low=0, high=4). (b) Calcula la altura del árbol con techo(log2(5)) y justifica por qué el costo total por nivel sigue acotado por O(n log n).',
    codeSnippet: '// mergeSort(arr, 0, 4);\n// arr[] = {6, 2, 7, 4, 9} (n = 5)',
    expectedCriteria:
      '(a) En la raíz (low=0, high=4), mid = 2, dividiendo en [0..2] ({6,2,7}) y [3..4] ({4,9}). (b) Altura = techo(log2(5)) = 3. (c) Cada nivel mezcla como máximo n elementos y la profundidad es O(log n), manteniendo la cota O(n log n).',
    numericFieldsCheck: [
      { label: '(a) Índice medio (mid) calculado en la primera división (low=0, high=4):', expectedValue: 2 },
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
    descriptor: 'Establece el orden lógico de las órdenes',
    abstraction: 'Intermedio',
    interactionType: 'Predicción',
    difficulty: 'Básico',
    title: 'Predecir el resultado completo de una partición de Quick Sort con duplicados',
    prompt:
      'Sobre int arr[] = {5, 9, 1, 6, 3, 3, 8}, usando Quick Sort con partición de Lomuto y pivote = último elemento (8). Ingresa en las celdas (a) el estado exacto del arreglo tras finalizar la primera partición y (b) el índice final donde queda ubicado el pivote 8.',
    codeSnippet: '// arr[] = {5, 9, 1, 6, 3, 3, 8}\n// pivote = arr[6] = 8 (esquema de Lomuto)',
    expectedCriteria:
      '[5, 1, 6, 3, 3, 8, 9], con el pivote (8) ubicado en el índice 5. Todos los menores que 8 (5, 1, 6, 3, 3) se agrupan en los índices 0..4 y el 9 queda en el índice 6.',
    arrayPredictionCheck: {
      initialArray: [5, 9, 1, 6, 3, 3, 8],
      expectedArray: [5, 1, 6, 3, 3, 8, 9],
      extraFieldLabel: '(b) Índice final exacto donde queda colocado el pivote (8):',
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
    descriptor: 'Selecciona las órdenes en forma ordenada y secuencial',
    abstraction: 'Básico',
    interactionType: 'Completar código',
    difficulty: 'Avanzado',
    title: 'Completar la partición de Quick Sort y evaluar su comportamiento con duplicados',
    prompt:
      "Completa la condición de la partición de Lomuto en C++ y presiona 'Compilar y Verificar' para ejecutarla en el motor AST. Luego justifica cómo afecta usar '<' frente a '<=' cuando el arreglo tiene muchos elementos repetidos iguales al pivote.",
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
    expectedBlanks: [['arr[j]<pivot', 'arr[j]<=pivot', 'pivot>arr[j]', 'pivot>=arr[j]']],
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
      "arr[j] < pivot (o <=). En arreglos con muchos duplicados iguales al pivote, la partición de Lomuto concentra todos los duplicados en un solo lado, produciendo particiones desbalanceadas O(n²); por ello se emplea partición de 3 vías (Dutch National Flag).",
  },
  {
    id: 'T18',
    family: 'Divide y vencerás',
    algorithm: 'Quick Sort',
    targetAlgorithmId: 'quick-sort',
    presetDataset: [8, 4, 7, 2, 9, 3],
    bloom: 'Crear',
    competence: 'Diseñar algoritmos',
    indicator: 'Crea una secuencia ordenada de instrucciones',
    descriptor: 'Selecciona las órdenes en forma ordenada y secuencial',
    abstraction: 'Básico',
    interactionType: 'Construcción manual',
    difficulty: 'Avanzado',
    title: 'Construir manualmente una partición de Quick Sort con verificación',
    prompt:
      'Intercambia las celdas de int arr[] = {8, 4, 7, 2, 9, 3} para construir el resultado exacto de la partición de Lomuto con pivote = 3 (último elemento). Indica además el índice final en que queda situado el pivote 3.',
    codeSnippet: '// arr[] = {8, 4, 7, 2, 9, 3}\n// pivote = arr[5] = 3 (esquema de Lomuto)',
    manualInitialArray: [8, 4, 7, 2, 9, 3],
    manualTargetArray: [2, 3, 7, 8, 9, 4],
    manualExtraField: {
      label: 'Índice final donde queda ubicado el pivote (3):',
      expectedValue: 1,
    },
    expectedCriteria:
      '[2, 3, 7, 8, 9, 4], con el pivote (3) en el índice 1. El único menor que 3 es 2 (queda en índice 0), luego se intercambia arr[1] con el pivote 3, dejando a la derecha [7, 8, 9, 4].',
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
    descriptor: 'Ensaya el camino que va a trazar o la figura que va a realizar',
    abstraction: 'Básico',
    interactionType: 'Justificación',
    difficulty: 'Avanzado',
    title: 'Evaluar y cuantificar el peor caso de Quick Sort, y proponer una mitigación',
    prompt:
      'Analiza Quick Sort ejecutado sobre el arreglo ya ordenado int arr[] = {1, 2, 3, 4, 5, 6} (n = 6), eligiendo siempre el último elemento como pivote. (a) Calcula el número exacto de comparaciones n(n-1)/2 y el tamaño del subarreglo izquierdo tras la primera partición. (b) Justifica una estrategia de elección de pivote para mitigar este peor caso.',
    codeSnippet: '// arr[] = {1, 2, 3, 4, 5, 6} (ya ordenado, n = 6)\n// pivote = arr[high] siempre',
    expectedCriteria:
      '(a) Cada partición deja un subarreglo de tamaño n-1 y otro vacío (0), sumando 5+4+3+2+1 = 15 comparaciones (O(n²)). (b) Usar mediana de tres (inicio, medio, fin) o pivote aleatorio evita particiones degeneradas en entradas ordenadas.',
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
    descriptor: 'Agrupa instrucciones dentro de un bloque repetitivo una cantidad de veces',
    abstraction: 'Avanzado',
    interactionType: 'Completar código',
    difficulty: 'Avanzado',
    title: 'Generalizar la estructura de doble ciclo de Bubble Sort para un arreglo de tamaño n',
    prompt:
      "Completa los límites de ambos ciclos anidados de Bubble Sort en función de 'n' e 'i', y presiona 'Compilar y Verificar' para ejecutar tu código sobre el motor AST. Justifica por qué el ciclo interno se reduce con 'i'.",
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
      'Primer blanco: n - 1. Segundo blanco: n - 1 - i (los últimos i elementos ya quedaron ubicados en su posición final en las pasadas previas, evitando comparaciones redundantes).',
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
    descriptor: 'Selecciona instrucciones finitas',
    abstraction: 'Avanzado',
    interactionType: 'Completar código',
    difficulty: 'Avanzado',
    title: 'Determinar la condición de parada que garantiza la finitud de la recursión en Merge Sort',
    prompt:
      "Completa la condición de caso base de Merge Sort recursivo para garantizar la finitud del algoritmo. Presiona 'Compilar y Verificar' (si pruebas 'left > right' verás cómo el motor AST detecta la recursión infinita en subarreglos de 1 elemento) y justifica tu respuesta.",
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

void mergeSort(int arr[], int left, int right) {
    if (__BLANK_1__) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
}

int main() {
    int arr[] = {8, 3, 5, 1};
    mergeSort(arr, 0, 3);
    return 0;
}`,
    expectedCriteria:
      "Blanco: left >= right. Con 'left > right', cuando left == right (subarreglo de 1 elemento), mid resulta igual a left y se invoca mergeSort(arr, left, left) infinitamente hasta agotar la pila de ejecución.",
  },
];

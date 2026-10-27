import * as acorn from 'acorn';
import type { Step, ArrayElement, MemoryFrame, StepLineHighlight, ElementState } from '../../types/trace';
import type { SupportedLanguage } from '../../types/algorithm';
import { normalizeCToJavaScript } from './cPreprocessor';

export interface ASTInstrumentationResult {
  success: boolean;
  steps?: Step[];
  error?: string;
  line?: number;
  column?: number;
  instrumentedCode?: string;
  detectedLanguage?: 'c' | 'javascript';
}

export interface VariableSnapshot {
  [key: string]: number | string | boolean | null | undefined;
}

export interface StudentTemplateItem {
  id: string;
  name: string;
  language: 'c' | 'javascript';
  category: 'sorting' | 'searching';
  code: string;
}

/**
 * Plantillas predeterminadas de algoritmos en C y JavaScript.
 */
export const STUDENT_CODE_TEMPLATES: Record<string, StudentTemplateItem> = {
  // --- Plantillas en Lenguaje C ---
  c_bubbleSort: {
    id: 'c_bubbleSort',
    name: '[C] Bubble Sort (Burbuja)',
    language: 'c',
    category: 'sorting',
    code: `// Bubble Sort en lenguaje C
void ordenar(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`.trim(),
  },
  c_selectionSort: {
    id: 'c_selectionSort',
    name: '[C] Selection Sort (Selección)',
    language: 'c',
    category: 'sorting',
    code: `// Selection Sort en lenguaje C
void ordenar(int arr[], int n) {
    int i, j, min, temp;
    for (i = 0; i < n - 1; i++) {
        min = i;
        for (j = i + 1; j < n; j++) {
            if (arr[j] < arr[min]) {
                min = j;
            }
        }
        if (min != i) {
            temp = arr[i];
            arr[i] = arr[min];
            arr[min] = temp;
        }
    }
}`.trim(),
  },
  c_insertionSort: {
    id: 'c_insertionSort',
    name: '[C] Insertion Sort (Inserción)',
    language: 'c',
    category: 'sorting',
    code: `// Insertion Sort en lenguaje C
void ordenar(int arr[], int n) {
    int i, j, clave;
    for (i = 1; i < n; i++) {
        clave = arr[i];
        j = i - 1;
        while (j >= 0 && arr[j] > clave) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = clave;
    }
}`.trim(),
  },
  c_linearSearch: {
    id: 'c_linearSearch',
    name: '[C] Búsqueda Lineal',
    language: 'c',
    category: 'searching',
    code: `// Búsqueda Lineal en lenguaje C
int buscar(int arr[], int n, int clave) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == clave) {
            return i;
        }
    }
    return -1;
}`.trim(),
  },
  c_binarySearch: {
    id: 'c_binarySearch',
    name: '[C] Búsqueda Binaria',
    language: 'c',
    category: 'searching',
    code: `// Búsqueda Binaria en C (requiere arreglo ordenado)
int buscar(int arr[], int n, int clave) {
    int inicio = 0;
    int fin = n - 1;
    while (inicio <= fin) {
        int medio = (inicio + fin) / 2;
        if (arr[medio] == clave) {
            return medio;
        }
        if (arr[medio] < clave) {
            inicio = medio + 1;
        } else {
            fin = medio - 1;
        }
    }
    return -1;
}`.trim(),
  },

  // --- Plantillas en JavaScript ---
  js_bubbleSort: {
    id: 'js_bubbleSort',
    name: '[JS] Bubble Sort (Burbuja)',
    language: 'javascript',
    category: 'sorting',
    code: `// Bubble Sort en JavaScript
function ordenar(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}`.trim(),
  },
  js_selectionSort: {
    id: 'js_selectionSort',
    name: '[JS] Selection Sort (Selección)',
    language: 'javascript',
    category: 'sorting',
    code: `// Selection Sort en JavaScript
function ordenar(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[min]) {
        min = j;
      }
    }
    if (min !== i) {
      let temp = arr[i];
      arr[i] = arr[min];
      arr[min] = temp;
    }
  }
}`.trim(),
  },
  js_insertionSort: {
    id: 'js_insertionSort',
    name: '[JS] Insertion Sort (Inserción)',
    language: 'javascript',
    category: 'sorting',
    code: `// Insertion Sort en JavaScript
function ordenar(arr) {
  let n = arr.length;
  for (let i = 1; i < n; i++) {
    let clave = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > clave) {
      arr[j + 1] = arr[j];
      j = j - 1;
    }
    arr[j + 1] = clave;
  }
}`.trim(),
  },
  js_linearSearch: {
    id: 'js_linearSearch',
    name: '[JS] Búsqueda Lineal',
    language: 'javascript',
    category: 'searching',
    code: `// Búsqueda Lineal en JavaScript
function buscar(arr, clave) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === clave) {
      return i;
    }
  }
  return -1;
}`.trim(),
  },
  js_binarySearch: {
    id: 'js_binarySearch',
    name: '[JS] Búsqueda Binaria',
    language: 'javascript',
    category: 'searching',
    code: `// Búsqueda Binaria en JavaScript
function buscar(arr, clave) {
  let inicio = 0;
  let fin = arr.length - 1;
  while (inicio <= fin) {
    let medio = Math.floor((inicio + fin) / 2);
    if (arr[medio] === clave) {
      return medio;
    }
    if (arr[medio] < clave) {
      inicio = medio + 1;
    } else {
      fin = medio - 1;
    }
  }
  return -1;
}`.trim(),
  },
};

/**
 * Validador sintáctico estricto usando Acorn (soporta C y JavaScript).
 */
export function validateStudentSyntax(sourceCode: string): { isValid: boolean; error?: string; line?: number; column?: number; detectedLanguage: 'c' | 'javascript' } {
  const { code: normalizedCode, detectedLanguage } = normalizeCToJavaScript(sourceCode);
  try {
    acorn.parse(normalizedCode, {
      ecmaVersion: 'latest',
      locations: true,
    });
    return { isValid: true, detectedLanguage };
  } catch (err: any) {
    const line = err.loc?.line;
    const column = err.loc?.column;
    const rawMessage = err.message ? err.message.replace(/\s*\(\d+:\d+\)$/, '') : 'Error de sintaxis desconocido';
    return {
      isValid: false,
      error: `Error de sintaxis en línea ${line}, columna ${column}: ${rawMessage}`,
      line,
      column,
      detectedLanguage,
    };
  }
}

/**
 * Motor de Instrumentación de AST (Enfoque 1: Generadores).
 * 
 * 1. Parsea el código con Acorn en un AST ESTree.
 * 2. Recorre el árbol e intercepta:
 *    - Sentencias: Inyecta yields de paso con número de línea y variables de entorno.
 *    - Comparaciones de arreglos: arr[j] > arr[k] => __comparar(arr, j, k, '>')
 *    - Comparaciones de clave: arr[i] === clave => __compararValor(arr, i, clave, '===')
 *    - Asignaciones a arreglos: arr[j] = val => __asignar(arr, j, val)
 * 3. Ejecuta la función generadora en un sandbox con límites de seguridad (máximo 1500 pasos).
 * 4. Retorna el array Step[] consumible directamente por el reproductor, memoria y visualizador.
 */
export function instrumentAndTraceStudentCode(
  sourceCode: string,
  initialDataset: number[],
  targetKey: number = 45,
  maxSteps: number = 1500
): ASTInstrumentationResult {
  // 1. Normalizar si es C / C++ preservando números de línea 1:1
  const { code: normalizedCode, detectedLanguage } = normalizeCToJavaScript(sourceCode);

  // Validar sintaxis con Acorn
  let ast: any;
  try {
    ast = acorn.parse(normalizedCode, {
      ecmaVersion: 'latest',
      locations: true,
    });
  } catch (err: any) {
    const line = err.loc?.line;
    const column = err.loc?.column;
    const msg = err.message ? err.message.replace(/\s*\(\d+:\d+\)$/, '') : 'Error de sintaxis';
    return {
      success: false,
      error: `Error de sintaxis (Acorn) en línea ${line}: ${msg}`,
      line,
      column,
      detectedLanguage,
    };
  }

  // 2. Extraer variables declaradas para incluirlas en el snapshot de memoria
  const declaredVariables = new Set<string>(['i', 'j', 'temp', 'min', 'clave', 'inicio', 'fin', 'medio', 'n', 'key', 'left', 'right', 'mid']);

  function findDeclarations(node: any) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclaration' && Array.isArray(node.declarations)) {
      for (const decl of node.declarations) {
        if (decl.id && decl.id.type === 'Identifier') {
          declaredVariables.add(decl.id.name);
        }
      }
    } else if (node.type === 'FunctionDeclaration' && Array.isArray(node.params)) {
      for (const p of node.params) {
        if (p.type === 'Identifier') declaredVariables.add(p.name);
      }
    }
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(findDeclarations);
      } else if (child && typeof child === 'object') {
        findDeclarations(child);
      }
    }
  }
  findDeclarations(ast);

  // Variables para serializar en el helper de snapshot
  const scopeVarTokens = Array.from(declaredVariables)
    .filter(v => v !== 'arr' && v !== 'Math' && v !== '__hooks')
    .map(v => `typeof ${v} !== 'undefined' ? { [${JSON.stringify(v)}]: ${v} } : {}`)
    .join(', ');

  // 3. Recolectar modificaciones de código (Source-to-Source)
  interface Replacement {
    start: number;
    end: number;
    text: string;
    priority: number; // Mayor prioridad se aplica primero en el mismo offset
  }
  const replacements: Replacement[] = [];

  // Helper para verificar si un nodo es arr[...]
  function isArrayAccess(node: any): boolean {
    return (
      node &&
      node.type === 'MemberExpression' &&
      !node.computed === false &&
      node.object &&
      node.object.type === 'Identifier' &&
      node.object.name === 'arr'
    );
  }

  // Detectar si hay una función principal declarada
  let mainFunctionName: string | null = null;

  function walk(node: any, parent: any) {
    if (!node || typeof node !== 'object') return;

    // Detectar función principal
    if (node.type === 'FunctionDeclaration') {
      if (!mainFunctionName && node.id) {
        mainFunctionName = node.id.name;
      }
      // Convertir function foo(...) a function* foo(...)
      const funcStart = node.start;
      replacements.push({
        start: funcStart,
        end: funcStart + 8, // 'function'
        text: 'function*',
        priority: 10,
      });
    }

    // A. Inyección de Yield en Sentencias
    const isStatement = [
      'VariableDeclaration',
      'ExpressionStatement',
      'IfStatement',
      'ForStatement',
      'WhileStatement',
      'ReturnStatement',
    ].includes(node.type);

    if (isStatement && parent && (parent.type === 'BlockStatement' || parent.type === 'Program')) {
      const line = node.loc?.start?.line ?? 1;
      const injection = `yield* __paso(${line}, () => Object.assign({}, ${scopeVarTokens})); `;
      replacements.push({
        start: node.start,
        end: node.start,
        text: injection,
        priority: 5,
      });
    }

    // B. Reemplazo de Comparaciones: arr[a] OP arr[b] o arr[a] OP clave
    if (node.type === 'BinaryExpression') {
      const op = node.operator;
      const isCompareOp = ['<', '>', '<=', '>=', '===', '==', '!==', '!='].includes(op);

      if (isCompareOp) {
        const leftIsArr = isArrayAccess(node.left);
        const rightIsArr = isArrayAccess(node.right);

        if (leftIsArr && rightIsArr) {
          const leftIdxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
          const rightIdxCode = normalizedCode.slice(node.right.property.start, node.right.property.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __comparar(arr, ${leftIdxCode}, ${rightIdxCode}, ${JSON.stringify(op)}))`,
            priority: 20,
          });
          return; // No recorrer hijos directos ya transformados
        } else if (leftIsArr) {
          const idxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
          const valCode = normalizedCode.slice(node.right.start, node.right.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __compararValor(arr, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, false))`,
            priority: 20,
          });
          return;
        } else if (rightIsArr) {
          const idxCode = normalizedCode.slice(node.right.property.start, node.right.property.end);
          const valCode = normalizedCode.slice(node.left.start, node.left.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __compararValor(arr, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, true))`,
            priority: 20,
          });
          return;
        }
      }
    }

    // C. Reemplazo de Asignaciones a Arreglos: arr[j] = valor
    if (node.type === 'AssignmentExpression') {
      if (isArrayAccess(node.left)) {
        const idxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
        const valCode = normalizedCode.slice(node.right.start, node.right.end);
        replacements.push({
          start: node.start,
          end: node.end,
          text: `(yield* __asignar(arr, ${idxCode}, ${valCode}))`,
          priority: 25,
        });
        return;
      }
    }

    // Recorrer hijos
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          walk(item, node);
        }
      } else if (child && typeof child === 'object') {
        walk(child, node);
      }
    }
  }

  walk(ast, null);

  // 4. Aplicar reemplazos ordenados de atrás hacia adelante para preservar offsets
  replacements.sort((a, b) => b.start - a.start || b.priority - a.priority);

  let transformedCode = normalizedCode;
  for (const rep of replacements) {
    transformedCode =
      transformedCode.slice(0, rep.start) +
      rep.text +
      transformedCode.slice(rep.end);
  }

  // Si hay una función declarada (ej. function ordenar(arr)), invocarla al final
  const invocation = mainFunctionName
    ? `\n  yield* ${mainFunctionName}(arr, __clave);\n`
    : '';

  // Envoltura completa del generador
  const generatorHeader = `
return function* (__initialArr, __clave, __hooks) {
  const { __paso, __comparar, __compararValor, __asignar, __intercambiar } = __hooks;
  const arr = __initialArr;

  function* swap(a, i, j) { yield* __intercambiar(a, i, j); }
  function* intercambiar(a, i, j) { yield* __intercambiar(a, i, j); }

  ${transformedCode}
  ${invocation}
};
`;

  // 5. Ejecutar la función generadora producida
  const steps: Step[] = [];
  const workingArray: number[] = [...initialDataset];
  let comparisonsCount = 0;
  let swapsCount = 0;
  let operationsCount = 0;

  // Estado del arreglo con identidades para renderizado D3
  let currentElements: ArrayElement[] = workingArray.map((val, idx) => ({
    id: `ast-item-${idx}-${val}`,
    value: val,
    originalIndex: idx,
    state: 'default',
    label: String(idx),
  }));

  function makeStep(
    line: number,
    explanation: string,
    operationType: Step['operationType'],
    vars: VariableSnapshot = {},
    customArray?: ArrayElement[]
  ): Step {
    operationsCount++;
    const arrCopy = (customArray || currentElements).map(el => ({ ...el }));

    // Frames para el panel de memoria
    const frames: MemoryFrame[] = [
      {
        id: 'frame-student',
        name: mainFunctionName ? `${mainFunctionName}(arr)` : 'CódigoEstudiante',
        isActive: true,
        variables: { ...vars, n: workingArray.length },
      },
      {
        id: 'frame-global',
        name: 'Entorno Global',
        isActive: false,
        variables: { n: workingArray.length },
      },
    ];

    // Mapeo unificado de línea activa
    const lineMap: Record<SupportedLanguage, number> = {
      pseudocode: line,
      python: line,
      cpp: line,
      java: line,
    };

    const highlights: StepLineHighlight[] = [
      {
        lineNumber: line,
        type: 'active',
        lineByLanguage: lineMap,
      },
    ];

    // Detectar índices activos de variables típicas
    const activeIndices: Record<string, number | undefined> = {};
    if (typeof vars.i === 'number') activeIndices.i = vars.i;
    if (typeof vars.j === 'number') activeIndices.j = vars.j;
    if (typeof vars.min === 'number') activeIndices.min = vars.min;
    if (typeof vars.medio === 'number') activeIndices.mid = vars.medio;
    if (typeof vars.clave === 'number') activeIndices.keyVal = vars.clave;

    return {
      stepIndex: steps.length + 1,
      totalSteps: 0,
      activeLine: line,
      activeLineByLang: lineMap,
      highlights,
      array: arrCopy,
      frames,
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
      activeIndices,
      operationType,
    };
  }

  // Hooks inyectados en el código del estudiante
  const hooks = {
    *__paso(line: number, getVarsFn: () => VariableSnapshot) {
      const vars = getVarsFn();
      steps.push(makeStep(line, `Ejecutando línea ${line}`, 'check', vars));
      yield;
    },

    *__comparar(arr: number[], i: number, j: number, op: string) {
      comparisonsCount++;
      const valI = arr[i];
      const valJ = arr[j];

      let res = false;
      switch (op) {
        case '<': res = valI < valJ; break;
        case '>': res = valI > valJ; break;
        case '<=': res = valI <= valJ; break;
        case '>=': res = valI >= valJ; break;
        case '===':
        case '==': res = valI === valJ; break;
        case '!==':
        case '!=': res = valI !== valJ; break;
      }

      // Marcar celdas comparadas
      const tempArray = currentElements.map((el, idx) => {
        if (idx === i || idx === j) {
          return { ...el, state: 'comparing' as const };
        }
        return { ...el, state: el.state === 'comparing' ? ('default' as const) : el.state };
      });

      steps.push(
        makeStep(
          1,
          `Comparando arr[${i}] (${valI}) ${op} arr[${j}] (${valJ}) → ${res ? 'Verdadero' : 'Falso'}`,
          'compare',
          { i, j },
          tempArray
        )
      );

      yield;
      return res;
    },

    *__compararValor(arr: number[], idx: number, val: number, op: string, reverse: boolean) {
      comparisonsCount++;
      const arrVal = arr[idx];

      let res = false;
      if (reverse) {
        switch (op) {
          case '<': res = val < arrVal; break;
          case '>': res = val > arrVal; break;
          case '<=': res = val <= arrVal; break;
          case '>=': res = val >= arrVal; break;
          case '===':
          case '==': res = val === arrVal; break;
          case '!==':
          case '!=': res = val !== arrVal; break;
        }
      } else {
        switch (op) {
          case '<': res = arrVal < val; break;
          case '>': res = arrVal > val; break;
          case '<=': res = arrVal <= val; break;
          case '>=': res = arrVal >= val; break;
          case '===':
          case '==': res = arrVal === val; break;
          case '!==':
          case '!=': res = arrVal !== val; break;
        }
      }

      const tempArray = currentElements.map((el, index) => {
        if (index === idx) {
          const nextState: ElementState = res ? 'sorted' : 'comparing';
          return { ...el, state: nextState };
        }
        return el;
      });

      steps.push(
        makeStep(
          1,
          `Evaluando arr[${idx}] (${arrVal}) ${op} ${val} → ${res ? 'Coincidencia' : 'No coincide'}`,
          'compare',
          { i: idx, clave: val },
          tempArray
        )
      );

      yield;
      return res;
    },

    *__asignar(arr: number[], idx: number, value: number) {
      swapsCount++;
      arr[idx] = value;

      // Actualizar representación visual
      currentElements = currentElements.map((el, i) => {
        if (i === idx) {
          return { ...el, value, state: 'swapped' as const };
        }
        return el;
      });

      steps.push(
        makeStep(
          1,
          `Asignación: arr[${idx}] ← ${value}`,
          'assign',
          { idx, value },
          currentElements
        )
      );

      yield;
      return value;
    },

    *__intercambiar(arr: number[], i: number, j: number) {
      swapsCount++;
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;

      const tempEl = currentElements[i];
      currentElements[i] = { ...currentElements[j], state: 'swapped' };
      currentElements[j] = { ...tempEl, state: 'swapped' };

      steps.push(
        makeStep(
          1,
          `Intercambio: arr[${i}] ⇄ arr[${j}] (${arr[i]} ⇄ ${arr[j]})`,
          'swap',
          { i, j }
        )
      );
      yield;
    },
  };

  // 6. Instanciación segura y ejecución del generador
  try {
    const factory = new Function(generatorHeader);
    const generatorFn = factory();
    const iterator = generatorFn(workingArray, targetKey, hooks);

    let next = iterator.next();
    while (!next.done) {
      if (steps.length > maxSteps) {
        return {
          success: false,
          error: `Límite de seguridad de ${maxSteps} pasos excedido. Verifique que los bucles finalicen correctamente.`,
          instrumentedCode: transformedCode,
        };
      }
      next = iterator.next();
    }

    // Paso final de finalización
    const finalArray = currentElements.map(el => ({ ...el, state: 'sorted' as const }));
    steps.push(makeStep(1, 'Algoritmo completado con éxito.', 'finish', {}, finalArray));

    // Actualizar totalSteps en cada paso
    steps.forEach(s => {
      s.totalSteps = steps.length;
    });

    return {
      success: true,
      steps,
      instrumentedCode: transformedCode,
    };
  } catch (runtimeErr: any) {
    return {
      success: false,
      error: `Error de ejecución: ${runtimeErr.message || 'Error en tiempo de ejecución'}`,
      instrumentedCode: transformedCode,
    };
  }
}

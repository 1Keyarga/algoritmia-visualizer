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

/**
 * Código inicial base desde cero en lenguaje C.
 * Estructura completa estándar con inclusión de cabeceras y función main().
 */
export const GENERAL_C_STARTER = `#include <stdio.h>

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
}

int main() {
    int arr[] = { 64, 34, 25, 12, 22, 11, 90 };
    int n = sizeof(arr) / sizeof(arr[0]);
    ordenar(arr, n);
    return 0;
}`;

/**
 * Código inicial base desde cero en JavaScript.
 * Estructura completa con función de ordenamiento y función main().
 */
export const GENERAL_JS_STARTER = `function ordenar(arr, n) {
    let i, j, temp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

function main() {
    let arr = [64, 34, 25, 12, 22, 11, 90];
    let n = arr.length;
    ordenar(arr, n);
}`;

/**
 * Validador sintáctico para C y JavaScript.
 */
export function validateStudentSyntax(sourceCode: string): {
  isValid: boolean;
  error?: string;
  line?: number;
  column?: number;
  detectedLanguage: 'c' | 'javascript';
} {
  const { code: normalizedCode, detectedLanguage } = normalizeCToJavaScript(sourceCode);

  try {
    acorn.parse(normalizedCode, {
      ecmaVersion: 'latest',
      locations: true,
    });
    return { isValid: true, detectedLanguage };
  } catch (err: any) {
    const line = err.loc?.line ?? 1;
    const column = err.loc?.column ?? 0;
    const rawMessage = err.message ? err.message.replace(/\s*\(\d+:\d+\)$/, '') : 'Error de sintaxis';
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
 * Motor de Trazado e Instrumentación de Código del Estudiante.
 * 
 * 1. Normaliza el código fuente (C o JavaScript) preservando los números de línea 1:1.
 * 2. Analiza el AST para interceptar comparaciones, intercambios y asignaciones.
 * 3. Ejecuta la traza paso a paso registrando el estado de memoria y variables.
 */
export function instrumentAndTraceStudentCode(
  sourceCode: string,
  initialDataset: number[],
  targetKey: number = 45,
  maxSteps: number = 2000
): ASTInstrumentationResult {
  // 1. Normalizar si es C / C++ preservando números de línea 1:1
  const { code: normalizedCode, detectedLanguage, mainArrayValues } = normalizeCToJavaScript(sourceCode);

  // Validar sintaxis
  let ast: any;
  try {
    ast = acorn.parse(normalizedCode, {
      ecmaVersion: 'latest',
      locations: true,
    });
  } catch (err: any) {
    const line = err.loc?.line ?? 1;
    const column = err.loc?.column ?? 0;
    const msg = err.message ? err.message.replace(/\s*\(\d+:\d+\)$/, '') : 'Error de sintaxis';
    return {
      success: false,
      error: `Error de sintaxis en línea ${line}: ${msg}`,
      line,
      column,
      detectedLanguage,
    };
  }

  // 2. Extraer variables y funciones declaradas
  const declaredVariables = new Set<string>([
    'i', 'j', 'temp', 'min', 'clave', 'inicio', 'fin', 'medio', 'n', 'key', 'left', 'right', 'mid'
  ]);
  const declaredFunctions = new Set<string>();
  let firstDeclaredFunction: string | null = null;

  function findDeclarations(node: any) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclaration' && Array.isArray(node.declarations)) {
      for (const decl of node.declarations) {
        if (decl.id && decl.id.type === 'Identifier') {
          declaredVariables.add(decl.id.name);
        }
      }
    } else if (node.type === 'FunctionDeclaration') {
      if (node.id && node.id.name) {
        declaredFunctions.add(node.id.name);
        if (!firstDeclaredFunction) {
          firstDeclaredFunction = node.id.name;
        }
      }
      if (Array.isArray(node.params)) {
        for (const p of node.params) {
          if (p.type === 'Identifier') declaredVariables.add(p.name);
        }
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

  // 3. Modificaciones de código (Source-to-Source)
  interface Replacement {
    start: number;
    end: number;
    text: string;
    priority: number;
  }
  const replacements: Replacement[] = [];

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

  function walk(node: any, parent: any) {
    if (!node || typeof node !== 'object') return;

    // Convertir funciones normales a generadores (function* foo)
    if (node.type === 'FunctionDeclaration') {
      const funcStart = node.start;
      replacements.push({
        start: funcStart,
        end: funcStart + 8, // 'function'
        text: 'function*',
        priority: 10,
      });
    }

    // Convertir llamadas a funciones del usuario en llamadas delegadas yield*
    if (
      node.type === 'CallExpression' &&
      node.callee &&
      node.callee.type === 'Identifier' &&
      declaredFunctions.has(node.callee.name)
    ) {
      replacements.push({
        start: node.start,
        end: node.start,
        text: '(yield* ',
        priority: 15,
      });
      replacements.push({
        start: node.end,
        end: node.end,
        text: ')',
        priority: 15,
      });
    }

    // Inyección de paso en sentencias ejecutables
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

    // Interceptar comparaciones sobre el arreglo arr
    if (node.type === 'BinaryExpression') {
      const op = node.operator;
      const isCompareOp = ['<', '>', '<=', '>=', '===', '==', '!==', '!='].includes(op);

      if (isCompareOp) {
        const line = node.loc?.start?.line ?? 1;
        const leftIsArr = isArrayAccess(node.left);
        const rightIsArr = isArrayAccess(node.right);

        if (leftIsArr && rightIsArr) {
          const leftIdxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
          const rightIdxCode = normalizedCode.slice(node.right.property.start, node.right.property.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __comparar(arr, ${leftIdxCode}, ${rightIdxCode}, ${JSON.stringify(op)}, ${line}))`,
            priority: 20,
          });
          return;
        } else if (leftIsArr) {
          const idxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
          const valCode = normalizedCode.slice(node.right.start, node.right.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __compararValor(arr, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, false, ${line}))`,
            priority: 20,
          });
          return;
        } else if (rightIsArr) {
          const idxCode = normalizedCode.slice(node.right.property.start, node.right.property.end);
          const valCode = normalizedCode.slice(node.left.start, node.left.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __compararValor(arr, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, true, ${line}))`,
            priority: 20,
          });
          return;
        }
      }
    }

    // Interceptar asignaciones sobre el arreglo arr: arr[j] = valor
    if (node.type === 'AssignmentExpression') {
      if (isArrayAccess(node.left)) {
        const line = node.loc?.start?.line ?? 1;
        const idxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
        const valCode = normalizedCode.slice(node.right.start, node.right.end);
        replacements.push({
          start: node.start,
          end: node.end,
          text: `(yield* __asignar(arr, ${idxCode}, ${valCode}, ${line}))`,
          priority: 25,
        });
        return;
      }
    }

    // Recorrer nodos hijos
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

  // Aplicar reemplazos de atrás hacia adelante
  replacements.sort((a, b) => b.start - a.start || b.priority - a.priority);

  let transformedCode = normalizedCode;
  for (const rep of replacements) {
    transformedCode =
      transformedCode.slice(0, rep.start) +
      rep.text +
      transformedCode.slice(rep.end);
  }

  // Punto de entrada: ejecutar main() si existe, o la primera función declarada
  let invocation = '';
  if (declaredFunctions.has('main')) {
    invocation = '\n  yield* main();\n';
  } else if (firstDeclaredFunction) {
    invocation = `\n  yield* ${firstDeclaredFunction}(arr, arr.length, __clave);\n`;
  }

  // Envoltura completa del generador
  const generatorHeader = `
return function* (__initialArr, __clave, __hooks) {
  const { __paso, __comparar, __compararValor, __asignar, __intercambiar } = __hooks;
  let arr = __initialArr;

  function* swap(a, i, j) { yield* __intercambiar(a, i, j); }
  function* intercambiar(a, i, j) { yield* __intercambiar(a, i, j); }

  ${transformedCode}
  ${invocation}
};
`;

  // 4. Inicializar conjunto de datos
  // Si el estudiante definió un arreglo literal en su código, usar ese exactamente
  const workingArray: number[] =
    mainArrayValues && mainArrayValues.length > 0
      ? [...mainArrayValues]
      : [...initialDataset];

  const steps: Step[] = [];
  let comparisonsCount = 0;
  let swapsCount = 0;
  let operationsCount = 0;

  // Estado del arreglo con identidades
  let currentElements: ArrayElement[] = workingArray.map((val, idx) => ({
    id: `student-item-${idx}-${val}`,
    value: val,
    originalIndex: idx,
    state: 'default' as ElementState,
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

    const activeFrameName = declaredFunctions.has('main')
      ? 'main()'
      : firstDeclaredFunction
      ? `${firstDeclaredFunction}(arr)`
      : 'Programa';

    const frames: MemoryFrame[] = [
      {
        id: 'frame-student',
        name: activeFrameName,
        isActive: true,
        variables: { ...vars, n: workingArray.length },
      },
      {
        id: 'frame-global',
        name: 'Memoria Global',
        isActive: false,
        variables: { n: workingArray.length },
      },
    ];

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

    const activeIndices: Record<string, number | undefined> = {};
    if (typeof vars.i === 'number') activeIndices.i = vars.i;
    if (typeof vars.j === 'number') activeIndices.j = vars.j;
    if (typeof vars.min === 'number') activeIndices.min = vars.min;
    if (typeof vars.medio === 'number') activeIndices.mid = vars.medio;
    if (typeof vars.clave === 'number') activeIndices.keyVal = vars.clave;
    if (typeof vars.left === 'number') activeIndices.left = vars.left;
    if (typeof vars.right === 'number') activeIndices.right = vars.right;

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

  // Hooks interceptores
  const hooks = {
    *__paso(line: number, getVarsFn: () => VariableSnapshot) {
      const vars = getVarsFn();
      steps.push(makeStep(line, `Ejecución de línea ${line}`, 'check', vars));
      yield;
    },

    *__comparar(arr: number[], i: number, j: number, op: string, line: number = 1) {
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

      const tempArray = currentElements.map((el, idx) => {
        if (idx === i || idx === j) {
          return { ...el, state: 'comparing' as ElementState };
        }
        return el;
      });

      steps.push(
        makeStep(
          line,
          `Comparación: arr[${i}] (${valI}) ${op} arr[${j}] (${valJ}) → ${res ? 'Verdadero' : 'Falso'}`,
          'compare',
          { i, j },
          tempArray
        )
      );

      yield;
      return res;
    },

    *__compararValor(arr: number[], idx: number, val: number, op: string, reverse: boolean, line: number = 1) {
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
          line,
          `Evaluando arr[${idx}] (${arrVal}) ${op} ${val} → ${res ? 'Coincidencia' : 'No coincide'}`,
          'compare',
          { i: idx, clave: val },
          tempArray
        )
      );

      yield;
      return res;
    },

    *__asignar(arr: number[], idx: number, value: number, line: number = 1) {
      swapsCount++;
      arr[idx] = value;

      currentElements = currentElements.map((el, i) => {
        if (i === idx) {
          return { ...el, value, state: 'swapped' as const };
        }
        return el;
      });

      steps.push(
        makeStep(
          line,
          `Asignación: arr[${idx}] ← ${value}`,
          'assign',
          { idx, value },
          currentElements
        )
      );

      yield;
      return value;
    },

    *__intercambiar(arr: number[], i: number, j: number, line: number = 1) {
      swapsCount++;
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;

      const tempEl = currentElements[i];
      currentElements[i] = { ...currentElements[j], state: 'swapped' };
      currentElements[j] = { ...tempEl, state: 'swapped' };

      steps.push(
        makeStep(
          line,
          `Intercambio: arr[${i}] ⇄ arr[${j}] (${arr[i]} ⇄ ${arr[j]})`,
          'swap',
          { i, j }
        )
      );
      yield;
    },
  };

  // 5. Instanciación y ejecución del generador
  try {
    const factory = new Function(generatorHeader);
    const generatorFn = factory();
    const iterator = generatorFn(workingArray, targetKey, hooks);

    let current = iterator.next();
    let stepsCounter = 0;

    while (!current.done && stepsCounter < maxSteps) {
      stepsCounter++;
      current = iterator.next();
    }

    if (stepsCounter >= maxSteps) {
      return {
        success: false,
        error: `Límite de seguridad alcanzado (${maxSteps} pasos). Verifique posibles bucles infinitos en el algoritmo.`,
        detectedLanguage,
      };
    }

    if (steps.length === 0) {
      // Si el código no ejecutó ningún bucle o sentencia medible, crear al menos un paso inicial
      steps.push(makeStep(1, 'Código ejecutado sin operaciones sobre el arreglo', 'finish'));
    }

    // Actualizar totalSteps en cada paso
    const total = steps.length;
    for (let i = 0; i < total; i++) {
      steps[i].stepIndex = i;
      steps[i].totalSteps = total;
    }

    return {
      success: true,
      steps,
      instrumentedCode: transformedCode,
      detectedLanguage,
    };
  } catch (runtimeErr: any) {
    const msg = runtimeErr.message || 'Error durante la ejecución';
    return {
      success: false,
      error: `Error de ejecución: ${msg}`,
      detectedLanguage,
    };
  }
}

import * as acorn from 'acorn';
import type {
  Step,
  ArrayElement,
  NamedArrayState,
  MemoryFrame,
  StepLineHighlight,
  ElementState,
} from '../../types/trace';
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
  [key: string]: any;
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
 * 2. Soporta cualquier nombre de arreglo (arr, datos, vector, aux, etc.) y múltiples arreglos simultáneos.
 * 3. Analiza el AST para interceptar comparaciones, intercambios y asignaciones sobre cualquier arreglo.
 * 4. Ejecuta la traza paso a paso registrando el estado de todos los arreglos y variables de ámbito.
 */
export function instrumentAndTraceStudentCode(
  sourceCode: string,
  initialDataset: number[],
  targetKey: number = 45,
  maxSteps: number = 2000
): ASTInstrumentationResult {
  // 1. Normalizar si es C / C++ preservando números de línea 1:1
  const { code: normalizedCode, detectedLanguage, mainArrayValues, primaryArrayName } =
    normalizeCToJavaScript(sourceCode);

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

  // 2. Extraer todas las variables, parámetros y funciones declaradas por el estudiante
  const declaredVariables = new Set<string>([
    'arr', 'i', 'j', 'k', 'temp', 'min', 'clave', 'inicio', 'fin', 'medio', 'n', 'key', 'left', 'right', 'mid'
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

  // Variables para serializar en el helper de snapshot (tanto escalares como arreglos).
  // Se usa try/catch porque typeof no evita el error en la Temporal Dead Zone de let/const.
  const scopeVarTokens = Array.from(declaredVariables)
    .filter(v => v !== 'Math' && v !== '__hooks' && v !== '__initialArr' && v !== '__clave')
    .map(v => `(function(){try{return{[${JSON.stringify(v)}]:${v}}}catch(e){return{}}})()`)
    .join(', ');

  const snapshotExpr = `() => Object.assign({}, ${scopeVarTokens})`;

  // 3. Modificaciones de código (Source-to-Source)
  interface Replacement {
    start: number;
    end: number;
    text: string;
    priority: number;
  }
  const replacements: Replacement[] = [];

  // Detecta cualquier acceso indexado sobre un identificador: arr[i], datos[j], aux[k], etc.
  function isArrayAccess(node: any): boolean {
    return Boolean(
      node &&
      node.type === 'MemberExpression' &&
      node.computed === true &&
      node.object &&
      node.object.type === 'Identifier'
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
      const injection = `yield* __paso(${line}, ${snapshotExpr}); `;
      replacements.push({
        start: node.start,
        end: node.start,
        text: injection,
        priority: 5,
      });
    }

    // Interceptar comparaciones sobre cualquier arreglo (arr[i] > arr[j], izq[i] <= der[j], datos[i] == clave)
    if (node.type === 'BinaryExpression') {
      const op = node.operator;
      const isCompareOp = ['<', '>', '<=', '>=', '===', '==', '!==', '!='].includes(op);

      if (isCompareOp) {
        const line = node.loc?.start?.line ?? 1;
        const leftIsArr = isArrayAccess(node.left);
        const rightIsArr = isArrayAccess(node.right);

        if (leftIsArr && rightIsArr) {
          const leftArrName = node.left.object.name;
          const rightArrName = node.right.object.name;
          const leftIdxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
          const rightIdxCode = normalizedCode.slice(node.right.property.start, node.right.property.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __comparar(${leftArrName}, ${JSON.stringify(leftArrName)}, ${leftIdxCode}, ${rightArrName}, ${JSON.stringify(rightArrName)}, ${rightIdxCode}, ${JSON.stringify(op)}, ${line}, ${snapshotExpr}))`,
            priority: 20,
          });
          return;
        } else if (leftIsArr) {
          const arrName = node.left.object.name;
          const idxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
          const valCode = normalizedCode.slice(node.right.start, node.right.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __compararValor(${arrName}, ${JSON.stringify(arrName)}, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, false, ${line}, ${snapshotExpr}))`,
            priority: 20,
          });
          return;
        } else if (rightIsArr) {
          const arrName = node.right.object.name;
          const idxCode = normalizedCode.slice(node.right.property.start, node.right.property.end);
          const valCode = normalizedCode.slice(node.left.start, node.left.end);
          replacements.push({
            start: node.start,
            end: node.end,
            text: `(yield* __compararValor(${arrName}, ${JSON.stringify(arrName)}, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, true, ${line}, ${snapshotExpr}))`,
            priority: 20,
          });
          return;
        }
      }
    }

    // Interceptar asignaciones sobre cualquier arreglo: nombreArr[j] = valor
    if (node.type === 'AssignmentExpression') {
      if (isArrayAccess(node.left)) {
        const line = node.loc?.start?.line ?? 1;
        const arrName = node.left.object.name;
        const idxCode = normalizedCode.slice(node.left.property.start, node.left.property.end);
        const valCode = normalizedCode.slice(node.right.start, node.right.end);
        replacements.push({
          start: node.start,
          end: node.end,
          text: `(yield* __asignar(${arrName}, ${JSON.stringify(arrName)}, ${idxCode}, ${valCode}, ${line}, ${snapshotExpr}))`,
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

  // 4. Inicializar conjunto de datos de respaldo
  const fallbackArray: number[] =
    mainArrayValues && mainArrayValues.length > 0
      ? [...mainArrayValues]
      : [...initialDataset];

  const steps: Step[] = [];
  let comparisonsCount = 0;
  let swapsCount = 0;
  let operationsCount = 0;

  // Mapa de todos los arreglos rastreados por referencia en memoria
  interface TrackedArrayEntry {
    idPrefix: string;
    name: string;
    ref: number[];
    elements: ArrayElement[];
  }
  const trackedArrays = new Map<number[], TrackedArrayEntry>();
  let arrayCounter = 0;

  function ensureTrackedArray(arrRef: number[], preferredName: string): TrackedArrayEntry {
    let entry = trackedArrays.get(arrRef);
    if (!entry) {
      arrayCounter++;
      const prefix = `arr-${arrayCounter}`;
      const elements: ArrayElement[] = arrRef.map((val, idx) => ({
        id: `${prefix}-item-${idx}`,
        value: Number(val) || 0,
        originalIndex: idx,
        state: 'default' as ElementState,
        label: String(idx),
      }));
      entry = {
        idPrefix: prefix,
        name: preferredName,
        ref: arrRef,
        elements,
      };
      trackedArrays.set(arrRef, entry);
    } else {
      if (preferredName && preferredName !== '__initialArr') {
        entry.name = preferredName;
      }
      // Sincronizar longitud y valores si el arreglo mutó directamente (ej. push o inicialización)
      if (entry.elements.length !== arrRef.length) {
        entry.elements = arrRef.map((val, idx) => ({
          id: `${entry!.idPrefix}-item-${idx}`,
          value: Number(val) || 0,
          originalIndex: idx,
          state: 'default' as ElementState,
          label: String(idx),
        }));
      } else {
        for (let i = 0; i < arrRef.length; i++) {
          entry.elements[i].value = Number(arrRef[i]) || 0;
        }
      }
    }
    return entry;
  }

  // Registrar el arreglo de respaldo inicial por si el usuario aún no inicializa su arreglo en la línea 1
  ensureTrackedArray(fallbackArray, primaryArrayName || 'arr');

  function extractScopeAndArrays(
    rawVars: VariableSnapshot,
    highlightOverrides?: Map<number[], Map<number, { state: ElementState; indicator?: string }>>
  ): {
    scalarVars: Record<string, string | number | boolean | null | undefined>;
    namedArrays: NamedArrayState[];
    primaryElements: ArrayElement[];
  } {
    const scalarVars: Record<string, string | number | boolean | null | undefined> = {};
    const activeArrayRefs = new Set<number[]>();

    for (const [key, val] of Object.entries(rawVars)) {
      if (Array.isArray(val)) {
        // Ignorar el arreglo fallback inyectado si el estudiante declaró sus propios arreglos en main()
        if (key === 'arr' && val === fallbackArray && declaredFunctions.has('main') && trackedArrays.size > 1) {
          continue;
        }
        ensureTrackedArray(val, key);
        activeArrayRefs.add(val);
        scalarVars[key] = `→ [0..${ Math.max(0, val.length - 1) }]`;
      } else if (
        typeof val === 'number' ||
        typeof val === 'boolean' ||
        typeof val === 'string' ||
        val === null
      ) {
        scalarVars[key] = val;
      }
    }

    // Si en este paso ya se habían registrado arreglos del usuario, eliminar el fallbackArray si no se usa
    const userArrayEntries = Array.from(trackedArrays.values()).filter(e => e.ref !== fallbackArray);
    const entriesToRender =
      userArrayEntries.length > 0 ? userArrayEntries : Array.from(trackedArrays.values());

    const namedArrays: NamedArrayState[] = entriesToRender.map(entry => {
      const overridesForThisArray = highlightOverrides?.get(entry.ref);
      const clonedElements = entry.elements.map((el, idx) => {
        const override = overridesForThisArray?.get(idx);
        if (override) {
          return {
            ...el,
            state: override.state,
            nonColorIndicator: override.indicator,
          };
        }
        return { ...el };
      });
      return {
        name: entry.name,
        elements: clonedElements,
      };
    });

    const primaryElements =
      namedArrays.length > 0
        ? namedArrays[0].elements
        : fallbackArray.map((v, i) => ({
            id: `fallback-${i}`,
            value: v,
            originalIndex: i,
            state: 'default' as ElementState,
          }));

    return { scalarVars, namedArrays, primaryElements };
  }

  function resetTransientStates() {
    for (const entry of trackedArrays.values()) {
      for (const el of entry.elements) {
        if (el.state === 'comparing' || el.state === 'swapped') {
          el.state = 'default';
          el.nonColorIndicator = undefined;
        }
      }
    }
  }

  function makeStep(
    line: number,
    explanation: string,
    operationType: Step['operationType'],
    rawVars: VariableSnapshot = {},
    highlightOverrides?: Map<number[], Map<number, { state: ElementState; indicator?: string }>>
  ): Step {
    operationsCount++;
    const { scalarVars, namedArrays, primaryElements } = extractScopeAndArrays(
      rawVars,
      highlightOverrides
    );

    const activeFrameName = declaredFunctions.has('main')
      ? 'main()'
      : firstDeclaredFunction
      ? `${firstDeclaredFunction}()`
      : 'Programa';

    const frames: MemoryFrame[] = [
      {
        id: 'frame-student',
        name: activeFrameName,
        isActive: true,
        variables: scalarVars,
      },
      {
        id: 'frame-global',
        name: 'Memoria Global',
        isActive: false,
        variables: { n: primaryElements.length },
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
    if (typeof rawVars.i === 'number') activeIndices.i = rawVars.i;
    if (typeof rawVars.j === 'number') activeIndices.j = rawVars.j;
    if (typeof rawVars.k === 'number') activeIndices.k = rawVars.k;
    if (typeof rawVars.min === 'number') activeIndices.min = rawVars.min;
    if (typeof rawVars.medio === 'number') activeIndices.mid = rawVars.medio;
    if (typeof rawVars.mid === 'number') activeIndices.mid = rawVars.mid;
    if (typeof rawVars.clave === 'number') activeIndices.keyVal = rawVars.clave;
    if (typeof rawVars.inicio === 'number') activeIndices.left = rawVars.inicio;
    if (typeof rawVars.left === 'number') activeIndices.left = rawVars.left;
    if (typeof rawVars.fin === 'number') activeIndices.right = rawVars.fin;
    if (typeof rawVars.right === 'number') activeIndices.right = rawVars.right;

    return {
      stepIndex: steps.length + 1,
      totalSteps: 0,
      activeLine: line,
      activeLineByLang: lineMap,
      highlights,
      array: primaryElements,
      namedArrays,
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

  // Hooks interceptores universales para cualquier arreglo
  const hooks = {
    *__paso(line: number, getVarsFn: () => VariableSnapshot) {
      resetTransientStates();
      const vars = getVarsFn();
      steps.push(makeStep(line, `Ejecución de sentencia en línea ${line}`, 'check', vars));
      yield;
    },

    *__comparar(
      leftArr: number[],
      leftName: string,
      i: number,
      rightArr: number[],
      rightName: string,
      j: number,
      op: string,
      line: number = 1,
      getVarsFn?: () => VariableSnapshot
    ) {
      resetTransientStates();
      comparisonsCount++;
      const valI = Array.isArray(leftArr) ? leftArr[i] : undefined;
      const valJ = Array.isArray(rightArr) ? rightArr[j] : undefined;

      let res = false;
      switch (op) {
        case '<': res = (valI as any) < (valJ as any); break;
        case '>': res = (valI as any) > (valJ as any); break;
        case '<=': res = (valI as any) <= (valJ as any); break;
        case '>=': res = (valI as any) >= (valJ as any); break;
        case '===':
        case '==': res = valI === valJ; break;
        case '!==':
        case '!=': res = valI !== valJ; break;
      }

      if (Array.isArray(leftArr)) ensureTrackedArray(leftArr, leftName);
      if (Array.isArray(rightArr)) ensureTrackedArray(rightArr, rightName);

      const overrides = new Map<number[], Map<number, { state: ElementState; indicator?: string }>>();
      if (Array.isArray(leftArr)) {
        const m = new Map<number, { state: ElementState; indicator?: string }>();
        m.set(i, { state: 'comparing', indicator: '?' });
        overrides.set(leftArr, m);
      }
      if (Array.isArray(rightArr)) {
        const m = overrides.get(rightArr) || new Map<number, { state: ElementState; indicator?: string }>();
        m.set(j, { state: 'comparing', indicator: '?' });
        overrides.set(rightArr, m);
      }

      const vars = getVarsFn ? getVarsFn() : { i, j };
      steps.push(
        makeStep(
          line,
          `Comparación: ${leftName}[${i}] (${valI}) ${op} ${rightName}[${j}] (${valJ}) → ${res ? 'Verdadero' : 'Falso'}`,
          'compare',
          vars,
          overrides
        )
      );

      yield;
      return res;
    },

    *__compararValor(
      targetArr: number[],
      arrName: string,
      idx: number,
      val: number,
      op: string,
      reverse: boolean,
      line: number = 1,
      getVarsFn?: () => VariableSnapshot
    ) {
      resetTransientStates();
      comparisonsCount++;
      const arrVal = Array.isArray(targetArr) ? targetArr[idx] : undefined;

      let res = false;
      if (reverse) {
        switch (op) {
          case '<': res = val < (arrVal as any); break;
          case '>': res = val > (arrVal as any); break;
          case '<=': res = val <= (arrVal as any); break;
          case '>=': res = val >= (arrVal as any); break;
          case '===':
          case '==': res = val === arrVal; break;
          case '!==':
          case '!=': res = val !== arrVal; break;
        }
      } else {
        switch (op) {
          case '<': res = (arrVal as any) < val; break;
          case '>': res = (arrVal as any) > val; break;
          case '<=': res = (arrVal as any) <= val; break;
          case '>=': res = (arrVal as any) >= val; break;
          case '===':
          case '==': res = arrVal === val; break;
          case '!==':
          case '!=': res = arrVal !== val; break;
        }
      }

      if (Array.isArray(targetArr)) ensureTrackedArray(targetArr, arrName);

      const overrides = new Map<number[], Map<number, { state: ElementState; indicator?: string }>>();
      if (Array.isArray(targetArr)) {
        const m = new Map<number, { state: ElementState; indicator?: string }>();
        const isEqualityMatch = (op === '==' || op === '===') && res;
        m.set(idx, {
          state: isEqualityMatch ? 'sorted' : 'comparing',
          indicator: isEqualityMatch ? '✔' : '?',
        });
        overrides.set(targetArr, m);
      }

      const vars = getVarsFn ? getVarsFn() : { i: idx, clave: val };
      steps.push(
        makeStep(
          line,
          `Evaluando ${arrName}[${idx}] (${arrVal}) ${op} ${val} → ${res ? 'Verdadero' : 'Falso'}`,
          'compare',
          vars,
          overrides
        )
      );

      yield;
      return res;
    },

    *__asignar(
      targetArr: number[],
      arrName: string,
      idx: number,
      value: number,
      line: number = 1,
      getVarsFn?: () => VariableSnapshot
    ) {
      resetTransientStates();
      swapsCount++;
      if (Array.isArray(targetArr)) {
        targetArr[idx] = value;
        const entry = ensureTrackedArray(targetArr, arrName);
        if (entry.elements[idx]) {
          entry.elements[idx].value = value;
          entry.elements[idx].state = 'swapped';
          entry.elements[idx].nonColorIndicator = '⇄';
        }
      }

      const vars = getVarsFn ? getVarsFn() : { idx, value };
      steps.push(
        makeStep(
          line,
          `Asignación en memoria: ${arrName}[${idx}] ← ${value}`,
          'assign',
          vars
        )
      );

      yield;
      return value;
    },

    *__intercambiar(targetArr: number[], i: number, j: number, line: number = 1) {
      resetTransientStates();
      swapsCount++;
      if (Array.isArray(targetArr)) {
        const temp = targetArr[i];
        targetArr[i] = targetArr[j];
        targetArr[j] = temp;

        const entry = ensureTrackedArray(targetArr, 'arr');
        if (entry.elements[i] && entry.elements[j]) {
          const tempEl = entry.elements[i];
          entry.elements[i] = { ...entry.elements[j], state: 'swapped', nonColorIndicator: '⇄' };
          entry.elements[j] = { ...tempEl, state: 'swapped', nonColorIndicator: '⇄' };
        }
      }

      steps.push(
        makeStep(
          line,
          `Intercambio: [${i}] ⇄ [${j}] (${targetArr?.[i]} ⇄ ${targetArr?.[j]})`,
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
    const iterator = generatorFn(fallbackArray, targetKey, hooks);

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
      steps.push(makeStep(1, 'Código ejecutado sin operaciones sobre arreglos', 'finish'));
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

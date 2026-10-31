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
 * Motor de Trazado e Instrumentación de Código del Estudiante (v2 - Bottom-Up AST + Call Stack Real).
 * 
 * Capacidades:
 * 1. Normaliza C o JavaScript preservando líneas 1:1 y tipos de variables (int, float, double, char, bool).
 * 2. Preserva la semántica de división entera en C: (a / b) -> Math.trunc((a) / (b)) cuando son enteros.
 * 3. Reescribe el AST de abajo hacia arriba (Post-Order Bottom-Up) para soportar anidamiento arbitrario
 *    de llamadas a funciones, accesos indexados (conteo[datos[i]] += 1) y expresiones compuestas.
 * 4. Soporta operadores de asignación compuesta (+=, -=, *=, /=, %=) e incremento/decremento (++, --) en arreglos.
 * 5. Protege contra bucles infinitos con o sin llaves (while(1);) inyectando puntos de control por iteración.
 * 6. Captura el estado post-ejecución de asignaciones escalares y mantiene una Pila de Llamadas (Call Stack)
 *    real con marcos apilados para funciones auxiliares y recursivas (Quick Sort, Merge Sort, Búsqueda Binaria).
 */
export function instrumentAndTraceStudentCode(
  sourceCode: string,
  initialDataset: number[],
  targetKey: number = 45,
  maxSteps: number = 2000
): ASTInstrumentationResult {
  // 1. Normalizar si es C / C++ preservando números de línea 1:1 y tipos declarados
  const {
    code: normalizedCode,
    detectedLanguage,
    mainArrayValues,
    primaryArrayName,
    variableTypes,
  } = normalizeCToJavaScript(sourceCode);

  // Validar sintaxis con Acorn
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

  // 2. Extraer funciones y variables por ámbito de función (para Call Stack real)
  const declaredVariables = new Set<string>(['arr']);
  const functionLocalVars = new Map<string, Set<string>>();
  const declaredFunctions = new Set<string>();
  let firstDeclaredFunction: string | null = null;

  function collectDeclarations(node: any, currentFuncName: string | null) {
    if (!node || typeof node !== 'object') return;

    let activeFunc = currentFuncName;

    if (node.type === 'FunctionDeclaration' && node.id?.name) {
      const fnName = node.id.name;
      declaredFunctions.add(fnName);
      if (!firstDeclaredFunction) {
        firstDeclaredFunction = fnName;
      }
      activeFunc = fnName;
      if (!functionLocalVars.has(fnName)) {
        functionLocalVars.set(fnName, new Set<string>());
      }
      const fnSet = functionLocalVars.get(fnName)!;
      if (Array.isArray(node.params)) {
        for (const p of node.params) {
          if (p.type === 'Identifier') {
            declaredVariables.add(p.name);
            fnSet.add(p.name);
          }
        }
      }
    } else if (node.type === 'VariableDeclaration' && Array.isArray(node.declarations)) {
      for (const decl of node.declarations) {
        if (decl.id?.type === 'Identifier') {
          const varName = decl.id.name;
          declaredVariables.add(varName);
          if (activeFunc && functionLocalVars.has(activeFunc)) {
            functionLocalVars.get(activeFunc)!.add(varName);
          }
        }
      }
    }

    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          collectDeclarations(item, activeFunc);
        }
      } else if (child && typeof child === 'object') {
        collectDeclarations(child, activeFunc);
      }
    }
  }
  collectDeclarations(ast, null);

  function buildSnapshotExpr(varNames: Iterable<string>): string {
    const tokens = Array.from(varNames)
      .filter(v => v !== 'Math' && v !== '__hooks' && v !== '__initialArr' && v !== '__clave')
      .map(v => `(function(){try{return{[${JSON.stringify(v)}]:${v}}}catch(e){return{}}})()`)
      .join(', ');
    return `() => Object.assign({}, ${tokens})`;
  }

  const globalSnapshotExpr = buildSnapshotExpr(declaredVariables);

  // 3. Motor de Reescritura AST Bottom-Up (Post-Order)
  interface Replacement {
    start: number;
    end: number;
    text: string;
  }
  let replacements: Replacement[] = [];

  // Obtiene el código de un rango [start, end] aplicando todas las transformaciones de sus nodos hijos
  function renderRange(start: number, end: number): string {
    const inner = replacements
      .filter(r => r.start >= start && r.end <= end)
      .sort((a, b) => b.start - a.start);

    let slice = normalizedCode.slice(start, end);
    for (const r of inner) {
      const relStart = r.start - start;
      const relEnd = r.end - start;
      slice = slice.slice(0, relStart) + r.text + slice.slice(relEnd);
    }
    return slice;
  }

  // Registra el reemplazo de un nodo consolidando y limpiando los reemplazos internos ya absorbidos
  function replaceNode(start: number, end: number, text: string) {
    replacements = replacements.filter(r => !(r.start >= start && r.end <= end));
    replacements.push({ start, end, text });
  }

  function isArrayAccess(node: any): boolean {
    return Boolean(
      node &&
      node.type === 'MemberExpression' &&
      node.computed === true &&
      node.object &&
      node.object.type === 'Identifier'
    );
  }

  // Determina si un nodo involucra un literal o variable de punto flotante en C
  function isFloatingPointExpr(node: any): boolean {
    if (!node || typeof node !== 'object') return false;
    if (node.type === 'Literal') {
      const raw = String(node.raw ?? node.value ?? '');
      return raw.includes('.');
    }
    if (node.type === 'Identifier') {
      const t = variableTypes[node.name];
      return t === 'float' || t === 'double';
    }
    if (node.type === 'BinaryExpression') {
      return isFloatingPointExpr(node.left) || isFloatingPointExpr(node.right);
    }
    return false;
  }

  // Recorrido Post-Order (primero transforma hijos, luego transforma el padre usando renderRange)
  function transformAST(node: any, parent: any, currentFuncName: string | null) {
    if (!node || typeof node !== 'object') return;

    const activeFunc =
      node.type === 'FunctionDeclaration' && node.id?.name ? node.id.name : currentFuncName;

    // 1. Primero transformar recursivamente todos los nodos hijos (Post-Order)
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          transformAST(item, node, activeFunc);
        }
      } else if (child && typeof child === 'object' && typeof child.type === 'string') {
        transformAST(child, node, activeFunc);
      }
    }

    const line = node.loc?.start?.line ?? 1;
    const activeVarsSet =
      activeFunc && functionLocalVars.has(activeFunc)
        ? functionLocalVars.get(activeFunc)!
        : declaredVariables;
    const snapshotExpr = buildSnapshotExpr(activeVarsSet);

    // 2. Transformar llamadas a funciones del usuario: fn(...) -> (yield* fn(...))
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'Identifier' &&
      declaredFunctions.has(node.callee.name)
    ) {
      const callCode = renderRange(node.start, node.end);
      replaceNode(node.start, node.end, `(yield* ${callCode})`);
      return;
    }

    // 3. Transformar expresiones binarias (Comparaciones sobre arreglos y División entera en C)
    if (node.type === 'BinaryExpression') {
      const op = node.operator;
      const isCompareOp = ['<', '>', '<=', '>=', '===', '==', '!==', '!='].includes(op);

      if (isCompareOp) {
        const leftIsArr = isArrayAccess(node.left);
        const rightIsArr = isArrayAccess(node.right);

        if (leftIsArr && rightIsArr) {
          const leftArrName = node.left.object.name;
          const rightArrName = node.right.object.name;
          const leftIdxCode = renderRange(node.left.property.start, node.left.property.end);
          const rightIdxCode = renderRange(node.right.property.start, node.right.property.end);
          replaceNode(
            node.start,
            node.end,
            `(yield* __comparar(${leftArrName}, ${JSON.stringify(leftArrName)}, ${leftIdxCode}, ${rightArrName}, ${JSON.stringify(rightArrName)}, ${rightIdxCode}, ${JSON.stringify(op)}, ${line}, ${snapshotExpr}))`
          );
          return;
        } else if (leftIsArr) {
          const arrName = node.left.object.name;
          const idxCode = renderRange(node.left.property.start, node.left.property.end);
          const valCode = renderRange(node.right.start, node.right.end);
          replaceNode(
            node.start,
            node.end,
            `(yield* __compararValor(${arrName}, ${JSON.stringify(arrName)}, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, false, ${line}, ${snapshotExpr}))`
          );
          return;
        } else if (rightIsArr) {
          const arrName = node.right.object.name;
          const idxCode = renderRange(node.right.property.start, node.right.property.end);
          const valCode = renderRange(node.left.start, node.left.end);
          replaceNode(
            node.start,
            node.end,
            `(yield* __compararValor(${arrName}, ${JSON.stringify(arrName)}, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, true, ${line}, ${snapshotExpr}))`
          );
          return;
        }
      }

      // P-01: En lenguaje C, truncar la división entera (ej. (izq + der) / 2 -> Math.trunc((izq + der) / 2))
      if (op === '/' && detectedLanguage === 'c' && !isFloatingPointExpr(node)) {
        const leftCode = renderRange(node.left.start, node.left.end);
        const rightCode = renderRange(node.right.start, node.right.end);
        replaceNode(node.start, node.end, `Math.trunc((${leftCode}) / (${rightCode}))`);
        return;
      }
    }

    // 4. Transformar asignaciones a arreglos (P-03: soporta =, +=, -=, *=, /=, %=)
    if (node.type === 'AssignmentExpression' && isArrayAccess(node.left)) {
      const arrName = node.left.object.name;
      const idxCode = renderRange(node.left.property.start, node.left.property.end);
      const valCode = renderRange(node.right.start, node.right.end);
      const op = node.operator || '=';
      replaceNode(
        node.start,
        node.end,
        `(yield* __asignar(${arrName}, ${JSON.stringify(arrName)}, ${idxCode}, ${valCode}, ${JSON.stringify(op)}, ${line}, ${snapshotExpr}))`
      );
      return;
    }

    // 5. Transformar incremento/decremento sobre arreglos (P-03: arr[i]++, --arr[i])
    if (node.type === 'UpdateExpression' && isArrayAccess(node.argument)) {
      const arrName = node.argument.object.name;
      const idxCode = renderRange(node.argument.property.start, node.argument.property.end);
      const op = node.operator;
      const isPrefix = Boolean(node.prefix);
      replaceNode(
        node.start,
        node.end,
        `(yield* __actualizar(${arrName}, ${JSON.stringify(arrName)}, ${idxCode}, ${JSON.stringify(op)}, ${isPrefix}, ${line}, ${snapshotExpr}))`
      );
      return;
    }

    // 6. Transformar sentencias return para capturar el valor de retorno (P-06)
    if (node.type === 'ReturnStatement') {
      if (node.argument) {
        const argCode = renderRange(node.argument.start, node.argument.end);
        replaceNode(
          node.start,
          node.end,
          `return (yield* __retornar(${line}, (${argCode}), ${snapshotExpr}));`
        );
      } else {
        replaceNode(
          node.start,
          node.end,
          `{ yield* __retornar(${line}, undefined, ${snapshotExpr}); return; }`
        );
      }
      return;
    }

    // 7. Proteger y trazar bucles (ForStatement, WhileStatement, DoWhileStatement) con o sin llaves (P-02)
    if (
      node.type === 'ForStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement'
    ) {
      if (node.body) {
        if (node.body.type === 'BlockStatement') {
          const bodyInner = renderRange(node.body.start + 1, node.body.end - 1);
          replaceNode(
            node.body.start,
            node.body.end,
            `{ yield* __iteracion(${line}, ${snapshotExpr}); ${bodyInner} }`
          );
        } else {
          const singleStmtCode = renderRange(node.body.start, node.body.end);
          const bodyLine = node.body.loc?.start?.line ?? line;
          replaceNode(
            node.body.start,
            node.body.end,
            `{ yield* __iteracion(${line}, ${snapshotExpr}); ${singleStmtCode} yield* __paso(${bodyLine}, ${snapshotExpr}); }`
          );
        }
      }
      return;
    }

    // 8. Transformar declaraciones y expresiones escalares capturando su estado POST-ejecución (P-05)
    if (
      (node.type === 'VariableDeclaration' || node.type === 'ExpressionStatement') &&
      parent &&
      (parent.type === 'BlockStatement' || parent.type === 'Program')
    ) {
      // Si es una asignación o actualización directa sobre un arreglo, __asignar/__actualizar ya emite el paso
      if (
        node.type === 'ExpressionStatement' &&
        ((node.expression?.type === 'AssignmentExpression' && isArrayAccess(node.expression.left)) ||
          (node.expression?.type === 'UpdateExpression' && isArrayAccess(node.expression.argument)))
      ) {
        return;
      }

      const stmtCode = renderRange(node.start, node.end);
      replaceNode(
        node.start,
        node.end,
        `${stmtCode} yield* __paso(${line}, ${snapshotExpr});`
      );
      return;
    }

    // 9. Envolver declaraciones de función con gestión de Call Stack (__pushFrame / __popFrame) (P-06)
    if (node.type === 'FunctionDeclaration' && node.id?.name && node.body?.type === 'BlockStatement') {
      const fnName = node.id.name;
      const headerToBody = renderRange(node.id.end, node.body.start);
      const bodyInner = renderRange(node.body.start + 1, node.body.end - 1);
      replaceNode(
        node.start,
        node.end,
        `function* ${fnName}${headerToBody}{ __hooks.__pushFrame(${JSON.stringify(fnName)}, ${snapshotExpr}); try { ${bodyInner} } finally { __hooks.__popFrame(); } }`
      );
      return;
    }
  }

  transformAST(ast, null, null);

  const transformedCode = renderRange(0, normalizedCode.length);

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
  const { __paso, __iteracion, __comparar, __compararValor, __asignar, __actualizar, __intercambiar, __retornar } = __hooks;
  let arr = __initialArr;

  function* swap(a, i, j) { yield* __intercambiar(a, i, j); }
  function* intercambiar(a, i, j) { yield* __intercambiar(a, i, j); }

  ${transformedCode}
  ${invocation}
};
`;

  // 4. Inicializar conjunto de datos y Pila de Ejecución (Call Stack)
  const fallbackArray: number[] =
    mainArrayValues && mainArrayValues.length > 0
      ? [...mainArrayValues]
      : [...initialDataset];

  const steps: Step[] = [];
  let comparisonsCount = 0;
  let swapsCount = 0;
  let operationsCount = 0;

  // Pila real de marcos de ejecución (Call Stack)
  interface RuntimeStackFrame {
    id: string;
    name: string;
    getVarsFn: () => VariableSnapshot;
    returnValue?: string | number | boolean | null;
  }
  const runtimeCallStack: RuntimeStackFrame[] = [];
  let frameIdCounter = 0;

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

  ensureTrackedArray(fallbackArray, primaryArrayName || 'arr');

  function inferVariableType(key: string, val: any): string {
    if (variableTypes[key]) {
      return variableTypes[key];
    }
    if (Array.isArray(val) || (typeof val === 'string' && val.startsWith('→'))) {
      return 'int[]';
    }
    if (typeof val === 'boolean') return 'bool';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'int' : 'float';
    }
    if (typeof val === 'string') return 'char*';
    return 'int';
  }

  function sanitizeFrameVariables(rawVars: VariableSnapshot): {
    scalars: Record<string, string | number | boolean | null | undefined>;
    types: Record<string, string>;
  } {
    const scalars: Record<string, string | number | boolean | null | undefined> = {};
    const types: Record<string, string> = {};

    for (const [key, val] of Object.entries(rawVars)) {
      if (Array.isArray(val)) {
        if (key === 'arr' && val === fallbackArray && declaredFunctions.has('main') && trackedArrays.size > 1) {
          continue;
        }
        ensureTrackedArray(val, key);
        scalars[key] = `→ [0..${Math.max(0, val.length - 1)}]`;
        types[key] = variableTypes[key] || 'int[]';
      } else if (
        typeof val === 'number' ||
        typeof val === 'boolean' ||
        typeof val === 'string' ||
        val === null
      ) {
        scalars[key] = val;
        types[key] = inferVariableType(key, val);
      }
    }
    return { scalars, types };
  }

  function buildStepFramesAndArrays(
    currentRawVars: VariableSnapshot,
    highlightOverrides?: Map<number[], Map<number, { state: ElementState; indicator?: string }>>
  ): {
    frames: MemoryFrame[];
    namedArrays: NamedArrayState[];
    primaryElements: ArrayElement[];
    topScalarVars: VariableSnapshot;
  } {
    // 1. Construir la pila de frames desde el tope (función activa) hasta la base (main / global)
    const frames: MemoryFrame[] = [];
    let topScalarVars: VariableSnapshot = currentRawVars;

    if (runtimeCallStack.length > 0) {
      for (let i = runtimeCallStack.length - 1; i >= 0; i--) {
        const rtFrame = runtimeCallStack[i];
        const isTop = i === runtimeCallStack.length - 1;
        const raw = isTop && Object.keys(currentRawVars).length > 0 ? currentRawVars : rtFrame.getVarsFn();
        if (isTop) topScalarVars = raw;

        const { scalars, types } = sanitizeFrameVariables(raw);
        if (rtFrame.returnValue !== undefined) {
          scalars['retorno'] = rtFrame.returnValue;
          types['retorno'] = inferVariableType('retorno', rtFrame.returnValue);
        }

        frames.push({
          id: rtFrame.id,
          name: `${rtFrame.name}()`,
          isActive: isTop,
          variables: scalars,
          variableTypes: types,
          returnValue: rtFrame.returnValue,
        });
      }
    } else {
      const { scalars, types } = sanitizeFrameVariables(currentRawVars);
      frames.push({
        id: 'frame-student-root',
        name: firstDeclaredFunction ? `${firstDeclaredFunction}()` : 'Programa',
        isActive: true,
        variables: scalars,
        variableTypes: types,
      });
    }

    // 2. Construir lista de arreglos rastreados
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

    return { frames, namedArrays, primaryElements, topScalarVars };
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
    const { frames, namedArrays, primaryElements, topScalarVars } = buildStepFramesAndArrays(
      rawVars,
      highlightOverrides
    );

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
    const checkIdx = (name: string, targetKeyName: string) => {
      if (typeof topScalarVars[name] === 'number') {
        activeIndices[targetKeyName] = topScalarVars[name];
      }
    };
    checkIdx('i', 'i');
    checkIdx('j', 'j');
    checkIdx('k', 'k');
    checkIdx('min', 'min');
    checkIdx('medio', 'mid');
    checkIdx('mid', 'mid');
    checkIdx('clave', 'keyVal');
    checkIdx('inicio', 'left');
    checkIdx('izq', 'left');
    checkIdx('bajo', 'left');
    checkIdx('left', 'left');
    checkIdx('fin', 'right');
    checkIdx('der', 'right');
    checkIdx('alto', 'right');
    checkIdx('right', 'right');

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

  // Hooks interceptores universales
  const hooks = {
    __pushFrame(fnName: string, getVarsFn: () => VariableSnapshot) {
      frameIdCounter++;
      runtimeCallStack.push({
        id: `frame-${fnName}-${frameIdCounter}`,
        name: fnName,
        getVarsFn,
      });
    },

    __popFrame() {
      runtimeCallStack.pop();
    },

    *__paso(line: number, getVarsFn: () => VariableSnapshot) {
      resetTransientStates();
      const vars = getVarsFn();
      steps.push(makeStep(line, `Sentencia ejecutada en línea ${line}`, 'check', vars));
      yield;
    },

    *__iteracion(line: number, getVarsFn: () => VariableSnapshot) {
      resetTransientStates();
      const vars = getVarsFn();
      steps.push(makeStep(line, `Iteración de bucle en línea ${line}`, 'iterate_inner', vars));
      yield;
    },

    *__retornar(line: number, retVal: any, getVarsFn: () => VariableSnapshot) {
      resetTransientStates();
      const vars = getVarsFn();
      if (runtimeCallStack.length > 0) {
        runtimeCallStack[runtimeCallStack.length - 1].returnValue =
          retVal !== undefined ? retVal : 'void';
      }
      const desc =
        retVal !== undefined
          ? `Retornando valor: ${retVal} (línea ${line})`
          : `Retornando de la función (línea ${line})`;
      steps.push(makeStep(line, desc, 'finish', vars));
      yield;
      return retVal;
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
      const idxI = Math.trunc(Number(i));
      const idxJ = Math.trunc(Number(j));
      const valI = Array.isArray(leftArr) ? leftArr[idxI] : undefined;
      const valJ = Array.isArray(rightArr) ? rightArr[idxJ] : undefined;

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
        m.set(idxI, { state: 'comparing', indicator: '?' });
        overrides.set(leftArr, m);
      }
      if (Array.isArray(rightArr)) {
        const m = overrides.get(rightArr) || new Map<number, { state: ElementState; indicator?: string }>();
        m.set(idxJ, { state: 'comparing', indicator: '?' });
        overrides.set(rightArr, m);
      }

      const vars = getVarsFn ? getVarsFn() : { i: idxI, j: idxJ };
      steps.push(
        makeStep(
          line,
          `Comparación: ${leftName}[${idxI}] (${valI}) ${op} ${rightName}[${idxJ}] (${valJ}) → ${res ? 'Verdadero' : 'Falso'}`,
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
      const cleanIdx = Math.trunc(Number(idx));
      const arrVal = Array.isArray(targetArr) ? targetArr[cleanIdx] : undefined;

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
        m.set(cleanIdx, {
          state: isEqualityMatch ? 'sorted' : 'comparing',
          indicator: isEqualityMatch ? '✔' : '?',
        });
        overrides.set(targetArr, m);
      }

      const vars = getVarsFn ? getVarsFn() : { i: cleanIdx, clave: val };
      steps.push(
        makeStep(
          line,
          `Evaluando ${arrName}[${cleanIdx}] (${arrVal}) ${op} ${val} → ${res ? 'Verdadero' : 'Falso'}`,
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
      operator: string = '=',
      line: number = 1,
      getVarsFn?: () => VariableSnapshot
    ) {
      resetTransientStates();
      swapsCount++;
      const cleanIdx = Math.trunc(Number(idx));
      let finalVal = value;

      if (Array.isArray(targetArr)) {
        const prevVal = Number(targetArr[cleanIdx]) || 0;
        switch (operator) {
          case '+=': finalVal = prevVal + value; break;
          case '-=': finalVal = prevVal - value; break;
          case '*=': finalVal = prevVal * value; break;
          case '/=':
            finalVal =
              detectedLanguage === 'c' ? Math.trunc(prevVal / value) : prevVal / value;
            break;
          case '%=': finalVal = prevVal % value; break;
          default: finalVal = value; break;
        }

        targetArr[cleanIdx] = finalVal;
        const entry = ensureTrackedArray(targetArr, arrName);
        if (entry.elements[cleanIdx]) {
          entry.elements[cleanIdx].value = finalVal;
          entry.elements[cleanIdx].state = 'swapped';
          entry.elements[cleanIdx].nonColorIndicator = undefined;
        }
      }

      const vars = getVarsFn ? getVarsFn() : { idx: cleanIdx, value: finalVal };
      const desc =
        operator === '='
          ? `Asignación en memoria: ${arrName}[${cleanIdx}] ← ${finalVal}`
          : `Actualización en memoria: ${arrName}[${cleanIdx}] ${operator} ${value} → ${finalVal}`;

      steps.push(makeStep(line, desc, 'assign', vars));

      yield;
      return finalVal;
    },

    *__actualizar(
      targetArr: number[],
      arrName: string,
      idx: number,
      operator: '++' | '--',
      isPrefix: boolean,
      line: number = 1,
      getVarsFn?: () => VariableSnapshot
    ) {
      resetTransientStates();
      swapsCount++;
      const cleanIdx = Math.trunc(Number(idx));
      const oldVal = Array.isArray(targetArr) ? Number(targetArr[cleanIdx]) || 0 : 0;
      const newVal = operator === '++' ? oldVal + 1 : oldVal - 1;

      if (Array.isArray(targetArr)) {
        targetArr[cleanIdx] = newVal;
        const entry = ensureTrackedArray(targetArr, arrName);
        if (entry.elements[cleanIdx]) {
          entry.elements[cleanIdx].value = newVal;
          entry.elements[cleanIdx].state = 'swapped';
          entry.elements[cleanIdx].nonColorIndicator = undefined;
        }
      }

      const vars = getVarsFn ? getVarsFn() : { idx: cleanIdx, value: newVal };
      steps.push(
        makeStep(
          line,
          `Actualización (${operator}): ${arrName}[${cleanIdx}] pasa de ${oldVal} a ${newVal}`,
          'assign',
          vars
        )
      );

      yield;
      return isPrefix ? newVal : oldVal;
    },

    *__intercambiar(targetArr: number[], i: number, j: number, line: number = 1) {
      resetTransientStates();
      swapsCount++;
      const idxI = Math.trunc(Number(i));
      const idxJ = Math.trunc(Number(j));

      if (Array.isArray(targetArr)) {
        const temp = targetArr[idxI];
        targetArr[idxI] = targetArr[idxJ];
        targetArr[idxJ] = temp;

        const entry = ensureTrackedArray(targetArr, 'arr');
        if (entry.elements[idxI] && entry.elements[idxJ]) {
          const tempEl = entry.elements[idxI];
          entry.elements[idxI] = { ...entry.elements[idxJ], state: 'swapped', nonColorIndicator: undefined };
          entry.elements[idxJ] = { ...tempEl, state: 'swapped', nonColorIndicator: undefined };
        }
      }

      const vars = globalSnapshotExpr ? {} : { i: idxI, j: idxJ };
      steps.push(
        makeStep(
          line,
          `Intercambio: [${idxI}] y [${idxJ}] (${targetArr?.[idxI]} y ${targetArr?.[idxJ]})`,
          'swap',
          vars
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
      steps.push(makeStep(1, 'Código ejecutado sin operaciones registradas', 'finish'));
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

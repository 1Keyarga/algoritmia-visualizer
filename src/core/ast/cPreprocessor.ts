/**
 * Preprocesador y Normalizador de Código C / C++ y JavaScript.
 *
 * Soporta patrones educativos estándar de C y C++:
 * - Directivas #include y constantes #define NOMBRE VALOR
 * - using namespace std;, std::vector<T>, .size(), .empty(), .push_back(), .pop_back(),
 *   .front(), .back(), .clear(), .resize(), .at()
 * - Bucles por rango: for (int x : arr) / for (const auto& x : arr)
 * - Funciones auxiliares, recursivas, int main(), referencias (&) y punteros simples (*)
 * - Declaraciones múltiples e inicializaciones multilínea de arreglos y vectores preservando mapeo 1:1
 * - E/S estándar (printf, cout, scanf, cin) tratada como no-op silencioso
 * - Registro de tipos declarados (int, float, double, char, bool, vector) para división entera en C/C++
 *
 * Mantiene intactos los números de línea (1:1) para sincronización exacta editor <-> traza.
 */

export interface CNormalizationResult {
  code: string;
  detectedLanguage: 'c' | 'javascript';
  hasMain: boolean;
  mainArrayValues?: number[];
  primaryArrayName?: string;
  variableTypes: Record<string, string>;
}

const C_TYPE_KEYWORDS =
  '(?:void|int|float|double|char|bool|long|short|unsigned|size_t|string)';

/**
 * Detecta si el código fuente contiene elementos propios de C/C++.
 */
export function detectLanguage(code: string): 'c' | 'javascript' {
  const cSignatures = [
    /#include\s*<.*>/,
    /#define\s+[a-zA-Z_]\w*\s+/,
    /\busing\s+namespace\s+std\b/,
    /\b(?:std::)?vector\s*<[^>]+>/,
    /\b(?:std::)?(?:cout|cin)\b/,
    /\bfor\s*\(\s*(?:const\s+)?(?:int|float|double|char|bool|long|short|unsigned|size_t|string|auto)\b[^:]*:/,
    /\b(void|int|float|double|char|bool|long|short|unsigned|size_t)\s+[a-zA-Z_]\w*\s*\(/,
    /\b(int|float|double|char|bool|long|short|unsigned|size_t)\s+[a-zA-Z_]\w*\s*(\[|\s*=|\s*;|\s*,)/,
    /\bsizeof\s*\(/,
    /\bprintf\s*\(/,
    /\b(?:NULL|nullptr|INT_MAX|INT_MIN)\b/,
    /\b(?:int|void)\s+main\s*\(/,
  ];

  for (const sig of cSignatures) {
    if (sig.test(code)) return 'c';
  }
  return 'javascript';
}

/**
 * Colapsa inicializaciones multilínea con llaves `{ ... }` (ej. int arr[] = {\n 1, 2\n};)
 * en la primera línea manteniendo líneas de relleno vacías/comentadas para conservar 1:1.
 */
function flattenMultilineInitializers(lines: string[]): string[] {
  const out = [...lines];
  let i = 0;
  while (i < out.length) {
    const line = out[i];
    const hasInitBrace =
      /(?:=)\s*\{[^}]*$/.test(line) &&
      !/^\s*(?:#|\/\/)/.test(line);

    if (hasInitBrace) {
      let combined = line;
      let j = i + 1;
      let closed = false;
      while (j < out.length) {
        const piece = out[j].replace(/\/\/.*$/, '').trim();
        combined += ' ' + piece;
        if (piece.includes('}')) {
          closed = true;
          break;
        }
        j++;
      }
      if (closed) {
        out[i] = combined;
        for (let k = i + 1; k <= j; k++) {
          out[k] = '// ...';
        }
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return out;
}

/**
 * Divide por comas o operadores de flujo respetando comillas y paréntesis.
 */
function splitRespectingDelimiters(expr: string, separator: string): string[] {
  const items: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let idx = 0; idx < expr.length; idx++) {
    const ch = expr[idx];
    const prev = idx > 0 ? expr[idx - 1] : '';

    if (ch === "'" && !inDouble && prev !== '\\') {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble) {
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
      else if (ch === '[') bracketDepth++;
      else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      else if (ch === '{') braceDepth++;
      else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);

      if (
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0 &&
        expr.slice(idx, idx + separator.length) === separator
      ) {
        items.push(current.trim());
        current = '';
        idx += separator.length - 1;
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) items.push(current.trim());
  return items;
}

/**
 * Reemplaza identificadores de macros `#define` fuera de cadenas de texto.
 */
function substituteDefineConstants(line: string, defines: Map<string, string>): string {
  if (defines.size === 0 || /^\s*#/.test(line)) return line;

  // Separar strings literales para no alterar texto dentro de comillas
  const segments = line.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g);
  return segments
    .map((seg, idx) => {
      if (idx % 2 === 1) return seg; // string literal
      let updated = seg;
      for (const [name, value] of defines.entries()) {
        const re = new RegExp(`\\b${name}\\b`, 'g');
        updated = updated.replace(re, value);
      }
      return updated;
    })
    .join('');
}

/**
 * Convierte parámetros C/C++ (int arr[], vector<int>& arr, int& a, const int n) a identificadores JS.
 */
function parseCParams(
  paramsRaw: string,
  variableTypes: Record<string, string>
): string {
  return splitRespectingDelimiters(paramsRaw, ',')
    .map((trimmed: string) => {
      if (!trimmed || trimmed === 'void') return '';

      // vector<T>& nombre o std::vector<T> nombre
      const vecMatch = trimmed.match(
        /^(?:const\s+)?(?:std::)?vector\s*<([^>]+)>\s*(?:[&*]\s*)?([a-zA-Z_]\w*)$/
      );
      if (vecMatch) {
        const innerType = vecMatch[1].trim();
        const pName = vecMatch[2];
        variableTypes[pName] = `vector<${innerType}>`;
        return pName;
      }

      // Tipo escalar/arreglo C: const int& x, int* arr, int arr[], int n
      const scalarOrArrMatch = trimmed.match(
        /^(?:const\s+)?(int|float|double|char|bool|long|short|unsigned|size_t|string)\s*(?:[*&]\s*)?([a-zA-Z_]\w*)\s*(\[\s*\d*\s*\])?$/
      );
      if (scalarOrArrMatch) {
        const pType = scalarOrArrMatch[1] === 'size_t' ? 'int' : scalarOrArrMatch[1];
        const pName = scalarOrArrMatch[2];
        const isArr = Boolean(scalarOrArrMatch[3]);
        variableTypes[pName] = isArr ? `${pType}[]` : pType;
        return pName;
      }

      const nameMatch = trimmed.match(/([a-zA-Z_]\w*)\s*(?:\[\s*\d*\s*\])?$/);
      return nameMatch ? nameMatch[1] : trimmed;
    })
    .filter(Boolean)
    .join(', ');
}

/**
 * Normaliza código a sintaxis ejecutable por el motor de análisis sintáctico.
 * Preserva exactamente los saltos de línea para mapeo 1:1.
 */
export function normalizeCToJavaScript(sourceCode: string): CNormalizationResult {
  const lang = detectLanguage(sourceCode);
  let hasMain = false;
  let mainArrayValues: number[] | undefined;
  let primaryArrayName: string | undefined;
  const variableTypes: Record<string, string> = {};

  if (
    /\bint\s+main\s*\(/.test(sourceCode) ||
    /\bvoid\s+main\s*\(/.test(sourceCode) ||
    /\bfunction\s+main\s*\(/.test(sourceCode)
  ) {
    hasMain = true;
  }

  // Detectar primer arreglo literal (C {...} o JS [...], incluyendo multilínea tras aplanar)
  const flattenedSourceForScan = flattenMultilineInitializers(sourceCode.split('\n')).join('\n');
  const anyArrayLiteralMatch = flattenedSourceForScan.match(
    /\b([a-zA-Z_]\w*)\s*(?:\[\s*\d*\s*\])?\s*=\s*(?:\{|\[)\s*([-0-9\s,.]+)\s*(?:\}|\])/
  );
  if (anyArrayLiteralMatch && anyArrayLiteralMatch[2]) {
    const candidateName = anyArrayLiteralMatch[1];
    const parsedNums = anyArrayLiteralMatch[2]
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n));
    if (parsedNums.length > 0) {
      primaryArrayName = candidateName;
      mainArrayValues = parsedNums;
    }
  }

  if (lang === 'javascript') {
    return {
      code: sourceCode,
      detectedLanguage: 'javascript',
      hasMain: /\bfunction\s+main\s*\(/.test(sourceCode),
      mainArrayValues,
      primaryArrayName,
      variableTypes,
    };
  }

  // Pre-procesamiento C/C++ manteniendo longitud de líneas 1:1
  const rawLines = flattenMultilineInitializers(sourceCode.split('\n')).map(line =>
    line.replace(/\blong\s+long\b/g, 'long')
  );
  const defines = new Map<string, string>();
  const userFuncNames = new Set<string>();
  const fnScanRegex = new RegExp(`\\b${C_TYPE_KEYWORDS}\\s+([a-zA-Z_]\\w*)\\s*\\(`, 'g');
  for (const rl of rawLines) {
    let m: RegExpExecArray | null;
    fnScanRegex.lastIndex = 0;
    while ((m = fnScanRegex.exec(rl)) !== null) {
      userFuncNames.add(m[1]);
    }
  }

  const normalizedLines = rawLines.map(line => {
    let l = line;

    // 1. Directivas #define (macros simples de constante) y #include
    const defineMatch = l.match(/^\s*#define\s+([a-zA-Z_]\w*)\s+(.+?)\s*$/);
    if (defineMatch) {
      defines.set(defineMatch[1], defineMatch[2]);
      return `// ${l.trim()}`;
    }
    if (/^\s*#/.test(l)) {
      return `// ${l.trim()}`;
    }

    // Aplicar sustituciones de constantes #define
    l = substituteDefineConstants(l, defines);

    // 2. using namespace std; -> comentario
    if (/^\s*using\s+namespace\s+std\s*;/.test(l)) {
      return `// ${l.trim()}`;
    }

    // 3. Limpiar prefijos std:: comunes fuera de strings
    l = l.replace(/\bstd::(vector|cout|cin|endl|swap|min|max|abs|string)\b/g, '$1');

    // 4. Declaraciones vector<T> (simples o múltiples en una línea):
    //    Ej: vector<int> v = {1, 2}; | vector<int> L(n1), R(n2); | vector<int> v(n, -1);
    l = l.replace(
      /^(\s*)(?:const\s+)?vector\s*<([^>]+)>\s+([^;]+);/g,
      (_m, indent, innerType, declList) => {
        const cleanInner = innerType.trim();
        const items = splitRespectingDelimiters(declList, ',');
        const converted = items
          .map((item: string) => {
            const initListMatch = item.match(/^([a-zA-Z_]\w*)\s*=\s*\{([^}]*)\}$/);
            if (initListMatch) {
              const [, name, content] = initListMatch;
              variableTypes[name] = `vector<${cleanInner}>`;
              return `${name} = [ ${content.trim()} ]`;
            }
            const ctorMatch = item.match(/^([a-zA-Z_]\w*)\s*\((.+)\)$/);
            if (ctorMatch) {
              const [, name, ctorArgsRaw] = ctorMatch;
              const ctorArgs = splitRespectingDelimiters(ctorArgsRaw, ',');
              variableTypes[name] = `vector<${cleanInner}>`;
              if (ctorArgs.length >= 2) {
                return `${name} = new Array(${ctorArgs[0]}).fill(${ctorArgs[1]})`;
              }
              return `${name} = new Array(${ctorArgs[0]}).fill(0)`;
            }
            const assignMatch = item.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
            if (assignMatch) {
              const [, name, rhs] = assignMatch;
              variableTypes[name] = `vector<${cleanInner}>`;
              return `${name} = ${rhs.trim()}`;
            }
            const bareMatch = item.match(/^([a-zA-Z_]\w*)$/);
            if (bareMatch) {
              const name = bareMatch[1];
              variableTypes[name] = `vector<${cleanInner}>`;
              return `${name} = []`;
            }
            return item;
          })
          .join(', ');
        return `${indent}let ${converted};`;
      }
    );

    // 5. Inicialización de arreglos C con cero (tamaño constante o variable: int aux[n] = {0};)
    l = l.replace(
      /\b(int|float|double|char|bool|long|short|unsigned)\s+([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=\s*\{\s*0?\s*\}\s*;/g,
      (_m, cType, arrName, sizeExpr) => {
        variableTypes[arrName] = `${cType}[]`;
        return `let ${arrName} = new Array(${sizeExpr.trim()}).fill(0);`;
      }
    );

    // 6. Inicialización de arreglos C con llaves: int arr[] = { 10, 20 };
    l = l.replace(
      /\b(int|float|double|char|bool|long|short|unsigned)\s+([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]\s*=\s*\{\s*([^}]*)\s*\}\s*;/g,
      (_m, cType, arrName, content) => {
        variableTypes[arrName] = `${cType}[]`;
        return `let ${arrName} = [ ${content} ];`;
      }
    );

    // 7. Reemplazar sizeof(arr) / sizeof(arr[0]) por arr.length
    l = l.replace(
      /sizeof\s*\(\s*([a-zA-Z_]\w*)\s*\)\s*\/\s*sizeof\s*\([^)]*\)/g,
      '$1.length'
    );

    // 8. Métodos de vector C++ -> equivalentes JS / helpers
    l = l.replace(/\.size\(\s*\)/g, '.length');
    l = l.replace(/\.empty\(\s*\)/g, '.length === 0');
    l = l.replace(/\.push_back\(/g, '.push(');
    l = l.replace(/\.pop_back\(\s*\)/g, '.pop()');
    l = l.replace(/\.front\(\s*\)/g, '[0]');
    l = l.replace(/([a-zA-Z_]\w*)\.back\(\s*\)/g, '$1[$1.length - 1]');
    l = l.replace(/\.clear\(\s*\)/g, '.length = 0');
    l = l.replace(/\.at\(([^)]+)\)/g, '[$1]');
    l = l.replace(
      /([a-zA-Z_]\w*)\.resize\(([^;)]*(?:\([^)]*\)[^;)]*)*)\)/g,
      '__vecResize($1, $2)'
    );

    // 9. Funciones matemáticas comunes de C/C++ (cmath / algorithm), sin pisar funciones del usuario
    l = l.replace(
      /(?<!Math\.)\b(min|max|abs|sqrt|pow|floor|ceil)\s*\(/g,
      (full, fnName) => (userFuncNames.has(fnName) ? full : `Math.${fnName}(`)
    );

    // 10. Cabeceras de funciones C/C++ (incluyendo vector<int>& y main())
    const fnHeaderRegex = new RegExp(
      `\\b${C_TYPE_KEYWORDS}\\s+([a-zA-Z_]\\w*)\\s*\\(([^)]*)\\)\\s*(\\{?)`,
      'g'
    );
    l = l.replace(fnHeaderRegex, (_match, funcName, params, trailingBrace) => {
      const cleanParams = parseCParams(params, variableTypes);
      return `function ${funcName}(${cleanParams}) ${trailingBrace || ''}`;
    });

    // 11a. Bucles por rango C++: for (int x : arr) / for (const auto& x : arr) => for (let x of arr)
    l = l.replace(
      /\bfor\s*\(\s*(?:const\s+)?(?:int|float|double|char|bool|long|short|unsigned|size_t|string|auto)\s*(?:[&*]\s*)?([a-zA-Z_]\w*)\s*:\s*([^)]+)\)/g,
      (_m, varName, iterableExpr) => {
        variableTypes[varName] = 'int';
        return `for (let ${varName} of ${iterableExpr.trim()})`;
      }
    );

    // 11b. Bucles for clásicos: for (int i = 0; ...) => for (let i = 0; ...)
    l = l.replace(
      /\bfor\s*\(\s*(?:int|size_t|long|unsigned)\s+([a-zA-Z_]\w*)/g,
      (_m, varName) => {
        variableTypes[varName] = 'int';
        return `for (let ${varName}`;
      }
    );

    // 12a. Declaraciones con auto: auto x = expr;
    l = l.replace(
      /^(\s*)(?:const\s+)?auto\s+([a-zA-Z_]\w*\s*=[^;]+);/g,
      '$1let $2;'
    );

    // 12b. Declaraciones escalares y múltiples (incluyendo arreglos auxiliares mezclados en la misma línea)
    l = l.replace(
      /^(\s*)(?:const\s+)?(int|float|double|char|bool|long|short|unsigned|size_t|string)\s+([^;]+);/g,
      (_match, indent, cType, declList) => {
        const normalizedType = cType === 'size_t' ? 'int' : cType;
        const topLevelItems = splitRespectingDelimiters(declList, ',');

        const processedDecls = topLevelItems
          .map((item: string) => {
            const zeroArrMatch = item.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=\s*\{\s*0?\s*\}$/);
            if (zeroArrMatch) {
              const [, arrName, sizeExpr] = zeroArrMatch;
              variableTypes[arrName] = `${normalizedType}[]`;
              return `${arrName} = new Array(${sizeExpr.trim()}).fill(0)`;
            }
            const listArrMatch = item.match(/^([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]\s*=\s*\{\s*([^}]*)\s*\}$/);
            if (listArrMatch) {
              const [, arrName, content] = listArrMatch;
              variableTypes[arrName] = `${normalizedType}[]`;
              return `${arrName} = [ ${content.trim()} ]`;
            }
            const fixedArrMatch = item.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]$/);
            if (fixedArrMatch) {
              const arrName = fixedArrMatch[1];
              variableTypes[arrName] = `${normalizedType}[]`;
              return `${arrName} = new Array(${fixedArrMatch[2].trim()}).fill(0)`;
            }
            const varNameMatch = item.match(/^[*&]?\s*([a-zA-Z_]\w*)/);
            if (varNameMatch) {
              variableTypes[varNameMatch[1]] = normalizedType;
            }
            return item.replace(/^[*&]\s*/, '').replace(/^([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]/, '$1');
          })
          .join(', ');
        return `${indent}let ${processedDecls};`;
      }
    );

    // 13. Constantes C/C++
    l = l.replace(/\b(?:NULL|nullptr)\b/g, 'null');
    l = l.replace(/\bINT_MAX\b/g, '2147483647');
    l = l.replace(/\bINT_MIN\b/g, '-2147483648');

    // 14. E/S estándar (printf / cout / scanf / cin) -> no-op silencioso (Visurithm visualiza el algoritmo, no consola)
    l = l.replace(/\bprintf\s*\([^;]*\);/g, '/* printf */ 0;');
    l = l.replace(/^(\s*)cout\s*<<\s*[^;]+;/g, '$1/* cout */ 0;');
    l = l.replace(/\bscanf\s*\([^;]*\);/g, '/* scanf */ 0;');
    l = l.replace(/^(\s*)cin\s*>>\s*[^;]+;/g, '$1/* cin */ 0;');

    return l;
  });

  return {
    code: normalizedLines.join('\n'),
    detectedLanguage: 'c',
    hasMain,
    mainArrayValues,
    primaryArrayName,
    variableTypes,
  };
}

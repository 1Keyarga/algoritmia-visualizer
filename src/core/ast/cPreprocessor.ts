/**
 * Preprocesador y Normalizador de Código C / C++ y JavaScript.
 *
 * Soporta patrones educativos estándar y avanzados de C y C++:
 * - Directivas #include, constantes #define NOMBRE VALOR y macros con parámetros #define M(a,b) ...
 * - Prototipos adelantados de funciones (void mergeSort(int arr[], int l, int r);) y firmas multilínea
 * - Punteros y referencias en funciones (void swap(int *a, int *b), swap(&arr[i], &arr[j])) y aritmética *(arr + i)
 * - Memoria dinámica C/C++: malloc, calloc, free, new int[n], delete[], delete
 * - Casteos estilo C/C++: (int)x, (float)x, (double)x, static_cast<T>(x)
 * - Utilitarios: memset(arr, 0, sizeof(arr)), std::swap, std::fill, std::reverse
 * - using namespace std;, std::vector<T>, .size(), .empty(), .push_back(), .pop_back(),
 *   .front(), .back(), .clear(), .resize(), .at()
 * - Bucles por rango: for (int x : arr) / for (const auto& x : arr)
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

interface MacroFuncDef {
  params: string[];
  body: string;
}

const C_TYPE_KEYWORDS =
  '(?:void|int|float|double|char|bool|long|short|unsigned|size_t|string)';

/**
 * Detecta si el código fuente contiene elementos propios de C/C++.
 */
export function detectLanguage(code: string): 'c' | 'javascript' {
  const cSignatures = [
    /#include\s*<.*>/,
    /#include\s*".*"/,
    /#define\s+[a-zA-Z_]\w*/,
    /\busing\s+namespace\s+std\b/,
    /\b(?:std::)?vector\s*<[^>]+>/,
    /\b(?:std::)?(?:cout|cin|swap|fill|reverse)\b/,
    /\b(?:malloc|calloc|free|memset)\s*\(/,
    /\bnew\s+(?:int|float|double|long|short|char|bool)\s*\[/,
    /\bdelete\s*(?:\[\s*\])?\s+[a-zA-Z_]\w*/,
    /\bstatic_cast\s*<[^>]+>/,
    /\bfor\s*\(\s*(?:const\s+)?(?:int|float|double|char|bool|long|short|unsigned|size_t|string|auto)\b[^:]*:/,
    /\b(void|int|float|double|char|bool|long|short|unsigned|size_t)\s+\*?\s*[a-zA-Z_]\w*\s*\(/,
    /\b(int|float|double|char|bool|long|short|unsigned|size_t)\s+\*?\s*[a-zA-Z_]\w*\s*(\[|\s*=|\s*;|\s*,)/,
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
 * y cabeceras/prototipos de función multilínea en la primera línea manteniendo líneas de relleno
 * comentadas para conservar el mapeo 1:1 de líneas.
 */
function flattenMultilineConstructs(lines: string[]): string[] {
  const out = [...lines];
  let i = 0;
  const fnStartRegex = new RegExp(
    `^\\s*(?:const\\s+)?${C_TYPE_KEYWORDS}(?:\\s*[*&]+)?\\s+[a-zA-Z_]\\w*\\s*\\([^)]*$`
  );

  while (i < out.length) {
    const line = out[i];
    const trimmed = line.trim();

    // 1. Inicialización multilínea de arreglo/vector: `= { ...` sin `}` en la misma línea
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

    // 2. Cabecera o prototipo de función C/C++ partido en varias líneas
    if (!trimmed.startsWith('//') && !trimmed.startsWith('#') && fnStartRegex.test(line)) {
      let combined = line.replace(/\/\/.*$/, '');
      let j = i + 1;
      let closed = false;
      while (j < out.length && j <= i + 6) {
        const piece = out[j].replace(/\/\/.*$/, '').trim();
        combined += ' ' + piece;
        if (piece.includes(')') && (piece.endsWith('{') || piece.endsWith(';') || piece.endsWith(')'))) {
          // Si termina solo en `)` y la siguiente línea empieza con `{`, incluir también la `{`
          if (piece.endsWith(')') && j + 1 < out.length && out[j + 1].trim() === '{') {
            j++;
            combined += ' {';
          }
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
 * Divide por comas o separadores respetando comillas y paréntesis/corchetes/llaves.
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
 * Expande macros `#define` con parámetros y constantes fuera de cadenas de texto.
 */
function substituteDefines(
  line: string,
  defines: Map<string, string>,
  macroFuncs: Map<string, MacroFuncDef>
): string {
  if ((defines.size === 0 && macroFuncs.size === 0) || /^\s*#/.test(line)) return line;

  const segments = line.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g);
  return segments
    .map((seg, idx) => {
      if (idx % 2 === 1) return seg;
      let updated = seg;

      // 1. Expandir macros con parámetros: MACRO(a, b)
      for (const [mName, mDef] of macroFuncs.entries()) {
        const callRe = new RegExp(`\\b${mName}\\s*\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)`, 'g');
        updated = updated.replace(callRe, (_full, argsRaw) => {
          const args = splitRespectingDelimiters(argsRaw, ',');
          let expanded = mDef.body;
          mDef.params.forEach((p, pIdx) => {
            const argVal = args[pIdx] ?? '';
            const paramRe = new RegExp(`\\b${p}\\b`, 'g');
            expanded = expanded.replace(paramRe, `(${argVal})`);
          });
          return expanded;
        });
      }

      // 2. Expandir constantes simples: #define N 10
      for (const [name, value] of defines.entries()) {
        const re = new RegExp(`\\b${name}\\b`, 'g');
        updated = updated.replace(re, value);
      }
      return updated;
    })
    .join('');
}

/**
 * Convierte parámetros C/C++ (int arr[], vector<int>& arr, int* a, int& b, const int n) a identificadores JS.
 */
function parseCParams(
  paramsRaw: string,
  variableTypes: Record<string, string>,
  pointerScalarParams: Set<string>
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

      // Tipo escalar/puntero/arreglo C: const int& x, int *a, int arr[], int n
      const scalarOrArrMatch = trimmed.match(
        /^(?:const\s+)?(int|float|double|char|bool|long|short|unsigned|size_t|string)\s*([*&]+)?\s*([a-zA-Z_]\w*)\s*(\[\s*\d*\s*\])?$/
      );
      if (scalarOrArrMatch) {
        const pType = scalarOrArrMatch[1] === 'size_t' ? 'int' : scalarOrArrMatch[1];
        const ptrOrRef = scalarOrArrMatch[2] || '';
        const pName = scalarOrArrMatch[3];
        const isArrBracket = Boolean(scalarOrArrMatch[4]);
        // Si se llama arr, L, R, temp, aux, datos, vec, nums o tiene [], tratar como arreglo; si es *a, *b, *x, *y registrar para desreferencia
        const looksLikeArrayName = /^(?:arr|array|vec|v|L|R|left|right|temp|aux|datos|lista|nums|valores|A|B)$/i.test(pName);
        if (ptrOrRef.includes('*') && !isArrBracket && !looksLikeArrayName) {
          pointerScalarParams.add(pName);
        }
        variableTypes[pName] = isArrBracket || looksLikeArrayName ? `${pType}[]` : pType;
        return pName;
      }

      const nameMatch = trimmed.match(/([a-zA-Z_]\w*)\s*(?:\[\s*\d*\s*\])?$/);
      return nameMatch ? nameMatch[1] : trimmed;
    })
    .filter(Boolean)
    .join(', ');
}

/**
 * Extrae el tamaño N de una expresión malloc/calloc como `n1 * sizeof(int)` o `sizeof(int) * n1`.
 */
function extractMallocCountExpr(rawArg: string): string {
  const cleaned = rawArg
    .replace(/\*\s*sizeof\s*\([^)]*\)/g, '')
    .replace(/sizeof\s*\([^)]*\)\s*\*/g, '')
    .trim();
  return cleaned || '0';
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
  const flattenedSourceForScan = flattenMultilineConstructs(sourceCode.split('\n')).join('\n');
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
  const rawLines = flattenMultilineConstructs(sourceCode.split('\n')).map(line =>
    line
      .replace(/\bunsigned\s+long\s+long\b/g, 'long')
      .replace(/\blong\s+long\s+int\b/g, 'long')
      .replace(/\blong\s+long\b/g, 'long')
      .replace(/\blong\s+int\b/g, 'long')
      .replace(/\bshort\s+int\b/g, 'short')
      .replace(/\bunsigned\s+int\b/g, 'unsigned')
  );

  const defines = new Map<string, string>();
  const macroFuncs = new Map<string, MacroFuncDef>();
  const userFuncNames = new Set<string>();
  const pointerScalarParams = new Set<string>();

  const fnScanRegex = new RegExp(`\\b${C_TYPE_KEYWORDS}(?:\\s*[*&]+)?\\s+([a-zA-Z_]\\w*)\\s*\\(`, 'g');
  for (const rl of rawLines) {
    let m: RegExpExecArray | null;
    fnScanRegex.lastIndex = 0;
    while ((m = fnScanRegex.exec(rl)) !== null) {
      userFuncNames.add(m[1]);
    }
  }

  const normalizedLines = rawLines.map(line => {
    let l = line;

    // 1. Directivas #define (con parámetros y constantes) y #include
    const macroFnMatch = l.match(/^\s*#define\s+([a-zA-Z_]\w*)\(([^)]*)\)\s+(.+?)\s*$/);
    if (macroFnMatch) {
      const params = macroFnMatch[2]
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      macroFuncs.set(macroFnMatch[1], { params, body: macroFnMatch[3] });
      return `// ${l.trim()}`;
    }

    const defineMatch = l.match(/^\s*#define\s+([a-zA-Z_]\w*)\s+(.+?)\s*$/);
    if (defineMatch) {
      defines.set(defineMatch[1], defineMatch[2]);
      return `// ${l.trim()}`;
    }
    if (/^\s*#/.test(l)) {
      return `// ${l.trim()}`;
    }

    // Aplicar sustituciones de macros y constantes #define
    l = substituteDefines(l, defines, macroFuncs);

    // 2. using namespace std; y typedef simples -> comentario
    if (/^\s*using\s+namespace\s+std\s*;/.test(l) || /^\s*typedef\s+[^;]+;\s*$/.test(l)) {
      return `// ${l.trim()}`;
    }

    // 2b. Prototipos adelantados de función sin cuerpo: `void mergeSort(int arr[], int l, int r);`
    const prototypeRegex = new RegExp(
      `^\\s*(?:const\\s+)?${C_TYPE_KEYWORDS}(?:\\s*[*&]+)?\\s+[a-zA-Z_]\\w*\\s*\\([^;{}]*\\)\\s*;\\s*(?:\\/\\/.*)?$`
    );
    if (prototypeRegex.test(l) && !/\b(?:return|new|malloc|calloc|free|delete)\b/.test(l)) {
      return `// ${l.trim()}`;
    }

    // 3. Limpiar prefijos std:: comunes
    l = l.replace(/\bstd::(vector|cout|cin|endl|swap|min|max|abs|string|fill|reverse)\b/g, '$1');

    // 3b. Memoria dinámica: free(ptr); y delete[] ptr; / delete ptr; -> no-op
    l = l.replace(/\bfree\s*\([^;)]+\)\s*;/g, '/* free */ 0;');
    l = l.replace(/\bdelete\s*(?:\[\s*\])?\s+[a-zA-Z_]\w*\s*;/g, '/* delete */ 0;');

    // 3c. Utilitarios: memset(arr, val, ...), fill(v.begin(), v.end(), val), reverse(v.begin(), v.end())
    l = l.replace(
      /\bmemset\s*\(\s*([a-zA-Z_]\w*)\s*,\s*([^,]+)\s*,\s*[^;()]+(?:\([^()]*\)[^;()]*)*\)/g,
      '$1.fill($2)'
    );
    l = l.replace(
      /\bfill\s*\(\s*([a-zA-Z_]\w*)\.begin\(\s*\)\s*,\s*\1\.end\(\s*\)\s*,\s*([^)]+)\)/g,
      '$1.fill($2)'
    );
    l = l.replace(
      /\breverse\s*\(\s*([a-zA-Z_]\w*)\.begin\(\s*\)\s*,\s*\1\.end\(\s*\)\s*\)/g,
      '$1.reverse()'
    );

    // 3d. Memoria dinámica en expresiones (malloc / calloc / new type[n])
    // Ej: (int*)malloc(n1 * sizeof(int)) o malloc(n1 * sizeof(int)) -> new Array(n1).fill(0)
    l = l.replace(
      /(?:\(\s*(?:int|float|double|char|bool|long|short|unsigned|void)\s*\*\s*\)\s*)?\bmalloc\s*\(([^;()]*(?:\([^()]*\)[^;()]*)*)\)/g,
      (_m, arg) => `new Array(${extractMallocCountExpr(arg)}).fill(0)`
    );
    l = l.replace(
      /(?:\(\s*(?:int|float|double|char|bool|long|short|unsigned|void)\s*\*\s*\)\s*)?\bcalloc\s*\(\s*([^,]+)\s*,\s*[^;()]*(?:\([^()]*\)[^;()]*)*\)/g,
      (_m, countExpr) => `new Array(${countExpr.trim()}).fill(0)`
    );
    l = l.replace(
      /\bnew\s+(?:int|float|double|char|bool|long|short|unsigned|size_t)\s*\[\s*([^\]]+)\s*\]/g,
      (_m, sizeExpr) => `new Array(${sizeExpr.trim()}).fill(0)`
    );

    // 3e. Aritmética de punteros sobre arreglos: *(arr + expr) -> arr[expr]
    l = l.replace(
      /\*\s*\(\s*([a-zA-Z_]\w*)\s*\+\s*([^();,]+(?:\([^()]*\)[^();,]*)*)\)/g,
      (_m, arrName, idxExpr) => `${arrName}[${idxExpr.trim()}]`
    );

    // 3f. Paso de dirección de celda de arreglo: &arr[expr] -> arr[expr] (para swap(&arr[j], &arr[j+1]))
    l = l.replace(/&\s*([a-zA-Z_]\w*\s*\[[^\]]+\])/g, '$1');

    // 3g. Casteos C++ static_cast<T>(expr) y casteos estilo C (int)(expr) / (double)x
    l = l.replace(
      /\bstatic_cast\s*<\s*(?:int|long|short|unsigned|size_t)\s*>\s*\(([^;()]*(?:\([^()]*\)[^;()]*)*)\)/g,
      'Math.trunc($1)'
    );
    l = l.replace(
      /\bstatic_cast\s*<\s*(?:float|double)\s*>\s*\(([^;()]*(?:\([^()]*\)[^;()]*)*)\)/g,
      'Number($1)'
    );
    l = l.replace(
      /\(\s*(?:int|long|short|unsigned|size_t)\s*\)\s*(\([^;()]*(?:\([^()]*\)[^;()]*)*\)|[a-zA-Z_]\w*(?:\[[^\]]+\])?|-?\d+(?:\.\d+)?)/g,
      'Math.trunc($1)'
    );
    l = l.replace(
      /\(\s*(?:float|double)\s*\)\s*(\([^;()]*(?:\([^()]*\)[^;()]*)*\)|[a-zA-Z_]\w*(?:\[[^\]]+\])?|-?\d+(?:\.\d+)?)/g,
      'Number($1)'
    );

    // 4. Declaraciones vector<T> (simples o múltiples en una línea):
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

    // 10. Cabeceras de funciones C/C++ (incluyendo punteros/referencias, vector<int>& y main())
    const fnHeaderRegex = new RegExp(
      `\\b${C_TYPE_KEYWORDS}(?:\\s*[*&]+)?\\s+([a-zA-Z_]\\w*)\\s*\\(([^)]*)\\)\\s*(\\{?)`,
      'g'
    );
    l = l.replace(fnHeaderRegex, (_match, funcName, params, trailingBrace) => {
      const cleanParams = parseCParams(params, variableTypes, pointerScalarParams);
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

    // 11b. Bucles for clásicos (incluyendo múltiples variables: for (int i = 0, j = n - 1; ...))
    l = l.replace(
      /\bfor\s*\(\s*(?:int|size_t|long|short|unsigned|auto)\s+([a-zA-Z_]\w*)/g,
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

    // 12b. Declaraciones escalares, punteros dinámicos y múltiples
    l = l.replace(
      /^(\s*)(?:const\s+)?(int|float|double|char|bool|long|short|unsigned|size_t|string)\s+([^;]+);/g,
      (_match, indent, cType, declList) => {
        const normalizedType = cType === 'size_t' ? 'int' : cType;
        const topLevelItems = splitRespectingDelimiters(declList, ',');

        const processedDecls = topLevelItems
          .map((item: string) => {
            const cleanItem = item.replace(/^\*+\s*/, '').trim();
            const isPtrDecl = /^\*+/.test(item.trim());

            const zeroArrMatch = cleanItem.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*=\s*\{\s*0?\s*\}$/);
            if (zeroArrMatch) {
              const [, arrName, sizeExpr] = zeroArrMatch;
              variableTypes[arrName] = `${normalizedType}[]`;
              return `${arrName} = new Array(${sizeExpr.trim()}).fill(0)`;
            }
            const listArrMatch = cleanItem.match(/^([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]\s*=\s*\{\s*([^}]*)\s*\}$/);
            if (listArrMatch) {
              const [, arrName, content] = listArrMatch;
              variableTypes[arrName] = `${normalizedType}[]`;
              return `${arrName} = [ ${content.trim()} ]`;
            }
            const fixedArrMatch = cleanItem.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]$/);
            if (fixedArrMatch) {
              const arrName = fixedArrMatch[1];
              variableTypes[arrName] = `${normalizedType}[]`;
              return `${arrName} = new Array(${fixedArrMatch[2].trim()}).fill(0)`;
            }
            const varNameMatch = cleanItem.match(/^([a-zA-Z_]\w*)/);
            if (varNameMatch) {
              const vName = varNameMatch[1];
              const isDynamicArrInit = /\bnew\s+Array\(/.test(cleanItem);
              variableTypes[vName] = isPtrDecl || isDynamicArrInit ? `${normalizedType}[]` : normalizedType;
            }
            return item.replace(/^[*&]+\s*/, '').replace(/^([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]/, '$1');
          })
          .join(', ');
        return `${indent}let ${processedDecls};`;
      }
    );

    // 12c. Desreferencia de parámetros puntero escalares dentro de funciones (ej. int t = *a; *a = *b; *b = t;)
    if (pointerScalarParams.size > 0) {
      for (const pName of pointerScalarParams) {
        // Reemplazar `*a` unario (cuando no es multiplicación `x * a`)
        const derefRe = new RegExp(`(^|[=(,;{:?!+\\-\\s])\\*\\s*\\b(${pName})\\b`, 'g');
        l = l.replace(derefRe, '$1$2');
      }
    }

    // 13. Constantes C/C++
    l = l.replace(/\b(?:NULL|nullptr)\b/g, 'null');
    l = l.replace(/\bINT_MAX\b/g, '2147483647');
    l = l.replace(/\bINT_MIN\b/g, '-2147483648');

    // 14. E/S estándar (printf / cout / scanf / cin) -> no-op silencioso
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

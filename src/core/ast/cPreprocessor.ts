/**
 * Preprocesador y Normalizador de Código C / C++ y JavaScript.
 * 
 * Permite que los estudiantes escriban programas de C/C++ o JavaScript con:
 * - Directivas #include y #define
 * - Funciones auxiliares, recursivas y función principal int main()
 * - Cualquier nombre de arreglo (arr, datos, vector, conteo, etc.) y múltiples arreglos simultáneos
 * - Declaraciones de arreglos nativas con llaves: int datos[] = { 38, 27, 43, ... };
 * - Declaraciones de arreglos de tamaño fijo: int conteo[10] = {0}; o int aux[5];
 * - Registro de tipos declarados (int, float, double, char, bool) para preservar división entera en C
 * 
 * Mantiene intactos los números de línea (1:1) para que los errores y el trazado
 * se sincronicen exactamente con el editor del estudiante.
 */

export interface CNormalizationResult {
  code: string;
  detectedLanguage: 'c' | 'javascript';
  hasMain: boolean;
  mainArrayValues?: number[];
  primaryArrayName?: string;
  variableTypes: Record<string, string>;
}

/**
 * Detecta si el código fuente contiene elementos propios de C/C++.
 */
export function detectLanguage(code: string): 'c' | 'javascript' {
  const cSignatures = [
    /#include\s*<.*>/,
    /\b(void|int|float|double|char|bool|long|short|unsigned)\s+[a-zA-Z_]\w*\s*\(/,
    /\b(int|float|double|char|bool|long|short|unsigned)\s+[a-zA-Z_]\w*\s*(\[|\s*=|\s*;|\s*,)/,
    /\bsizeof\s*\(/,
    /\bprintf\s*\(/,
    /\bNULL\b/,
    /\bint\s+main\s*\(/,
    /\bvoid\s+main\s*\(/,
  ];

  for (const sig of cSignatures) {
    if (sig.test(code)) return 'c';
  }
  return 'javascript';
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

  // Extraer el primer arreglo literal definido en C ({...}) o JS ([...]), sin importar cómo se llame
  const anyArrayLiteralMatch = sourceCode.match(
    /\b([a-zA-Z_]\w*)\s*(?:\[\s*\d*\s*\])?\s*=\s*(?:\{|\[)\s*([\d\s,.-]+)\s*(?:\}|\])/
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

  // Detectar si tiene función main
  if (
    /\bint\s+main\s*\(/.test(sourceCode) ||
    /\bvoid\s+main\s*\(/.test(sourceCode) ||
    /\bfunction\s+main\s*\(/.test(sourceCode)
  ) {
    hasMain = true;
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

  // Procesamiento línea por línea para C/C++ preservando números de línea 1:1
  const lines = sourceCode.split('\n');

  const normalizedLines = lines.map((line) => {
    let l = line;

    // 1. Comentar directivas de preprocesador (#include, #define) sin alterar líneas
    if (/^\s*#/.test(l)) {
      return `// ${l.trim()}`;
    }

    // 2. Convertir inicialización de arreglos con cero en C: int aux[5] = {0}; o int aux[5] = {};
    l = l.replace(
      /\b(int|float|double|char|long|short|unsigned)\s+([a-zA-Z_]\w*)\s*\[\s*(\d+)\s*\]\s*=\s*\{\s*0?\s*\}\s*;/g,
      (_m, cType, arrName, sizeStr) => {
        variableTypes[arrName] = `${cType}[]`;
        return `let ${arrName} = new Array(${sizeStr}).fill(0);`;
      }
    );

    // 3. Convertir inicializaciones de cualquier arreglo con llaves a corchetes de JS:
    // int arr[] = { 64, 34, 25 }; o int datos[3] = { 10, 20, 30 }; => let datos = [ 10, 20, 30 ];
    l = l.replace(
      /\b(int|float|double|char|long|short|unsigned)\s+([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]\s*=\s*\{\s*([^}]*)\s*\}\s*;/g,
      (_m, cType, arrName, content) => {
        variableTypes[arrName] = `${cType}[]`;
        return `let ${arrName} = [ ${content} ];`;
      }
    );

    // 4. Reemplazar sizeof(nombreArr) / sizeof(nombreArr[0]) por nombreArr.length
    l = l.replace(
      /sizeof\s*\(\s*([a-zA-Z_]\w*)\s*\)\s*\/\s*sizeof\s*\([^)]*\)/g,
      '$1.length'
    );

    // 5. Cabeceras de funciones C (incluyendo int main()):
    // void ordenar(int datos[], int n) => function ordenar(datos, n)
    l = l.replace(
      /\b(void|int|bool|float|double|long|short|unsigned|size_t)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(\{?)/g,
      (_match, _retType, funcName, params, trailingBrace) => {
        const cleanParams = params
          .split(',')
          .map((p: string) => {
            const trimmed = p.trim();
            if (!trimmed || trimmed === 'void') return '';
            const paramParts = trimmed.match(
              /^(?:const\s+)?(int|float|double|char|bool|long|short|unsigned|size_t)\s+([a-zA-Z_]\w*)\s*(\[\s*\d*\s*\])?$/
            );
            if (paramParts) {
              const pType = paramParts[1];
              const pName = paramParts[2];
              const isArr = Boolean(paramParts[3]);
              variableTypes[pName] = isArr ? `${pType}[]` : pType;
              return pName;
            }
            const nameMatch = trimmed.match(/([a-zA-Z_]\w*)\s*(\[\s*\d*\s*\])?$/);
            return nameMatch ? nameMatch[1] : trimmed;
          })
          .filter(Boolean)
          .join(', ');

        return `function ${funcName}(${cleanParams}) ${trailingBrace || ''}`;
      }
    );

    // 6. En bucles for: for (int i = 0; ...) => for (let i = 0; ...)
    l = l.replace(
      /\bfor\s*\(\s*(int|size_t|long|unsigned)\s+([a-zA-Z_]\w*)/g,
      (_m, cType, varName) => {
        variableTypes[varName] = cType === 'size_t' ? 'int' : cType;
        return `for (let ${varName}`;
      }
    );

    // 7. Declaraciones de variables escalares o arreglos de tamaño fijo sin inicializar:
    // Ej: int i = 0, j, temp; => let i = 0, j, temp;
    // Ej: int pos = busquedaBinaria(datos, n, 27); => let pos = busquedaBinaria(datos, n, 27);
    // Ej: int aux[5]; => let aux = new Array(5).fill(0);
    l = l.replace(
      /^(\s*)(?:const\s+)?(int|float|double|char|bool|long|short|unsigned|size_t)\s+([^;]+);/g,
      (_match, indent, cType, declList) => {
        const normalizedType = cType === 'size_t' ? 'int' : cType;
        // Dividir únicamente por comas de nivel superior (fuera de paréntesis de llamadas a función)
        const topLevelItems: string[] = [];
        let current = '';
        let parenDepth = 0;
        for (let idx = 0; idx < declList.length; idx++) {
          const ch = declList[idx];
          if (ch === '(' || ch === '[') parenDepth++;
          else if (ch === ')' || ch === ']') parenDepth = Math.max(0, parenDepth - 1);
          if (ch === ',' && parenDepth === 0) {
            topLevelItems.push(current);
            current = '';
          } else {
            current += ch;
          }
        }
        if (current.trim()) topLevelItems.push(current);

        const processedDecls = topLevelItems
          .map((item: string) => {
            const trimmed = item.trim();
            const fixedArrMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*\[\s*(\d+)\s*\]$/);
            if (fixedArrMatch) {
              const arrName = fixedArrMatch[1];
              variableTypes[arrName] = `${normalizedType}[]`;
              return `${arrName} = new Array(${fixedArrMatch[2]}).fill(0)`;
            }
            const varNameMatch = trimmed.match(/^([a-zA-Z_]\w*)/);
            if (varNameMatch) {
              variableTypes[varNameMatch[1]] = normalizedType;
            }
            return trimmed.replace(/^([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]/, '$1');
          })
          .join(', ');
        return `${indent}let ${processedDecls};`;
      }
    );

    // 8. Constantes C
    l = l.replace(/\bNULL\b/g, 'null');

    // 9. printf / scanf
    l = l.replace(/\bprintf\s*\([^;]*\);/g, '/* printf */ 0;');
    l = l.replace(/\bscanf\s*\([^;]*\);/g, '/* scanf */ 0;');

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

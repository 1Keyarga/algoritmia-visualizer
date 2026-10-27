/**
 * Preprocesador y Normalizador de Código C / C++ para Acorn.js
 * 
 * Convierte un subconjunto algorítmico de C/C++ en código JavaScript sintácticamente
 * válido preservando EXACTAMENTE los números de línea y columnas para que
 * Acorn.js pueda generar el AST y sincronizar los números de línea 1:1 con el editor.
 */

export interface CNormalizationResult {
  code: string;
  detectedLanguage: 'c' | 'javascript';
}

/**
 * Detecta si el código fuente contiene elementos propios de C/C++.
 */
export function detectLanguage(code: string): 'c' | 'javascript' {
  const cSignatures = [
    /#include\s*<.*>/,
    /\b(void|int|float|double|char|bool|long)\s+[a-zA-Z_]\w*\s*\(/,
    /\b(int|float|double|char|bool|long)\s+[a-zA-Z_]\w*\s*(\[|\s*=|\s*;|\s*,)/,
    /\bsizeof\s*\(/,
    /\bprintf\s*\(/,
    /\bNULL\b/,
  ];

  for (const sig of cSignatures) {
    if (sig.test(code)) return 'c';
  }
  return 'javascript';
}

/**
 * Normaliza código C/C++ para que Acorn pueda parsearlo a AST.
 * Mantiene intactas las líneas de código (reemplaza tokens respetando saltos de línea).
 */
export function normalizeCToJavaScript(sourceCode: string): CNormalizationResult {
  const lang = detectLanguage(sourceCode);
  if (lang === 'javascript') {
    return { code: sourceCode, detectedLanguage: 'javascript' };
  }

  // Procesamiento línea por línea para garantizar correspondencia 1:1 de números de línea
  const lines = sourceCode.split('\n');

  const normalizedLines = lines.map((line) => {
    let l = line;

    // 1. Comentar directivas de preprocesador (#include, #define) sin borrar la línea
    if (/^\s*#/.test(l)) {
      return `// ${l.trim()}`;
    }

    // 2. Reemplazar sizeof(arr) / sizeof(arr[0]) o sizeof(arr)/sizeof(int) por arr.length
    l = l.replace(/sizeof\s*\(\s*arr\s*\)\s*\/\s*sizeof\s*\(\s*(arr\[0\]|int|float|double)\s*\)/g, 'arr.length');

    // 3. Reemplazar cabeceras de funciones C:
    // void ordenar(int arr[], int n) => function ordenar(arr, n)
    // int busqueda(int arr[], int n, int clave) => function busqueda(arr, n, clave)
    l = l.replace(
      /\b(void|int|bool|float|double|long)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(\{?)/g,
      (_match, _retType, funcName, params, trailingBrace) => {
        // Limpiar tipos de parámetros: "int arr[], int n" => "arr, n"
        const cleanParams = params
          .split(',')
          .map((p: string) => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            // Eliminar punteros o corchetes: "int arr[]" => "arr", "int* arr" => "arr"
            const nameMatch = trimmed.match(/([a-zA-Z_]\w*)\s*(\[\])?$/);
            return nameMatch ? nameMatch[1] : trimmed;
          })
          .filter(Boolean)
          .join(', ');

        return `function ${funcName}(${cleanParams}) ${trailingBrace || ''}`;
      }
    );

    // 4. Reemplazar declaraciones de variables:
    // int i = 0, j, temp; => let i = 0, j, temp;
    // int min = i; => let min = i;
    l = l.replace(
      /\b(int|float|double|char|bool|long|size_t)\s+([a-zA-Z_]\w*(\s*\[\s*\])?(\s*=\s*[^;,]+)?(\s*,\s*[a-zA-Z_]\w*(\s*\[\s*\])?(\s*=\s*[^;,]+)?)*)\s*;/g,
      (_match, _type, declList) => {
        // Limpiar posibles corchetes en declaraciones: "arr[]" => "arr"
        const cleanedList = declList.replace(/\[\s*\d*\s*\]/g, '');
        return `let ${cleanedList};`;
      }
    );

    // 5. Reemplazar en bucles for:
    // for (int i = 0; ...) => for (let i = 0; ...)
    l = l.replace(/\bfor\s*\(\s*(int|size_t)\s+/g, 'for (let ');

    // 6. Valores constantes C:
    l = l.replace(/\bNULL\b/g, 'null');
    l = l.replace(/\btrue\b/g, 'true');
    l = l.replace(/\bfalse\b/g, 'false');

    // 7. printf(...) o cout => comentar para no romper ejecución
    l = l.replace(/\bprintf\s*\([^;]*\);/g, '/* printf */');

    return l;
  });

  return {
    code: normalizedLines.join('\n'),
    detectedLanguage: 'c',
  };
}

/**
 * Preprocesador y Normalizador de Código C / C++ y JavaScript.
 * 
 * Permite que los estudiantes escriban programas completos de C/C++ con:
 * - Directivas #include
 * - Funciones auxiliares y función principal int main()
 * - Declaraciones de arreglos nativas con llaves: int arr[] = { 38, 27, 43, ... };
 * - Declaraciones de variables: int i, j, temp;
 * - Tipos de retorno y parámetros: void, int, etc.
 * 
 * Mantiene intactos los números de línea (1:1) para que los errores y el trazado
 * se sincronicen exactamente con el editor del estudiante.
 */

export interface CNormalizationResult {
  code: string;
  detectedLanguage: 'c' | 'javascript';
  hasMain: boolean;
  mainArrayValues?: number[];
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

  // Extraer valores si el estudiante definió un arreglo literal en C ({...}) o JS ([...])
  const arrayLiteralMatch = sourceCode.match(/\barr\s*(\[\s*\])?\s*=\s*(\{|\[)\s*([\d\s,.-]+)\s*(\}|\])/);
  if (arrayLiteralMatch && arrayLiteralMatch[3]) {
    const parsedNums = arrayLiteralMatch[3]
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n));
    if (parsedNums.length > 0) {
      mainArrayValues = parsedNums;
    }
  }

  // Detectar si tiene función main
  if (/\bint\s+main\s*\(/.test(sourceCode) || /\bvoid\s+main\s*\(/.test(sourceCode) || /\bmain\s*\(/.test(sourceCode)) {
    hasMain = true;
  }

  if (lang === 'javascript') {
    // Para JavaScript, si declara let/const/var arr = [...], sincronizarlo con __initialArr
    const jsLines = sourceCode.split('\n').map((line) => {
      let l = line;
      if (/\b(let|const|var)\s+arr\s*=\s*\[/.test(l)) {
        l = l.replace(/\b(let|const|var)\s+arr\s*=\s*\[[^\]]*\]\s*;/g, 'arr = __initialArr;');
      }
      return l;
    });

    return {
      code: jsLines.join('\n'),
      detectedLanguage: 'javascript',
      hasMain: /\bfunction\s+main\s*\(/.test(sourceCode),
      mainArrayValues,
    };
  }

  // Procesamiento línea por línea para C/C++ preservando números de línea
  const lines = sourceCode.split('\n');

  const normalizedLines = lines.map((line) => {
    let l = line;

    // 1. Comentar directivas de preprocesador (#include, #define) sin alterar líneas
    if (/^\s*#/.test(l)) {
      return `// ${l.trim()}`;
    }

    // 2. Convertir inicialización del arreglo arr principal:
    // int arr[] = { 64, 34, ... }; => arr = __initialArr;
    if (/(int|float|double|char|long)\s+arr\s*\[\s*\]\s*=\s*\{/.test(l)) {
      l = l.replace(
        /(int|float|double|char|long)\s+arr\s*\[\s*\]\s*=\s*\{[^}]*\}\s*;/g,
        'arr = __initialArr;'
      );
    } else {
      // Otros arreglos auxiliares con llaves a corchetes: int temp[] = { 1, 2 }; => let temp = [ 1, 2 ];
      l = l.replace(
        /(int|float|double|char|long)\s+([a-zA-Z_]\w*)\s*\[\s*\]\s*=\s*\{\s*([\d\s,.-]+)\s*\}\s*;/g,
        'let $2 = [ $3 ];'
      );
    }

    // 3. Reemplazar sizeof(arr) / sizeof(arr[0]) o variantes por arr.length
    l = l.replace(/sizeof\s*\(\s*arr\s*\)\s*\/\s*sizeof\s*\([^)]*\)/g, 'arr.length');
    l = l.replace(/sizeof\s*\([^)]*\)\s*\/\s*sizeof\s*\([^)]*\)/g, 'arr.length');

    // 4. Cabeceras de funciones C (incluyendo int main()):
    // void ordenar(int arr[], int n) => function ordenar(arr, n)
    // int main() => function main()
    l = l.replace(
      /\b(void|int|bool|float|double|long)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(\{?)/g,
      (_match, _retType, funcName, params, trailingBrace) => {
        const cleanParams = params
          .split(',')
          .map((p: string) => {
            const trimmed = p.trim();
            if (!trimmed || trimmed === 'void') return '';
            const nameMatch = trimmed.match(/([a-zA-Z_]\w*)\s*(\[\])?$/);
            return nameMatch ? nameMatch[1] : trimmed;
          })
          .filter(Boolean)
          .join(', ');

        return `function ${funcName}(${cleanParams}) ${trailingBrace || ''}`;
      }
    );

    // 5. Declaraciones de variables C:
    // int i = 0, j, temp; => let i = 0, j, temp;
    l = l.replace(
      /\b(int|float|double|char|bool|long|size_t)\s+([a-zA-Z_]\w*(\s*\[\s*\])?(\s*=\s*[^;,]+)?(\s*,\s*[a-zA-Z_]\w*(\s*\[\s*\])?(\s*=\s*[^;,]+)?)*)\s*;/g,
      (_match, _type, declList) => {
        const cleanedList = declList.replace(/\[\s*\d*\s*\]/g, '');
        return `let ${cleanedList};`;
      }
    );

    // 6. En bucles for: for (int i = 0; ...) => for (let i = 0; ...)
    l = l.replace(/\bfor\s*\(\s*(int|size_t)\s+/g, 'for (let ');

    // 7. Constantes C
    l = l.replace(/\bNULL\b/g, 'null');
    l = l.replace(/\btrue\b/g, 'true');
    l = l.replace(/\bfalse\b/g, 'false');

    // 8. printf / cout
    l = l.replace(/\bprintf\s*\([^;]*\);/g, '/* printf */ 0;');

    return l;
  });

  return {
    code: normalizedLines.join('\n'),
    detectedLanguage: 'c',
    hasMain,
    mainArrayValues,
  };
}

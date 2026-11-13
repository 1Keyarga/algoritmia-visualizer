import React from 'react';

const COMMON_KEYWORDS = new Set([
  'for',
  'while',
  'do',
  'if',
  'else',
  'return',
  'break',
  'continue',
  'switch',
  'case',
  'default',
  'try',
  'catch',
  'throw',
  'true',
  'false',
  'null',
  'nullptr',
  'NULL',
  'sizeof',
  'using',
  'namespace',
]);

const JS_KEYWORDS = new Set([
  'function',
  'const',
  'let',
  'var',
  'of',
  'in',
  'undefined',
  'NaN',
  'new',
  'typeof',
  'async',
  'await',
]);

const C_TYPES = new Set([
  'void',
  'int',
  'float',
  'double',
  'char',
  'bool',
  'long',
  'short',
  'unsigned',
  'signed',
  'size_t',
  'string',
  'vector',
  'auto',
  'std',
  'INT_MAX',
  'INT_MIN',
]);

const TOKEN_REGEX =
  /(\/\/.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*\b)/gm;

/**
 * Renderiza una línea de código con resaltado de sintaxis ligero compatible con C/C++ y JavaScript.
 * Usa exclusivamente color (sin negrita ni cursiva en el overlay del editor) para conservar
 * el ancho exacto de caracteres entre el textarea y la capa visual.
 */
export function highlightCodeLine(
  lineText: string,
  language: 'c' | 'javascript',
  options?: { preserveExactMetrics?: boolean }
): React.ReactNode {
  if (!lineText) return ' ';

  const trimmedStart = lineText.trimStart();
  if (language === 'c' && trimmedStart.startsWith('#')) {
    const directiveMatch = lineText.match(/^(\s*)(#\w+)(.*)$/);
    if (directiveMatch) {
      return (
        <>
          {directiveMatch[1]}
          <span className="text-fuchsia-400">{directiveMatch[2]}</span>
          <span className="text-amber-300/90">{directiveMatch[3]}</span>
        </>
      );
    }
  }

  const preserveMetrics = options?.preserveExactMetrics ?? false;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(lineText)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(lineText.slice(lastIndex, match.index));
    }

    const token = match[0];
    const nextChar = lineText.slice(match.index + token.length).match(/^\s*\(/);
    let cls = 'text-slate-200';

    if (token.startsWith('//') || token.startsWith('/*')) {
      cls = preserveMetrics ? 'text-slate-500' : 'text-slate-500 italic';
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      cls = 'text-amber-300';
    } else if (/^(?:0x[0-9a-fA-F]+|\d)/.test(token)) {
      cls = 'text-orange-300';
    } else if (
      COMMON_KEYWORDS.has(token) ||
      (language === 'javascript' && JS_KEYWORDS.has(token)) ||
      (language === 'c' && token === 'const')
    ) {
      cls = 'text-violet-400';
    } else if (language === 'c' && C_TYPES.has(token)) {
      cls = 'text-cyan-400';
    } else if (nextChar) {
      cls = 'text-sky-300';
    }

    nodes.push(
      <span key={`${match.index}-${token}`} className={cls}>
        {token}
      </span>
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < lineText.length) {
    nodes.push(lineText.slice(lastIndex));
  }

  return nodes;
}

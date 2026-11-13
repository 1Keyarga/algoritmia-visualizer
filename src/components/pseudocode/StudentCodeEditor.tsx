import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GENERAL_C_STARTER,
  GENERAL_JS_STARTER,
  validateStudentSyntax,
  instrumentAndTraceStudentCode,
} from '../../core/ast/astInstrumenter';
import type { Step } from '../../types/trace';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { highlightCodeLine } from './syntaxHighlighter';

const STORAGE_LANG_KEY = 'visurithm_student_lang';
const STORAGE_DRAFT_KEYS: Record<'c' | 'javascript', string> = {
  c: 'visurithm_student_draft_c',
  javascript: 'visurithm_student_draft_js',
};

function readInitialEditorState(): {
  language: 'c' | 'javascript';
  drafts: Record<'c' | 'javascript', string>;
} {
  try {
    const savedLang = window.localStorage.getItem(STORAGE_LANG_KEY);
    const savedC = window.localStorage.getItem(STORAGE_DRAFT_KEYS.c);
    const savedJs = window.localStorage.getItem(STORAGE_DRAFT_KEYS.javascript);
    return {
      language: savedLang === 'javascript' ? 'javascript' : 'c',
      drafts: {
        c: savedC !== null ? savedC : GENERAL_C_STARTER,
        javascript: savedJs !== null ? savedJs : GENERAL_JS_STARTER,
      },
    };
  } catch {
    return {
      language: 'c',
      drafts: {
        c: GENERAL_C_STARTER,
        javascript: GENERAL_JS_STARTER,
      },
    };
  }
}

function persistDraft(lang: 'c' | 'javascript', content: string) {
  try {
    window.localStorage.setItem(STORAGE_DRAFT_KEYS[lang], content);
  } catch {
    // Ignorar errores de almacenamiento (modo privado / cuota llena)
  }
}

interface StudentCodeEditorProps {
  currentDataset: number[];
  searchTarget?: number;
  currentStep: Step | null;
  onTraceGenerated: (steps: Step[], studentSourceCode: string, category: 'sorting' | 'searching') => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  isExecuting: boolean;
  onExitExecutionMode: () => void;
}

export const StudentCodeEditor: React.FC<StudentCodeEditorProps> = ({
  currentDataset,
  searchTarget = 45,
  currentStep,
  onTraceGenerated,
  isOpen,
  onToggleOpen,
  isExecuting,
  onExitExecutionMode,
}) => {
  const [initialEditorState] = useState(readInitialEditorState);
  const [activeLanguage, setActiveLanguage] = useState<'c' | 'javascript'>(
    initialEditorState.language
  );
  const [drafts, setDrafts] = useState<Record<'c' | 'javascript', string>>(
    initialEditorState.drafts
  );
  const code = drafts[activeLanguage];

  const updateActiveCode = (nextCode: string) => {
    setDrafts(prev => ({ ...prev, [activeLanguage]: nextCode }));
    persistDraft(activeLanguage, nextCode);
  };

  const [runtimeError, setRuntimeError] = useState<{ message: string; line: number | null } | null>(null);
  const [executionStats, setExecutionStats] = useState<{ totalSteps: number } | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLPreElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const syntaxValidation = useMemo(() => validateStudentSyntax(code), [code]);
  const syntaxError = !syntaxValidation.isValid
    ? syntaxValidation.error || 'Error de sintaxis'
    : runtimeError?.message || null;
  const errorLine = !syntaxValidation.isValid
    ? syntaxValidation.line || null
    : runtimeError?.line || null;

  // Auto-scroll hacia la línea activa durante la ejecución paso a paso
  useEffect(() => {
    if (isExecuting && currentStep?.activeLine && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isExecuting, currentStep?.activeLine]);

  // Al cambiar de lenguaje conserva ambos borradores por separado
  const handleSelectLanguage = (lang: 'c' | 'javascript') => {
    setActiveLanguage(lang);
    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // Ignorar si localStorage no está disponible
    }
    setRuntimeError(null);
    setExecutionStats(null);
    onExitExecutionMode();
  };

  // Restablecer solo el lenguaje activo a su plantilla inicial
  const handleResetCode = () => {
    const starter = activeLanguage === 'c' ? GENERAL_C_STARTER : GENERAL_JS_STARTER;
    updateActiveCode(starter);
    setRuntimeError(null);
    setExecutionStats(null);
    onExitExecutionMode();
  };

  // Enfocar y hacer scroll directo hacia la línea con error
  const handleFocusErrorLine = () => {
    if (!errorLine || !textareaRef.current) return;
    const el = textareaRef.current;
    const allLines = code.split('\n');
    const targetIdx = Math.max(0, Math.min(allLines.length - 1, errorLine - 1));
    let charOffset = 0;
    for (let i = 0; i < targetIdx; i++) {
      charOffset += allLines[i].length + 1;
    }
    const lineLength = allLines[targetIdx]?.length ?? 0;

    el.focus();
    el.setSelectionRange(charOffset, charOffset + lineLength);

    const lineHeightPx = 20;
    const targetScrollTop = Math.max(0, targetIdx * lineHeightPx - el.clientHeight / 2 + 12);
    el.scrollTop = targetScrollTop;
    if (gutterRef.current) gutterRef.current.scrollTop = targetScrollTop;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = targetScrollTop;
      highlightRef.current.scrollLeft = el.scrollLeft;
    }
  };

  // Compilar y ejecutar
  const handleCompileAndRun = () => {
    const result = instrumentAndTraceStudentCode(code, currentDataset, searchTarget);
    if (!result.success || !result.steps) {
      setRuntimeError({
        message: result.error || 'Error al procesar el código',
        line: result.line || null,
      });
      return;
    }

    setRuntimeError(null);
    setExecutionStats({ totalSteps: result.steps.length });
    onTraceGenerated(result.steps, code, 'sorting');
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const lineStart = code.lastIndexOf('\n', start - 1) + 1;
        const lineSlice = code.slice(lineStart, end);
        const removedSpaces = lineSlice.startsWith('    ')
          ? 4
          : lineSlice.startsWith('\t')
          ? 1
          : 0;
        if (removedSpaces > 0) {
          const updated = code.slice(0, lineStart) + code.slice(lineStart + removedSpaces);
          updateActiveCode(updated);
          if (runtimeError) setRuntimeError(null);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              const nextStart = Math.max(lineStart, start - removedSpaces);
              const nextEnd = Math.max(lineStart, end - removedSpaces);
              textareaRef.current.selectionStart = nextStart;
              textareaRef.current.selectionEnd = nextEnd;
            }
          });
        }
      } else {
        const updated = code.slice(0, start) + '    ' + code.slice(end);
        updateActiveCode(updated);
        if (runtimeError) setRuntimeError(null);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 4;
            textareaRef.current.selectionEnd = start + 4;
          }
        });
      }
      return;
    }

    if (e.key === 'Enter') {
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const currentLineBeforeCursor = code.slice(lineStart, start);
      const baseIndentMatch = currentLineBeforeCursor.match(/^(\s*)/);
      const baseIndent = baseIndentMatch ? baseIndentMatch[1] : '';
      const opensBlock = currentLineBeforeCursor.trimEnd().endsWith('{');
      const nextIndent = baseIndent + (opensBlock ? '    ' : '');

      if (nextIndent.length > 0) {
        e.preventDefault();
        const updated = code.slice(0, start) + '\n' + nextIndent + code.slice(end);
        updateActiveCode(updated);
        if (runtimeError) setRuntimeError(null);
        const nextPos = start + 1 + nextIndent.length;
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = nextPos;
            textareaRef.current.selectionEnd = nextPos;
          }
        });
      }
    }
  };

  // Líneas de código para la numeración
  const lines = code.split('\n');

  if (!isOpen) {
    return (
      <div
        onClick={onToggleOpen}
        className="w-10 bg-[#161722] border-r border-[#232532] flex flex-col items-center py-4 cursor-pointer hover:bg-[#1a1c2a] transition-colors group select-none shrink-0"
        title="Abrir Editor de Código"
      >
        <button className="p-1.5 rounded-lg bg-[#222434] text-slate-400 group-hover:text-white mb-4 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[11px] font-bold tracking-widest text-indigo-400 group-hover:text-indigo-300 uppercase [writing-mode:vertical-rl] rotate-180">
            Editor ({activeLanguage === 'c' ? 'C / C++' : 'JavaScript'})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[380px] sm:w-[440px] md:w-[480px] lg:w-[500px] xl:w-[540px] bg-[#141521] border-r border-[#232532] flex flex-col justify-between shrink-0 h-full overflow-hidden select-none transition-all">
      {/* 1. Encabezado del Editor */}
      <div className="bg-[#11121d] border-b border-[#232532] p-2.5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            Editor de Código
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCode}
              disabled={isExecuting}
              className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
            >
              Reiniciar
            </button>
            <button
              onClick={onToggleOpen}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              title="Colapsar editor"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selector de Lenguaje (C / JavaScript) */}
        <div className="flex items-center gap-1 bg-[#1a1c2b] p-1 rounded-lg border border-[#2c3046]">
          <button
            onClick={() => handleSelectLanguage('c')}
            disabled={isExecuting}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
              activeLanguage === 'c'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#23263a]'
            } disabled:opacity-50`}
          >
            Lenguaje C / C++
          </button>
          <button
            onClick={() => handleSelectLanguage('javascript')}
            disabled={isExecuting}
            className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
              activeLanguage === 'javascript'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#23263a]'
            } disabled:opacity-50`}
          >
            JavaScript
          </button>
        </div>
      </div>

      {/* 2. Área del Código (Edición o Visualización de Ejecución) */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0f1019] relative overflow-hidden font-mono text-xs">
        {isExecuting ? (
          /* Modo Visualización de Ejecución con resaltado activo */
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isActive = currentStep?.activeLine === lineNum;

              let bg = 'hover:bg-[#1a1c2b]/30';
              let border = 'border-transparent';
              let badge = null;

              if (isActive) {
                bg = 'bg-amber-500/20 text-amber-200 font-bold';
                border = 'border-amber-400';
                badge = (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black shrink-0">
                    Línea Activa
                  </span>
                );
              }

              return (
                <div
                  key={lineNum}
                  ref={isActive ? activeLineRef : null}
                  className={`flex items-center px-2 py-0.5 border-l-4 ${border} ${bg} transition-colors min-w-0`}
                >
                  <span className="w-7 text-right pr-2 text-slate-600 select-none text-[11px] shrink-0">
                    {lineNum}
                  </span>
                  <div className="flex-1 whitespace-pre pl-1 min-w-0 overflow-hidden text-ellipsis text-[12px] text-slate-200">
                    {isActive
                      ? lineText || ' '
                      : highlightCodeLine(lineText, activeLanguage)}
                  </div>
                  {badge && <div className="shrink-0 pl-2">{badge}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          /* Modo Edición de Código Libre */
          <div className="flex-1 flex min-h-0">
            {/* Números de Línea sincronizados verticalmente con el editor */}
            <div
              ref={gutterRef}
              className="w-9 bg-[#11121d] border-r border-[#1e2030] py-3 pb-8 text-right pr-2 text-slate-600 select-none text-[11px] shrink-0 font-mono overflow-hidden"
            >
              {lines.map((_, idx) => (
                <div
                  key={idx}
                  className={`leading-5 ${errorLine === idx + 1 ? 'text-rose-400 font-bold bg-rose-950/40' : ''}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Editor con capa de resaltado de sintaxis 1:1 detrás del textarea */}
            <div className="flex-1 relative min-w-0 min-h-0 overflow-hidden">
              <pre
                ref={highlightRef}
                aria-hidden="true"
                className="absolute inset-0 m-0 p-3 pb-8 font-mono text-[12px] leading-5 whitespace-pre overflow-hidden pointer-events-none select-none z-0"
              >
                {lines.map((lineText, idx) => (
                  <div
                    key={idx}
                    className={`min-h-5 ${errorLine === idx + 1 ? 'bg-rose-950/35' : ''}`}
                  >
                    {highlightCodeLine(lineText, activeLanguage, { preserveExactMetrics: true })}
                  </div>
                ))}
              </pre>

              <textarea
                ref={textareaRef}
                value={code}
                wrap="off"
                onKeyDown={handleEditorKeyDown}
                onScroll={e => {
                  const el = e.currentTarget;
                  if (gutterRef.current) {
                    gutterRef.current.scrollTop = el.scrollTop;
                  }
                  if (highlightRef.current) {
                    highlightRef.current.scrollTop = el.scrollTop;
                    highlightRef.current.scrollLeft = el.scrollLeft;
                  }
                }}
                onChange={(e) => {
                  updateActiveCode(e.target.value);
                  if (runtimeError) setRuntimeError(null);
                }}
                spellCheck={false}
                className={`relative z-10 w-full h-full bg-transparent ${
                  code.length > 0 ? 'text-transparent' : 'text-slate-200'
                } caret-indigo-400 p-3 leading-5 outline-none resize-none overflow-auto font-mono text-[12px] selection:bg-indigo-600/35 placeholder:text-slate-600 whitespace-pre`}
                placeholder={
                  activeLanguage === 'c'
                    ? '// Escribe aquí tu algoritmo en lenguaje C / C++...\n#include <stdio.h>\nvoid ordenar(int arr[], int n) {\n    // tu código aquí\n}\nint main() {\n    // punto de entrada\n}'
                    : '// Escribe aquí tu algoritmo en JavaScript...\nfunction ordenar(arr, n) {\n    // tu código aquí\n}\nfunction main() {\n    // punto de entrada\n}'
                }
              />
            </div>
          </div>
        )}

        {/* Alerta de Error Sintáctico / Límite de Pasos (click para saltar a la línea) */}
        {syntaxError && (
          <button
            type="button"
            onClick={handleFocusErrorLine}
            disabled={!errorLine}
            title={errorLine ? `Ir a la línea ${errorLine}` : undefined}
            className={`w-full text-left bg-rose-950/90 border-t border-rose-500/50 p-2.5 text-xs text-rose-200 shrink-0 transition-colors ${
              errorLine ? 'hover:bg-rose-900/80 cursor-pointer' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2 leading-tight">
              <div>
                <span className="font-bold">Error de análisis: </span>
                {syntaxError}
              </div>
              {errorLine && (
                <span className="shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-200">
                  Ir a línea {errorLine}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* 3. Barra Inferior de Control y Estado */}
      <div className="bg-[#12131d] border-t border-[#232532] p-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            {syntaxError ? (
              <span className="text-rose-400 text-[11px]">Sintaxis inválida</span>
            ) : (
              <span className="text-emerald-400 text-[11px]">Sintaxis válida</span>
            )}
          </div>

          {isExecuting && executionStats && (
            <span className="text-[10px] font-mono text-indigo-300">
              {executionStats.totalSteps} pasos
            </span>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2">
          {isExecuting ? (
            <button
              onClick={() => {
                setExecutionStats(null);
                onExitExecutionMode();
              }}
              className="flex-1 bg-[#202234] hover:bg-[#2b2d45] border border-[#3b3f5c] text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Editar código
            </button>
          ) : (
            <button
              onClick={handleCompileAndRun}
              disabled={!!syntaxError}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Compilar y ejecutar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

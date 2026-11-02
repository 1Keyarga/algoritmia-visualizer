import React, { useState, useEffect, useRef } from 'react';
import {
  GENERAL_C_STARTER,
  GENERAL_JS_STARTER,
  validateStudentSyntax,
  instrumentAndTraceStudentCode,
} from '../../core/ast/astInstrumenter';
import type { Step } from '../../types/trace';
import { Play, RotateCcw, AlertTriangle, CheckCircle, Code2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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
  const [activeLanguage, setActiveLanguage] = useState<'c' | 'javascript'>('c');
  const [code, setCode] = useState<string>(GENERAL_C_STARTER);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [executionStats, setExecutionStats] = useState<{ totalSteps: number } | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll hacia la línea activa durante la ejecución paso a paso
  useEffect(() => {
    if (isExecuting && currentStep?.activeLine && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isExecuting, currentStep?.activeLine]);

  // Al cambiar de lenguaje
  const handleSelectLanguage = (lang: 'c' | 'javascript') => {
    setActiveLanguage(lang);
    setCode(lang === 'c' ? GENERAL_C_STARTER : GENERAL_JS_STARTER);
    setSyntaxError(null);
    setErrorLine(null);
    setExecutionStats(null);
    onExitExecutionMode();
  };

  // Restablecer el código base desde cero
  const handleResetCode = () => {
    setCode(activeLanguage === 'c' ? GENERAL_C_STARTER : GENERAL_JS_STARTER);
    setSyntaxError(null);
    setErrorLine(null);
    setExecutionStats(null);
    onExitExecutionMode();
  };

  // Validar sintaxis al escribir
  useEffect(() => {
    const val = validateStudentSyntax(code);
    if (!val.isValid) {
      setSyntaxError(val.error || 'Error de sintaxis');
      setErrorLine(val.line || null);
    } else {
      setSyntaxError(null);
      setErrorLine(null);
    }
  }, [code]);

  // Compilar y ejecutar
  const handleCompileAndRun = () => {
    const result = instrumentAndTraceStudentCode(code, currentDataset, searchTarget);
    if (!result.success || !result.steps) {
      setSyntaxError(result.error || 'Error al procesar el código');
      setErrorLine(result.line || null);
      return;
    }

    setSyntaxError(null);
    setErrorLine(null);
    setExecutionStats({ totalSteps: result.steps.length });
    onTraceGenerated(result.steps, code, 'sorting');
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
            Editor de Código ({activeLanguage === 'c' ? 'C / C++' : 'JavaScript'})
          </span>
        </div>
        <Code2 className="w-4 h-4 text-indigo-400 mt-4" />
      </div>
    );
  }

  return (
    <div className="w-[380px] sm:w-[440px] md:w-[480px] lg:w-[500px] xl:w-[540px] bg-[#141521] border-r border-[#232532] flex flex-col justify-between shrink-0 h-full overflow-hidden select-none transition-all">
      {/* 1. Encabezado del Editor */}
      <div className="bg-[#11121d] border-b border-[#232532] p-2.5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
                Editor de Código ({activeLanguage === 'c' ? 'C / C++' : 'JavaScript'})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetCode}
              disabled={isExecuting}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
              title="Restablecer código base inicial"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
                  <div className="flex-1 whitespace-pre pl-1 min-w-0 overflow-hidden text-ellipsis text-[12px] text-slate-300">
                    {lineText || ' '}
                  </div>
                  {badge && <div className="shrink-0 pl-2">{badge}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          /* Modo Edición de Código Libre */
          <div className="flex-1 flex min-h-0">
            {/* Números de Línea */}
            <div className="w-9 bg-[#11121d] border-r border-[#1e2030] py-3 text-right pr-2 text-slate-600 select-none text-[11px] shrink-0 font-mono">
              {lines.map((_, idx) => (
                <div
                  key={idx}
                  className={`leading-5 ${errorLine === idx + 1 ? 'text-rose-400 font-bold bg-rose-950/40' : ''}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Textarea del Estudiante */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 bg-transparent text-slate-200 p-3 leading-5 outline-none resize-none overflow-auto font-mono text-[12px] selection:bg-indigo-700/50"
              placeholder={
                activeLanguage === 'c'
                  ? '// Escribe aquí tu algoritmo en lenguaje C...\n#include <stdio.h>\nvoid ordenar(int arr[], int n) {\n    // tu código aquí\n}\nint main() {\n    // punto de entrada\n}'
                  : '// Escribe aquí tu algoritmo en JavaScript...\nfunction ordenar(arr, n) {\n    // tu código aquí\n}\nfunction main() {\n    // punto de entrada\n}'
              }
            />
          </div>
        )}

        {/* Alerta de Error Sintáctico */}
        {syntaxError && (
          <div className="bg-rose-950/90 border-t border-rose-500/50 p-2.5 text-xs text-rose-200 flex items-start gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-tight">
              <span className="font-bold">Error de análisis: </span>
              {syntaxError}
            </div>
          </div>
        )}
      </div>

      {/* 3. Barra Inferior de Control y Estado */}
      <div className="bg-[#12131d] border-t border-[#232532] p-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            {syntaxError ? (
              <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" /> Sintaxis inválida
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" /> Sintaxis correcta
              </span>
            )}
          </div>

          {isExecuting && executionStats && (
            <span className="text-[10px] font-mono text-indigo-300">
              {executionStats.totalSteps} pasos generados
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
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#202234] hover:bg-[#2b2d45] border border-[#3b3f5c] text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Editar Código ({activeLanguage === 'c' ? 'C / C++' : 'JavaScript'})</span>
            </button>
          ) : (
            <button
              onClick={handleCompileAndRun}
              disabled={!!syntaxError}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Compilar y Ejecutar ({activeLanguage === 'c' ? 'C / C++' : 'JavaScript'})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

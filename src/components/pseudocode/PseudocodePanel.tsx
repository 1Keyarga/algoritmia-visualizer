import React from 'react';
import type { Step } from '../../types/trace';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';
import { StepExplanation } from './StepExplanation';
import { ChevronLeft, ChevronRight, Code2 } from 'lucide-react';

interface PseudocodePanelProps {
  algorithm: AlgorithmMetadata;
  currentStep: Step | null;
  stepIndex: number;
  totalSteps: number;
  selectedLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const PseudocodePanel: React.FC<PseudocodePanelProps> = ({
  algorithm,
  currentStep,
  stepIndex,
  totalSteps,
  selectedLanguage,
  onChangeLanguage,
  isOpen,
  onToggleOpen,
}) => {
  const languages: { id: SupportedLanguage; label: string }[] = [
    { id: 'pseudocode', label: 'Pseudocódigo' },
    { id: 'python', label: 'Python' },
    { id: 'cpp', label: 'C++' },
    { id: 'java', label: 'Java' },
  ];

  const lines = algorithm.codeByLanguage[selectedLanguage] || [];

  // Resaltado de sintaxis enriquecido para Pseudocódigo en Español, Python, C++ y Java
  const renderCodeWithSyntax = (code: string) => {
    if (!code) return <span>&nbsp;</span>;
    if (code.trim().startsWith('//') || code.trim().startsWith('#')) {
      return <span className="text-slate-500 italic">{code}</span>;
    }

    const tokens = code.split(
      /(\balgoritmo\b|\bfuncion\b|\bpara\b|\bhacer\b|\bdesde\b|\bhasta\b|\bsi\b|\bentonces\b|\bno\b|\binterrumpir\b|\bretornar\b|\bintercambiar\b|\blongitud\b|\bVerdadero\b|\bFalso\b|\bdef\b|\bin\b|\brange\b|\blen\b|\bswap\b|\bTrue\b|\bFalse\b|\bvoid\b|\bint\b|\bbool\b|\bvector\b|\bpublic\b|\bstatic\b|\bbreak\b|\breturn\b|\bwhile\b|\bfor\b|\bif\b|\belse\b|[←(),:><=+\-\[\];{}])/g
    );

    return tokens.map((token, i) => {
      // Palabras clave de control
      if (['algoritmo', 'funcion', 'def', 'void', 'public', 'static', 'retornar', 'return', 'interrumpir', 'break'].includes(token)) {
        return <span key={i} className="text-purple-400 font-semibold">{token}</span>;
      }
      // Bucles y condicionales
      if (['para', 'hacer', 'desde', 'hasta', 'si', 'entonces', 'no', 'for', 'in', 'while', 'if', 'else'].includes(token)) {
        return <span key={i} className="text-pink-400 font-semibold">{token}</span>;
      }
      // Tipos y funciones integradas
      if (['longitud', 'intercambiar', 'range', 'len', 'swap', 'size', 'length', 'int', 'bool', 'vector'].includes(token)) {
        return <span key={i} className="text-cyan-400 font-medium">{token}</span>;
      }
      // Booleanos
      if (['Verdadero', 'Falso', 'True', 'False', 'true', 'false'].includes(token)) {
        return <span key={i} className="text-emerald-400 font-semibold">{token}</span>;
      }
      // Operadores especiales
      if (['←', '=', '==', '!=', '<', '>', '<=', '>=', '+', '-', '+=', '-='].includes(token)) {
        return <span key={i} className="text-amber-300 font-medium">{token}</span>;
      }
      // Paréntesis y delimitadores
      if (['(', ')', '[', ']', '{', '}', ';', ':', ','].includes(token)) {
        return <span key={i} className="text-slate-400">{token}</span>;
      }
      // Variables
      if (['arr', 'bubble_sort', 'bubbleSort'].includes(token)) {
        return <span key={i} className="text-amber-200">{token}</span>;
      }
      if (['i', 'j', 'n', 'swapped', 'intercambiado', 'temp', 'key', 'clave'].includes(token)) {
        return <span key={i} className="text-slate-200 font-medium">{token}</span>;
      }
      return <span key={i} className="text-slate-300">{token}</span>;
    });
  };

  const getLineHighlight = (lineNum: number) => {
    if (!currentStep) return null;
    
    // Buscar en highlights detallados
    const customHighlight = currentStep.highlights?.find(h => {
      if (h.lineByLanguage) {
        return h.lineByLanguage[selectedLanguage] === lineNum;
      }
      return h.lineNumber === lineNum;
    });

    if (customHighlight) return customHighlight;

    const mappedActive = currentStep.activeLineByLang?.[selectedLanguage] || currentStep.activeLine;
    if (mappedActive === lineNum) {
      return { lineNumber: lineNum, type: 'active' as const };
    }
    return null;
  };

  // Barra colapsada
  if (!isOpen) {
    return (
      <div
        onClick={onToggleOpen}
        className="w-10 bg-[#161722] hover:bg-[#1c1e2d] border-r border-[#232532] flex flex-col items-center py-4 cursor-pointer transition-colors shrink-0 group select-none"
        title="Expandir panel de código"
      >
        <button className="p-1.5 rounded-lg bg-[#222434] text-slate-400 group-hover:text-white mb-4 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[11px] font-bold tracking-widest text-slate-400 group-hover:text-indigo-300 uppercase [writing-mode:vertical-rl] rotate-180">
            Pseudocódigo / Código
          </span>
        </div>
        <Code2 className="w-4 h-4 text-indigo-400/70 mt-4" />
      </div>
    );
  }

  return (
    <div className="w-[420px] xl:w-[460px] bg-[#161722] border-r border-[#232532] flex flex-col justify-between shrink-0 h-full overflow-hidden select-none transition-all">
      {/* Header with Language Tabs and Collapse Button */}
      <div className="bg-[#13141d] border-b border-[#232532] p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              Código / Algoritmo
            </span>
          </div>
          <button
            onClick={onToggleOpen}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            title="Colapsar panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-[#1a1c27] p-1 rounded-lg border border-[#27293a]">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => onChangeLanguage(lang.id)}
                className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#232537]'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="flex-1 overflow-y-auto py-3 font-mono-code text-[13px] leading-relaxed">
        {lines.map((line) => {
          const highlight = getLineHighlight(line.lineNumber);
          
          let rowClass = 'hover:bg-[#1e202f]/50 transition-colors';
          let borderClass = 'border-transparent';
          let badge = null;
          let icon = null;

          if (highlight) {
            if (highlight.type === 'executed') {
              rowClass = 'bg-emerald-950/40 text-emerald-200';
              borderClass = 'border-l-4 border-emerald-500';
              badge = <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-600/50">ejecutado</span>;
              icon = <span className="w-2 h-2 rounded-[2px] bg-emerald-400 shrink-0 inline-block mr-1.5 shadow-sm shadow-emerald-500" />;
            } else if (highlight.type === 'next') {
              rowClass = 'bg-amber-950/40 text-amber-200';
              borderClass = 'border-l-4 border-amber-500';
              badge = <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-600/50">siguiente</span>;
              icon = <span className="w-2 h-2 rounded-[2px] bg-amber-400 shrink-0 inline-block mr-1.5 shadow-sm shadow-amber-500" />;
            } else if (highlight.type === 'evaluating') {
              rowClass = 'bg-indigo-950/60 text-indigo-200';
              borderClass = 'border-l-4 border-indigo-500';
              icon = <span className="w-2 h-2 rounded-[2px] bg-indigo-400 shrink-0 inline-block mr-1.5 shadow-sm shadow-indigo-500" />;
            } else {
              rowClass = 'bg-indigo-950/80 text-indigo-100 font-semibold shadow-inner';
              borderClass = 'border-l-4 border-indigo-500';
              icon = <span className="w-2 h-2 rounded-[2px] bg-indigo-400 shrink-0 inline-block mr-1.5 shadow-sm shadow-indigo-500" />;
            }
          }

          return (
            <div
              key={line.lineNumber}
              className={`flex items-center px-3 py-1 border-l-4 ${borderClass} ${rowClass}`}
            >
              {/* Line number + marker icon */}
              <div className="w-10 text-slate-500 text-right pr-3 select-none flex items-center justify-end text-xs">
                {icon}
                <span>{line.lineNumber}</span>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-x-auto whitespace-pre pl-1">
                {renderCodeWithSyntax(line.code)}
              </div>

              {/* Status Badge */}
              {badge && (
                <div className="shrink-0 pl-2">
                  {badge}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation Footer Box */}
      <div className="p-3.5 bg-[#12131b] border-t border-[#232532]">
        <StepExplanation
          currentStep={currentStep}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
        />
      </div>
    </div>
  );
};

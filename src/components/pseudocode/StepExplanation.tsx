import React from 'react';
import type { Step } from '../../types/trace';

interface StepExplanationProps {
  currentStep: Step | null;
  stepIndex: number;
  totalSteps: number;
  activeLineNumber?: number;
}

export const StepExplanation: React.FC<StepExplanationProps> = ({
  currentStep,
  activeLineNumber,
}) => {
  const displayedLine = activeLineNumber ?? currentStep?.activeLine ?? 0;

  return (
    <div className="bg-[#14151f] border border-[#232534] rounded-xl p-3.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
          Explicación del paso
        </span>
        {currentStep && displayedLine > 0 && (
          <span className="text-[10px] font-mono text-slate-400">
            Línea {displayedLine}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[38px] max-h-[54px] overflow-y-auto pr-1">
        {currentStep?.explanation || 'Esperando inicio de la ejecución del algoritmo.'}
      </p>
    </div>
  );
};

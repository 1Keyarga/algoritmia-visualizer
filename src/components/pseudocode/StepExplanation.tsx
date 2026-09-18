import React from 'react';
import type { Step } from '../../types/trace';

interface StepExplanationProps {
  currentStep: Step | null;
  stepIndex: number;
  totalSteps: number;
}

export const StepExplanation: React.FC<StepExplanationProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
}) => {
  const percentage = totalSteps > 1 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <div className="bg-[#14151f] border border-[#232534] rounded-xl p-3.5 flex flex-col gap-3 shadow-lg">
      <div className="flex flex-col gap-1 border-l-2 border-indigo-500 pl-3">
        <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
          ¿Por qué este paso?
        </span>
        <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[36px]">
          {currentStep?.explanation || 'Esperando inicio de la ejecución del algoritmo.'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#202230]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-400">
            Paso {stepIndex + 1} de {totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-[140px]">
          <div className="w-full bg-[#202230] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

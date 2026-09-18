import React from 'react';
import type { Step } from '../../types/trace';
import { D3BarChart } from './D3BarChart';

interface VisualizerPanelProps {
  currentStep: Step | null;
  stepIndex: number;
  totalSteps: number;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
}) => {
  return (
    <div className="flex-1 bg-[#171821] p-4 flex flex-col min-h-0 select-none">
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#232532]">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Visualización
        </span>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            Paso {stepIndex + 1} de {totalSteps}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center pt-2">
        {currentStep ? (
          <D3BarChart array={currentStep.array} />
        ) : (
          <div className="text-slate-500 text-xs">Cargando visualización...</div>
        )}
      </div>
    </div>
  );
};

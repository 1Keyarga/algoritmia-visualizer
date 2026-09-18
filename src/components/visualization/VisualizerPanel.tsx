import React from 'react';
import type { Step } from '../../types/trace';
import { D3BarChart } from './D3BarChart';
import { BarChart3, Maximize2, Minimize2 } from 'lucide-react';

interface VisualizerPanelProps {
  currentStep: Step | null;
  stepIndex: number;
  totalSteps: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex-1 bg-[#151622] p-4 flex flex-col min-h-0 select-none relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#232534] shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
            Visualización Gráfica (D3.js)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Step indicator badge */}
          <div className="flex items-center gap-2 bg-[#1c1d2c] px-3 py-1 rounded-full border border-[#2b2d42]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              Paso {stepIndex + 1} de {totalSteps}
            </span>
          </div>

          {/* Fullscreen toggle (RF-21) */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg bg-[#1c1d2c] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#2b2d42] transition-colors cursor-pointer"
            title={isFullscreen ? 'Restaurar vista' : 'Maximizar gráfico'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* D3 Canvas Container */}
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

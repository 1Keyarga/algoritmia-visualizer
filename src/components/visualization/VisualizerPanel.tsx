import React from 'react';
import type { Step } from '../../types/trace';
import { D3BarChart } from './D3BarChart';
import { DivideAndConquerContainer } from './divide_and_conquer/DivideAndConquerContainer';
import { BarChart3, GitFork, Maximize2, Minimize2 } from 'lucide-react';

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
  const isDivideAndConquer = !!currentStep?.divideAndConquer;

  return (
    <div className="flex-1 bg-[#151622] p-4 flex flex-col min-h-[350px] select-none relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#232534] shrink-0">
        <div className="flex items-center gap-2">
          {isDivideAndConquer ? (
            <GitFork className="w-4 h-4 text-amber-400" />
          ) : (
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          )}
          <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
            {isDivideAndConquer
              ? 'Divide y Vencerás'
              : 'Visualización Gráfica (D3.js)'}
          </span>

          {/* Explanation inline for DnC */}
          {isDivideAndConquer && currentStep && (
            <span className="text-[11px] text-slate-400 font-normal ml-2 hidden lg:inline truncate max-w-[420px]">
              — {currentStep.explanation}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Metrics mini-badges for DnC */}
          {isDivideAndConquer && currentStep && (
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-[#1c1d2c] border border-[#2b2d42] text-slate-300">
                Comp: {currentStep.metrics.comparisons}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1c1d2c] border border-[#2b2d42] text-slate-300">
                Mov: {currentStep.metrics.swaps}
              </span>
            </div>
          )}

          {/* Step indicator badge */}
          <div className="flex items-center gap-2 bg-[#1c1d2c] px-3 py-1 rounded-full border border-[#2b2d42]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              Paso {stepIndex + 1} de {totalSteps}
            </span>
          </div>

          {/* Fullscreen toggle */}
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

      {/* Main Canvas Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        {currentStep ? (
          isDivideAndConquer && currentStep.divideAndConquer ? (
            <DivideAndConquerContainer
              dcState={currentStep.divideAndConquer}
              frames={currentStep.frames}
              metrics={currentStep.metrics}
              complexity={currentStep.complexity}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <D3BarChart array={currentStep.array} />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">Cargando visualización...</div>
        )}
      </div>
    </div>
  );
};

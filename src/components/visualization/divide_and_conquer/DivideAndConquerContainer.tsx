import React from 'react';
import type { DivideAndConquerState, MemoryFrame, StepMetrics, ComplexityInfo } from '../../../types/trace';
import { RecursionTreeVisualizer } from './RecursionTreeVisualizer';
import { Layers } from 'lucide-react';

interface DivideAndConquerContainerProps {
  dcState: DivideAndConquerState;
  frames?: MemoryFrame[];
  metrics?: StepMetrics;
  complexity?: ComplexityInfo;
}

export const DivideAndConquerContainer: React.FC<DivideAndConquerContainerProps> = ({ dcState, frames: _frames, metrics: _metrics, complexity: _complexity }) => {
  const { activePhase, phaseDescription } = dcState;

  // Fases del flujo conceptual
  const phases: Array<{ id: 'divide' | 'conquer' | 'combine' | 'completed'; label: string; icon: string }> = [
    { id: 'divide', label: '1. Divide', icon: '⚡' },
    { id: 'conquer', label: '2. Caso Base', icon: '✔' },
    { id: 'combine', label: '3. Mezcla', icon: '⮁' },
    { id: 'completed', label: '4. Resuelto', icon: '🏆' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#11121b] select-none font-sans">
      {/* Barra de Control de Fases */}
      <div className="bg-[#151624] border-b border-[#232537] px-4 py-2 flex flex-wrap items-center gap-3 shrink-0">
        
        {/* Indicador de Fases Dinámico */}
        <div className="flex items-center gap-2">
          {phases.map(phase => {
            const isCurrent = activePhase === phase.id;
            return (
              <div
                key={phase.id}
                className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full border transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-[#181a28] text-slate-500 border-[#272a3e]'
                }`}
              >
                <span>{phase.icon}</span>
                <span>{phase.label}</span>
              </div>
            );
          })}
        </div>

        {/* Descripción de la Fase Actual */}
        {phaseDescription && (
          <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5 bg-[#1a1c2e] px-2.5 py-1 rounded-md border border-[#2b2d42] ml-auto">
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[320px]">{phaseDescription}</span>
          </div>
        )}
      </div>

      {/* Canvas del Árbol */}
      <div className="flex-1 min-h-0 relative">
        <RecursionTreeVisualizer dcState={dcState} />
      </div>
    </div>
  );
};

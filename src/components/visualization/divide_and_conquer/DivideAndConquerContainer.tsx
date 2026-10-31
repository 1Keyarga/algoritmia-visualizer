import React from 'react';
import type { DivideAndConquerState } from '../../../types/trace';
import { RecursionTreeVisualizer } from './RecursionTreeVisualizer';
import { Layers } from 'lucide-react';

interface DivideAndConquerContainerProps {
  dcState: DivideAndConquerState;
}

export const DivideAndConquerContainer: React.FC<DivideAndConquerContainerProps> = ({ dcState }) => {
  const { activePhase, phaseDescription } = dcState;

  const phases: Array<{ id: 'divide' | 'conquer' | 'combine' | 'completed'; label: string }> = [
    { id: 'divide', label: '1. División' },
    { id: 'conquer', label: '2. Caso Base' },
    { id: 'combine', label: '3. Combinación' },
    { id: 'completed', label: '4. Resuelto' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#11121b] rounded-xl border border-[#232537] overflow-hidden select-none font-sans">
      {/* Barra de Control de Fases de altura fija (sin saltos de línea) */}
      <div className="bg-[#151624] border-b border-[#232537] px-3.5 h-10 flex items-center justify-between gap-3 shrink-0 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          {phases.map(phase => {
            const isCurrent = activePhase === phase.id;
            return (
              <div
                key={phase.id}
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                    : 'bg-[#181a28] text-slate-400 border-[#272a3e]'
                }`}
              >
                {phase.label}
              </div>
            );
          })}
        </div>

        {phaseDescription && (
          <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 bg-[#1a1c2e] px-2.5 py-0.5 rounded-md border border-[#2b2d42] min-w-0 max-w-[380px]">
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{phaseDescription}</span>
          </div>
        )}
      </div>

      {/* Lienzo completo dedicado al Árbol de Recursión */}
      <div className="flex-1 min-h-0 relative">
        <RecursionTreeVisualizer dcState={dcState} />
      </div>
    </div>
  );
};

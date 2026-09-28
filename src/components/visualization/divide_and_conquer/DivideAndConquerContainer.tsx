import React, { useState } from 'react';
import type { DivideAndConquerState } from '../../../types/trace';
import { RecursionTreeVisualizer } from './RecursionTreeVisualizer';
import { ParallelView } from './ParallelView';
import { GitFork, Network, Layers } from 'lucide-react';

interface DivideAndConquerContainerProps {
  dcState: DivideAndConquerState;
}

export const DivideAndConquerContainer: React.FC<DivideAndConquerContainerProps> = ({ dcState }) => {
  const [viewMode, setViewMode] = useState<'tree' | 'parallel'>('tree');

  const { activePhase, phaseDescription } = dcState;

  // Fases del flujo conceptual
  const phases: Array<{ id: 'divide' | 'conquer' | 'combine' | 'completed'; label: string; icon: string }> = [
    { id: 'divide', label: '1. Divide (Bifurcación)', icon: '⚡' },
    { id: 'conquer', label: '2. Conquer (Casos Base)', icon: '✔' },
    { id: 'combine', label: '3. Combine (Mezcla)', icon: '⮁' },
    { id: 'completed', label: '4. Resultado (Ordenado)', icon: '🏆' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#11121b] select-none font-sans">
      {/* Barra de Control de Vistas y Fases de Divide y Vencerás */}
      <div className="bg-[#151624] border-b border-[#232537] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Toggle de Vistas: Árbol vs Paralelismo */}
        <div className="flex items-center gap-1 bg-[#1a1b2c] p-1 rounded-lg border border-[#2b2d44]">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Árbol de Recursión</span>
          </button>

          <button
            onClick={() => setViewMode('parallel')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'parallel'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Paralelismo (Fork-Join)</span>
          </button>
        </div>

        {/* Indicador de Fases Dinámico */}
        <div className="hidden md:flex items-center gap-2">
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
          <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5 bg-[#1a1c2e] px-2.5 py-1 rounded-md border border-[#2b2d42]">
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[320px]">{phaseDescription}</span>
          </div>
        )}
      </div>

      {/* Contenido según la pestaña seleccionada */}
      <div className="flex-1 min-h-0 relative">
        {viewMode === 'tree' ? (
          <RecursionTreeVisualizer dcState={dcState} />
        ) : (
          <ParallelView parallelState={dcState.parallel} />
        )}
      </div>
    </div>
  );
};

import React from 'react';
import type { DivideAndConquerState, Step } from '../../../types/trace';
import { RecursionTreeVisualizer } from './RecursionTreeVisualizer';
import { Layers, Cpu } from 'lucide-react';

interface DivideAndConquerContainerProps {
  dcState: DivideAndConquerState;
  currentStep?: Step;
}

export const DivideAndConquerContainer: React.FC<DivideAndConquerContainerProps> = ({
  dcState,
  currentStep,
}) => {
  const { activePhase, phaseDescription, activeNodeId, nodes } = dcState;
  const activeNode = activeNodeId ? nodes[activeNodeId] : undefined;
  const activeRange = activeNode ? activeNode.range : undefined;

  const phases: Array<{ id: 'divide' | 'conquer' | 'combine' | 'completed'; label: string }> = [
    { id: 'divide', label: '1. División / Partición' },
    { id: 'conquer', label: '2. Caso Base' },
    { id: 'combine', label: '3. Combinación / Fijación' },
    { id: 'completed', label: '4. Resuelto' },
  ];

  const array = currentStep?.array || [];
  const activeIndices = currentStep?.activeIndices || {};
  const callStack = currentStep?.frames ? [...currentStep.frames].reverse() : [];

  const getPointerBadge = (idx: number): { text: string; cls: string } | null => {
    const labels: string[] = [];
    let isFocus = false;
    if (activeIndices.pivot === idx) {
      labels.push('pivote');
      isFocus = true;
    }
    if (activeIndices.mid === idx) {
      labels.push('medio');
      isFocus = true;
    }
    if (activeIndices.i === idx) labels.push('i');
    if (activeIndices.j === idx) labels.push('j');

    if (labels.length === 0) return null;
    return {
      text: labels.join(','),
      cls: isFocus
        ? 'bg-purple-500/30 text-purple-200 border-purple-400/60'
        : 'bg-amber-500/30 text-amber-200 border-amber-400/60',
    };
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#11121b] rounded-xl border border-[#232537] overflow-hidden select-none font-sans">
      {/* 1. Barra Superior de Fases y Pila de Recursión */}
      <div className="bg-[#151624] border-b border-[#232537] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {phases.map(phase => {
            const isCurrent = activePhase === phase.id;
            return (
              <div
                key={phase.id}
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border transition-colors ${
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
          <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 bg-[#1a1c2e] px-2.5 py-0.5 rounded-md border border-[#2b2d42]">
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[360px]">{phaseDescription}</span>
          </div>
        )}
      </div>

      {/* 2. Lienzo Central: Árbol de Recursión Auto-Ajustado */}
      <div className="flex-1 min-h-[210px] relative">
        <RecursionTreeVisualizer dcState={dcState} />
      </div>

      {/* 3. Barra Inferior Fija: Estado del Arreglo Global y Rango Activo [inicio..fin] */}
      {array.length > 0 && (
        <div className="bg-[#141624] border-t border-[#23263a] px-4 py-2.5 shrink-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold uppercase tracking-wider">
                Arreglo en Memoria (arr[0..{array.length - 1}])
              </span>
              {activeRange && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                  Subproblema activo: [{activeRange[0]}..{activeRange[1]}]
                </span>
              )}
            </div>

            {/* Pila de llamadas recursivas en vivo */}
            {callStack.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                <span className="text-slate-400 mr-1">Pila:</span>
                {callStack.map((frame, i) => (
                  <React.Fragment key={frame.id || i}>
                    {i > 0 && <span className="text-slate-500">➔</span>}
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        frame.isActive
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-[#181a2a] text-slate-400 border-[#262940]'
                      }`}
                    >
                      {frame.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Tira horizontal de celdas con altura fija */}
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-0.5">
            {array.map((item, idx) => {
              const inActiveSubarray =
                !activeRange || (idx >= activeRange[0] && idx <= activeRange[1]);
              const ptr = getPointerBadge(idx);

              let cellCls = 'bg-[#1a1c2d] border-[#2d314b] text-slate-200';
              if (item.state === 'comparing') {
                cellCls = 'bg-amber-500/25 border-amber-400 text-amber-200 font-black';
              } else if (item.state === 'swapped') {
                cellCls = 'bg-sky-500/25 border-sky-400 text-sky-100 font-black';
              } else if (item.state === 'selected') {
                cellCls = 'bg-purple-500/25 border-purple-400 text-purple-200 font-black';
              } else if (item.state === 'sorted') {
                cellCls = 'bg-emerald-500/20 border-emerald-500/70 text-emerald-200 font-bold';
              }

              return (
                <div
                  key={item.id || idx}
                  className={`flex flex-col items-center shrink-0 transition-opacity duration-200 ${
                    inActiveSubarray ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {/* Fila de puntero superior con altura fija h-4 */}
                  <div className="h-4 flex items-center justify-center mb-0.5">
                    {ptr && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1 rounded border leading-tight ${ptr.cls}`}
                      >
                        {ptr.text}
                      </span>
                    )}
                  </div>

                  {/* Celda del arreglo */}
                  <div
                    className={`w-10 sm:w-11 h-10 rounded-lg border flex flex-col items-center justify-center font-mono transition-colors duration-200 ${cellCls}`}
                  >
                    <span className="text-xs font-bold leading-none">{item.value}</span>
                    <span className="text-[8px] text-slate-400 mt-0.5 leading-none">
                      [{idx}]
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import type { Step } from '../../types/trace';
import { StackFrames } from './StackFrames';
import { ArrayGrid } from './ArrayGrid';
import { MetricsOverview } from './MetricsOverview';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MemoryPanelProps {
  currentStep: Step | null;
  stepIndex?: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  hideArrayGrid?: boolean;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  currentStep,
  stepIndex = 0,
  isOpen,
  onToggleOpen,
  hideArrayGrid = false,
}) => {
  if (!currentStep) return null;

  if (!isOpen) {
    return (
      <div
        onClick={onToggleOpen}
        className="bg-[#151622] hover:bg-[#1a1c2b] border-b border-[#232532] px-4 py-2 flex items-center justify-between cursor-pointer transition-colors select-none shrink-0"
        title="Expandir panel"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Memoria
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            — {currentStep.array.length} elementos | {currentStep.metrics.comparisons} comp | {currentStep.metrics.swaps} swaps
          </span>
        </div>
        <button className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#171824] border-b border-[#232532] p-3 flex flex-col justify-between select-none shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#242638] shrink-0">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Memoria
        </span>
        <button
          onClick={onToggleOpen}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          title="Colapsar panel"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content: Frames + Objetos (o vista compacta cuando el lienzo inferior ya grafica el arreglo) */}
      {hideArrayGrid ? (
        (() => {
          const activeFrame =
            currentStep.frames.find(f => f.isActive) || currentStep.frames[0];
          const entries = activeFrame ? Object.entries(activeFrame.variables) : [];
          return (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {activeFrame && (
                  <span className="text-xs font-mono font-bold text-amber-400 mr-1.5">
                    {activeFrame.name}
                  </span>
                )}
                {entries.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 bg-[#141520] border border-[#25283a] rounded-md px-2 py-0.5 text-[11px] font-mono"
                  >
                    <span className="text-slate-400">{key}:</span>
                    <span className="font-bold text-slate-100">
                      {val === null || val === undefined ? '—' : String(val)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="shrink-0">
                <MetricsOverview
                  metrics={currentStep.metrics}
                  complexity={currentStep.complexity}
                  stepIndex={stepIndex}
                />
              </div>
            </div>
          );
        })()
      ) : (
        <div className="flex gap-4 items-start min-h-0">
          <StackFrames frames={currentStep.frames} />

          <div className="flex-1 flex flex-col justify-between min-w-0">
            <ArrayGrid
              array={currentStep.array}
              activeIndices={currentStep.activeIndices}
            />
            <MetricsOverview
              metrics={currentStep.metrics}
              complexity={currentStep.complexity}
              stepIndex={stepIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import type { Step } from '../../types/trace';
import { StackFrames } from './StackFrames';
import { ArrayGrid } from './ArrayGrid';
import { MetricsOverview } from './MetricsOverview';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MemoryPanelProps {
  currentStep: Step | null;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  currentStep,
  isOpen,
  onToggleOpen,
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
    <div className="bg-[#171824] border-b border-[#232532] p-4 flex flex-col justify-between shrink-0 select-none shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#242638]">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Memoria
        </span>
        <button
          onClick={onToggleOpen}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          title="Colapsar panel"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Content: Frames + Objetos */}
      <div className="flex gap-6 items-start">
        <StackFrames frames={currentStep.frames} />

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <ArrayGrid
            array={currentStep.array}
            activeIndices={currentStep.activeIndices}
          />
          <MetricsOverview
            metrics={currentStep.metrics}
            complexity={currentStep.complexity}
          />
        </div>
      </div>
    </div>
  );
};

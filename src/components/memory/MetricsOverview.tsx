import React from 'react';
import type { StepMetrics, ComplexityInfo } from '../../types/trace';
import { GitCompare, ArrowLeftRight, Clock, Box } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: StepMetrics;
  complexity: ComplexityInfo;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  metrics,
  complexity,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-code pt-1.5 mt-1 border-t border-[#25283a] text-slate-300">
      {/* Counters */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#1b1c28] px-2 py-1 rounded-md border border-[#2b2e44]">
          <GitCompare className="w-3 h-3 text-amber-400" />
          <span className="text-slate-400 font-sans">Comp:</span>
          <span className="font-bold text-amber-300">{metrics.comparisons}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#1b1c28] px-2 py-1 rounded-md border border-[#2b2e44]">
          <ArrowLeftRight className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400 font-sans">Swaps:</span>
          <span className="font-bold text-indigo-300">{metrics.swaps}</span>
        </div>
      </div>

      {/* Complexity Badges */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#1b1c28] px-2 py-1 rounded-md border border-[#2b2e44]">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400 font-sans">Tiempo:</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold">
            {complexity.timeComplexity}
          </span>
          {complexity.bestCase && (
            <span className="text-[9px] text-emerald-400 font-mono" title="Mejor caso">
              ({complexity.bestCase})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-[#1b1c28] px-2 py-1 rounded-md border border-[#2b2e44]">
          <Box className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400 font-sans">Espacio:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
            {complexity.spaceComplexity}
          </span>
        </div>
      </div>
    </div>
  );
};

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
    <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono-code pt-3 mt-1 border-t border-[#25283a] text-slate-300">
      {/* Counters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#1b1c28] px-3 py-1.5 rounded-lg border border-[#2b2e44]">
          <GitCompare className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400 font-sans text-xs">Comparaciones:</span>
          <span className="font-bold text-amber-300 text-sm">{metrics.comparisons}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#1b1c28] px-3 py-1.5 rounded-lg border border-[#2b2e44]">
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-sans text-xs">Intercambios:</span>
          <span className="font-bold text-indigo-300 text-sm">{metrics.swaps}</span>
        </div>
      </div>

      {/* Complexity Badges */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#1b1c28] px-3 py-1.5 rounded-lg border border-[#2b2e44]">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-sans text-xs">Tiempo:</span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold text-xs">
            {complexity.timeComplexity}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#1b1c28] px-3 py-1.5 rounded-lg border border-[#2b2e44]">
          <Box className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 font-sans text-xs">Espacio:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold text-xs">
            {complexity.spaceComplexity}
          </span>
        </div>
      </div>
    </div>
  );
};

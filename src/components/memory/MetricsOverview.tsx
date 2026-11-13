import React from 'react';
import type { StepMetrics, ComplexityInfo } from '../../types/trace';

interface MetricsOverviewProps {
  metrics: StepMetrics;
  complexity: ComplexityInfo;
  stepIndex?: number;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  metrics,
  complexity,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-code pt-1.5 mt-1 border-t border-[#25283a] text-slate-300">
      <div className="flex items-center gap-3">
        <div>
          <span className="text-slate-400 font-sans">Comparaciones: </span>
          <span className="font-bold text-amber-300">{metrics.comparisons}</span>
        </div>

        <span className="text-slate-600">·</span>

        <div>
          <span className="text-slate-400 font-sans">Intercambios: </span>
          <span className="font-bold text-indigo-300">{metrics.swaps}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div>
          <span className="text-slate-400 font-sans">Tiempo: </span>
          <span className="font-bold text-indigo-300">{complexity.timeComplexity}</span>
          {complexity.bestCase && (
            <span className="text-[10px] text-emerald-400 ml-1" title="Mejor caso">
              ({complexity.bestCase})
            </span>
          )}
        </div>

        <span className="text-slate-600">·</span>

        <div>
          <span className="text-slate-400 font-sans">Espacio: </span>
          <span className="font-bold text-emerald-300">{complexity.spaceComplexity}</span>
        </div>
      </div>
    </div>
  );
};

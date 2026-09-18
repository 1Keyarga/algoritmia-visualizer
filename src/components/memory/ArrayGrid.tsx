import React from 'react';
import type { ArrayElement } from '../../types/trace';

interface ArrayGridProps {
  array: ArrayElement[];
  activeIndices?: {
    i?: number;
    j?: number;
    [key: string]: number | undefined;
  };
}

export const ArrayGrid: React.FC<ArrayGridProps> = ({
  array,
  activeIndices,
}) => {
  const jIndex = activeIndices?.j;
  const iIndex = activeIndices?.i;

  const sortedIndices = array
    .map((item, idx) => item.state === 'sorted' ? idx : -1)
    .filter(idx => idx !== -1);
  
  const sortedLegendText = sortedIndices.length > 0
    ? `Ordenados (${sortedIndices.length})`
    : 'Ordenados';

  const comparingLegendText = jIndex !== undefined
    ? `Comparando (j = ${jIndex}, j+1 = ${jIndex + 1})`
    : 'Comparando';

  return (
    <div className="flex-1 flex flex-col justify-between font-mono-code min-w-0">
      <div>
        {/* Header with list name and element count */}
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-sans font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-sm font-bold">arreglo (arr)</span>
            <span className="text-[11px] text-slate-400 font-normal">[{array.length} elementos]</span>
          </div>
        </div>

        {/* Array Grid Container */}
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="inline-flex flex-col min-w-full">
            {/* Pointer Indicators Row (i, j) */}
            <div className="flex items-center h-6 mb-1">
              {array.map((_, idx) => {
                const isJ = jIndex === idx;
                const isJ1 = jIndex !== undefined && idx === jIndex + 1;
                const isI = iIndex === idx && jIndex === undefined;

                let indicator = null;
                if (isJ) indicator = 'j ▼';
                else if (isJ1) indicator = 'j+1 ▼';
                else if (isI) indicator = 'i ▼';

                return (
                  <div
                    key={idx}
                    className="w-12 xl:w-14 text-center shrink-0 text-[11px] font-black text-amber-400 flex items-center justify-center"
                  >
                    {indicator && (
                      <span className="bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-500/60 shadow-md shadow-amber-500/20 animate-pulse">
                        {indicator}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Indices Row */}
            <div className="flex items-center">
              {array.map((_, idx) => {
                const isHighlighted = (jIndex !== undefined && (idx === jIndex || idx === jIndex + 1)) || (iIndex === idx);
                return (
                  <div
                    key={idx}
                    className={`w-12 xl:w-14 text-center shrink-0 text-[11px] font-mono py-1 border-r border-t border-b first:border-l first:rounded-tl-lg last:rounded-tr-lg ${
                      isHighlighted
                        ? 'bg-[#272a3e] text-amber-300 font-bold border-[#444866]'
                        : 'bg-[#151622] text-slate-400 border-[#26283a]'
                    }`}
                  >
                    idx {idx}
                  </div>
                );
              })}
            </div>

            {/* Values Row with States & Non-chromatic Badges */}
            <div className="flex items-center">
              {array.map((item, idx) => {
                let cellBg = 'bg-[#1a1b28] text-slate-100 border-[#2d3046]';
                let indicatorColor = 'text-slate-500';

                if (item.state === 'comparing') {
                  cellBg = 'bg-amber-500/25 text-amber-200 border-amber-500 ring-2 ring-amber-500/30 font-black shadow-lg shadow-amber-500/10';
                  indicatorColor = 'text-amber-400 font-black';
                } else if (item.state === 'swapped') {
                  cellBg = 'bg-indigo-500/35 text-indigo-100 border-indigo-500 ring-2 ring-indigo-500/40 font-black';
                  indicatorColor = 'text-indigo-300 font-bold';
                } else if (item.state === 'sorted') {
                  cellBg = 'bg-emerald-500/25 text-emerald-200 border-emerald-500 font-bold';
                  indicatorColor = 'text-emerald-400 font-bold';
                }

                return (
                  <div
                    key={item.id || idx}
                    className={`w-12 xl:w-14 h-12 text-center shrink-0 text-sm flex flex-col items-center justify-center border-r border-b first:border-l first:rounded-bl-lg last:rounded-br-lg ${cellBg} transition-all duration-200`}
                  >
                    <span className="font-bold text-sm">{item.value}</span>
                    <span className={`text-[10px] leading-none ${indicatorColor}`}>
                      {item.nonColorIndicator || item.label || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Accessible Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1 font-sans">
          <div className="flex items-center gap-1.5 bg-[#1d1f2d] px-2.5 py-1 rounded-md border border-[#2b2d42]">
            <span className="w-3 h-3 rounded-[3px] bg-amber-500 border border-amber-300" />
            <span className="text-amber-300 font-medium">{comparingLegendText}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1d1f2d] px-2.5 py-1 rounded-md border border-[#2b2d42]">
            <span className="w-3 h-3 rounded-[3px] bg-emerald-500 border border-emerald-300" />
            <span className="text-emerald-300 font-medium">{sortedLegendText}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1d1f2d] px-2.5 py-1 rounded-md border border-[#2b2d42]">
            <span className="w-3 h-3 rounded-[3px] bg-[#2d3046] border border-[#444866]" />
            <span className="text-slate-400">Desordenado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

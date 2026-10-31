import React from 'react';
import type { ArrayElement } from '../../types/trace';

interface ArrayGridProps {
  array: ArrayElement[];
  activeIndices?: {
    i?: number;
    j?: number;
    min?: number;
    [key: string]: number | undefined;
  };
}

export const ArrayGrid: React.FC<ArrayGridProps> = ({
  array,
  activeIndices,
}) => {
  const jIndex = activeIndices?.j;
  const iIndex = activeIndices?.i;
  const minIndex = activeIndices?.min;
  const keyVal = activeIndices?.keyVal;
  const keyIndex = activeIndices?.keyIndex;
  const leftIndex = activeIndices?.left;
  const rightIndex = activeIndices?.right;
  const midIndex = activeIndices?.mid;



  return (
    <div className="flex-1 flex flex-col justify-between font-mono-code min-w-0">
      <div>
        {/* Encabezado con nombre de estructura y cantidad de elementos */}
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-sans font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-sm font-bold">arreglo (arr)</span>
            <span className="text-[11px] text-slate-400 font-normal">[{array.length} elementos]</span>
          </div>
        </div>

        {/* Array Grid Container */}
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="inline-flex flex-col min-w-full">
            {/* Pointer Indicators Row (i, j, min, clave, inicio, medio, fin) */}
            <div className="flex items-center h-6 mb-1">
              {array.map((_, idx) => {
                const isJ = jIndex === idx;
                const isJ1 = jIndex !== undefined && idx === jIndex + 1 && minIndex === undefined && keyVal === undefined && keyIndex === undefined && leftIndex === undefined;
                const isI = iIndex === idx;
                const isMin = minIndex === idx;
                const isKey = (keyIndex !== undefined && keyIndex === idx) || (keyVal !== undefined && isI && jIndex !== undefined);
                const isLeft = leftIndex === idx;
                const isRight = rightIndex === idx;
                const isMid = midIndex === idx;

                let indicator = null;
                let badgeStyle = 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-amber-500/20';

                if (isMin && isI && jIndex !== undefined) {
                  indicator = 'i, min';
                  badgeStyle = 'bg-purple-500/30 text-purple-300 border-purple-500/60 shadow-purple-500/20';
                } else if (isMin) {
                  indicator = 'min';
                  badgeStyle = 'bg-purple-500/30 text-purple-300 border-purple-500/60 shadow-purple-500/20';
                } else if (isKey) {
                  indicator = 'clave';
                  badgeStyle = 'bg-purple-500/30 text-purple-300 border-purple-500/60 shadow-purple-500/20';
                } else if (isMid && isLeft) {
                  indicator = 'ini, med';
                  badgeStyle = 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-amber-500/20';
                } else if (isMid) {
                  indicator = 'medio';
                  badgeStyle = 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-amber-500/20';
                } else if (isLeft && isRight) {
                  indicator = 'ini, fin';
                  badgeStyle = 'bg-indigo-500/30 text-indigo-300 border-indigo-500/60 shadow-indigo-500/20';
                } else if (isLeft) {
                  indicator = 'inicio';
                  badgeStyle = 'bg-blue-500/30 text-blue-300 border-blue-500/60 shadow-blue-500/20';
                } else if (isRight) {
                  indicator = 'fin';
                  badgeStyle = 'bg-indigo-500/30 text-indigo-300 border-indigo-500/60 shadow-indigo-500/20';
                } else if (isJ) {
                  indicator = 'j';
                  badgeStyle = 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-amber-500/20';
                } else if (isJ1) {
                  indicator = 'j+1';
                  badgeStyle = 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-amber-500/20';
                } else if (isI) {
                  indicator = 'i';
                  badgeStyle = 'bg-blue-500/30 text-blue-300 border-blue-500/60 shadow-blue-500/20';
                }

                return (
                  <div
                    key={idx}
                    className="w-12 xl:w-14 text-center shrink-0 text-[10px] font-black flex items-center justify-center"
                  >
                    {indicator && (
                      <span className={`px-1.5 py-0.5 rounded-md border shadow-md animate-pulse ${badgeStyle}`}>
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
                const isHighlighted = 
                  (jIndex !== undefined && (idx === jIndex || (minIndex === undefined && keyVal === undefined && keyIndex === undefined && leftIndex === undefined && idx === jIndex + 1))) || 
                  (iIndex === idx) || 
                  (minIndex === idx) ||
                  (keyIndex === idx) ||
                  (leftIndex === idx) ||
                  (rightIndex === idx) ||
                  (midIndex === idx);

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

            {/* Fila de valores con estados semánticos (RF-05) y marcadores no cromáticos (RNF-07) */}
            <div className="flex items-center">
              {array.map((item, idx) => {
                let cellBg = 'bg-[#1a1b28] text-slate-100 border-[#2d3046]';
                let indicatorColor = 'text-slate-400';

                if (item.state === 'comparing') {
                  cellBg = 'bg-amber-500/25 text-amber-200 border-amber-500 ring-2 ring-amber-500/30 font-black shadow-lg shadow-amber-500/10';
                  indicatorColor = 'text-amber-300 font-black';
                } else if (item.state === 'selected') {
                  cellBg = 'bg-purple-500/30 text-purple-200 border-purple-500 ring-2 ring-purple-500/40 font-black shadow-lg shadow-purple-500/10';
                  indicatorColor = 'text-purple-300 font-bold';
                } else if (item.state === 'swapped') {
                  cellBg = 'bg-sky-500/30 text-sky-100 border-sky-400 ring-2 ring-sky-500/40 font-black shadow-lg shadow-sky-500/10';
                  indicatorColor = 'text-sky-300 font-bold';
                } else if (item.state === 'sorted') {
                  cellBg = 'bg-emerald-500/25 text-emerald-200 border-emerald-500 font-bold';
                  indicatorColor = 'text-emerald-300 font-bold';
                } else if (item.state === 'discarded') {
                  cellBg = 'bg-[#11131d] text-slate-500 border-[#202334] opacity-60 line-through';
                  indicatorColor = 'text-rose-400/80 font-bold no-underline';
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
      </div>
    </div>
  );
};

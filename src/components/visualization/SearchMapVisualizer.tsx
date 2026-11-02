import React from 'react';
import type { ArrayElement, Step } from '../../types/trace';
import { ArrowDown, CheckCircle2, XCircle } from 'lucide-react';

interface SearchMapVisualizerProps {
  array: ArrayElement[];
  algorithmType: 'linear' | 'binary';
  currentStep: Step | null;
  targetKey?: number;
}

export const SearchMapVisualizer: React.FC<SearchMapVisualizerProps> = ({
  array,
  algorithmType,
  currentStep,
  targetKey = 45,
}) => {
  const n = array.length;

  const vars = currentStep?.frames?.[0]?.variables || {};
  const inicio = typeof vars.inicio === 'number' ? vars.inicio : undefined;
  const fin = typeof vars.fin === 'number' ? vars.fin : undefined;
  const medio = typeof vars.medio === 'number' ? vars.medio : undefined;
  const currI = typeof vars.i === 'number' ? vars.i : undefined;
  const target = typeof vars.clave === 'number' ? vars.clave : targetKey;
  const resultado = typeof vars.resultado === 'number' ? vars.resultado : undefined;
  const isFound = resultado !== undefined && resultado !== -1;
  const isNotFound = resultado === -1;

  interface SearchCellInfo {
    cellState: 'evaluating' | 'found' | 'active_range' | 'discarded';
    statusLabel: string;
  }

  const getCellInfo = (idx: number, item: ArrayElement): SearchCellInfo => {
    if (isFound && (idx === resultado || (item.state === 'sorted' && item.value === target))) {
      return { cellState: 'found', statusLabel: 'Encontrado' };
    }

    if (algorithmType === 'binary') {
      const leftBound = inicio !== undefined ? inicio : 0;
      const rightBound = fin !== undefined ? fin : n - 1;

      if (medio !== undefined && idx === medio) {
        return { cellState: 'evaluating', statusLabel: 'Evaluando' };
      }

      if (idx < leftBound || idx > rightBound) {
        return { cellState: 'discarded', statusLabel: 'Descartado' };
      }

      return { cellState: 'active_range', statusLabel: 'En rango' };
    } else {
      const currentProbe = currI !== undefined ? currI : 0;

      if (idx === currentProbe) {
        return { cellState: 'evaluating', statusLabel: 'Evaluando' };
      }

      if (idx < currentProbe) {
        return { cellState: 'discarded', statusLabel: 'Descartado' };
      }

      return { cellState: 'active_range', statusLabel: 'Pendiente' };
    }
  };

  const cellInfos = array.map((item, idx) => getCellInfo(idx, item));
  const activeCount = cellInfos.filter(
    c => c.cellState === 'active_range' || c.cellState === 'evaluating' || c.cellState === 'found'
  ).length;
  const discardedCount = n - activeCount;
  const discardedPercent = Math.round((discardedCount / Math.max(1, n)) * 100);

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#11131e] p-3 gap-3 text-slate-100 select-none overflow-hidden rounded-xl border border-[#222538]">
      {/* 1. Barra de estado del espacio de búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161826] border border-[#25283e] px-3.5 py-2 rounded-lg shrink-0">
        {/* Valor objetivo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Valor buscado:</span>
            <span className="px-2 py-0.5 rounded bg-[#1f2236] border border-[#323756] text-xs font-mono font-bold text-amber-300">
              {target}
            </span>
          </div>

          <div className="h-3.5 w-[1px] bg-[#282c42]" />

          {/* Estado actual */}
          <div className="flex items-center gap-1.5 text-xs">
            {isFound ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Encontrado en índice {resultado}
              </span>
            ) : isNotFound ? (
              <span className="flex items-center gap-1 font-semibold text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                No encontrado (retorna -1)
              </span>
            ) : (
              <span className="text-slate-300 font-medium">
                {algorithmType === 'binary'
                  ? `Rango activo: [${inicio ?? 0}..${fin ?? n - 1}]`
                  : `Inspección secuencial: índice ${currI ?? 0}`}
              </span>
            )}
          </div>
        </div>

        {/* Proporción de espacio descartado */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400">Espacio descartado:</span>
            <span className="font-semibold text-slate-200">
              {discardedCount}/{n} ({discardedPercent}%)
            </span>
          </div>

          {/* Leyenda sobria */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400 border-l border-[#282c42] pl-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-indigo-500" />
              En rango
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-amber-400" />
              Evaluando
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-400" />
              Encontrado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-slate-700" />
              Descartado
            </span>
          </div>
        </div>
      </div>

      {/* 2. Representación del arreglo y punteros */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-x-auto overflow-y-hidden px-2">
        <div className="flex items-end justify-center gap-2.5 min-w-max">
          {array.map((item, idx) => {
            const { cellState, statusLabel } = cellInfos[idx];

            const isLeft = algorithmType === 'binary' && inicio !== undefined && idx === inicio;
            const isRight = algorithmType === 'binary' && fin !== undefined && idx === fin;
            const isMid = algorithmType === 'binary' && medio !== undefined && idx === medio;
            const isCurrentI = algorithmType === 'linear' && currI !== undefined && idx === currI;

            let borderStyle = 'border-[#282c44]';
            let bgStyle = 'bg-[#171929] text-slate-200';
            let bottomBarColor = 'bg-indigo-500/60';

            if (cellState === 'found') {
              borderStyle = 'border-emerald-400 ring-1 ring-emerald-400/40';
              bgStyle = 'bg-emerald-950/35 text-emerald-100 font-bold';
              bottomBarColor = 'bg-emerald-400';
            } else if (cellState === 'evaluating') {
              borderStyle = 'border-amber-400 ring-1 ring-amber-400/40';
              bgStyle = 'bg-amber-950/30 text-amber-100 font-bold';
              bottomBarColor = 'bg-amber-400';
            } else if (cellState === 'discarded') {
              borderStyle = 'border-[#1d2030] opacity-40';
              bgStyle = 'bg-[#0e1019] text-slate-500 line-through';
              bottomBarColor = 'bg-slate-800';
            }

            return (
              <div key={item.id || idx} className="flex flex-col items-center">
                {/* Punteros Superiores */}
                <div className="h-8 flex items-end justify-center gap-1 mb-1">
                  {isLeft && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                        inicio
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-indigo-400 -mt-0.5" />
                    </div>
                  )}

                  {isMid && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded">
                        medio
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-amber-400 -mt-0.5" />
                    </div>
                  )}

                  {isRight && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-purple-600 text-white px-1.5 py-0.2 rounded">
                        fin
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-purple-400 -mt-0.5" />
                    </div>
                  )}

                  {isCurrentI && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded">
                        i
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-amber-400 -mt-0.5" />
                    </div>
                  )}
                </div>

                {/* Celda del arreglo */}
                <div
                  className={`w-14 sm:w-16 h-18 rounded-lg border flex flex-col justify-between p-2 relative overflow-hidden transition-all duration-200 ${borderStyle} ${bgStyle}`}
                >
                  <div className="text-[9px] font-mono text-slate-400 text-center">
                    [{idx}]
                  </div>

                  <div className="text-center font-mono text-lg font-bold leading-none">
                    {item.value}
                  </div>

                  <div className="w-full h-1 bg-[#131522] rounded-full overflow-hidden">
                    <div className={`h-full ${bottomBarColor}`} style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Estado inferior */}
                <div className="mt-1.5 text-[9px] font-mono text-slate-400 leading-none">
                  {statusLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

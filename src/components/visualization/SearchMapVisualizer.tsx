import React from 'react';
import type { ArrayElement, Step } from '../../types/trace';
import { Flame, Snowflake, Target, ArrowDown, CheckCircle2, XCircle, Compass } from 'lucide-react';

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

  // Extraer variables del paso actual
  const vars = currentStep?.frames?.[0]?.variables || {};
  const inicio = typeof vars.inicio === 'number' ? vars.inicio : undefined;
  const fin = typeof vars.fin === 'number' ? vars.fin : undefined;
  const medio = typeof vars.medio === 'number' ? vars.medio : undefined;
  const currI = typeof vars.i === 'number' ? vars.i : undefined;
  const target = typeof vars.clave === 'number' ? vars.clave : targetKey;
  const resultado = typeof vars.resultado === 'number' ? vars.resultado : undefined;
  const isFound = resultado !== undefined && resultado !== -1;
  const isNotFound = resultado === -1;

  interface ThermalCellInfo {
    tempState: 'focus' | 'found' | 'candidate' | 'frozen';
    tempLabel: string;
    tempPercent: number;
  }

  const getCellThermalInfo = (idx: number, item: ArrayElement): ThermalCellInfo => {
    if (isFound && (idx === resultado || (item.state === 'sorted' && item.value === target))) {
      return { tempState: 'found', tempLabel: 'Coincidencia', tempPercent: 100 };
    }

    if (algorithmType === 'binary') {
      const leftBound = inicio !== undefined ? inicio : 0;
      const rightBound = fin !== undefined ? fin : n - 1;

      if (medio !== undefined && idx === medio) {
        return { tempState: 'focus', tempLabel: 'Foco (Medio)', tempPercent: 90 };
      }

      if (idx < leftBound || idx > rightBound) {
        return { tempState: 'frozen', tempLabel: 'Descartado', tempPercent: 10 };
      }

      return { tempState: 'candidate', tempLabel: 'Candidato', tempPercent: 45 };
    } else {
      const currentProbe = currI !== undefined ? currI : 0;

      if (idx === currentProbe) {
        return { tempState: 'focus', tempLabel: 'Foco (i)', tempPercent: 85 };
      }

      if (idx < currentProbe) {
        return { tempState: 'frozen', tempLabel: 'Descartado', tempPercent: 10 };
      }

      return { tempState: 'candidate', tempLabel: 'Por Explorar', tempPercent: 40 };
    }
  };

  const cellInfos = array.map((item, idx) => getCellThermalInfo(idx, item));
  const activeCount = cellInfos.filter(
    c => c.tempState === 'candidate' || c.tempState === 'focus' || c.tempState === 'found'
  ).length;
  const discardedCount = n - activeCount;
  const discardedPercent = Math.round((discardedCount / Math.max(1, n)) * 100);

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#10111a] p-2.5 gap-2 text-slate-100 select-none overflow-hidden rounded-xl border border-[#222538]">
      {/* 1. Header del Radar Térmico y Estadísticas (compacto, sin desborde) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#151726] border border-[#24273d] px-3 py-2 rounded-lg shrink-0">
        {/* Objetivo de búsqueda */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold leading-none">
              Clave Buscada
            </div>
            <div className="text-sm font-mono font-black text-amber-300 leading-tight">
              {target}
            </div>
          </div>
        </div>

        {/* Estado del radar */}
        <div className="flex items-center gap-1.5 bg-[#1b1e32] border border-[#2b2f4c] px-2.5 py-1 rounded-md">
          {isFound ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-300">
                ¡Encontrado en índice {resultado}!
              </span>
            </>
          ) : isNotFound ? (
            <>
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px] font-semibold text-rose-300">
                Clave no encontrada (-1)
              </span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-semibold text-slate-300">
                {algorithmType === 'binary'
                  ? 'Búsqueda en curso (bisección)'
                  : 'Escaneando secuencialmente'}
              </span>
            </>
          )}
        </div>

        {/* Medidor de elementos descartados */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-slate-400">Descartados:</span>
            <span className="font-bold text-indigo-300">
              {discardedPercent}% ({discardedCount}/{n})
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#1b1d30] rounded-full overflow-hidden border border-[#2b2f4c]">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 transition-all duration-300"
              style={{ width: `${discardedPercent}%` }}
            />
          </div>
        </div>

        {/* Leyenda Térmica Compacta */}
        <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-0.5 rounded border border-[#232742]">
            <Snowflake className="w-2.5 h-2.5 text-sky-400" />
            <span>Frío</span>
          </div>
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-0.5 rounded border border-[#232742]">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Activo</span>
          </div>
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-0.5 rounded border border-[#232742]">
            <Flame className="w-2.5 h-2.5 text-amber-400" />
            <span>Foco</span>
          </div>
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-0.5 rounded border border-[#232742]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Éxito</span>
          </div>
        </div>
      </div>

      {/* 2. Lienzo Central: Cuadrícula Térmica con Punteros Estabilizados (sin scroll vertical) */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-x-auto overflow-y-hidden px-2">
        <div className="flex items-end justify-center gap-2 min-w-max">
          {array.map((item, idx) => {
            const { tempState, tempLabel } = cellInfos[idx];

            const isLeft = algorithmType === 'binary' && inicio !== undefined && idx === inicio;
            const isRight = algorithmType === 'binary' && fin !== undefined && idx === fin;
            const isMid = algorithmType === 'binary' && medio !== undefined && idx === medio;
            const isCurrentI = algorithmType === 'linear' && currI !== undefined && idx === currI;

            let borderStyle = 'border-[#262b46]';
            let bgStyle = 'bg-[#161828] text-slate-200';
            let thermalBarColor = 'bg-indigo-500/40';
            let glowEffect = '';

            if (tempState === 'found') {
              borderStyle = 'border-emerald-400 ring-2 ring-emerald-400/50';
              bgStyle =
                'bg-gradient-to-b from-emerald-950/70 via-[#102a24] to-[#0b1f1a] text-emerald-100 font-black';
              thermalBarColor = 'bg-emerald-400';
              glowEffect = 'shadow-[0_0_16px_rgba(16,185,129,0.3)]';
            } else if (tempState === 'focus') {
              borderStyle = 'border-amber-400 ring-2 ring-amber-400/50';
              bgStyle =
                'bg-gradient-to-b from-amber-950/70 via-[#2a1c0d] to-[#1d1409] text-amber-100 font-bold';
              thermalBarColor = 'bg-gradient-to-r from-amber-400 to-orange-500';
              glowEffect = 'shadow-[0_0_16px_rgba(245,158,11,0.3)]';
            } else if (tempState === 'frozen') {
              borderStyle = 'border-[#191f30] opacity-40';
              bgStyle = 'bg-[#0d101a] text-slate-600 line-through';
              thermalBarColor = 'bg-slate-800';
            } else {
              borderStyle = 'border-indigo-500/40';
              bgStyle = 'bg-[#181a2e] text-slate-100';
              thermalBarColor = 'bg-indigo-500';
            }

            return (
              <div key={item.id || idx} className="flex flex-col items-center">
                {/* Punteros Superiores Estabilizados */}
                <div className="h-8 flex items-end justify-center gap-0.5 mb-1">
                  {isLeft && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-1 py-0.2 rounded">
                        ini
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-indigo-400 -mt-0.5" />
                    </div>
                  )}

                  {isMid && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-1 py-0.2 rounded flex items-center gap-0.5">
                        <Flame className="w-2 h-2" /> med
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-amber-400 -mt-0.5" />
                    </div>
                  )}

                  {isRight && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-purple-600 text-white px-1 py-0.2 rounded">
                        fin
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-purple-400 -mt-0.5" />
                    </div>
                  )}

                  {isCurrentI && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Flame className="w-2 h-2" /> i
                      </span>
                      <ArrowDown className="w-2.5 h-2.5 text-amber-400 -mt-0.5" />
                    </div>
                  )}
                </div>

                {/* Tarjeta de Celda Térmica */}
                <div
                  className={`w-13 sm:w-15 h-16 rounded-xl border-2 flex flex-col justify-between p-1.5 relative overflow-hidden transition-all duration-200 ${borderStyle} ${bgStyle} ${glowEffect}`}
                >
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
                    <span>idx {idx}</span>
                    {tempState === 'frozen' && <Snowflake className="w-2.5 h-2.5 text-sky-400" />}
                    {tempState === 'focus' && <Flame className="w-2.5 h-2.5 text-amber-400" />}
                    {tempState === 'found' && <Target className="w-2.5 h-2.5 text-emerald-400" />}
                  </div>

                  <div className="text-center font-mono text-lg sm:text-xl font-bold leading-none">
                    {item.value}
                  </div>

                  <div className="w-full h-1 bg-[#131522] rounded-full overflow-hidden">
                    <div className={`h-full ${thermalBarColor}`} style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Etiqueta Térmica Inferior */}
                <div className="mt-1 text-[9px] font-mono text-slate-400 leading-none">
                  {tempLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Explicación del paso actual */}
      <div className="bg-[#141624] border border-[#24273d] px-3 py-2 rounded-lg flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Compass className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0 text-xs text-slate-200 leading-snug font-sans">
          {currentStep?.explanation || 'Preparando ejecución del algoritmo de búsqueda...'}
        </div>
      </div>
    </div>
  );
};

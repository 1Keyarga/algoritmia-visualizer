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

  // Clasificación térmica de cada celda
  interface ThermalCellInfo {
    tempState: 'focus' | 'found' | 'candidate' | 'frozen';
    tempLabel: string;
    tempPercent: number; // 0% a 100%
  }

  const getCellThermalInfo = (idx: number, item: ArrayElement): ThermalCellInfo => {
    // 1. Objetivo encontrado
    if (isFound && (idx === resultado || (item.state === 'sorted' && item.value === target))) {
      return { tempState: 'found', tempLabel: 'Coincidencia', tempPercent: 100 };
    }

    if (algorithmType === 'binary') {
      const leftBound = inicio !== undefined ? inicio : 0;
      const rightBound = fin !== undefined ? fin : n - 1;

      // 2. Foco activo (punto medio en evaluación)
      if (medio !== undefined && idx === medio) {
        return { tempState: 'focus', tempLabel: 'Foco (Medio)', tempPercent: 90 };
      }

      // 3. Fuera del rango de búsqueda activo (descartado / congelado)
      if (idx < leftBound || idx > rightBound) {
        return { tempState: 'frozen', tempLabel: 'Descartado', tempPercent: 10 };
      }

      // 4. Espacio candidato activo
      return { tempState: 'candidate', tempLabel: 'Candidato', tempPercent: 45 };
    } else {
      // Búsqueda lineal
      const currentProbe = currI !== undefined ? currI : 0;

      // 2. Foco activo de exploración
      if (idx === currentProbe) {
        return { tempState: 'focus', tempLabel: 'Foco (i)', tempPercent: 85 };
      }

      // 3. Ya explorado sin éxito (descartado)
      if (idx < currentProbe) {
        return { tempState: 'frozen', tempLabel: 'Descartado', tempPercent: 10 };
      }

      // 4. Territorio por explorar
      return { tempState: 'candidate', tempLabel: 'Por Explorar', tempPercent: 40 };
    }
  };

  // Cálculos territoriales para la barra de calor
  const cellInfos = array.map((item, idx) => getCellThermalInfo(idx, item));
  const activeCount = cellInfos.filter(c => c.tempState === 'candidate' || c.tempState === 'focus' || c.tempState === 'found').length;
  const discardedCount = n - activeCount;
  const discardedPercent = Math.round((discardedCount / n) * 100);

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#10111a] p-4 text-slate-100 select-none overflow-y-auto">
      {/* 1. Header del Radar Térmico y Estadísticas */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151726] border border-[#24273d] p-3 rounded-xl shadow-lg shrink-0">
        {/* Objetivo de búsqueda */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Clave Buscada
            </div>
            <div className="text-base font-mono font-black text-amber-300">
              {target}
            </div>
          </div>
        </div>

        {/* Estado del radar */}
        <div className="flex items-center gap-2 bg-[#1b1e32] border border-[#2b2f4c] px-3 py-1.5 rounded-lg">
          {isFound ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">
                ¡Encontrado en índice {resultado}!
              </span>
            </>
          ) : isNotFound ? (
            <>
              <XCircle className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-rose-300">
                Clave no encontrada (-1)
              </span>
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">
                {algorithmType === 'binary' ? 'Búsqueda en curso (bisección)' : 'Escaneando secuencialmente'}
              </span>
            </>
          )}
        </div>

        {/* Medidor de territorio eliminado */}
        <div className="flex flex-col gap-1 min-w-[200px]">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Territorio Descartado:</span>
            <span className="font-bold text-indigo-300">{discardedPercent}% ({discardedCount}/{n})</span>
          </div>
          <div className="w-full h-2 bg-[#1b1d30] rounded-full overflow-hidden border border-[#2b2f4c]">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 transition-all duration-300"
              style={{ width: `${discardedPercent}%` }}
            />
          </div>
        </div>

        {/* Leyenda Térmica Compacta */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-1 rounded border border-[#232742]">
            <Snowflake className="w-3 h-3 text-sky-400" />
            <span>Frío</span>
          </div>
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-1 rounded border border-[#232742]">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Activo</span>
          </div>
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-1 rounded border border-[#232742]">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Foco</span>
          </div>
          <div className="flex items-center gap-1 bg-[#121422] px-2 py-1 rounded border border-[#232742]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Éxito</span>
          </div>
        </div>
      </div>

      {/* 2. Lienzo Central: Cuadrícula Térmica con Punteros Dinámicos */}
      <div className="flex-1 flex flex-col justify-center items-center py-6 overflow-x-auto min-h-[220px]">
        <div className="flex items-end justify-center gap-2 px-4 min-w-max">
          {array.map((item, idx) => {
            const { tempState, tempLabel } = cellInfos[idx];

            // Punteros activos
            const isLeft = algorithmType === 'binary' && inicio !== undefined && idx === inicio;
            const isRight = algorithmType === 'binary' && fin !== undefined && idx === fin;
            const isMid = algorithmType === 'binary' && medio !== undefined && idx === medio;
            const isCurrentI = algorithmType === 'linear' && currI !== undefined && idx === currI;

            // Estilos térmicos dinámicos
            let borderStyle = 'border-[#262b46]';
            let bgStyle = 'bg-[#161828] text-slate-200';
            let thermalBarColor = 'bg-indigo-500/40';
            let glowEffect = '';

            if (tempState === 'found') {
              borderStyle = 'border-emerald-400 ring-2 ring-emerald-400/50';
              bgStyle = 'bg-gradient-to-b from-emerald-950/70 via-[#102a24] to-[#0b1f1a] text-emerald-100 font-black';
              thermalBarColor = 'bg-emerald-400';
              glowEffect = 'shadow-[0_0_20px_rgba(16,185,129,0.35)]';
            } else if (tempState === 'focus') {
              borderStyle = 'border-amber-400 ring-2 ring-amber-400/50';
              bgStyle = 'bg-gradient-to-b from-amber-950/70 via-[#2a1c0d] to-[#1d1409] text-amber-100 font-bold';
              thermalBarColor = 'bg-gradient-to-r from-amber-400 to-orange-500';
              glowEffect = 'shadow-[0_0_20px_rgba(245,158,11,0.35)]';
            } else if (tempState === 'frozen') {
              borderStyle = 'border-[#191f30] opacity-40';
              bgStyle = 'bg-[#0d101a] text-slate-600 line-through';
              thermalBarColor = 'bg-slate-800';
            } else {
              // candidate
              borderStyle = 'border-indigo-500/40';
              bgStyle = 'bg-[#181a2e] text-slate-100';
              thermalBarColor = 'bg-indigo-500';
            }

            return (
              <div key={item.id || idx} className="flex flex-col items-center">
                {/* Puntero Superior Estabilizado */}
                <div className="h-10 flex items-end justify-center gap-1 mb-1">
                  {isLeft && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm">
                        ini
                      </span>
                      <ArrowDown className="w-3 h-3 text-indigo-400 -mt-0.5" />
                    </div>
                  )}

                  {isMid && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" /> med
                      </span>
                      <ArrowDown className="w-3 h-3 text-amber-400 -mt-0.5" />
                    </div>
                  )}

                  {isRight && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded shadow-sm">
                        fin
                      </span>
                      <ArrowDown className="w-3 h-3 text-purple-400 -mt-0.5" />
                    </div>
                  )}

                  {isCurrentI && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" /> i
                      </span>
                      <ArrowDown className="w-3.5 h-3.5 text-amber-400 -mt-0.5" />
                    </div>
                  )}
                </div>

                {/* Tarjeta de Celda Térmica */}
                <div
                  className={`w-14 sm:w-16 h-20 rounded-xl border-2 flex flex-col justify-between p-2 relative overflow-hidden transition-all duration-300 ${borderStyle} ${bgStyle} ${glowEffect}`}
                >
                  {/* Índice en esquina */}
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                    <span>idx {idx}</span>
                    {tempState === 'frozen' && <Snowflake className="w-3 h-3 text-sky-400" />}
                    {tempState === 'focus' && <Flame className="w-3 h-3 text-amber-400" />}
                    {tempState === 'found' && <Target className="w-3 h-3 text-emerald-400" />}
                  </div>

                  {/* Valor Principal */}
                  <div className="text-center font-mono text-xl sm:text-2xl font-bold tracking-tight">
                    {item.value}
                  </div>

                  {/* Barra de temperatura en la base */}
                  <div className="w-full">
                    <div className="w-full h-1 bg-[#131522] rounded-full overflow-hidden">
                      <div className={`h-full ${thermalBarColor}`} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* Etiqueta Térmica Inferior */}
                <div className="mt-1.5 text-[9px] font-mono text-slate-400">
                  {tempLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Panel Inferior de Análisis Territorial y Explicación Didáctica */}
      <div className="bg-[#141624] border border-[#24273d] p-3 rounded-xl flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Compass className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="font-semibold text-slate-200 mb-0.5">
            {algorithmType === 'binary' ? 'Lógica de Reducción Bipartita' : 'Lógica de Inspección Secuencial'}
          </div>
          <div>{currentStep?.explanation || 'Preparando análisis térmico del espacio de búsqueda...'}</div>
        </div>
      </div>
    </div>
  );
};

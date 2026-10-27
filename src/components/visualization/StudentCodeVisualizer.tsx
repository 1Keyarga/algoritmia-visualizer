import React from 'react';
import type { Step } from '../../types/trace';
import { 
  Cpu, 
  ArrowRightLeft, 
  Binary, 
  Layers, 
  ArrowDown, 
  Hash 
} from 'lucide-react';

interface StudentCodeVisualizerProps {
  currentStep: Step;
}

export const StudentCodeVisualizer: React.FC<StudentCodeVisualizerProps> = ({ currentStep }) => {
  const { array, frames, activeIndices, metrics, explanation, operationType, activeLine } = currentStep;

  // Extraer variables del marco activo (estudiante o main)
  const activeFrame = frames.find(f => f.isActive) || frames[0];
  const variables = activeFrame ? activeFrame.variables : {};

  // Variables activas de puntero/índice
  const pointerMap: Record<number, { name: string; color: string }[]> = {};

  const registerPointer = (idx: number | undefined, name: string, color: string) => {
    if (typeof idx === 'number' && idx >= 0 && idx < array.length) {
      if (!pointerMap[idx]) pointerMap[idx] = [];
      pointerMap[idx].push({ name, color });
    }
  };

  registerPointer(activeIndices.i, 'i', 'bg-amber-500 text-slate-950 border-amber-400');
  registerPointer(activeIndices.j, 'j', 'bg-cyan-500 text-slate-950 border-cyan-400');
  registerPointer(activeIndices.min, 'min', 'bg-rose-500 text-white border-rose-400');
  registerPointer(activeIndices.mid, 'medio', 'bg-emerald-500 text-slate-950 border-emerald-400');
  registerPointer(activeIndices.left, 'izq', 'bg-blue-500 text-white border-blue-400');
  registerPointer(activeIndices.right, 'der', 'bg-purple-500 text-white border-purple-400');

  // Máximo valor para calcular la escala de las barras internas de memoria
  const maxValue = Math.max(...array.map(el => Math.abs(el.value)), 1);

  // Determinar elementos actualmente en comparación
  const comparingElements = array.filter(el => el.state === 'comparing');

  return (
    <div className="flex-1 flex flex-col justify-between p-4 gap-4 bg-[#11121d] rounded-xl border border-[#23263b] overflow-y-auto select-none font-sans">
      
      {/* 1. HUD de Operación Activa y Estado de la CPU/Memoria */}
      <div className="bg-[#171826] border border-[#282b42] rounded-xl p-3.5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
            operationType === 'compare'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : operationType === 'swap' || operationType === 'assign'
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            {operationType === 'compare' ? (
              <Binary className="w-5 h-5 animate-pulse" />
            ) : operationType === 'swap' ? (
              <ArrowRightLeft className="w-5 h-5 animate-bounce" />
            ) : operationType === 'assign' ? (
              <Layers className="w-5 h-5" />
            ) : (
              <Cpu className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                operationType === 'compare'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : operationType === 'swap'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : operationType === 'assign'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {operationType === 'compare'
                  ? 'Comparación'
                  : operationType === 'swap'
                  ? 'Intercambio'
                  : operationType === 'assign'
                  ? 'Asignación'
                  : 'Paso de Ejecución'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Línea {activeLine}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-200 truncate mt-0.5" title={explanation}>
              {explanation}
            </div>
          </div>
        </div>

        {/* Comparador Visual en Vivo */}
        {comparingElements.length >= 2 && (
          <div className="flex items-center gap-2 bg-[#12131e] px-3 py-1.5 rounded-lg border border-amber-500/30 shrink-0">
            <div className="text-center font-mono">
              <div className="text-[9px] text-slate-400">arr[{comparingElements[0].originalIndex}]</div>
              <div className="text-xs font-bold text-amber-300">{comparingElements[0].value}</div>
            </div>
            <div className="text-amber-400 font-black text-sm px-1">⟷</div>
            <div className="text-center font-mono">
              <div className="text-[9px] text-slate-400">arr[{comparingElements[1].originalIndex}]</div>
              <div className="text-xs font-bold text-amber-300">{comparingElements[1].value}</div>
            </div>
          </div>
        )}

        {/* Métricas en tiempo real */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#12131e] border border-[#23263b] rounded-lg px-2.5 py-1 text-center font-mono">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Comparaciones</div>
            <div className="text-xs font-bold text-amber-400">{metrics.comparisons}</div>
          </div>
          <div className="bg-[#12131e] border border-[#23263b] rounded-lg px-2.5 py-1 text-center font-mono">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Intercambios</div>
            <div className="text-xs font-bold text-indigo-400">{metrics.swaps}</div>
          </div>
          <div className="bg-[#12131e] border border-[#23263b] rounded-lg px-2.5 py-1 text-center font-mono">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Operaciones</div>
            <div className="text-xs font-bold text-emerald-400">{metrics.operations}</div>
          </div>
        </div>
      </div>

      {/* 2. Arquitectura de Memoria del Arreglo (Slots Interactivos de Memoria) */}
      <div className="flex-1 min-h-[180px] bg-[#0d0e17] border border-[#212338] rounded-xl p-4 flex flex-col justify-center overflow-x-auto">
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            Segmento de Memoria: Arreglo <span className="text-slate-300 font-mono">arr[ ]</span> ({array.length} elementos)
          </span>
          <span className="text-[9px] font-mono text-slate-500">
            Direccionamiento Secuencial (Indexado en base 0)
          </span>
        </div>

        {/* Fila de Celdas de Memoria */}
        <div className="flex items-end justify-center gap-2.5 min-w-max py-4 px-2">
          {array.map((item, idx) => {
            const pointers = pointerMap[idx] || [];
            const isComparing = item.state === 'comparing';
            const isSwapped = item.state === 'swapped';
            const isSorted = item.state === 'sorted';

            // Porcentaje para el medidor de nivel interno
            const fillHeightPct = Math.min(100, Math.max(12, Math.round((Math.abs(item.value) / maxValue) * 100)));

            // Color del slot según estado
            let borderClass = 'border-[#282b42]';
            let bgClass = 'bg-[#151726]';
            let textClass = 'text-slate-200';
            let glowShadow = '';

            if (isComparing) {
              borderClass = 'border-amber-400 ring-2 ring-amber-400/30';
              bgClass = 'bg-amber-950/30';
              textClass = 'text-amber-200 font-black';
              glowShadow = 'shadow-[0_0_15px_rgba(251,191,36,0.25)]';
            } else if (isSwapped) {
              borderClass = 'border-indigo-400 ring-2 ring-indigo-400/30';
              bgClass = 'bg-indigo-950/30';
              textClass = 'text-indigo-200 font-black';
              glowShadow = 'shadow-[0_0_15px_rgba(129,140,248,0.25)]';
            } else if (isSorted) {
              borderClass = 'border-emerald-500/70';
              bgClass = 'bg-emerald-950/20';
              textClass = 'text-emerald-300 font-bold';
            }

            return (
              <div key={item.id} className="flex flex-col items-center">
                {/* Punteros de Variables apuntando al índice (i, j, min, etc.) */}
                <div className="h-10 flex flex-col items-center justify-end mb-1">
                  {pointers.length > 0 && (
                    <div className="flex items-center gap-1">
                      {pointers.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className={`flex flex-col items-center animate-bounce`}
                          style={{ animationDuration: '1.2s' }}
                        >
                          <span
                            className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full border shadow-sm ${p.color}`}
                          >
                            {p.name}
                          </span>
                          <ArrowDown className="w-3 h-3 text-slate-300 -mt-0.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tarjeta de Celda de Memoria */}
                <div
                  className={`w-14 sm:w-16 h-28 rounded-xl border flex flex-col justify-between p-2 relative overflow-hidden transition-all duration-300 ${borderClass} ${bgClass} ${glowShadow}`}
                >
                  {/* Dirección simulada y etiqueta de índice */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-white/5 pb-1 z-10">
                    <span className="text-indigo-400 font-bold">[{idx}]</span>
                    <span className="text-[8px] text-slate-500">0x{idx.toString(16).padStart(2, '0')}</span>
                  </div>

                  {/* Valor central del elemento */}
                  <div className="flex-1 flex items-center justify-center z-10">
                    <span className={`text-base sm:text-lg font-mono ${textClass}`}>
                      {item.value}
                    </span>
                  </div>

                  {/* Barra de magnitud interna */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-indigo-500/10 pointer-events-none transition-all duration-300"
                    style={{ height: `${fillHeightPct}%` }}
                  />

                  {/* Estado / Badge inferior */}
                  <div className="z-10 text-center">
                    <span
                      className={`text-[8px] font-mono px-1 py-0.2 rounded uppercase block truncate ${
                        isComparing
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : isSwapped
                          ? 'bg-indigo-400 text-slate-950 font-bold'
                          : isSorted
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {isComparing ? 'Comp' : isSwapped ? 'Mod' : isSorted ? 'OK' : 'arr'}
                    </span>
                  </div>
                </div>

                {/* Subíndice del arreglo debajo */}
                <div className="mt-1.5 text-center font-mono text-[10px] text-slate-400">
                  arr[{idx}]
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Panel de Registros de Variables y Entorno de Ejecución */}
      <div className="bg-[#151724] border border-[#24273c] rounded-xl p-3 shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#24273c]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Variables de Ámbito ({activeFrame ? activeFrame.name : 'main'})
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Tipos e Identificadores Detectados
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {Object.entries(variables).map(([key, val]) => {
            const isPointer = ['i', 'j', 'min', 'medio', 'clave', 'left', 'right'].includes(key);
            const isTemp = key === 'temp';

            return (
              <div
                key={key}
                className={`p-2 rounded-lg border flex flex-col justify-between font-mono ${
                  isPointer
                    ? 'bg-[#1a1c2d] border-indigo-500/30'
                    : isTemp
                    ? 'bg-[#221c2d] border-purple-500/30'
                    : 'bg-[#12131e] border-[#25283e]'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span className="font-bold text-slate-300">{key}</span>
                  <span className="text-[8px] text-indigo-400">int</span>
                </div>
                <div className="text-sm font-bold text-slate-100 mt-1">
                  {val === undefined || val === null ? '—' : String(val)}
                </div>
              </div>
            );
          })}

          {Object.keys(variables).length === 0 && (
            <div className="col-span-full text-center text-slate-500 text-xs py-2">
              Sin variables locales activas en este paso
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

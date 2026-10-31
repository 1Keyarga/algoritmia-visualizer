import React from 'react';
import type { Step, NamedArrayState } from '../../types/trace';
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
  const { array, namedArrays, frames, activeIndices, metrics, explanation, operationType, activeLine } = currentStep;

  // Lista de arreglos en memoria (soporta 1 o múltiples arreglos con cualquier nombre)
  const arraysToRender: NamedArrayState[] =
    namedArrays && namedArrays.length > 0
      ? namedArrays
      : [{ name: 'arr', elements: array }];

  // Extraer marco activo (tope de la pila de llamadas)
  const activeFrame = frames.find(f => f.isActive) || frames[0];
  const variables = activeFrame ? activeFrame.variables : {};
  const variableTypes = activeFrame?.variableTypes || {};
  // Pila de llamadas en orden cronológico (base -> tope activo)
  const callStack = [...frames].reverse();

  // Variables activas de puntero/índice
  const getPointersForIndex = (idx: number, arrayLength: number) => {
    const pointers: { name: string; color: string }[] = [];
    const addIfMatch = (val: number | string | boolean | null | undefined, name: string, color: string) => {
      if (typeof val === 'number' && val === idx && idx >= 0 && idx < arrayLength) {
        pointers.push({ name, color });
      }
    };

    addIfMatch(activeIndices.i, 'i', 'bg-amber-500 text-slate-950 border-amber-400');
    addIfMatch(activeIndices.j, 'j', 'bg-cyan-500 text-slate-950 border-cyan-400');
    addIfMatch(activeIndices.k, 'k', 'bg-indigo-500 text-white border-indigo-400');
    addIfMatch(activeIndices.min, 'min', 'bg-rose-500 text-white border-rose-400');
    addIfMatch(activeIndices.mid, 'medio', 'bg-emerald-500 text-slate-950 border-emerald-400');
    addIfMatch(activeIndices.left, 'izq', 'bg-blue-500 text-white border-blue-400');
    addIfMatch(activeIndices.right, 'der', 'bg-purple-500 text-white border-purple-400');
    addIfMatch(variables.bajo, 'bajo', 'bg-blue-500 text-white border-blue-400');
    addIfMatch(variables.alto, 'alto', 'bg-purple-500 text-white border-purple-400');
    addIfMatch(variables.pos, 'pos', 'bg-emerald-500 text-slate-950 border-emerald-400');

    return pointers;
  };

  // Determinar todos los elementos actualmente en comparación en cualquier arreglo
  const comparingItems: { arrName: string; index: number; value: number }[] = [];
  for (const namedArr of arraysToRender) {
    namedArr.elements.forEach((el, idx) => {
      if (el.state === 'comparing') {
        comparingItems.push({ arrName: namedArr.name, index: idx, value: el.value });
      }
    });
  }

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
              <Binary className="w-5 h-5" />
            ) : operationType === 'swap' ? (
              <ArrowRightLeft className="w-5 h-5" />
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
        {comparingItems.length >= 2 && (
          <div className="flex items-center gap-2 bg-[#12131e] px-3 py-1.5 rounded-lg border border-amber-500/30 shrink-0">
            <div className="text-center font-mono">
              <div className="text-[9px] text-slate-400">{comparingItems[0].arrName}[{comparingItems[0].index}]</div>
              <div className="text-xs font-bold text-amber-300">{comparingItems[0].value}</div>
            </div>
            <div className="text-amber-400 font-bold text-xs px-1">vs</div>
            <div className="text-center font-mono">
              <div className="text-[9px] text-slate-400">{comparingItems[1].arrName}[{comparingItems[1].index}]</div>
              <div className="text-xs font-bold text-amber-300">{comparingItems[1].value}</div>
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
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Escrituras</div>
            <div className="text-xs font-bold text-indigo-400">{metrics.swaps}</div>
          </div>
          <div className="bg-[#12131e] border border-[#23263b] rounded-lg px-2.5 py-1 text-center font-mono">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Operaciones</div>
            <div className="text-xs font-bold text-emerald-400">{metrics.operations}</div>
          </div>
        </div>
      </div>

      {/* 2. Segmentos de Memoria de Arreglos (Soporta 1 o múltiples arreglos con cualquier identificador) */}
      <div className="flex-1 flex flex-col gap-3 min-h-[180px] overflow-y-auto">
        {arraysToRender.map((namedArr, arrIdx) => {
          const elems = namedArr.elements;
          const maxValue = Math.max(...elems.map(el => Math.abs(el.value)), 1);

          return (
            <div
              key={`${namedArr.name}-${arrIdx}`}
              className="flex-1 bg-[#0d0e17] border border-[#212338] rounded-xl p-4 flex flex-col justify-center overflow-x-auto"
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  Arreglo{' '}
                  <span className="text-indigo-300 font-mono font-black">{namedArr.name}[ ]</span>{' '}
                  <span className="text-slate-400">({elems.length} elementos)</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  0..{Math.max(0, elems.length - 1)}
                </span>
              </div>

              {/* Fila de Celdas de Memoria */}
              <div className="flex items-end justify-center gap-2.5 min-w-max py-3 px-2">
                {elems.map((item, idx) => {
                  const pointers = getPointersForIndex(idx, elems.length);
                  const isComparing = item.state === 'comparing';
                  const isSwapped = item.state === 'swapped';
                  const isSorted = item.state === 'sorted';

                  // Porcentaje para el medidor de nivel interno
                  const fillHeightPct = Math.min(
                    100,
                    Math.max(12, Math.round((Math.abs(item.value) / maxValue) * 100))
                  );

                  // Color del slot según estado (RF-05)
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
                    borderClass = 'border-sky-400 ring-2 ring-sky-400/30';
                    bgClass = 'bg-sky-950/30';
                    textClass = 'text-sky-200 font-black';
                    glowShadow = 'shadow-[0_0_15px_rgba(56,189,248,0.25)]';
                  } else if (isSorted) {
                    borderClass = 'border-emerald-500/70';
                    bgClass = 'bg-emerald-950/20';
                    textClass = 'text-emerald-300 font-bold';
                  }

                  return (
                    <div key={item.id || idx} className="flex flex-col items-center">
                      {/* Punteros de Variables apuntando al índice (i, j, k, min, etc.) */}
                      <div className="h-9 flex flex-col items-center justify-end mb-1">
                        {pointers.length > 0 && (
                          <div className="flex items-center gap-1">
                            {pointers.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex flex-col items-center transition-all duration-200"
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
                        className={`w-14 sm:w-16 h-24 rounded-xl border flex flex-col justify-between p-2 relative overflow-hidden transition-all duration-300 ${borderClass} ${bgClass} ${glowShadow}`}
                      >
                        {/* Dirección simulada y etiqueta de índice */}
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-white/5 pb-1 z-10">
                          <span className="text-indigo-400 font-bold">[{idx}]</span>
                          <span className="text-[8px] text-slate-400">
                            0x{((arrIdx + 1) * 256 + idx * 4).toString(16).toUpperCase()}
                          </span>
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

                        {/* Estado inferior */}
                        <div className="z-10 text-center">
                          <span
                            className={`text-[8px] font-mono px-1 py-0.2 rounded uppercase block truncate ${
                              isComparing
                                ? 'bg-amber-400 text-slate-950 font-bold'
                                : isSwapped
                                ? 'bg-sky-400 text-slate-950 font-bold'
                                : isSorted
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {isComparing
                              ? 'Comp'
                              : isSwapped
                              ? 'Mod'
                              : isSorted
                              ? 'Listo'
                              : namedArr.name}
                          </span>
                        </div>
                      </div>

                      {/* Subíndice del arreglo debajo */}
                      <div className="mt-1 text-center font-mono text-[10px] text-slate-400">
                        {namedArr.name}[{idx}]
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Panel de Variables y Pila de Ejecución */}
      <div className="bg-[#151724] border border-[#24273c] rounded-xl p-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#24273c]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Variables ({activeFrame ? activeFrame.name : 'main()'})
          </span>

          {/* Pila de Llamadas */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] uppercase font-mono text-slate-400 mr-1">Pila:</span>
            {callStack.map((frame, idx) => (
              <React.Fragment key={frame.id || idx}>
                {idx > 0 && <span className="text-[10px] text-slate-500 font-mono">/</span>}
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    frame.isActive
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                      : 'bg-[#12131e] text-slate-400 border-[#25283e]'
                  }`}
                >
                  {frame.name}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {Object.entries(variables).map(([key, val]) => {
            const isPointer = ['i', 'j', 'k', 'min', 'medio', 'clave', 'left', 'right', 'inicio', 'fin', 'mid', 'izq', 'der', 'bajo', 'alto', 'pos'].includes(key);
            const isTemp = key === 'temp' || key === 'pivote';
            const isReturn = key === 'retorno';
            const isArrayRef = typeof val === 'string' && val.startsWith('→');
            const declaredType = variableTypes[key] || (isArrayRef ? 'int[]' : isReturn ? 'return' : typeof val === 'boolean' ? 'bool' : typeof val === 'number' && !Number.isInteger(val) ? 'float' : 'int');

            return (
              <div
                key={key}
                className={`p-2 rounded-lg border flex flex-col justify-between font-mono ${
                  isReturn
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : isArrayRef
                    ? 'bg-[#16192b] border-emerald-500/30'
                    : isPointer
                    ? 'bg-[#1a1c2d] border-indigo-500/30'
                    : isTemp
                    ? 'bg-[#221c2d] border-purple-500/30'
                    : 'bg-[#12131e] border-[#25283e]'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span className={`font-bold ${isReturn ? 'text-emerald-300' : 'text-slate-200'}`}>{key}</span>
                  <span className={`text-[8px] ${isReturn ? 'text-emerald-400 font-bold' : 'text-indigo-400'}`}>
                    {declaredType}
                  </span>
                </div>
                <div className={`text-sm font-bold mt-1 truncate ${isReturn ? 'text-emerald-200' : 'text-slate-100'}`} title={String(val ?? '—')}>
                  {val === undefined || val === null ? '—' : String(val)}
                </div>
              </div>
            );
          })}

          {Object.keys(variables).length === 0 && (
            <div className="col-span-full text-center text-slate-400 text-xs py-2">
              Sin variables locales activas en este paso
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

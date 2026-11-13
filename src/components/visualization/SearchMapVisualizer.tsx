import React from 'react';
import type { ArrayElement, Step } from '../../types/trace';
import { deriveSearchTelemetry } from './search/searchHistory';
import { LinearSearchCanvas } from './search/LinearSearchCanvas';
import { BinarySearchCanvas } from './search/BinarySearchCanvas';

interface SearchMapVisualizerProps {
  array: ArrayElement[];
  algorithmType: 'linear' | 'binary';
  currentStep: Step | null;
  traceHistory?: Step[];
  targetKey?: number;
  compact?: boolean;
}

export const SearchMapVisualizer: React.FC<SearchMapVisualizerProps> = ({
  array,
  algorithmType,
  currentStep,
  traceHistory,
  targetKey = 45,
  compact = false,
}) => {
  const n = array.length;
  const telemetry = deriveSearchTelemetry(
    array,
    algorithmType,
    currentStep,
    traceHistory,
    targetKey
  );

  const discardedPercent = Math.round(
    (telemetry.discardedCount / Math.max(1, n)) * 100
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#11131e] p-2.5 gap-2.5 text-slate-100 select-none overflow-hidden rounded-xl border border-[#222538]">
      {/* Barra de telemetría sobria */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#161826] border border-[#25283e] px-3 py-1.5 rounded-lg shrink-0 min-h-[36px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">Clave:</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1f2236] border border-[#323756] text-[11px] font-mono font-bold text-amber-300">
              {telemetry.target}
            </span>
          </div>

          <div className="h-3.5 w-[1px] bg-[#282c42] shrink-0" />

          <div className="flex items-center gap-1.5 text-[11px] truncate">
            {telemetry.isFound ? (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                Índice {telemetry.resultado}
              </span>
            ) : telemetry.isFinalNotFound ? (
              <span className="flex items-center gap-1.5 font-semibold text-rose-400 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                {compact ? 'Sin resultado (-1)' : 'No encontrado (retorna -1)'}
              </span>
            ) : algorithmType === 'binary' ? (
              <span className="text-slate-300 font-mono text-[11px] truncate">
                {telemetry.inicio !== undefined && telemetry.fin !== undefined
                  ? compact
                    ? `[${telemetry.inicio}..${telemetry.fin}]${
                        telemetry.medio !== undefined ? ` · m=${telemetry.medio}` : ''
                      }`
                    : `Rango [${telemetry.inicio}..${telemetry.fin}]${
                        telemetry.medio !== undefined ? ` · medio = ${telemetry.medio}` : ''
                      }`
                  : 'Inicializando límites'}
              </span>
            ) : (
              <span className="text-slate-300 font-mono text-[11px] truncate">
                {telemetry.currI !== undefined
                  ? `i = ${telemetry.currI}`
                  : 'Listo'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-slate-400">
              {algorithmType === 'binary' ? 'Descartado:' : 'Revisado:'}
            </span>
            <span className="font-semibold text-slate-200">
              {algorithmType === 'binary'
                ? compact
                  ? `${telemetry.discardedCount}/${n}`
                  : `${telemetry.discardedCount}/${n} (${discardedPercent}%)`
                : `${
                    telemetry.isFound && telemetry.resultado !== undefined
                      ? telemetry.resultado + 1
                      : telemetry.isFinalNotFound
                        ? n
                        : telemetry.checkedIndices.size
                  }/${n}`}
            </span>
          </div>

          {!compact && (
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400 border-l border-[#282c42] pl-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Evaluando
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Hallado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                {algorithmType === 'binary' ? 'Excluido' : 'Verificado'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lienzo SVG dedicado al algoritmo */}
      {algorithmType === 'binary' ? (
        <BinarySearchCanvas
          array={array}
          currentStep={currentStep}
          telemetry={telemetry}
          compact={compact}
        />
      ) : (
        <LinearSearchCanvas
          array={array}
          currentStep={currentStep}
          telemetry={telemetry}
          compact={compact}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { Step } from '../../types/trace';
import { D3BarChart } from './D3BarChart';
import { ArrayTableView } from './ArrayTableView';
import { DivideAndConquerContainer } from './divide_and_conquer/DivideAndConquerContainer';
import { SearchMapVisualizer } from './SearchMapVisualizer';
import { StudentCodeVisualizer } from './StudentCodeVisualizer';
import {
  BarChart3,
  GitFork,
  Search,
  Maximize2,
  Minimize2,
  Cpu,
  Table2,
  Flame,
} from 'lucide-react';

interface VisualizerPanelProps {
  currentStep: Step | null;
  stepIndex: number;
  totalSteps: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  algorithmFamily?: string;
  algorithmId?: string;
}

type ViewMode = 'bars' | 'table';

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
  isFullscreen,
  onToggleFullscreen,
  algorithmFamily,
  algorithmId,
}) => {
  const isDivideAndConquer = !!currentStep?.divideAndConquer;
  const isSearching = algorithmFamily === 'searching';
  const isCustomCode = algorithmFamily === 'custom' || algorithmId === 'custom-ast';
  const isClassicSorting = !isDivideAndConquer && !isSearching && !isCustomCode;
  const searchType = algorithmId === 'binary-search' ? 'binary' : 'linear';

  const [viewMode, setViewMode] = useState<ViewMode>('bars');
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    setViewMode('bars');
  }, [algorithmId]);

  return (
    <div className="flex-1 bg-[#151622] p-3 flex flex-col min-h-0 select-none relative overflow-hidden">
      {/* Encabezado de una sola línea fija (flex-nowrap evita saltos verticales al cambiar la longitud del texto) */}
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-[#232534] shrink-0 h-9">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {isCustomCode ? (
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : isDivideAndConquer ? (
            <GitFork className="w-4 h-4 text-amber-400 shrink-0" />
          ) : isSearching ? (
            <Search className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span className="text-xs font-bold tracking-wider text-slate-300 uppercase shrink-0">
            {isCustomCode
              ? 'Depurador y Visualizador de Memoria'
              : isDivideAndConquer
              ? 'Divide y Vencerás'
              : isSearching
              ? 'Mapa Térmico de Búsqueda'
              : 'Lienzo de Visualización'}
          </span>

          {/* Explicación en línea truncada sin romper nunca la fila */}
          {isDivideAndConquer && currentStep && (
            <span
              className="text-[11px] text-slate-400 font-normal truncate min-w-0 flex-1"
              title={currentStep.explanation}
            >
              — {currentStep.explanation}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Conmutador Barras | Tabla y Mapa de Calor SOLO en Ordenamiento Clásico */}
          {isClassicSorting && (
            <>
              <div className="flex items-center bg-[#1a1c2b] border border-[#2b2e44] rounded-lg p-0.5 text-[11px] font-medium">
                <button
                  onClick={() => setViewMode('bars')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'bars'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Barras</span>
                </button>

                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table2 className="w-3 h-3" />
                  <span>Tabla</span>
                </button>
              </div>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-colors cursor-pointer ${
                  showHeatmap
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-[#1c1d2c] border-[#2b2d42] text-slate-400 hover:text-slate-200'
                }`}
                title="Activar/Desactivar Mapa de Calor de Accesos (RF-19)"
              >
                <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">Accesos</span>
              </button>
            </>
          )}

          {/* Métricas de comparaciones y movimientos en Divide y Vencerás */}
          {isDivideAndConquer && currentStep && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-[#1c1d2c] border border-[#2b2d42] text-slate-300">
                Comp: {currentStep.metrics.comparisons}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1c1d2c] border border-[#2b2d42] text-slate-300">
                Mov: {currentStep.metrics.swaps}
              </span>
            </div>
          )}

          {/* Indicador de paso actual */}
          <div className="flex items-center gap-1.5 bg-[#1c1d2c] px-2.5 py-1 rounded-full border border-[#2b2d42]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] font-mono font-semibold text-slate-200 whitespace-nowrap">
              Paso {stepIndex + 1} de {totalSteps}
            </span>
          </div>

          {/* Alternar pantalla completa */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg bg-[#1c1d2c] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#2b2d42] transition-colors cursor-pointer"
            title={isFullscreen ? 'Restaurar vista' : 'Maximizar panel'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contenedor principal de visualización */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {currentStep ? (
          isCustomCode ? (
            <StudentCodeVisualizer currentStep={currentStep} />
          ) : isDivideAndConquer && currentStep.divideAndConquer ? (
            <DivideAndConquerContainer dcState={currentStep.divideAndConquer} />
          ) : isSearching ? (
            <SearchMapVisualizer
              array={currentStep.array}
              algorithmType={searchType}
              currentStep={currentStep}
            />
          ) : viewMode === 'table' ? (
            <ArrayTableView currentStep={currentStep} showHeatmap={showHeatmap} />
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
              <D3BarChart array={currentStep.array} showHeatmap={showHeatmap} />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Cargando visualización...
          </div>
        )}
      </div>
    </div>
  );
};

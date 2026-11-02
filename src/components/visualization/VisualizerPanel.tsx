import React from 'react';
import type { Step } from '../../types/trace';
import { D3BarChart } from './D3BarChart';
import { DivideAndConquerContainer } from './divide_and_conquer/DivideAndConquerContainer';
import { SearchMapVisualizer } from './SearchMapVisualizer';
import { StudentCodeVisualizer } from './StudentCodeVisualizer';
import { StepPredictionBar } from './StepPredictionBar';
import {
  BarChart3,
  GitFork,
  Search,
  Maximize2,
  Minimize2,
  Cpu,
} from 'lucide-react';

interface VisualizerPanelProps {
  currentStep: Step | null;
  nextStep?: Step | null;
  stepIndex: number;
  totalSteps: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  algorithmFamily?: string;
  algorithmId?: string;
  isPredictionModeActive?: boolean;
  onTogglePredictionMode?: () => void;
  onAdvanceStep?: () => void;
  isAwaitingCompilation?: boolean;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  currentStep,
  nextStep = null,
  stepIndex,
  totalSteps,
  isFullscreen,
  onToggleFullscreen,
  algorithmFamily,
  algorithmId,
  isPredictionModeActive = false,
  onTogglePredictionMode,
  onAdvanceStep,
  isAwaitingCompilation = false,
}) => {
  const isDivideAndConquer = !!currentStep?.divideAndConquer;
  const isSearching = algorithmFamily === 'searching';
  const isCustomCode = algorithmFamily === 'custom' || algorithmId === 'custom-ast';
  const searchType = algorithmId === 'binary-search' ? 'binary' : 'linear';

  return (
    <div className="flex-1 bg-[#151622] p-3 flex flex-col min-h-0 select-none relative overflow-hidden">
      {/* Encabezado limpio de una sola línea fija */}
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
              ? 'Ejecución de Código'
              : isDivideAndConquer
              ? 'Divide y Vencerás'
              : isSearching
              ? 'Búsqueda'
              : 'Visualización'}
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
            <span
              className={`w-2 h-2 rounded-full ${
                isAwaitingCompilation ? 'bg-slate-500' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] font-mono font-semibold text-slate-200 whitespace-nowrap">
              {isAwaitingCompilation
                ? 'Modo edición'
                : `Paso ${stepIndex + 1} de ${totalSteps}`}
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

      {/* Barra interactiva de predicción de pasos (solo cuando se activa desde una tarea guiada) */}
      {isPredictionModeActive && onAdvanceStep && onTogglePredictionMode && (
        <StepPredictionBar
          currentStep={currentStep}
          nextStep={nextStep}
          stepIndex={stepIndex}
          onAdvanceStep={onAdvanceStep}
          onClose={onTogglePredictionMode}
        />
      )}

      {/* Contenedor principal de visualización */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isAwaitingCompilation ? (
          <div className="flex-1 bg-[#11121d] border border-[#23263b] rounded-xl flex flex-col items-center justify-center p-8 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#191c2e] border border-[#2b304d] flex items-center justify-center text-indigo-400 mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">
              Esperando compilación y ejecución
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
              Escribe o modifica tu algoritmo en el editor de la izquierda y presiona{' '}
              <span className="text-indigo-300 font-semibold">Compilar y Ejecutar</span> para
              instrumentar el AST y habilitar la visualización paso a paso en memoria.
            </p>
          </div>
        ) : currentStep ? (
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
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
              <D3BarChart array={currentStep.array} />
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

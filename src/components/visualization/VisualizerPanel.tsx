import React from 'react';
import type { AlgorithmMetadata } from '../../types/algorithm';
import type { Step } from '../../types/trace';
import { D3BarChart } from './D3BarChart';
import { DivideAndConquerContainer } from './divide_and_conquer/DivideAndConquerContainer';
import { SearchMapVisualizer } from './SearchMapVisualizer';
import { StudentCodeVisualizer } from './StudentCodeVisualizer';
import { StepPredictionBar } from './StepPredictionBar';
import { AlgorithmComparisonView } from './AlgorithmComparisonView';
import type {
  ComparisonSyncMode,
  ComparisonTraceEntry,
} from '../../core/utils/comparisonSync';
import { Maximize2, Minimize2 } from 'lucide-react';

interface VisualizerPanelProps {
  currentStep: Step | null;
  nextStep?: Step | null;
  traceHistory?: Step[];
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
  comparisonProps?: {
    primaryAlgorithm: AlgorithmMetadata;
    secondaryAlgorithm: AlgorithmMetadata;
    sameFamilyAlgorithms: AlgorithmMetadata[];
    onSelectSecondaryAlgorithm: (algoId: string) => void;
    primaryEntries: ComparisonTraceEntry[];
    secondaryEntries: ComparisonTraceEntry[];
    rawPrimarySteps: Step[];
    rawSecondarySteps: Step[];
    syncMode: ComparisonSyncMode;
    onChangeSyncMode: (mode: ComparisonSyncMode) => void;
  } | null;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  currentStep,
  nextStep = null,
  traceHistory,
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
  comparisonProps = null,
}) => {
  const isComparing = !!comparisonProps;
  const isDivideAndConquer = !isComparing && !!currentStep?.divideAndConquer;
  const isSearching = algorithmFamily === 'searching';
  const isCustomCode = algorithmFamily === 'custom' || algorithmId === 'custom-ast';
  const searchType = algorithmId === 'binary-search' ? 'binary' : 'linear';

  return (
    <div className="flex-1 bg-[#151622] p-3 flex flex-col min-h-0 select-none relative overflow-hidden">
      {/* Encabezado limpio sin iconos decorativos */}
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-[#232534] shrink-0 h-8">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase shrink-0">
            {isComparing
              ? 'Comparación en Paralelo'
              : isCustomCode
              ? 'Ejecución'
              : isDivideAndConquer
              ? 'Divide y Vencerás'
              : isSearching
              ? 'Búsqueda'
              : 'Visualización'}
          </span>

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
          {comparisonProps && (
            <div
              className="flex items-center bg-[#1c1e2e] border border-[#2b2e46] rounded-md p-0.5 text-[10px] font-mono"
              title="Por hitos sincroniza comparaciones y movimientos reales sin penalizar por líneas auxiliares"
            >
              <button
                type="button"
                onClick={() => comparisonProps.onChangeSyncMode('milestones')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  comparisonProps.syncMode === 'milestones'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Por hitos
              </button>
              <button
                type="button"
                onClick={() => comparisonProps.onChangeSyncMode('raw')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  comparisonProps.syncMode === 'raw'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Paso a paso
              </button>
            </div>
          )}

          {isDivideAndConquer && currentStep && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>Comp: <strong className="text-slate-200">{currentStep.metrics.comparisons}</strong></span>
              <span>·</span>
              <span>Mov: <strong className="text-slate-200">{currentStep.metrics.swaps}</strong></span>
            </div>
          )}

          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
            {isAwaitingCompilation
              ? 'Modo edición'
              : comparisonProps?.syncMode === 'milestones'
                ? `Hito ${stepIndex + 1} / ${totalSteps}`
                : `Paso ${stepIndex + 1} / ${totalSteps}`}
          </span>

          <button
            onClick={onToggleFullscreen}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#25283d] transition-colors cursor-pointer"
            title={isFullscreen ? 'Restaurar vista' : 'Maximizar panel'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {isPredictionModeActive && onAdvanceStep && onTogglePredictionMode && (
        <StepPredictionBar
          currentStep={currentStep}
          nextStep={nextStep}
          stepIndex={stepIndex}
          onAdvanceStep={onAdvanceStep}
          onClose={onTogglePredictionMode}
        />
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isAwaitingCompilation ? (
          <div className="flex-1 bg-[#11121d] border border-[#23263b] rounded-xl flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-sm font-bold text-slate-200">
              Listo para compilar
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
              Escribe tu código a la izquierda y presiona{' '}
              <span className="text-indigo-300 font-semibold">Compilar y ejecutar</span> para ver cada paso.
            </p>
          </div>
        ) : comparisonProps ? (
          <AlgorithmComparisonView
            primaryAlgorithm={comparisonProps.primaryAlgorithm}
            secondaryAlgorithm={comparisonProps.secondaryAlgorithm}
            sameFamilyAlgorithms={comparisonProps.sameFamilyAlgorithms}
            onSelectSecondaryAlgorithm={comparisonProps.onSelectSecondaryAlgorithm}
            primaryEntries={comparisonProps.primaryEntries}
            secondaryEntries={comparisonProps.secondaryEntries}
            rawPrimarySteps={comparisonProps.rawPrimarySteps}
            rawSecondarySteps={comparisonProps.rawSecondarySteps}
            syncMode={comparisonProps.syncMode}
            stepIndex={stepIndex}
          />
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
              traceHistory={traceHistory}
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

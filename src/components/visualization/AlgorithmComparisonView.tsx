import React from 'react';
import type { AlgorithmMetadata } from '../../types/algorithm';
import type { Step } from '../../types/trace';
import { D3BarChart } from './D3BarChart';
import { SearchMapVisualizer } from './SearchMapVisualizer';
import { DivideAndConquerContainer } from './divide_and_conquer/DivideAndConquerContainer';

interface AlgorithmComparisonViewProps {
  primaryAlgorithm: AlgorithmMetadata;
  secondaryAlgorithm: AlgorithmMetadata;
  sameFamilyAlgorithms: AlgorithmMetadata[];
  onSelectSecondaryAlgorithm: (algoId: string) => void;
  primarySteps: Step[];
  secondarySteps: Step[];
  stepIndex: number;
}

export const AlgorithmComparisonView: React.FC<AlgorithmComparisonViewProps> = ({
  primaryAlgorithm,
  secondaryAlgorithm,
  sameFamilyAlgorithms,
  onSelectSecondaryAlgorithm,
  primarySteps,
  secondarySteps,
  stepIndex,
}) => {
  const primaryIdx = Math.min(stepIndex, Math.max(0, primarySteps.length - 1));
  const secondaryIdx = Math.min(stepIndex, Math.max(0, secondarySteps.length - 1));

  const primaryStep = primarySteps[primaryIdx] || null;
  const secondaryStep = secondarySteps[secondaryIdx] || null;

  const isPrimaryFinished = primarySteps.length > 0 && stepIndex >= primarySteps.length - 1;
  const isSecondaryFinished = secondarySteps.length > 0 && stepIndex >= secondarySteps.length - 1;

  const renderAlgorithmPane = (
    algo: AlgorithmMetadata,
    step: Step | null,
    currentIdx: number,
    totalCount: number,
    isFinished: boolean,
    isSecondary: boolean
  ) => {
    const isSearching = algo.family === 'searching';
    const searchType = algo.id === 'binary-search' ? 'binary' : 'linear';

    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#11131e] border border-[#23263a] rounded-xl overflow-hidden">
        {/* Cabecera del panel individual */}
        <div className="px-3 py-2 bg-[#161826] border-b border-[#23263a] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isFinished
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]'
                  : isSecondary
                  ? 'bg-amber-400'
                  : 'bg-indigo-400'
              }`}
            />
            {isSecondary && sameFamilyAlgorithms.length > 1 ? (
              <select
                value={algo.id}
                onChange={e => onSelectSecondaryAlgorithm(e.target.value)}
                className="bg-[#1e2135] border border-[#2f3452] rounded px-2 py-0.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer truncate max-w-[180px]"
              >
                {sameFamilyAlgorithms.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-100 truncate">
                {algo.name}
              </span>
            )}

            <span className="text-[10px] font-mono text-indigo-300 shrink-0">
              {algo.complexity.time}
            </span>
          </div>

          {step && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
              <span>
                Comp: <strong className="text-amber-300">{step.metrics.comparisons}</strong>
              </span>
              <span>·</span>
              <span>
                {isSearching ? 'Descartes' : 'Swaps'}:{' '}
                <strong className="text-indigo-300">{step.metrics.swaps}</strong>
              </span>
              <span>·</span>
              <span className={isFinished ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
                {currentIdx + 1}/{totalCount}
              </span>
            </div>
          )}
        </div>

        {/* Lienzo gráfico del algoritmo */}
        <div className="flex-1 min-h-0 flex flex-col p-2.5 overflow-hidden">
          {step ? (
            step.divideAndConquer ? (
              <DivideAndConquerContainer dcState={step.divideAndConquer} />
            ) : isSearching ? (
              <SearchMapVisualizer
                array={step.array}
                algorithmType={searchType}
                currentStep={step}
                compact
              />
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                <D3BarChart array={step.array} />
              </div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Sin pasos disponibles
            </div>
          )}
        </div>

        {/* Pie con la acción actual de este algoritmo (sin cortar a mitad de frase) */}
        {step && (
          <div className="px-3 py-2 bg-[#141623] border-t border-[#202336] flex items-start justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-300 leading-snug">
              {step.explanation}
            </span>
            <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">
              Línea {step.activeLine}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
      {renderAlgorithmPane(
        primaryAlgorithm,
        primaryStep,
        primaryIdx,
        primarySteps.length,
        isPrimaryFinished,
        false
      )}
      {renderAlgorithmPane(
        secondaryAlgorithm,
        secondaryStep,
        secondaryIdx,
        secondarySteps.length,
        isSecondaryFinished,
        true
      )}
    </div>
  );
};

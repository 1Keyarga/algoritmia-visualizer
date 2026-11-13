import React, { useState, useMemo } from 'react';
import type { Step } from '../../types/trace';
import { Crosshair, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';

interface StepPredictionBarProps {
  currentStep: Step | null;
  nextStep: Step | null;
  stepIndex: number;
  onAdvanceStep: () => void;
  onClose: () => void;
}

type PredictedAction = 'compare' | 'modify' | 'control' | 'complete';

export const StepPredictionBar: React.FC<StepPredictionBarProps> = ({
  currentStep,
  nextStep,
  stepIndex,
  onAdvanceStep,
  onClose,
}) => {
  const [score, setScore] = useState({ hits: 0, attempts: 0 });
  const [feedbackState, setFeedbackState] = useState<{
    stepIndex: number;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const feedback =
    feedbackState && feedbackState.stepIndex === stepIndex ? feedbackState : null;

  const expectedAction: PredictedAction = useMemo(() => {
    if (!nextStep || !currentStep) return 'control';
    const op = nextStep.operationType;
    if (op === 'compare') return 'compare';
    if (op === 'swap' || nextStep.metrics.swaps > currentStep.metrics.swaps) {
      return 'modify';
    }
    if (op === 'finish') {
      return 'complete';
    }
    return 'control';
  }, [currentStep, nextStep]);

  const options: { key: PredictedAction; label: string }[] = [
    { key: 'compare', label: 'Comparar elementos' },
    { key: 'modify', label: 'Intercambiar / Mover valor' },
    { key: 'control', label: 'Actualizar índices / Dividir' },
    { key: 'complete', label: 'Fijar ordenado / Finalizar' },
  ];

  const handleSelectPrediction = (chosen: PredictedAction) => {
    if (!nextStep) return;
    const isCorrect = chosen === expectedAction;
    setScore(prev => ({
      hits: prev.hits + (isCorrect ? 1 : 0),
      attempts: prev.attempts + 1,
    }));

    if (isCorrect) {
      setFeedbackState({
        stepIndex,
        isCorrect: true,
        message: `Correcto: ${nextStep.explanation}`,
      });
      setTimeout(() => {
        onAdvanceStep();
      }, 650);
    } else {
      const correctLabel = options.find(o => o.key === expectedAction)?.label || '';
      setFeedbackState({
        stepIndex,
        isCorrect: false,
        message: `El siguiente paso corresponde a "${correctLabel}": ${nextStep.explanation}`,
      });
    }
  };

  if (!nextStep) {
    return (
      <div className="mb-2 px-3 py-2 rounded-xl bg-[#181a2a] border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Ejecución finalizada. Aciertos en Modo Predicción: {score.hits} / {score.attempts}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 cursor-pointer"
          title="Cerrar Modo Predicción"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2 px-3 py-2 rounded-xl bg-[#181a2a] border border-amber-500/40 flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            Modo Predicción Activo
          </span>
          <span className="text-xs text-slate-300">
            ¿Qué operación realizará el algoritmo en el paso {stepIndex + 2}?
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111320] border border-[#2a2e46] text-emerald-300 font-semibold">
            Aciertos: {score.hits}/{score.attempts}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#23263a] cursor-pointer"
            title="Desactivar Modo Predicción"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => handleSelectPrediction(opt.key)}
            className="px-2.5 py-1.5 rounded-lg bg-[#121422] hover:bg-[#1e2238] border border-[#2b2f4a] hover:border-amber-400/50 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer text-center truncate"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
            feedback.isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="truncate">{feedback.message}</span>
          </div>

          {!feedback.isCorrect && (
            <button
              onClick={onAdvanceStep}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-100 font-semibold shrink-0 cursor-pointer"
            >
              <span>Avanzar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

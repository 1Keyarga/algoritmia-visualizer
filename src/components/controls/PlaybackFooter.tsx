import React from 'react';
import type { PlaybackSpeed } from '../../types/playback';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  RotateCcw,
} from 'lucide-react';

interface PlaybackFooterProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onGoToStep: (step: number) => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onReset: () => void;
  disabled?: boolean;
  maxAllowedStepIndex?: number;
  stepUnitLabel?: 'Paso' | 'Hito';
}

export const PlaybackFooter: React.FC<PlaybackFooterProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  speed,
  onTogglePlay,
  onNextStep,
  onPrevStep,
  onGoToStart,
  onGoToEnd,
  onGoToStep,
  onSetSpeed,
  onReset,
  disabled = false,
  maxAllowedStepIndex,
  stepUnitLabel = 'Paso',
}) => {
  const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4];
  const effectiveMax =
    maxAllowedStepIndex !== undefined
      ? Math.min(maxAllowedStepIndex, Math.max(0, totalSteps - 1))
      : Math.max(0, totalSteps - 1);
  const isCheckpointLocked =
    !disabled && maxAllowedStepIndex !== undefined && maxAllowedStepIndex < totalSteps - 1;
  const isAtCheckpointLimit = isCheckpointLocked && currentStepIndex >= effectiveMax;

  const percent =
    !disabled && totalSteps > 1 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <footer className="bg-[#13141e] border-t border-[#232532] flex flex-col shrink-0 select-none z-20">
      {/* Línea de tiempo interactiva (Scrubber) */}
      <div className="w-full px-6 pt-2 pb-1 bg-[#101119] flex items-center gap-3 border-b border-[#1c1d29]">
        <div className="flex-1 relative flex items-center group">
          <input
            type="range"
            min={0}
            max={disabled ? 0 : Math.max(0, totalSteps - 1)}
            value={disabled ? 0 : currentStepIndex}
            disabled={disabled || totalSteps <= 1}
            onChange={(e) => onGoToStep(Math.min(Number(e.target.value), effectiveMax))}
            className="w-full h-1.5 bg-[#25283a] rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed accent-indigo-500 hover:h-2 transition-all"
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400 w-8 text-right shrink-0">
          {percent}%
        </span>
      </div>

      {/* Barra de controles de reproducción */}
      <div className="h-14 px-6 flex items-center justify-between gap-3">
        {/* Contador de pasos, punto de control y guía visible de atajos de teclado (CP-07) */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="bg-[#1c1d2c] px-3 py-1 rounded-lg border border-[#2b2d42] shrink-0">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {disabled
                ? 'Sin ejecución'
                : `${stepUnitLabel} ${currentStepIndex + 1} / ${totalSteps}`}
            </span>
          </div>

          {isCheckpointLocked ? (
            <div
              className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-[11px] font-medium"
            >
              <span>Punto de control en paso {effectiveMax + 1}</span>
            </div>
          ) : (
            <div
              aria-label="Atajos de teclado disponibles"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161826] border border-[#26293e] text-[10px] text-slate-300"
            >
              <span className="font-semibold text-slate-400">Atajos:</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 rounded bg-[#22253a] border border-[#343956] font-mono text-[10px] text-indigo-200">
                  Espacio
                </kbd>
                <span>Play/Pausa</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-[#22253a] border border-[#343956] font-mono text-[10px] text-indigo-200">
                  ←/→
                </kbd>
                <span>Paso</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-[#22253a] border border-[#343956] font-mono text-[10px] text-indigo-200">
                  Home/End
                </kbd>
                <span>Extremos</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-[#22253a] border border-[#343956] font-mono text-[10px] text-indigo-200">
                  R
                </kbd>
                <span>Reset</span>
              </span>
            </div>
          )}
        </div>

        {/* Controles multimedia */}
        <div className="flex items-center gap-2.5">
          {/* Ir al inicio */}
          <button
            onClick={onGoToStart}
            disabled={disabled || currentStepIndex === 0}
            aria-label="Ir al inicio (Atajo Home)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Ir al inicio (Home)"
          >
            <SkipBack aria-hidden="true" className="w-4 h-4" />
          </button>

          {/* Paso anterior */}
          <button
            onClick={onPrevStep}
            disabled={disabled || currentStepIndex === 0}
            aria-label="Paso anterior (Atajo Flecha Izquierda)"
            className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
            title="Paso anterior (Flecha Izquierda)"
          >
            <ChevronLeft aria-hidden="true" className="w-5 h-5" />
            <kbd className="hidden sm:inline text-[10px] font-mono text-slate-400">←</kbd>
          </button>

          {/* Botón Reproducir / Pausar */}
          <button
            onClick={onTogglePlay}
            disabled={disabled || totalSteps === 0}
            aria-label={isPlaying ? 'Pausar (Atajo Espacio)' : 'Reproducir (Atajo Espacio)'}
            className="h-10 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
          >
            {isPlaying && !disabled ? (
              <Pause aria-hidden="true" className="w-4 h-4 fill-white" />
            ) : (
              <Play aria-hidden="true" className="w-4 h-4 fill-white ml-0.5" />
            )}
            <kbd className="hidden md:inline text-[10px] font-mono opacity-90">Espacio</kbd>
          </button>

          {/* Paso siguiente */}
          <button
            onClick={onNextStep}
            disabled={disabled || currentStepIndex >= effectiveMax || isAtCheckpointLimit}
            aria-label="Paso siguiente (Atajo Flecha Derecha)"
            className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
            title="Paso siguiente (Flecha Derecha)"
          >
            <kbd className="hidden sm:inline text-[10px] font-mono text-slate-400">→</kbd>
            <ChevronRight aria-hidden="true" className="w-5 h-5" />
          </button>

          {/* Ir al final */}
          <button
            onClick={onGoToEnd}
            disabled={disabled || currentStepIndex >= effectiveMax || isAtCheckpointLimit}
            aria-label="Ir al final permitido (Atajo End)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Ir al final permitido (End)"
          >
            <SkipForward aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Velocidad de reproducción y reinicio */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#1c1d29] border border-[#2b2e42] rounded-lg p-0.5">
            {speeds.map((s) => (
              <button
                key={s}
                disabled={disabled}
                onClick={() => onSetSpeed(s)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  speed === s
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={onReset}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1d29] hover:bg-[#25283d] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2b2e42] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Reiniciar ejecución (R)"
          >
            <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Reset</span>
            <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-[#25283d] border border-[#343956] text-[10px] font-mono text-slate-300">
              R
            </kbd>
          </button>
        </div>
      </div>
    </footer>
  );
};

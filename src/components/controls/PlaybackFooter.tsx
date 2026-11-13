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
      <div className="h-14 px-6 flex items-center justify-between">
        {/* Contador de pasos y estado de punto de control */}
        <div className="flex items-center gap-2.5 min-w-[140px]">
          <div className="bg-[#1c1d2c] px-3 py-1 rounded-lg border border-[#2b2d42]">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {disabled ? 'Sin ejecución' : `Paso ${currentStepIndex + 1} / ${totalSteps}`}
            </span>
          </div>

          {isCheckpointLocked && (
            <div
              className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-[11px] font-medium"
              title="Resuelve la actividad en el panel izquierdo para desbloquear la ejecución completa del algoritmo"
            >
              <span>Punto de control en paso {effectiveMax + 1}</span>
            </div>
          )}
        </div>

        {/* Controles multimedia */}
        <div className="flex items-center gap-3">
          {/* Ir al inicio */}
          <button
            onClick={onGoToStart}
            disabled={disabled || currentStepIndex === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Ir al inicio (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Paso anterior */}
          <button
            onClick={onPrevStep}
            disabled={disabled || currentStepIndex === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Paso anterior (Flecha Izquierda)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Botón Reproducir / Pausar */}
          <button
            onClick={onTogglePlay}
            disabled={disabled || totalSteps === 0}
            className="w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
            title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
          >
            {isPlaying && !disabled ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* Paso siguiente */}
          <button
            onClick={onNextStep}
            disabled={disabled || currentStepIndex >= effectiveMax || isAtCheckpointLimit}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Paso siguiente (Flecha Derecha)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Ir al final */}
          <button
            onClick={onGoToEnd}
            disabled={disabled || currentStepIndex >= effectiveMax || isAtCheckpointLimit}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Ir al final permitido (End)"
          >
            <SkipForward className="w-4 h-4" />
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
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

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
}) => {
  const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4];

  return (
    <footer className="h-16 bg-[#14151e] border-t border-[#232532] px-6 flex items-center justify-between shrink-0 select-none relative z-20">
      <div className="absolute -top-1 left-0 right-0 h-2 group cursor-pointer">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onGoToStep(Number(e.target.value))}
          className="w-full h-1 bg-[#242636] accent-indigo-500 cursor-pointer appearance-none group-hover:h-1.5 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-xs font-mono text-slate-400 font-medium">
          Paso {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onGoToStart}
          disabled={currentStepIndex === 0}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
          title="Ir al inicio (Home)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onPrevStep}
          disabled={currentStepIndex === 0}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
          title="Paso anterior (Flecha Izquierda)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:shadow-indigo-500/60 transition-all transform active:scale-95 cursor-pointer"
          title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        <button
          onClick={onNextStep}
          disabled={currentStepIndex >= totalSteps - 1}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
          title="Paso siguiente (Flecha Derecha)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={onGoToEnd}
          disabled={currentStepIndex >= totalSteps - 1}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
          title="Ir al final (End)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#1c1d28] border border-[#2b2d3e] rounded-lg p-0.5">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                speed === s
                  ? 'bg-indigo-600/40 text-indigo-300 font-bold border border-indigo-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1d28] hover:bg-[#252737] border border-[#2b2d3e] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          title="Reiniciar ejecución (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </footer>
  );
};

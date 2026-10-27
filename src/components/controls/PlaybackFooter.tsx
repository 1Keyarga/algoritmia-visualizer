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
  const percent = totalSteps > 1 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <footer className="bg-[#13141e] border-t border-[#232532] flex flex-col shrink-0 select-none z-20">
      {/* Línea de tiempo interactiva (Scrubber) */}
      <div className="w-full px-6 pt-2 pb-1 bg-[#101119] flex items-center gap-3 border-b border-[#1c1d29]">
        <div className="flex-1 relative flex items-center group">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIndex}
            onChange={(e) => onGoToStep(Number(e.target.value))}
            className="w-full h-1.5 bg-[#25283a] rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
          />
        </div>
        <span className="text-[10px] font-mono text-slate-400 w-8 text-right shrink-0">
          {percent}%
        </span>
      </div>

      {/* Barra de controles de reproducción */}
      <div className="h-14 px-6 flex items-center justify-between">
        {/* Contador de pasos */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="bg-[#1c1d2c] px-3 py-1 rounded-lg border border-[#2b2d42]">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              Paso {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>
        </div>

        {/* Controles multimedia */}
        <div className="flex items-center gap-3">
          {/* Ir al inicio */}
          <button
            onClick={onGoToStart}
            disabled={currentStepIndex === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer"
            title="Ir al inicio (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Paso anterior */}
          <button
            onClick={onPrevStep}
            disabled={currentStepIndex === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer"
            title="Paso anterior (Flecha Izquierda)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Botón Reproducir / Pausar */}
          <button
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all transform active:scale-95 cursor-pointer ring-2 ring-indigo-400/20"
            title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Paso siguiente */}
          <button
            onClick={onNextStep}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer"
            title="Paso siguiente (Flecha Derecha)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Ir al final */}
          <button
            onClick={onGoToEnd}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#202234] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer"
            title="Ir al final (End)"
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
                onClick={() => onSetSpeed(s)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1d29] hover:bg-[#25283d] border border-[#2b2e42] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
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

import { useEffect } from 'react';

interface KeyboardOptions {
  onTogglePlay: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onReset: () => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  enabled?: boolean;
}

export function useKeyboard({
  onTogglePlay,
  onNextStep,
  onPrevStep,
  onReset,
  onGoToStart,
  onGoToEnd,
  enabled = true,
}: KeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar combinaciones del navegador/SO (Ctrl+R, Cmd+R, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Ignorar si el usuario está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNextStep();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrevStep();
      } else if (e.code === 'Home') {
        e.preventDefault();
        onGoToStart();
      } else if (e.code === 'End') {
        e.preventDefault();
        onGoToEnd();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onTogglePlay, onNextStep, onPrevStep, onReset, onGoToStart, onGoToEnd]);
}

import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { PlaybackSpeed, PlaybackState, PlaybackAction } from '../types/playback';
import type { Step } from '../types/trace';

const SPEED_DELAYS: Record<PlaybackSpeed, number> = {
  0.5: 1200,
  1: 600,
  2: 300,
  4: 120,
};

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY':
      if (state.currentStepIndex >= state.totalSteps - 1) {
        return { ...state, currentStepIndex: 0, isPlaying: true };
      }
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'TOGGLE_PLAY':
      if (!state.isPlaying && state.currentStepIndex >= state.totalSteps - 1) {
        return { ...state, currentStepIndex: 0, isPlaying: true };
      }
      return { ...state, isPlaying: !state.isPlaying };
    case 'NEXT_STEP':
      if (state.currentStepIndex < state.totalSteps - 1) {
        return { ...state, currentStepIndex: state.currentStepIndex + 1 };
      }
      return { ...state, isPlaying: false };
    case 'PREV_STEP':
      if (state.currentStepIndex > 0) {
        return { ...state, currentStepIndex: state.currentStepIndex - 1, isPlaying: false };
      }
      return state;
    case 'GO_TO_STEP': {
      const target = Math.max(0, Math.min(action.payload, state.totalSteps - 1));
      return { ...state, currentStepIndex: target, isPlaying: false };
    }
    case 'GO_TO_START':
      return { ...state, currentStepIndex: 0, isPlaying: false };
    case 'GO_TO_END':
      return { ...state, currentStepIndex: Math.max(0, state.totalSteps - 1), isPlaying: false };
    case 'SET_SPEED':
      try {
        localStorage.setItem('algoritmia_preferred_speed', String(action.payload));
      } catch {
        // Ignorar si localStorage no está disponible
      }
      return { ...state, speed: action.payload };
    case 'RESET': {
      const newTotal = action.payload !== undefined ? action.payload : state.totalSteps;
      return { ...state, currentStepIndex: 0, totalSteps: newTotal, isPlaying: false };
    }
    default:
      return state;
  }
}

export function usePlayback(steps: Step[]) {
  const getInitialSpeed = (): PlaybackSpeed => {
    try {
      const saved = localStorage.getItem('algoritmia_preferred_speed');
      if (saved && ['0.5', '1', '2', '4'].includes(saved)) {
        return Number(saved) as PlaybackSpeed;
      }
    } catch {}
    return 1;
  };

  const [state, dispatch] = useReducer(playbackReducer, {
    currentStepIndex: 0,
    totalSteps: steps.length,
    isPlaying: false,
    speed: getInitialSpeed(),
  });

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch({ type: 'RESET', payload: steps.length });
  }, [steps]);

  useEffect(() => {
    if (state.isPlaying) {
      const delay = SPEED_DELAYS[state.speed];
      timerRef.current = window.setInterval(() => {
        dispatch({ type: 'NEXT_STEP' });
      }, delay);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isPlaying, state.speed]);

  const currentStep = steps[state.currentStepIndex] || steps[0] || null;

  return {
    state,
    currentStep,
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.totalSteps,
    isPlaying: state.isPlaying,
    speed: state.speed,
    play: useCallback(() => dispatch({ type: 'PLAY' }), []),
    pause: useCallback(() => dispatch({ type: 'PAUSE' }), []),
    togglePlay: useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), []),
    nextStep: useCallback(() => dispatch({ type: 'NEXT_STEP' }), []),
    prevStep: useCallback(() => dispatch({ type: 'PREV_STEP' }), []),
    goToStep: useCallback((idx: number) => dispatch({ type: 'GO_TO_STEP', payload: idx }), []),
    goToStart: useCallback(() => dispatch({ type: 'GO_TO_START' }), []),
    goToEnd: useCallback(() => dispatch({ type: 'GO_TO_END' }), []),
    setSpeed: useCallback((spd: PlaybackSpeed) => dispatch({ type: 'SET_SPEED', payload: spd }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };
}

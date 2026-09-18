export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

export interface PlaybackState {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
}

export type PlaybackAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'GO_TO_START' }
  | { type: 'GO_TO_END' }
  | { type: 'SET_SPEED'; payload: PlaybackSpeed }
  | { type: 'RESET'; payload?: number };

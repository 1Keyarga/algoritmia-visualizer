import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ALGORITHMS_CATALOG, CUSTOM_AST_METADATA } from './core/algorithms/registry';
import { GUIDED_TASKS_REPOSITORY } from './core/tasks/tasksRepository';
import type { AlgorithmMetadata, SupportedLanguage } from './types/algorithm';
import type { Step } from './types/trace';
import { generateBubbleSortTrace } from './core/algorithms/bubbleSort';
import { generateSelectionSortTrace } from './core/algorithms/selectionSort';
import { generateInsertionSortTrace } from './core/algorithms/insertionSort';
import { generateMergeSortTrace } from './core/algorithms/mergeSort';
import { generateQuickSortTrace } from './core/algorithms/quickSort';
import { generateLinearSearchTrace } from './core/algorithms/linearSearch';
import { generateBinarySearchTrace } from './core/algorithms/binarySearch';
import { generateRandomDataset } from './core/utils/generator';
import {
  buildComparisonEntries,
  type ComparisonSyncMode,
} from './core/utils/comparisonSync';
import { usePlayback } from './hooks/usePlayback';
import { useKeyboard } from './hooks/useKeyboard';
import { HomeHub, type AppModule } from './components/layout/HomeHub';
import { Navbar } from './components/layout/Navbar';
import { PseudocodePanel } from './components/pseudocode/PseudocodePanel';
import { StudentCodeEditor } from './components/pseudocode/StudentCodeEditor';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { VisualizerPanel } from './components/visualization/VisualizerPanel';
import { PlaybackFooter } from './components/controls/PlaybackFooter';
import {
  InteractiveTaskPanel,
  type TaskAttemptCategory,
} from './components/tasks/InteractiveTaskPanel';
import { EvaluationModule } from './components/evaluation/EvaluationModule';
import {
  DEFAULT_SHEETS_WEBHOOK_URL,
  EVALUATION_STORAGE_KEY,
  TASK_PROGRESS_BY_PARTICIPANT_KEY,
  fetchParticipantFromSheets,
  makeTaskProgressSignature,
  parseTasksDetailFromSheets,
  persistGuestTaskProgress,
  persistParticipantTaskProgress,
  readGuestTaskProgress,
  readParticipantTaskProgress,
  removeSavedParticipantSession,
  saveParticipantSessionRecord,
  sendEvaluationToGoogleSheets,
  type ParticipantSession,
  type PostestVisualizerScenario,
  type TaskProgressState,
} from './core/evaluation/evaluationRepository';

const PREF_ALGO_STORAGE_KEY = 'visurithm_pref_algo';

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persistTaskProgress(
  progress: TaskProgressState,
  participantId?: string | null
) {
  if (participantId) {
    persistParticipantTaskProgress(participantId, progress);
  } else {
    persistGuestTaskProgress(progress);
  }
}

function generateAlgorithmTrace(
  algoId: string,
  data: number[],
  searchTarget: number
): Step[] {
  let rawSteps: Step[];
  if (algoId === 'merge-sort') {
    rawSteps = generateMergeSortTrace(data);
  } else if (algoId === 'quick-sort') {
    rawSteps = generateQuickSortTrace(data);
  } else if (algoId === 'insertion-sort') {
    rawSteps = generateInsertionSortTrace(data);
  } else if (algoId === 'selection-sort') {
    rawSteps = generateSelectionSortTrace(data);
  } else if (algoId === 'linear-search') {
    rawSteps = generateLinearSearchTrace(data, searchTarget);
  } else if (algoId === 'binary-search') {
    rawSteps = generateBinarySearchTrace(data, searchTarget);
  } else if (algoId === 'bubble-sort-classic') {
    rawSteps = generateBubbleSortTrace(data, false);
  } else {
    rawSteps = generateBubbleSortTrace(data, true);
  }

  const accessByIndex: number[] = [];
  return rawSteps.map(step => {
    const enrichedArray = step.array.map((el, idx) => {
      if (el.state === 'comparing' || el.state === 'swapped' || el.state === 'selected') {
        accessByIndex[idx] = (accessByIndex[idx] || 0) + 1;
      }
      return {
        ...el,
        accessCount: accessByIndex[idx] || 0,
      };
    });
    return {
      ...step,
      array: enrichedArray,
    };
  });
}

interface InitialAppState {
  activeModule: AppModule;
  algorithm: AlgorithmMetadata;
  dataset: number[];
  searchTarget: number;
  initialStepJump: number | null;
}

function readInitialAppState(): InitialAppState {
  const defaultDataset = [38, 27, 43, 3, 9, 82, 10, 19];
  let savedAlgo = ALGORITHMS_CATALOG[0];
  try {
    const savedId = localStorage.getItem(PREF_ALGO_STORAGE_KEY);
    const found = ALGORITHMS_CATALOG.find(a => a.id === savedId);
    if (found) savedAlgo = found;
  } catch {}

  const params = new URLSearchParams(window.location.search);
  const algoParam = params.get('algo');
  const dataParam = params.get('data');
  const stepParam = params.get('step');
  const targetParam = params.get('target');

  let activeModule: AppModule = 'home';
  let algorithm = savedAlgo;
  if (algoParam) {
    const foundAlgo = ALGORITHMS_CATALOG.find(a => a.id === algoParam);
    if (foundAlgo) {
      algorithm = foundAlgo;
      activeModule = 'algorithms';
    }
  }

  let dataset = defaultDataset;
  if (dataParam) {
    const parsed = dataParam
      .split(',')
      .map(v => Number(v.trim()))
      .filter(n => !Number.isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 999);
    if (parsed.length >= 2 && parsed.length <= 30) {
      dataset = parsed;
    }
  }
  if (algorithm.id === 'binary-search') {
    dataset = [...dataset].sort((a, b) => a - b);
  }

  const searchTarget =
    targetParam && !Number.isNaN(Number(targetParam)) ? Number(targetParam) : 45;
  const initialStepJump =
    stepParam && !Number.isNaN(Number(stepParam)) ? Math.max(0, Number(stepParam)) : null;

  return {
    activeModule,
    algorithm,
    dataset,
    searchTarget,
    initialStepJump,
  };
}

export function App() {
  const [initialState] = useState<InitialAppState>(() => readInitialAppState());

  const [activeModule, setActiveModule] = useState<AppModule>(initialState.activeModule);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmMetadata>(
    initialState.algorithm
  );

  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [secondaryAlgorithmId, setSecondaryAlgorithmId] = useState<string>('selection-sort');
  const [comparisonSyncMode, setComparisonSyncMode] = useState<ComparisonSyncMode>('milestones');
  const [isPostestVisualizerActive, setIsPostestVisualizerActive] = useState<boolean>(false);
  const [postestCompareAlgorithmId, setPostestCompareAlgorithmId] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('pseudocode');

  const [isPseudocodeOpen, setIsPseudocodeOpen] = useState(true);
  const [isMemoryOpen, setIsMemoryOpen] = useState(
    () => initialState.algorithm.family !== 'divide_and_conquer'
  );
  const [isVisualizerFullscreen, setIsVisualizerFullscreen] = useState(false);

  const [dataset, setDataset] = useState<number[]>(initialState.dataset);

  const [searchTarget, setSearchTarget] = useState<number>(initialState.searchTarget);
  const [customSteps, setCustomSteps] = useState<Step[] | null>(null);
  const [isASTExecuting, setIsASTExecuting] = useState(false);
  const [customCategory, setCustomCategory] = useState<'sorting' | 'searching'>('sorting');

  const [isPredictionModeActive, setIsPredictionModeActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('T01');
  const [unlockedTaskIds, setUnlockedTaskIds] = useState<string[]>([]);
  const pendingStepJumpRef = useRef<number | null>(null);
  const pendingAutoPlayRef = useRef<boolean>(false);

  const [participantSession, setParticipantSession] = useState<ParticipantSession | null>(() =>
    readJsonStorage<ParticipantSession | null>(EVALUATION_STORAGE_KEY, null)
  );

  const [taskProgress, setTaskProgress] = useState<TaskProgressState>(() => {
    const savedSession = readJsonStorage<ParticipantSession | null>(
      EVALUATION_STORAGE_KEY,
      null
    );
    if (savedSession?.participantId) {
      return readParticipantTaskProgress(savedSession.participantId);
    }
    return readGuestTaskProgress();
  });

  const initialParticipantIdRef = useRef<string | null>(
    participantSession?.participantId ?? null
  );
  const makeTaskSnapshot = (id: string, progress: TaskProgressState) =>
    `${id}::${makeTaskProgressSignature(progress)}`;
  const lastSyncedTaskSnapshotRef = useRef<string>(
    participantSession?.participantId
      ? makeTaskSnapshot(participantSession.participantId, taskProgress)
      : ''
  );
  const { completedTaskIds, taskOutcomes, taskAttemptsById } = taskProgress;

  const handleApplyRemoteTaskProgress = useCallback(
    (participantId: string, progress: TaskProgressState, markAsSynced = true) => {
      lastSyncedTaskSnapshotRef.current = markAsSynced
        ? makeTaskSnapshot(participantId, progress)
        : '';
      setTaskProgress(progress);
      persistTaskProgress(progress, participantId);
      setUnlockedTaskIds([]);
    },
    []
  );

  // Al recargar con sesión activa, sincroniza contra Google Sheets si doGet está habilitado
  useEffect(() => {
    const activeId = initialParticipantIdRef.current;
    if (!activeId) return;
    let cancelled = false;

    fetchParticipantFromSheets(DEFAULT_SHEETS_WEBHOOK_URL, activeId).then(remote => {
      if (cancelled || remote === null) return;

      if (!remote.found) {
        // La fila fue eliminada en Google Sheets: limpiar estado local de ese participante
        removeSavedParticipantSession(activeId);
        try {
          localStorage.removeItem(EVALUATION_STORAGE_KEY);
          const map = readJsonStorage<Record<string, TaskProgressState>>(
            TASK_PROGRESS_BY_PARTICIPANT_KEY,
            {}
          );
          delete map[activeId];
          localStorage.setItem(TASK_PROGRESS_BY_PARTICIPANT_KEY, JSON.stringify(map));
        } catch {}
        lastSyncedTaskSnapshotRef.current = '';
        setParticipantSession(null);
        setTaskProgress(readGuestTaskProgress());
        setUnlockedTaskIds([]);
        return;
      }

      const remoteTasks = parseTasksDetailFromSheets(remote.tasksDetail || '');
      lastSyncedTaskSnapshotRef.current = makeTaskSnapshot(activeId, remoteTasks);
      setTaskProgress(remoteTasks);
      persistTaskProgress(remoteTasks, activeId);

      setParticipantSession(prev => {
        if (!prev || prev.participantId !== activeId) return prev;
        const keepLocalPre =
          !!remote.pretestCompletedAt &&
          prev.pretest?.completedAt === remote.pretestCompletedAt;
        const keepLocalPos =
          !!remote.postestCompletedAt &&
          prev.postest?.completedAt === remote.postestCompletedAt;
        const updated: ParticipantSession = {
          ...prev,
          consentedAt: remote.consentedAt || prev.consentedAt,
          pretest: keepLocalPre ? prev.pretest : undefined,
          postest: keepLocalPos ? prev.postest : undefined,
          remotePretestCompletedAt: remote.pretestCompletedAt || undefined,
          remotePostestCompletedAt: remote.postestCompletedAt || undefined,
          inProgressAnswers:
            remote.pretestCompletedAt && remote.postestCompletedAt
              ? undefined
              : prev.inProgressAnswers,
        };
        try {
          localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(updated));
          saveParticipantSessionRecord(updated);
        } catch {}
        return updated;
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Cuando cambian las tareas resueltas o agotadas estando logueado, sincroniza con Google Sheets
  useEffect(() => {
    const activeId = participantSession?.participantId;
    if (!activeId) return;
    const currentSnapshot = makeTaskSnapshot(activeId, taskProgress);
    if (currentSnapshot === lastSyncedTaskSnapshotRef.current) return;
    if (
      taskProgress.completedTaskIds.length === 0 &&
      Object.keys(taskProgress.taskOutcomes).length === 0
    ) {
      lastSyncedTaskSnapshotRef.current = currentSnapshot;
      return;
    }
    const timer = window.setTimeout(() => {
      lastSyncedTaskSnapshotRef.current = currentSnapshot;
      void sendEvaluationToGoogleSheets(
        DEFAULT_SHEETS_WEBHOOK_URL,
        participantSession,
        taskProgress.taskOutcomes,
        taskProgress.completedTaskIds.length
      );
    }, 50);
    return () => window.clearTimeout(timer);
  }, [participantSession, taskProgress]);

  const handleUpdateParticipantSession = useCallback(
    (next: ParticipantSession | null) => {
      const prevId = participantSession?.participantId ?? null;
      const nextId = next?.participantId ?? null;

      setParticipantSession(next);
      try {
        if (next) {
          localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(next));
          saveParticipantSessionRecord(next);
        } else {
          if (participantSession) {
            saveParticipantSessionRecord(participantSession);
          }
          localStorage.removeItem(EVALUATION_STORAGE_KEY);
        }
      } catch {}

      if (prevId === nextId) return;

      if (!nextId) {
        // Cerrar sesión del participante actual: respaldar su avance y volver al espacio local/invitado
        if (prevId) {
          persistTaskProgress(taskProgress, prevId);
        }
        setTaskProgress(readGuestTaskProgress());
        setUnlockedTaskIds([]);
        return;
      }

      const restored = readParticipantTaskProgress(nextId);
      setTaskProgress(restored);
      persistTaskProgress(restored, nextId);
      setUnlockedTaskIds([]);
    },
    [participantSession, taskProgress]
  );

  const handleMarkTaskCompleted = useCallback(
    (taskId: string) => {
      setTaskProgress(prev => {
        if (prev.completedTaskIds.includes(taskId)) return prev;
        const next: TaskProgressState = {
          ...prev,
          completedTaskIds: [...prev.completedTaskIds, taskId],
        };
        persistTaskProgress(next, participantSession?.participantId);
        return next;
      });
    },
    [participantSession?.participantId]
  );

  const handleRecordTaskOutcome = useCallback(
    (taskId: string, category: TaskAttemptCategory) => {
      setTaskProgress(prev => {
        const next: TaskProgressState = {
          ...prev,
          taskOutcomes: { ...prev.taskOutcomes, [taskId]: category },
        };
        persistTaskProgress(next, participantSession?.participantId);
        return next;
      });
    },
    [participantSession?.participantId]
  );

  const handleRecordTaskAttempt = useCallback(
    (taskId: string, attempts: number) => {
      setTaskProgress(prev => {
        const next: TaskProgressState = {
          ...prev,
          taskAttemptsById: { ...prev.taskAttemptsById, [taskId]: attempts },
        };
        persistTaskProgress(next, participantSession?.participantId);
        return next;
      });
    },
    [participantSession?.participantId]
  );

  // Guardar preferencia de último algoritmo seleccionado
  useEffect(() => {
    if (selectedAlgorithm.id !== 'custom-ast') {
      try {
        localStorage.setItem(PREF_ALGO_STORAGE_KEY, selectedAlgorithm.id);
      } catch {}
    }
  }, [selectedAlgorithm.id]);

  const isDivideAndConquer = selectedAlgorithm.family === 'divide_and_conquer';
  const isCustomAST = activeModule === 'student_code' || selectedAlgorithm.id === 'custom-ast';

  const sameFamilyAlgorithms = useMemo(() => {
    return ALGORITHMS_CATALOG.filter(
      a => a.family === selectedAlgorithm.family && a.id !== selectedAlgorithm.id
    );
  }, [selectedAlgorithm]);

  const secondaryAlgorithm = useMemo(() => {
    return (
      sameFamilyAlgorithms.find(a => a.id === secondaryAlgorithmId) ||
      sameFamilyAlgorithms[0] ||
      ALGORITHMS_CATALOG[0]
    );
  }, [sameFamilyAlgorithms, secondaryAlgorithmId]);

  const steps = useMemo(() => {
    if (isCustomAST && customSteps) {
      const accessByIndex: number[] = [];
      return customSteps.map(step => {
        const enrichedArray = step.array.map((el, idx) => {
          if (el.state === 'comparing' || el.state === 'swapped' || el.state === 'selected') {
            accessByIndex[idx] = (accessByIndex[idx] || 0) + 1;
          }
          return {
            ...el,
            accessCount: accessByIndex[idx] || 0,
          };
        });
        return {
          ...step,
          array: enrichedArray,
        };
      });
    }
    const effectiveId = isCustomAST ? 'bubble-sort' : selectedAlgorithm.id;
    return generateAlgorithmTrace(effectiveId, dataset, searchTarget);
  }, [dataset, selectedAlgorithm.id, searchTarget, customSteps, isCustomAST]);

  const currentGuidedTask = useMemo(
    () => GUIDED_TASKS_REPOSITORY.find(t => t.id === selectedTaskId) || GUIDED_TASKS_REPOSITORY[0],
    [selectedTaskId]
  );

  // Activar comparación en paralelo en tareas comparativas, en preguntas comparativas del Postest o desde barra superior
  const isGuidedTaskComparison =
    activeModule === 'guided_tasks' &&
    (currentGuidedTask.id === 'T05' || currentGuidedTask.id === 'T11');

  const isPostestComparison =
    activeModule === 'evaluation' &&
    isPostestVisualizerActive &&
    !!postestCompareAlgorithmId;

  const isComparisonActive =
    (activeModule === 'algorithms' && isComparing && sameFamilyAlgorithms.length > 0) ||
    isGuidedTaskComparison ||
    isPostestComparison;

  const effectiveSecondaryAlgorithm = useMemo(() => {
    if (isPostestComparison && postestCompareAlgorithmId) {
      return (
        ALGORITHMS_CATALOG.find(a => a.id === postestCompareAlgorithmId) || secondaryAlgorithm
      );
    }
    if (activeModule === 'guided_tasks') {
      if (currentGuidedTask.id === 'T05') {
        const partnerId =
          selectedAlgorithm.id === 'selection-sort'
            ? 'bubble-sort-classic'
            : 'selection-sort';
        return ALGORITHMS_CATALOG.find(a => a.id === partnerId) || secondaryAlgorithm;
      }
      if (currentGuidedTask.id === 'T11') {
        const partnerId =
          selectedAlgorithm.id === 'binary-search' ? 'linear-search' : 'binary-search';
        return ALGORITHMS_CATALOG.find(a => a.id === partnerId) || secondaryAlgorithm;
      }
    }
    return secondaryAlgorithm;
  }, [
    isPostestComparison,
    postestCompareAlgorithmId,
    activeModule,
    currentGuidedTask.id,
    selectedAlgorithm.id,
    secondaryAlgorithm,
  ]);

  const secondarySteps = useMemo(() => {
    if (!isComparisonActive) return [];
    const secData =
      effectiveSecondaryAlgorithm.id === 'binary-search'
        ? [...dataset].sort((a, b) => a - b)
        : dataset;
    return generateAlgorithmTrace(effectiveSecondaryAlgorithm.id, secData, searchTarget);
  }, [isComparisonActive, effectiveSecondaryAlgorithm.id, dataset, searchTarget]);

  const primaryComparisonEntries = useMemo(
    () => (isComparisonActive ? buildComparisonEntries(steps, comparisonSyncMode) : []),
    [isComparisonActive, steps, comparisonSyncMode]
  );

  const secondaryComparisonEntries = useMemo(
    () => (isComparisonActive ? buildComparisonEntries(secondarySteps, comparisonSyncMode) : []),
    [isComparisonActive, secondarySteps, comparisonSyncMode]
  );

  const primaryComparisonSteps = useMemo(
    () => primaryComparisonEntries.map(e => e.step),
    [primaryComparisonEntries]
  );

  const playbackTimelineSteps = useMemo(() => {
    if (!isComparisonActive) {
      return steps;
    }
    if (secondaryComparisonEntries.length <= primaryComparisonSteps.length) {
      return primaryComparisonSteps;
    }
    const padded = [...primaryComparisonSteps];
    const lastPrimary = primaryComparisonSteps[primaryComparisonSteps.length - 1];
    while (padded.length < secondaryComparisonEntries.length && lastPrimary) {
      padded.push(lastPrimary);
    }
    return padded;
  }, [
    isComparisonActive,
    steps,
    primaryComparisonSteps,
    secondaryComparisonEntries.length,
  ]);

  const isCurrentTaskUnlocked =
    unlockedTaskIds.includes(currentGuidedTask.id) ||
    completedTaskIds.includes(currentGuidedTask.id) ||
    taskOutcomes[currentGuidedTask.id] === 'failed' ||
    (taskAttemptsById[currentGuidedTask.id] ?? 0) >= 3;

  const maxAllowedStepIndex =
    activeModule === 'guided_tasks' && !isCurrentTaskUnlocked
      ? currentGuidedTask.breakpointStepIndex
      : undefined;

  const playback = usePlayback(
    playbackTimelineSteps,
    maxAllowedStepIndex,
    initialState.initialStepJump ?? undefined
  );
  const playbackReset = playback.reset;
  const playbackGoToStep = playback.goToStep;
  const playbackPlay = playback.play;

  const singleTraceHistory = useMemo(
    () => (isComparisonActive ? undefined : steps.slice(0, playback.currentStepIndex + 1)),
    [isComparisonActive, steps, playback.currentStepIndex]
  );

  useEffect(() => {
    if (pendingStepJumpRef.current !== null && steps.length > 0) {
      const targetIdx = Math.max(0, Math.min(pendingStepJumpRef.current, steps.length - 1));
      pendingStepJumpRef.current = null;
      playbackGoToStep(targetIdx);
    }
  }, [steps, playbackGoToStep]);

  useEffect(() => {
    if (pendingAutoPlayRef.current && steps.length > 0 && maxAllowedStepIndex === undefined) {
      pendingAutoPlayRef.current = false;
      playbackPlay();
    }
  }, [steps, maxAllowedStepIndex, playbackPlay]);

  const isKeyboardEnabled =
    activeModule === 'algorithms' ||
    activeModule === 'guided_tasks' ||
    (activeModule === 'student_code' && isASTExecuting) ||
    (activeModule === 'evaluation' && isPostestVisualizerActive);

  useKeyboard({
    onTogglePlay: playback.togglePlay,
    onNextStep: playback.nextStep,
    onPrevStep: playback.prevStep,
    onReset: playback.reset,
    onGoToStart: playback.goToStart,
    onGoToEnd: playback.goToEnd,
    enabled: isKeyboardEnabled,
  });

  const handleGenerateRandom = (size: number = dataset.length) => {
    const newData = generateRandomDataset(size, 10, 99);
    if (selectedAlgorithm.id === 'binary-search') {
      newData.sort((a, b) => a - b);
    }
    setDataset(newData);
  };

  const handleChangeDatasetSize = (newSize: number) => {
    handleGenerateRandom(newSize);
  };

  const handleApplyCustomDataset = (customData: number[]) => {
    if (activeModule === 'algorithms' && selectedAlgorithm.id === 'binary-search') {
      setDataset([...customData].sort((a, b) => a - b));
    } else {
      setDataset(customData);
    }
  };

  const handleLoadTaskScenario = useCallback(
    (
      algorithmId: string,
      presetData: number[],
      presetTarget?: number,
      enablePrediction?: boolean,
      initialStepIndex?: number
    ) => {
      const targetAlgo = ALGORITHMS_CATALOG.find(a => a.id === algorithmId);
      if (targetAlgo) {
        setSelectedAlgorithm(targetAlgo);
        setIsMemoryOpen(targetAlgo.family !== 'divide_and_conquer');
      }
      setCustomSteps(null);
      setDataset([...presetData]);
      if (presetTarget !== undefined) {
        setSearchTarget(presetTarget);
      }
      if (enablePrediction !== undefined) {
        setIsPredictionModeActive(enablePrediction);
      }
      if (initialStepIndex !== undefined) {
        pendingStepJumpRef.current = initialStepIndex;
        playbackGoToStep(initialStepIndex);
      } else {
        playbackReset();
      }
    },
    [playbackGoToStep, playbackReset]
  );

  const handlePostestScenarioChange = useCallback(
    (isActive: boolean, scenario?: PostestVisualizerScenario) => {
      setIsPostestVisualizerActive(isActive);
      if (!isActive || !scenario) {
        setPostestCompareAlgorithmId(null);
        return;
      }
      const targetAlgo = ALGORITHMS_CATALOG.find(a => a.id === scenario.algorithmId);
      if (targetAlgo) {
        setSelectedAlgorithm(targetAlgo);
        setIsMemoryOpen(targetAlgo.family !== 'divide_and_conquer');
      }
      setCustomSteps(null);
      setIsPredictionModeActive(false);
      setDataset([...scenario.dataset]);
      if (scenario.searchTarget !== undefined) {
        setSearchTarget(scenario.searchTarget);
      }
      setPostestCompareAlgorithmId(scenario.compareWithAlgorithmId || null);
      pendingStepJumpRef.current = 0;
      playbackReset();
    },
    [playbackReset]
  );

  const handleUnlockTaskExecution = useCallback(
    ( _customAstSteps?: Step[]) => {
      setUnlockedTaskIds(prev =>
        prev.includes(currentGuidedTask.id) ? prev : [...prev, currentGuidedTask.id]
      );
      pendingAutoPlayRef.current = true;
    },
    [currentGuidedTask.id]
  );

  const handleToggleFullscreen = () => {
    if (isVisualizerFullscreen) {
      setIsVisualizerFullscreen(false);
      setIsPseudocodeOpen(true);
      if (!isDivideAndConquer) setIsMemoryOpen(true);
    } else {
      setIsVisualizerFullscreen(true);
      setIsPseudocodeOpen(false);
      setIsMemoryOpen(false);
    }
  };

  const handleNavigateModule = (targetModule: AppModule) => {
    if (targetModule !== 'evaluation') {
      setIsPostestVisualizerActive(false);
      setPostestCompareAlgorithmId(null);
    }
    if (targetModule === 'home') {
      setIsPredictionModeActive(false);
      setActiveModule('home');
    } else if (targetModule === 'algorithms') {
      if (selectedAlgorithm.id === 'custom-ast') {
        setSelectedAlgorithm(ALGORITHMS_CATALOG[0]);
        setIsMemoryOpen(ALGORITHMS_CATALOG[0].family !== 'divide_and_conquer');
      } else {
        setIsMemoryOpen(selectedAlgorithm.family !== 'divide_and_conquer');
      }
      setIsPredictionModeActive(false);
      setActiveModule('algorithms');
      playback.reset();
    } else if (targetModule === 'student_code') {
      setSelectedAlgorithm(CUSTOM_AST_METADATA);
      setIsASTExecuting(false);
      setCustomSteps(null);
      setIsPredictionModeActive(false);
      setActiveModule('student_code');
      playback.reset();
    } else if (targetModule === 'guided_tasks') {
      if (selectedAlgorithm.id === 'custom-ast') {
        setSelectedAlgorithm(ALGORITHMS_CATALOG[0]);
        setIsMemoryOpen(ALGORITHMS_CATALOG[0].family !== 'divide_and_conquer');
      }
      setActiveModule('guided_tasks');
    } else if (targetModule === 'evaluation') {
      setIsPredictionModeActive(false);
      setActiveModule('evaluation');
    }
  };

  const handleShareLink = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('algo', selectedAlgorithm.id);
    url.searchParams.set('data', dataset.join(','));
    url.searchParams.set('step', String(playback.currentStepIndex));
    if (selectedAlgorithm.family === 'searching') {
      url.searchParams.set('target', String(searchTarget));
    } else {
      url.searchParams.delete('target');
    }
    const shareUrl = url.toString();
    window.history.replaceState({}, '', shareUrl);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
  }, [selectedAlgorithm.id, selectedAlgorithm.family, dataset, playback.currentStepIndex, searchTarget]);

  // PORTADA DE INICIO (separada del entorno de trabajo para futuro login de estudiantes)
  if (activeModule === 'home') {
    return (
      <div className="flex flex-col h-full w-full min-h-0 bg-[#0d0e16] text-slate-100 font-sans">
        <HomeHub
          onEnterAlgorithmsModule={initialAlgo => {
            const target = initialAlgo || ALGORITHMS_CATALOG[0];
            setSelectedAlgorithm(target);
            setIsMemoryOpen(target.family !== 'divide_and_conquer');
            if (target.id === 'binary-search') {
              setDataset(prev => [...prev].sort((a, b) => a - b));
            }
            setIsPredictionModeActive(false);
            setActiveModule('algorithms');
            playback.reset();
          }}
          onEnterStudentCodeModule={() => handleNavigateModule('student_code')}
          onEnterGuidedTasksModule={() => handleNavigateModule('guided_tasks')}
          onEnterEvaluationModule={() => handleNavigateModule('evaluation')}
          completedTasksCount={completedTaskIds.length}
          activeParticipantId={participantSession?.participantId || null}
        />
      </div>
    );
  }

  const activeTimeline = isComparisonActive ? primaryComparisonSteps : steps;

  const nextStep =
    playback.currentStepIndex + 1 < activeTimeline.length
      ? activeTimeline[playback.currentStepIndex + 1]
      : null;

  const showWorkspaceVisualizer =
    activeModule !== 'evaluation' || isPostestVisualizerActive;

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-[#111217] text-slate-100 font-sans">
      {/* Barra única del entorno de trabajo */}
      <Navbar
        activeModule={activeModule}
        onNavigateModule={handleNavigateModule}
        selectedAlgorithm={selectedAlgorithm}
        onSelectAlgorithm={algo => {
          setSelectedAlgorithm(algo);
          setIsMemoryOpen(algo.family !== 'divide_and_conquer');
          if (algo.id === 'binary-search') {
            setDataset(prev => [...prev].sort((a, b) => a - b));
          }
          playback.reset();
        }}
        datasetSize={dataset.length}
        onChangeDatasetSize={handleChangeDatasetSize}
        onGenerateRandom={() => handleGenerateRandom(dataset.length)}
        onApplyCustomDataset={handleApplyCustomDataset}
        currentDataset={dataset}
        searchTarget={searchTarget}
        onChangeSearchTarget={setSearchTarget}
        completedTasksCount={completedTaskIds.length}
        isComparing={isComparing}
        onToggleComparison={() => setIsComparing(prev => !prev)}
        onShareLink={handleShareLink}
        activeParticipantId={participantSession?.participantId || null}
      />

      {/* Área principal de trabajo del módulo activo */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Columna izquierda (o pantalla completa en Pretest/Resumen de evaluación) */}
        {activeModule === 'evaluation' ? (
          <EvaluationModule
            session={participantSession}
            onUpdateSession={handleUpdateParticipantSession}
            onApplyRemoteTaskProgress={handleApplyRemoteTaskProgress}
            taskOutcomes={taskOutcomes}
            completedTasksCount={completedTaskIds.length}
            onGoToGuidedTasks={() => handleNavigateModule('algorithms')}
            onPostestScenarioChange={handlePostestScenarioChange}
            algorithm={selectedAlgorithm}
            currentStep={playback.currentStep}
            stepIndex={playback.currentStepIndex}
            totalSteps={playback.totalSteps}
            selectedLanguage={selectedLanguage}
            onChangeLanguage={setSelectedLanguage}
          />
        ) : activeModule === 'student_code' ? (
          <StudentCodeEditor
            currentDataset={dataset}
            searchTarget={searchTarget}
            currentStep={playback.currentStep}
            onTraceGenerated={(newSteps, _code, category) => {
              setCustomSteps(newSteps);
              setIsASTExecuting(true);
              if (category) setCustomCategory(category);
              playback.reset();
            }}
            isOpen={isPseudocodeOpen}
            onToggleOpen={() => setIsPseudocodeOpen(!isPseudocodeOpen)}
            isExecuting={isASTExecuting}
            onExitExecutionMode={() => {
              setIsASTExecuting(false);
              setCustomSteps(null);
              playback.reset();
            }}
          />
        ) : activeModule === 'guided_tasks' ? (
          <InteractiveTaskPanel
            isOpen={true}
            onClose={() => {
              setIsPredictionModeActive(false);
              setActiveModule('home');
            }}
            onLoadTaskScenario={handleLoadTaskScenario}
            onUnlockTaskExecution={handleUnlockTaskExecution}
            completedTaskIds={completedTaskIds}
            onMarkTaskCompleted={handleMarkTaskCompleted}
            taskOutcomes={taskOutcomes}
            onRecordTaskOutcome={handleRecordTaskOutcome}
            taskAttemptsById={taskAttemptsById}
            onRecordTaskAttempt={handleRecordTaskAttempt}
            isPredictionModeActive={isPredictionModeActive}
            onTogglePredictionMode={() => setIsPredictionModeActive(prev => !prev)}
            selectedTaskId={selectedTaskId}
            onSelectTaskId={setSelectedTaskId}
            isTaskUnlocked={isCurrentTaskUnlocked}
            algorithm={selectedAlgorithm}
            currentStep={playback.currentStep}
            stepIndex={playback.currentStepIndex}
            totalSteps={playback.totalSteps}
            selectedLanguage={selectedLanguage}
            onChangeLanguage={setSelectedLanguage}
          />
        ) : (
          <PseudocodePanel
            algorithm={selectedAlgorithm}
            currentStep={playback.currentStep}
            stepIndex={playback.currentStepIndex}
            totalSteps={playback.totalSteps}
            selectedLanguage={selectedLanguage}
            onChangeLanguage={setSelectedLanguage}
            isOpen={isPseudocodeOpen}
            onToggleOpen={() => setIsPseudocodeOpen(!isPseudocodeOpen)}
          />
        )}

        {/* Columna derecha: Memoria (superior) + Visualización gráfica (inferior) */}
        {showWorkspaceVisualizer && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#12131b]">
            {activeModule !== 'student_code' && !isComparisonActive && (
              <MemoryPanel
                currentStep={playback.currentStep}
                stepIndex={playback.currentStepIndex}
                isOpen={isMemoryOpen}
                onToggleOpen={() => setIsMemoryOpen(!isMemoryOpen)}
                hideArrayGrid={selectedAlgorithm.family === 'searching'}
              />
            )}

            <VisualizerPanel
              currentStep={playback.currentStep}
              nextStep={nextStep}
              traceHistory={singleTraceHistory}
              stepIndex={playback.currentStepIndex}
              totalSteps={playback.totalSteps}
              isFullscreen={isVisualizerFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              algorithmFamily={
                activeModule === 'student_code' ? customCategory : selectedAlgorithm.family
              }
              algorithmId={
                activeModule === 'student_code' ? 'custom-ast' : selectedAlgorithm.id
              }
              isPredictionModeActive={isPredictionModeActive}
              onTogglePredictionMode={() => setIsPredictionModeActive(prev => !prev)}
              onAdvanceStep={playback.nextStep}
              isAwaitingCompilation={activeModule === 'student_code' && !isASTExecuting}
              comparisonProps={
                isComparisonActive
                  ? {
                      primaryAlgorithm: selectedAlgorithm,
                      primaryEntries: primaryComparisonEntries,
                      secondaryAlgorithm: effectiveSecondaryAlgorithm,
                      secondaryEntries: secondaryComparisonEntries,
                      rawPrimarySteps: steps,
                      rawSecondarySteps: secondarySteps,
                      sameFamilyAlgorithms:
                        isGuidedTaskComparison || isPostestComparison
                          ? [effectiveSecondaryAlgorithm]
                          : sameFamilyAlgorithms,
                      onSelectSecondaryAlgorithm: algoId => setSecondaryAlgorithmId(algoId),
                      syncMode: comparisonSyncMode,
                      onChangeSyncMode: setComparisonSyncMode,
                    }
                  : null
              }
            />
          </div>
        )}
      </main>

      {/* Barra inferior de controles y reproducción */}
      {showWorkspaceVisualizer && (
        <PlaybackFooter
          currentStepIndex={playback.currentStepIndex}
          totalSteps={playback.totalSteps}
          isPlaying={playback.isPlaying}
          speed={playback.speed}
          onTogglePlay={playback.togglePlay}
          onNextStep={playback.nextStep}
          onPrevStep={playback.prevStep}
          onGoToStart={playback.goToStart}
          onGoToEnd={playback.goToEnd}
          onGoToStep={playback.goToStep}
          onSetSpeed={playback.setSpeed}
          onReset={playback.reset}
          disabled={activeModule === 'student_code' && !isASTExecuting}
          maxAllowedStepIndex={maxAllowedStepIndex}
          stepUnitLabel={
            isComparisonActive && comparisonSyncMode === 'milestones' ? 'Hito' : 'Paso'
          }
        />
      )}
    </div>
  );
}

export default App;

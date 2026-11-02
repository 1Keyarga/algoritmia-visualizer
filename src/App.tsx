import { useState, useMemo, useEffect, useCallback } from 'react';
import { ALGORITHMS_CATALOG, CUSTOM_AST_METADATA } from './core/algorithms/registry';
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
import { usePlayback } from './hooks/usePlayback';
import { useKeyboard } from './hooks/useKeyboard';
import { HomeHub, type AppModule } from './components/layout/HomeHub';
import { Navbar } from './components/layout/Navbar';
import { PseudocodePanel } from './components/pseudocode/PseudocodePanel';
import { StudentCodeEditor } from './components/pseudocode/StudentCodeEditor';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { VisualizerPanel } from './components/visualization/VisualizerPanel';
import { PlaybackFooter } from './components/controls/PlaybackFooter';
import { InteractiveTaskPanel } from './components/tasks/InteractiveTaskPanel';

const COMPLETED_TASKS_STORAGE_KEY = 'algoritmia_completed_tasks_v1';

export function App() {
  const [activeModule, setActiveModule] = useState<AppModule>('home');

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmMetadata>(
    ALGORITHMS_CATALOG[0]
  );

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('pseudocode');

  const [isPseudocodeOpen, setIsPseudocodeOpen] = useState(true);
  const [isMemoryOpen, setIsMemoryOpen] = useState(true);
  const [isVisualizerFullscreen, setIsVisualizerFullscreen] = useState(false);

  const [dataset, setDataset] = useState<number[]>([38, 27, 43, 3, 9, 82, 10, 19]);

  const [searchTarget, setSearchTarget] = useState<number>(45);
  const [customSteps, setCustomSteps] = useState<Step[] | null>(null);
  const [isASTExecuting, setIsASTExecuting] = useState(false);
  const [customCategory, setCustomCategory] = useState<'sorting' | 'searching'>('sorting');

  const [isPredictionModeActive, setIsPredictionModeActive] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COMPLETED_TASKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleMarkTaskCompleted = useCallback((taskId: string) => {
    setCompletedTaskIds(prev => {
      if (prev.includes(taskId)) return prev;
      const next = [...prev, taskId];
      try {
        localStorage.setItem(COMPLETED_TASKS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return next;
    });
  }, []);

  const isOptimized = selectedAlgorithm.id === 'bubble-sort';
  const isDivideAndConquer = selectedAlgorithm.family === 'divide_and_conquer';
  const isCustomAST = activeModule === 'student_code' || selectedAlgorithm.id === 'custom-ast';

  // Colapsar panel de memoria solo en divide y vencerás para dar prioridad al árbol
  useEffect(() => {
    if (isDivideAndConquer) {
      setIsMemoryOpen(false);
    } else {
      setIsMemoryOpen(true);
    }
  }, [isDivideAndConquer]);

  const steps = useMemo(() => {
    let rawSteps: Step[];
    if (isCustomAST) {
      rawSteps = customSteps || generateBubbleSortTrace(dataset, isOptimized);
    } else if (selectedAlgorithm.id === 'merge-sort') {
      rawSteps = generateMergeSortTrace(dataset);
    } else if (selectedAlgorithm.id === 'quick-sort') {
      rawSteps = generateQuickSortTrace(dataset);
    } else if (selectedAlgorithm.id === 'insertion-sort') {
      rawSteps = generateInsertionSortTrace(dataset);
    } else if (selectedAlgorithm.id === 'selection-sort') {
      rawSteps = generateSelectionSortTrace(dataset);
    } else if (selectedAlgorithm.id === 'linear-search') {
      rawSteps = generateLinearSearchTrace(dataset, searchTarget);
    } else if (selectedAlgorithm.id === 'binary-search') {
      rawSteps = generateBinarySearchTrace(dataset, searchTarget);
    } else {
      rawSteps = generateBubbleSortTrace(dataset, isOptimized);
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
  }, [dataset, selectedAlgorithm, isOptimized, searchTarget, customSteps, isCustomAST]);

  const playback = usePlayback(steps);

  useKeyboard({
    onTogglePlay: playback.togglePlay,
    onNextStep: playback.nextStep,
    onPrevStep: playback.prevStep,
    onReset: playback.reset,
    onGoToStart: playback.goToStart,
    onGoToEnd: playback.goToEnd,
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
    setDataset(customData);
  };

  const handleLoadTaskScenario = useCallback(
    (
      algorithmId: string,
      presetData: number[],
      presetTarget?: number,
      enablePrediction?: boolean
    ) => {
      const targetAlgo = ALGORITHMS_CATALOG.find(a => a.id === algorithmId);
      if (targetAlgo) {
        setSelectedAlgorithm(targetAlgo);
      }
      setDataset([...presetData]);
      if (presetTarget !== undefined) {
        setSearchTarget(presetTarget);
      }
      if (enablePrediction !== undefined) {
        setIsPredictionModeActive(enablePrediction);
      }
      playback.reset();
    },
    [playback]
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

  // CAPA PRINCIPAL: Selección de Módulo
  if (activeModule === 'home') {
    return (
      <div className="flex flex-col h-full w-full min-h-0 bg-[#111217] text-slate-100 font-sans">
        <HomeHub
          onEnterAlgorithmsModule={initialAlgo => {
            const target = initialAlgo || ALGORITHMS_CATALOG[0];
            setSelectedAlgorithm(target);
            if (target.id === 'binary-search') {
              setDataset(prev => [...prev].sort((a, b) => a - b));
            }
            setIsPredictionModeActive(false);
            setActiveModule('algorithms');
            playback.reset();
          }}
          onEnterStudentCodeModule={() => {
            setSelectedAlgorithm(CUSTOM_AST_METADATA);
            setIsPredictionModeActive(false);
            setActiveModule('student_code');
            playback.reset();
          }}
          onEnterGuidedTasksModule={() => {
            setActiveModule('guided_tasks');
            playback.reset();
          }}
          completedTasksCount={completedTaskIds.length}
        />
      </div>
    );
  }

  const nextStep =
    playback.currentStepIndex + 1 < steps.length
      ? steps[playback.currentStepIndex + 1]
      : null;

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-[#111217] text-slate-100 font-sans">
      {/* Barra de navegación dedicada exclusivamente al módulo activo */}
      <Navbar
        activeModule={activeModule}
        onBackToHome={() => {
          setIsPredictionModeActive(false);
          setActiveModule('home');
        }}
        selectedAlgorithm={selectedAlgorithm}
        onSelectAlgorithm={algo => {
          setSelectedAlgorithm(algo);
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
      />

      {/* Área principal de trabajo del módulo activo */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Panel izquierdo: Editor de Código del Estudiante (en student_code) o Pseudocódigo (en algorithms / guided_tasks) */}
        {activeModule === 'student_code' ? (
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
            onExitExecutionMode={() => setIsASTExecuting(false)}
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

        {/* Área central: Memoria (superior) + Visualización gráfica (inferior) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#12131b]">
          {!isDivideAndConquer && activeModule !== 'student_code' && (
            <MemoryPanel
              currentStep={playback.currentStep}
              isOpen={isMemoryOpen}
              onToggleOpen={() => setIsMemoryOpen(!isMemoryOpen)}
            />
          )}

          <VisualizerPanel
            currentStep={playback.currentStep}
            nextStep={nextStep}
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
          />
        </div>

        {/* Panel de Tareas Interactivas Guiadas (exclusivo del módulo guided_tasks) */}
        <InteractiveTaskPanel
          isOpen={activeModule === 'guided_tasks'}
          onClose={() => {
            setIsPredictionModeActive(false);
            setActiveModule('home');
          }}
          onLoadTaskScenario={handleLoadTaskScenario}
          completedTaskIds={completedTaskIds}
          onMarkTaskCompleted={handleMarkTaskCompleted}
          isPredictionModeActive={isPredictionModeActive}
          onTogglePredictionMode={() => setIsPredictionModeActive(prev => !prev)}
        />
      </main>

      {/* Barra inferior de controles y reproducción */}
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
      />
    </div>
  );
}

export default App;

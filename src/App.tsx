import { useState, useMemo, useEffect } from 'react';
import { ALGORITHMS_CATALOG } from './core/algorithms/registry';
import type { AlgorithmMetadata, SupportedLanguage } from './types/algorithm';
import type { Step } from './types/trace';
import { generateBubbleSortTrace } from './core/algorithms/bubbleSort';
import { generateSelectionSortTrace } from './core/algorithms/selectionSort';
import { generateInsertionSortTrace } from './core/algorithms/insertionSort';
import { generateMergeSortTrace } from './core/algorithms/mergeSort';
import { generateLinearSearchTrace } from './core/algorithms/linearSearch';
import { generateBinarySearchTrace } from './core/algorithms/binarySearch';
import { generateRandomDataset } from './core/utils/generator';
import { usePlayback } from './hooks/usePlayback';
import { useKeyboard } from './hooks/useKeyboard';
import { Navbar } from './components/layout/Navbar';
import { PseudocodePanel } from './components/pseudocode/PseudocodePanel';
import { StudentCodeEditor } from './components/pseudocode/StudentCodeEditor';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { VisualizerPanel } from './components/visualization/VisualizerPanel';
import { PlaybackFooter } from './components/controls/PlaybackFooter';

export function App() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmMetadata>(
    ALGORITHMS_CATALOG[0]
  );

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('pseudocode');

  const [isPseudocodeOpen, setIsPseudocodeOpen] = useState(true);
  const [isMemoryOpen, setIsMemoryOpen] = useState(true);
  const [isVisualizerFullscreen, setIsVisualizerFullscreen] = useState(false);

  const [dataset, setDataset] = useState<number[]>([
    38, 27, 43, 3, 9, 82, 10, 19
  ]);

  const [searchTarget, setSearchTarget] = useState<number>(45);
  const [customSteps, setCustomSteps] = useState<Step[] | null>(null);
  const [isASTExecuting, setIsASTExecuting] = useState(false);
  const [customCategory, setCustomCategory] = useState<'sorting' | 'searching'>('sorting');

  // Cambiar dataset a ordenado para binary search
  useEffect(() => {
    if (selectedAlgorithm.id === 'binary-search') {
      const sorted = [...dataset].sort((a, b) => a - b);
      setDataset(sorted);
    }
  }, [selectedAlgorithm.id]);

  const isOptimized = selectedAlgorithm.id === 'bubble-sort';

  const isDivideAndConquer = selectedAlgorithm.family === 'divide_and_conquer';
  const isCustomAST = selectedAlgorithm.id === 'custom-ast';

  // Colapsar panel de memoria solo en divide y vencerás para dar prioridad al árbol
  useEffect(() => {
    if (isDivideAndConquer) {
      setIsMemoryOpen(false);
    } else {
      setIsMemoryOpen(true);
    }
  }, [isDivideAndConquer]);

  const steps = useMemo(() => {
    if (selectedAlgorithm.id === 'custom-ast') {
      return customSteps || generateBubbleSortTrace(dataset, isOptimized);
    }
    if (selectedAlgorithm.id === 'merge-sort') {
      return generateMergeSortTrace(dataset);
    }
    if (selectedAlgorithm.id === 'insertion-sort') {
      return generateInsertionSortTrace(dataset);
    }
    if (selectedAlgorithm.id === 'selection-sort') {
      return generateSelectionSortTrace(dataset);
    }
    if (selectedAlgorithm.id === 'linear-search') {
      return generateLinearSearchTrace(dataset, searchTarget);
    }
    if (selectedAlgorithm.id === 'binary-search') {
      return generateBinarySearchTrace(dataset, searchTarget);
    }
    if (selectedAlgorithm.id.startsWith('bubble-sort')) {
      return generateBubbleSortTrace(dataset, isOptimized);
    }
    return generateBubbleSortTrace(dataset, isOptimized);
  }, [dataset, selectedAlgorithm, isOptimized, searchTarget, customSteps]);

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
    setDataset(newData);
  };

  const handleChangeDatasetSize = (newSize: number) => {
    handleGenerateRandom(newSize);
  };

  const handleApplyCustomDataset = (customData: number[]) => {
    setDataset(customData);
  };

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

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-[#111217] text-slate-100 font-sans">
      {/* Barra de navegación superior */}
      <Navbar
        selectedAlgorithm={selectedAlgorithm}
        onSelectAlgorithm={(algo) => {
          setSelectedAlgorithm(algo);
          playback.reset();
        }}
        datasetSize={dataset.length}
        onChangeDatasetSize={handleChangeDatasetSize}
        onGenerateRandom={() => handleGenerateRandom(dataset.length)}
        onApplyCustomDataset={handleApplyCustomDataset}
        currentDataset={dataset}
        searchTarget={searchTarget}
        onChangeSearchTarget={setSearchTarget}
      />

      {/* Área principal de trabajo */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Panel izquierdo: Pseudocódigo o Editor de Código del Estudiante */}
        {isCustomAST ? (
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

        {/* Área derecha: Memoria (superior) + Visualización gráfica (inferior) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-auto bg-[#12131b]">
          {/* Panel de memoria (oculto en divide y vencerás y en modo código del estudiante porque tienen su propio visualizador dedicado) */}
          {!isDivideAndConquer && !isCustomAST && (
            <MemoryPanel
              currentStep={playback.currentStep}
              isOpen={isMemoryOpen}
              onToggleOpen={() => setIsMemoryOpen(!isMemoryOpen)}
            />
          )}

          {/* Panel de visualización */}
          <VisualizerPanel
            currentStep={playback.currentStep}
            stepIndex={playback.currentStepIndex}
            totalSteps={playback.totalSteps}
            isFullscreen={isVisualizerFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            algorithmFamily={isCustomAST ? customCategory : selectedAlgorithm.family}
            algorithmId={selectedAlgorithm.id}
          />
        </div>
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

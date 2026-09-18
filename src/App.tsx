import { useState, useMemo } from 'react';
import { ALGORITHMS_CATALOG } from './core/algorithms/registry';
import type { AlgorithmMetadata } from './types/algorithm';
import { generateBubbleSortTrace } from './core/algorithms/bubbleSort';
import { generateRandomDataset } from './core/utils/generator';
import { usePlayback } from './hooks/usePlayback';
import { useKeyboard } from './hooks/useKeyboard';
import { Navbar } from './components/layout/Navbar';
import { PseudocodePanel } from './components/pseudocode/PseudocodePanel';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { VisualizerPanel } from './components/visualization/VisualizerPanel';
import { PlaybackFooter } from './components/controls/PlaybackFooter';

export function App() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmMetadata>(
    ALGORITHMS_CATALOG[0]
  );

  const [dataset, setDataset] = useState<number[]>([
    12, 23, 67, 12, 56, 11, 45, 23, 78, 56, 78, 89, 98, 45
  ]);

  const steps = useMemo(() => {
    if (selectedAlgorithm.id === 'bubble-sort') {
      return generateBubbleSortTrace(dataset);
    }
    return generateBubbleSortTrace(dataset);
  }, [dataset, selectedAlgorithm]);

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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#111217] text-slate-100 overflow-hidden font-sans">
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
      />

      <main className="flex-1 flex min-h-0 overflow-hidden">
        <PseudocodePanel
          algorithm={selectedAlgorithm}
          currentStep={playback.currentStep}
          stepIndex={playback.currentStepIndex}
          totalSteps={playback.totalSteps}
        />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MemoryPanel currentStep={playback.currentStep} />

          <VisualizerPanel
            currentStep={playback.currentStep}
            stepIndex={playback.currentStepIndex}
            totalSteps={playback.totalSteps}
          />
        </div>
      </main>

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

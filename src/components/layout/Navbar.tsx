import React, { useState } from 'react';
import { ALGORITHMS_CATALOG } from '../../core/algorithms/registry';
import type { AlgorithmMetadata } from '../../types/algorithm';
import { ChevronDown, Sparkles, Settings, Sliders, Layers, Code2, Cpu, BarChart3 } from 'lucide-react';
import { DatasetModal } from './DatasetModal';

interface NavbarProps {
  selectedAlgorithm: AlgorithmMetadata;
  onSelectAlgorithm: (algo: AlgorithmMetadata) => void;
  datasetSize: number;
  onChangeDatasetSize: (size: number) => void;
  onGenerateRandom: () => void;
  onApplyCustomDataset: (data: number[]) => void;
  currentDataset: number[];
  isPseudocodeOpen: boolean;
  onTogglePseudocode: () => void;
  isMemoryOpen: boolean;
  onToggleMemory: () => void;
  isVisualizerFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedAlgorithm,
  onSelectAlgorithm,
  datasetSize,
  onChangeDatasetSize,
  onGenerateRandom,
  onApplyCustomDataset,
  currentDataset,
  isPseudocodeOpen,
  onTogglePseudocode,
  isMemoryOpen,
  onToggleMemory,
  isVisualizerFullscreen,
  onToggleFullscreen,
}) => {
  const [isAlgoMenuOpen, setIsAlgoMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const families = [
    { key: 'sorting', label: 'Algoritmos de Ordenamiento' },
    { key: 'searching', label: 'Algoritmos de Búsqueda' },
    { key: 'divide_and_conquer', label: 'Divide y Vencerás' },
  ];

  return (
    <>
      <header className="h-14 bg-[#14151e] border-b border-[#232532] px-4 flex items-center justify-between shrink-0 select-none z-30">
        {/* Left: Brand logo & Algorithm Selector & Dataset controls */}
        <div className="flex items-center gap-3 xl:gap-4">
          {/* Logo badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black text-sm tracking-tight">
              <span>Lk</span>
            </div>
            <span className="text-slate-300 font-semibold text-xs hidden lg:inline-block">
              Algoritmia & ED
            </span>
          </div>

          <div className="h-5 w-[1px] bg-[#2d2f3f]" />

          {/* Algorithm dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsAlgoMenuOpen(!isAlgoMenuOpen)}
              className="flex items-center gap-2 bg-[#1c1d29] hover:bg-[#252738] border border-[#2e3146] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{selectedAlgorithm.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAlgoMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAlgoMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAlgoMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 bg-[#1c1d29] border border-[#2e3146] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {families.map((fam) => {
                    const algos = ALGORITHMS_CATALOG.filter(a => a.family === fam.key);
                    return (
                      <div key={fam.key} className="px-1 py-1">
                        <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                          {fam.label}
                        </div>
                        {algos.map((algo) => {
                          const isSelected = algo.id === selectedAlgorithm.id;
                          return (
                            <button
                              key={algo.id}
                              onClick={() => {
                                onSelectAlgorithm(algo);
                                setIsAlgoMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600/30 text-indigo-300 font-bold'
                                  : 'text-slate-300 hover:bg-[#25273a] hover:text-white'
                              }`}
                            >
                              <span>{algo.name}</span>
                              {algo.id === 'bubble-sort' && (
                                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono">
                                  Activo
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Dataset size slider */}
          <div className="flex items-center gap-2.5 bg-[#171824] border border-[#26283a] px-3 py-1 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">Dataset</span>
            <input
              type="range"
              min={5}
              max={25}
              value={datasetSize}
              onChange={(e) => onChangeDatasetSize(Number(e.target.value))}
              className="w-20 h-1.5 bg-[#2a2c3f] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono font-bold text-amber-300 w-5 text-center">
              {datasetSize}
            </span>
          </div>

          {/* New dataset button */}
          <button
            onClick={onGenerateRandom}
            className="flex items-center gap-1.5 bg-[#202232] hover:bg-[#292c42] border border-[#353850] text-indigo-300 hover:text-indigo-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
            title="Generar nuevo arreglo aleatorio"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nuevo Dataset</span>
          </button>

          {/* Custom dataset modal trigger */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#1a1b28] hover:bg-[#232537] border border-[#2b2e42] text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Ingresar valores personalizados"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Personalizar</span>
          </button>
        </div>

        {/* Right: Quick Panel Visibility Toggles & Profile */}
        <div className="flex items-center gap-3">
          {/* Panel Visibility Buttons */}
          <div className="flex items-center bg-[#171824] border border-[#26283a] p-0.5 rounded-lg">
            <button
              onClick={onTogglePseudocode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                isPseudocodeOpen
                  ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mostrar / Ocultar panel de Código"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Código</span>
            </button>

            <button
              onClick={onToggleMemory}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                isMemoryOpen
                  ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mostrar / Ocultar panel de Memoria"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Memoria</span>
            </button>

            <button
              onClick={onToggleFullscreen}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                isVisualizerFullscreen
                  ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Maximizar Gráfico D3"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Gráfico</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#202232] rounded-lg transition-colors cursor-pointer"
            title="Opciones"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Student Profile avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1.5px] cursor-pointer shadow-md">
            <div className="w-full h-full rounded-full bg-[#171821] flex items-center justify-center overflow-hidden">
              <span className="text-[11px] font-bold text-indigo-300">EST</span>
            </div>
          </div>
        </div>
      </header>

      <DatasetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApplyDataset={onApplyCustomDataset}
        currentDataset={currentDataset}
      />
    </>
  );
};

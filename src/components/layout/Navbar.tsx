import React, { useState } from 'react';
import { ALGORITHMS_CATALOG } from '../../core/algorithms/registry';
import type { AlgorithmMetadata } from '../../types/algorithm';
import { ChevronDown, Sparkles, Settings, Sliders, Layers } from 'lucide-react';
import { DatasetModal } from './DatasetModal';

interface NavbarProps {
  selectedAlgorithm: AlgorithmMetadata;
  onSelectAlgorithm: (algo: AlgorithmMetadata) => void;
  datasetSize: number;
  onChangeDatasetSize: (size: number) => void;
  onGenerateRandom: () => void;
  onApplyCustomDataset: (data: number[]) => void;
  currentDataset: number[];
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedAlgorithm,
  onSelectAlgorithm,
  datasetSize,
  onChangeDatasetSize,
  onGenerateRandom,
  onApplyCustomDataset,
  currentDataset,
}) => {
  const [isAlgoMenuOpen, setIsAlgoMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const families = [
    { key: 'sorting', label: 'Ordenamiento' },
    { key: 'searching', label: 'Búsqueda' },
    { key: 'divide_and_conquer', label: 'Divide y Vencerás' },
  ];

  return (
    <>
      <header className="h-14 bg-[#14151e] border-b border-[#232532] px-4 flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-bold text-sm tracking-tighter">
              <span className="font-mono font-black">Lk</span>
            </div>
            <span className="text-slate-400 font-medium text-xs hidden lg:inline-block">
              Algoritmia & ED
            </span>
          </div>

          <div className="h-5 w-[1px] bg-[#2d2f3f]" />

          <div className="relative">
            <button
              onClick={() => setIsAlgoMenuOpen(!isAlgoMenuOpen)}
              className="flex items-center gap-2.5 bg-[#1c1d28] hover:bg-[#242636] border border-[#2d2f3f] px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedAlgorithm.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAlgoMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAlgoMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAlgoMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-60 bg-[#1c1d28] border border-[#2d2f3f] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {families.map((fam) => {
                    const algos = ALGORITHMS_CATALOG.filter(a => a.family === fam.key);
                    return (
                      <div key={fam.key} className="px-1 py-1">
                        <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
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
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                                  : 'text-slate-300 hover:bg-[#252737] hover:text-white'
                              }`}
                            >
                              <span>{algo.name}</span>
                              {algo.id === 'bubble-sort' && (
                                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded">
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

          <div className="flex items-center gap-2.5 bg-[#181923] border border-[#262837] px-3 py-1 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">Dataset</span>
            <input
              type="range"
              min={5}
              max={25}
              value={datasetSize}
              onChange={(e) => onChangeDatasetSize(Number(e.target.value))}
              className="w-20 h-1.5 bg-[#2a2c3d] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono font-semibold text-slate-200 w-4 text-center">
              {datasetSize}
            </span>
          </div>

          <button
            onClick={onGenerateRandom}
            className="flex items-center gap-1.5 bg-[#202130] hover:bg-[#292a3e] border border-[#34374b] text-indigo-300 hover:text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
            title="Generar nuevo arreglo aleatorio"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nuevo Dataset</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#1a1b26] hover:bg-[#232535] border border-[#2b2d3e] text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Ingresar valores personalizados"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Personalizar</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#202130] rounded-lg transition-colors cursor-pointer"
            title="Opciones"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1.5px] cursor-pointer">
            <div className="w-full h-full rounded-full bg-[#171821] flex items-center justify-center overflow-hidden">
              <span className="text-[10px] font-bold text-indigo-300">EST</span>
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

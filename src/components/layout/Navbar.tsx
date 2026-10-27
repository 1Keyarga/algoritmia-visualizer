import React, { useState, useRef, useEffect } from 'react';
import { ALGORITHMS_CATALOG, CUSTOM_AST_METADATA } from '../../core/algorithms/registry';
import type { AlgorithmMetadata } from '../../types/algorithm';
import { ChevronDown, Sparkles, Sliders, Layers, User, Code2 } from 'lucide-react';
import { DatasetModal } from './DatasetModal';

interface NavbarProps {
  selectedAlgorithm: AlgorithmMetadata;
  onSelectAlgorithm: (algo: AlgorithmMetadata) => void;
  datasetSize: number;
  onChangeDatasetSize: (size: number) => void;
  onGenerateRandom: () => void;
  onApplyCustomDataset: (data: number[]) => void;
  currentDataset: number[];
  searchTarget?: number;
  onChangeSearchTarget?: (target: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedAlgorithm,
  onSelectAlgorithm,
  datasetSize,
  onChangeDatasetSize,
  onGenerateRandom,
  onApplyCustomDataset,
  currentDataset,
  searchTarget,
  onChangeSearchTarget,
}) => {
  const [isAlgoMenuOpen, setIsAlgoMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Calcula la posición del menú desplegable respecto al botón selector
  useEffect(() => {
    if (isAlgoMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isAlgoMenuOpen]);

  const families = [
    { key: 'sorting', label: 'Algoritmos de Ordenamiento' },
    { key: 'searching', label: 'Algoritmos de Búsqueda' },
    { key: 'divide_and_conquer', label: 'Divide y Vencerás' },
    { key: 'custom', label: 'Código del Estudiante' },
  ];

  const isBubbleSort = selectedAlgorithm.id.startsWith('bubble-sort');
  const isOptimizedBubble = selectedAlgorithm.id === 'bubble-sort';

  const handleToggleBubbleVariant = (targetOptimized: boolean) => {
    const targetId = targetOptimized ? 'bubble-sort' : 'bubble-sort-classic';
    const targetAlgo = ALGORITHMS_CATALOG.find(a => a.id === targetId);
    if (targetAlgo) {
      onSelectAlgorithm(targetAlgo);
    }
  };

  return (
    <>
      <header className="h-14 bg-[#14151e] border-b border-[#232532] px-3 flex items-center justify-between shrink-0 select-none">
        {/* Zona izquierda: Logo, selector de algoritmo y controles del dataset */}
        <div className="flex items-center gap-2 lg:gap-3 overflow-hidden">
          {/* Logotipo del curso */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black text-xs tracking-tight">
              <span>Lk</span>
            </div>
            <span className="text-slate-300 font-semibold text-[11px] hidden xl:inline-block">
              Algoritmia & ED
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#2d2f3f] shrink-0 hidden sm:block" />

          {/* Algorithm dropdown */}
          <div className="relative shrink-0 z-50">
            <button
              ref={buttonRef}
              onClick={() => setIsAlgoMenuOpen(!isAlgoMenuOpen)}
              className="flex items-center gap-1.5 bg-[#1c1d29] hover:bg-[#252738] border border-[#2e3146] px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[140px] md:max-w-[160px]">{selectedAlgorithm.name}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isAlgoMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAlgoMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[40]"
                  onClick={() => setIsAlgoMenuOpen(false)}
                />
                <div
                  className="fixed w-64 bg-[#1c1d29] border border-[#2e3146] rounded-xl shadow-2xl py-2 z-[50] animate-in fade-in zoom-in-95 duration-100 max-h-[70vh] overflow-y-auto custom-scrollbar"
                  style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                >
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
                              {algo.id.startsWith('bubble-sort') && (
                                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono">
                                  {algo.id === 'bubble-sort' ? 'O(n)' : 'O(n²)'}
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

          {/* Quick Variant Toggle for Bubble Sort: Clásico on left (default), Optimizado on right */}
          {isBubbleSort && (
            <div className="flex items-center bg-[#171824] border border-[#282a3c] p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => handleToggleBubbleVariant(false)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                  !isOptimizedBubble
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Versión clásica: ejecuta todas las pasadas completas"
              >
                Clásico
              </button>

              <button
                onClick={() => handleToggleBubbleVariant(true)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                  isOptimizedBubble
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Versión optimizada: detección temprana por bandera"
              >
                Optimizado
              </button>
            </div>
          )}

          {/* Control deslizante de tamaño del arreglo */}
          <div className="flex items-center gap-1.5 bg-[#171824] border border-[#26283a] px-2 py-1 rounded-lg shrink-0 hidden md:flex">
            <span className="text-[10px] text-slate-400 font-medium hidden lg:inline">Dataset</span>
            <input
              type="range"
              min={5}
              max={25}
              value={datasetSize}
              onChange={(e) => onChangeDatasetSize(Number(e.target.value))}
              className="w-14 lg:w-16 h-1.5 bg-[#2a2c3f] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[11px] font-mono font-bold text-amber-300 w-4 text-center">
              {datasetSize}
            </span>
          </div>

          {/* Input para valor a buscar (solo en algoritmos de búsqueda) */}
          {selectedAlgorithm.family === 'searching' && (
            <div className="flex items-center gap-1.5 bg-[#171824] border border-[#26283a] px-2 py-1 rounded-lg shrink-0">
              <span className="text-[10px] text-slate-400 font-medium hidden lg:inline">Buscar:</span>
              <input
                type="number"
                value={searchTarget || ''}
                onChange={(e) => onChangeSearchTarget?.(Number(e.target.value))}
                className="w-16 lg:w-20 h-5 bg-[#2a2c3f] border border-[#3e4156] rounded px-2 text-[11px] font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                placeholder="valor"
              />
            </div>
          )}

          {/* Botón para generar nuevo dataset aleatorio */}
          <button
            onClick={onGenerateRandom}
            className="flex items-center gap-1 bg-[#202232] hover:bg-[#292c42] border border-[#353850] text-indigo-300 hover:text-indigo-100 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors shadow-xs cursor-pointer shrink-0"
            title="Generar nuevo arreglo aleatorio"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>

          {/* Botón para abrir el modal de personalización */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 bg-[#1a1b28] hover:bg-[#232537] border border-[#2b2e42] text-slate-300 hover:text-white px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0"
            title="Ingresar valores personalizados"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden lg:inline">Personalizar</span>
          </button>

          {/* Acceso directo a Mi Código (Editor del Estudiante) */}
          <button
            onClick={() => onSelectAlgorithm(CUSTOM_AST_METADATA)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border ${
              selectedAlgorithm.id === 'custom-ast'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30'
                : 'bg-[#1b1d2e] hover:bg-[#24283f] text-indigo-300 border-[#323654]'
            }`}
            title="Abrir Editor de Código del Estudiante"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mi Código</span>
          </button>
        </div>

        {/* Zona derecha: Perfil de usuario */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#1e2030] border border-[#353850] flex items-center justify-center text-indigo-300 shadow-xs" title="Perfil de usuario">
            <User className="w-3.5 h-3.5" />
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

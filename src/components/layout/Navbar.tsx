import React, { useState, useRef, useEffect } from 'react';
import { ALGORITHMS_CATALOG } from '../../core/algorithms/registry';
import type { AlgorithmMetadata } from '../../types/algorithm';
import type { AppModule } from './HomeHub';
import {
  ChevronDown,
  Shuffle,
  Sliders,
  Layers,
  Code2,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { DatasetModal } from './DatasetModal';

interface NavbarProps {
  activeModule: Exclude<AppModule, 'home'>;
  onBackToHome: () => void;
  selectedAlgorithm: AlgorithmMetadata;
  onSelectAlgorithm: (algo: AlgorithmMetadata) => void;
  datasetSize: number;
  onChangeDatasetSize: (size: number) => void;
  onGenerateRandom: () => void;
  onApplyCustomDataset: (data: number[]) => void;
  currentDataset: number[];
  searchTarget?: number;
  onChangeSearchTarget?: (target: number) => void;
  completedTasksCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onBackToHome,
  selectedAlgorithm,
  onSelectAlgorithm,
  datasetSize,
  onChangeDatasetSize,
  onGenerateRandom,
  onApplyCustomDataset,
  currentDataset,
  searchTarget,
  onChangeSearchTarget,
  completedTasksCount = 0,
}) => {
  const [isAlgoMenuOpen, setIsAlgoMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
      <header className="h-13 bg-[#12141f] border-b border-[#212436] px-3.5 flex items-center justify-between shrink-0 select-none">
        {/* Zona izquierda: Retorno a Módulos y barra de herramientas del módulo activo */}
        <div className="flex items-center gap-2 lg:gap-3 overflow-hidden">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191b2a] hover:bg-[#222538] border border-[#2b2f46] text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
            title="Volver a la pantalla principal de módulos"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Módulos</span>
          </button>

          <div className="h-4 w-[1px] bg-[#26293d] shrink-0" />

          {/* MÓDULO 1: CATÁLOGO DE ALGORITMOS */}
          {activeModule === 'algorithms' && (
            <>
              <div className="relative shrink-0 z-50">
                <button
                  ref={buttonRef}
                  onClick={() => setIsAlgoMenuOpen(!isAlgoMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer border bg-[#191b2a] hover:bg-[#222538] border-[#313652] text-slate-100"
                >
                  <Layers className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                  <span className="truncate max-w-[140px] sm:max-w-[180px] md:max-w-[210px]">
                    {selectedAlgorithm.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                      isAlgoMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isAlgoMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[40]"
                      onClick={() => setIsAlgoMenuOpen(false)}
                    />
                    <div
                      className="fixed w-72 bg-[#181a28] border border-[#2c3048] rounded-lg shadow-2xl py-1.5 z-[50] max-h-[75vh] overflow-y-auto custom-scrollbar"
                      style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
                    >
                      {families.map(fam => {
                        const algos = ALGORITHMS_CATALOG.filter(a => a.family === fam.key);
                        return (
                          <div key={fam.key} className="px-1.5 py-1">
                            <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              {fam.label}
                            </div>
                            {algos.map(algo => {
                              const isSelected = algo.id === selectedAlgorithm.id;
                              const badgeComplexity =
                                algo.id === 'bubble-sort' ? 'O(n)' : algo.complexity.time;

                              return (
                                <button
                                  key={algo.id}
                                  onClick={() => {
                                    onSelectAlgorithm(algo);
                                    setIsAlgoMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600/25 text-indigo-200 font-semibold'
                                      : 'text-slate-300 hover:bg-[#22253a] hover:text-white'
                                  }`}
                                >
                                  <span className="truncate">{algo.name}</span>
                                  <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono shrink-0">
                                    {badgeComplexity}
                                  </span>
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

              {isBubbleSort && (
                <div className="flex items-center bg-[#161826] border border-[#26293e] p-0.5 rounded-md shrink-0">
                  <button
                    onClick={() => handleToggleBubbleVariant(false)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      !isOptimizedBubble
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Clásico
                  </button>

                  <button
                    onClick={() => handleToggleBubbleVariant(true)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                      isOptimizedBubble
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Optimizado
                  </button>
                </div>
              )}

              {/* Control deslizante de tamaño del arreglo */}
              <div className="flex items-center gap-2 bg-[#161826] border border-[#26293e] px-2.5 py-1 rounded-md shrink-0 hidden md:flex">
                <span className="text-[11px] text-slate-400 font-medium hidden lg:inline">
                  Tamaño
                </span>
                <input
                  type="range"
                  min={5}
                  max={25}
                  value={datasetSize}
                  onChange={e => onChangeDatasetSize(Number(e.target.value))}
                  className="w-14 lg:w-16 h-1 bg-[#2a2d42] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[11px] font-mono font-bold text-slate-200 w-4 text-center">
                  {datasetSize}
                </span>
              </div>

              {/* Input para valor a buscar */}
              {selectedAlgorithm.family === 'searching' && (
                <div className="flex items-center gap-1.5 bg-[#161826] border border-[#26293e] px-2.5 py-1 rounded-md shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium hidden lg:inline">
                    Objetivo:
                  </span>
                  <input
                    type="number"
                    value={searchTarget || ''}
                    onChange={e => onChangeSearchTarget?.(Number(e.target.value))}
                    className="w-14 lg:w-16 h-5 bg-[#222538] border border-[#353954] rounded px-1.5 text-[11px] font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                    placeholder="valor"
                  />
                </div>
              )}

              {/* Generar nuevo arreglo aleatorio */}
              <button
                onClick={onGenerateRandom}
                className="flex items-center gap-1.5 bg-[#191b2a] hover:bg-[#222538] border border-[#2b2f46] text-slate-200 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
                title="Generar nuevo arreglo aleatorio"
              >
                <Shuffle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Aleatorio</span>
              </button>

              {/* Personalizar valores */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#191b2a] hover:bg-[#222538] border border-[#2b2f46] text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
                title="Ingresar valores personalizados"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="hidden lg:inline">Editar datos</span>
              </button>
            </>
          )}

          {/* MÓDULO 2: CÓDIGO DEL ESTUDIANTE */}
          {activeModule === 'student_code' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191b2a] border border-[#2c3048] text-slate-200 text-xs font-semibold">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Código del Estudiante</span>
              </div>
              <span className="hidden md:inline text-xs text-slate-400">
                Análisis e instrumentación AST (C / JavaScript)
              </span>
            </div>
          )}

          {/* MÓDULO 3: TAREAS INTERACTIVAS GUIADAS */}
          {activeModule === 'guided_tasks' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191b2a] border border-[#2c3048] text-slate-200 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tareas Interactivas Guiadas</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#162326] text-emerald-400 border border-emerald-800/60">
                {completedTasksCount} / 21 resueltas
              </span>
              <span className="hidden lg:inline text-xs text-slate-400">
                — {selectedAlgorithm.name}
              </span>
            </div>
          )}
        </div>

        {/* Zona derecha: Resumen técnico de complejidad del algoritmo activo */}
        {activeModule !== 'student_code' && (
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono shrink-0">
            <span className="px-2 py-0.5 rounded bg-[#181a28] border border-[#282c42] text-slate-300">
              Tiempo: <strong className="text-indigo-300">{selectedAlgorithm.complexity.time}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#181a28] border border-[#282c42] text-slate-300">
              Espacio: <strong className="text-emerald-400">{selectedAlgorithm.complexity.space}</strong>
            </span>
          </div>
        )}
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

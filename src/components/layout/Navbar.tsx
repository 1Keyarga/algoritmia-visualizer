import React, { useState, useRef, useEffect } from 'react';
import { ALGORITHMS_CATALOG } from '../../core/algorithms/registry';
import type { AlgorithmMetadata } from '../../types/algorithm';
import { TrazarithmMark, type AppModule } from './HomeHub';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { DatasetModal } from './DatasetModal';
import type { ThemeMode } from '../../core/utils/themeMode';

interface NavbarProps {
  activeModule: Exclude<AppModule, 'home'>;
  onNavigateModule: (module: AppModule) => void;
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
  isComparing?: boolean;
  onToggleComparison?: () => void;
  onShareLink?: () => void;
  activeParticipantId?: string | null;
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onNavigateModule,
  selectedAlgorithm,
  onSelectAlgorithm,
  datasetSize,
  onChangeDatasetSize,
  onGenerateRandom,
  onApplyCustomDataset,
  currentDataset,
  searchTarget,
  onChangeSearchTarget,
  completedTasksCount: _completedTasksCount = 0,
  isComparing = false,
  onToggleComparison,
  onShareLink,
  activeParticipantId = null,
  themeMode = 'dark',
  onToggleThemeMode,
}) => {
  const [isAlgoMenuOpen, setIsAlgoMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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
    { key: 'sorting', label: 'Ordenamiento' },
    { key: 'searching', label: 'Búsqueda' },
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
      <header className="h-12 bg-[#11131e] border-b border-[#1f2233] px-4 flex items-center justify-between gap-3 shrink-0 select-none z-30">
        {/* Navegación principal */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateModule('home')}
            className="flex items-center gap-2 text-sm font-bold tracking-tight text-white hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <TrazarithmMark className="w-5 h-5 shrink-0" />
            <span>Trazarithm</span>
          </button>

          <div className="h-4 w-[1px] bg-[#24283d] shrink-0" />

          <nav className="flex items-center bg-[#161826] border border-[#24283e] p-0.5 rounded-lg">
            <button
              onClick={() => onNavigateModule('algorithms')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModule === 'algorithms'
                  ? 'bg-[#232741] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Catálogo
            </button>

            <button
              onClick={() => onNavigateModule('student_code')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModule === 'student_code'
                  ? 'bg-[#232741] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Código
            </button>

            <button
              onClick={() => onNavigateModule('guided_tasks')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModule === 'guided_tasks'
                  ? 'bg-[#232741] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tareas
            </button>

            <button
              onClick={() => onNavigateModule('evaluation')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModule === 'evaluation'
                  ? 'bg-[#232741] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeParticipantId
                    ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.85)]'
                    : 'bg-slate-500'
                }`}
              />
              <span>{activeParticipantId ? activeParticipantId : 'Evaluación'}</span>
            </button>
          </nav>
        </div>

        {/* Controles del algoritmo activo (solo en Catálogo) */}
        {activeModule === 'algorithms' && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="relative shrink-0 z-50">
              <button
                ref={buttonRef}
                onClick={() => setIsAlgoMenuOpen(!isAlgoMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer border bg-[#191b2a] hover:bg-[#222538] border-[#2e3452] text-slate-100"
              >
                <span className="truncate max-w-[160px] sm:max-w-[200px]">
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
                          <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
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
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
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

            {onToggleComparison && (
              <button
                onClick={onToggleComparison}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  isComparing
                    ? 'bg-indigo-600/25 border-indigo-500/60 text-indigo-200 font-semibold'
                    : 'bg-[#191b2a] hover:bg-[#222538] border-[#2b2f46] text-slate-300 hover:text-white'
                }`}
              >
                Comparar
              </button>
            )}

            <div className="flex items-center gap-2 bg-[#161826] border border-[#26293e] px-2.5 py-1 rounded-md shrink-0 hidden xl:flex">
              <span className="text-[11px] text-slate-400">N</span>
              <input
                type="range"
                min={5}
                max={25}
                value={datasetSize}
                onChange={e => onChangeDatasetSize(Number(e.target.value))}
                className="w-14 h-1 bg-[#2a2d42] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[11px] font-mono text-slate-200 w-4 text-center">
                {datasetSize}
              </span>
            </div>

            {selectedAlgorithm.family === 'searching' && (
              <div className="flex items-center gap-1.5 bg-[#161826] border border-[#26293e] px-2.5 py-1 rounded-md shrink-0">
                <span className="text-[11px] text-slate-400 hidden lg:inline">Buscar:</span>
                <input
                  type="number"
                  value={searchTarget || ''}
                  onChange={e => onChangeSearchTarget?.(Number(e.target.value))}
                  className="w-12 h-5 bg-[#222538] border border-[#353954] rounded px-1.5 text-[11px] font-mono text-amber-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              onClick={onGenerateRandom}
              className="bg-[#191b2a] hover:bg-[#222538] border border-[#2b2f46] text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              Aleatorio
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#191b2a] hover:bg-[#222538] border border-[#2b2f46] text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              Datos
            </button>

            {onShareLink && (
              <button
                onClick={() => {
                  onShareLink();
                  setLinkCopied(true);
                  window.setTimeout(() => setLinkCopied(false), 2000);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  linkCopied
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                    : 'bg-[#191b2a] hover:bg-[#222538] border-[#2b2f46] text-slate-300 hover:text-white'
                }`}
              >
                {linkCopied ? 'Copiado' : 'Compartir'}
              </button>
            )}

            {onToggleThemeMode && (
              <button
                type="button"
                onClick={onToggleThemeMode}
                aria-pressed={themeMode === 'light'}
                title={themeMode === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                className="flex items-center gap-1.5 bg-[#191b2a] hover:bg-[#222538] border border-[#2b2f46] text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                {themeMode === 'light' ? (
                  <>
                    <Moon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                    <span>Oscuro</span>
                  </>
                ) : (
                  <>
                    <Sun aria-hidden="true" className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Claro</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {activeModule !== 'algorithms' && onToggleThemeMode && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleThemeMode}
              aria-pressed={themeMode === 'light'}
              title={themeMode === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
              className="flex items-center gap-1.5 bg-[#191b2a] hover:bg-[#222538] border border-[#2b2f46] text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              {themeMode === 'light' ? (
                <>
                  <Moon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                  <span>Oscuro</span>
                </>
              ) : (
                <>
                  <Sun aria-hidden="true" className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Claro</span>
                </>
              )}
            </button>
          </div>
        )}
      </header>

      <DatasetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApplyDataset={onApplyCustomDataset}
        currentDataset={currentDataset}
        isBinarySearch={selectedAlgorithm.id === 'binary-search'}
      />
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { ALGORITHMS_CATALOG } from '../../core/algorithms/registry';
import type { AlgorithmMetadata } from '../../types/algorithm';

export type AppModule =
  | 'home'
  | 'algorithms'
  | 'student_code'
  | 'guided_tasks'
  | 'evaluation';

interface HomeHubProps {
  onEnterAlgorithmsModule: (initialAlgo?: AlgorithmMetadata) => void;
  onEnterStudentCodeModule: () => void;
  onEnterGuidedTasksModule: () => void;
  onEnterEvaluationModule: () => void;
  completedTasksCount: number;
  activeParticipantId?: string | null;
}

interface PreviewFrame {
  bars: number[];
  activeIdx: number;
  compareIdx: number;
  caption: string;
  stepLabel: string;
}

const HERO_PREVIEW_FRAMES: PreviewFrame[] = [
  {
    bars: [36, 74, 28, 86, 52, 64],
    activeIdx: 2,
    compareIdx: 1,
    caption: 'Comparando arr[2] con arr[1]',
    stepLabel: 'Paso 14 / 72',
  },
  {
    bars: [36, 28, 74, 86, 52, 64],
    activeIdx: 1,
    compareIdx: 0,
    caption: 'Comparando arr[1] con arr[0]',
    stepLabel: 'Paso 15 / 72',
  },
  {
    bars: [28, 36, 74, 86, 52, 64],
    activeIdx: 0,
    compareIdx: -1,
    caption: 'Insertando clave 28 en posición 0',
    stepLabel: 'Paso 16 / 72',
  },
  {
    bars: [28, 36, 74, 86, 52, 64],
    activeIdx: 4,
    compareIdx: 3,
    caption: 'Comparando arr[4] con arr[3]',
    stepLabel: 'Paso 22 / 72',
  },
  {
    bars: [28, 36, 52, 74, 86, 64],
    activeIdx: 2,
    compareIdx: 1,
    caption: 'Insertando clave 52 en posición 2',
    stepLabel: 'Paso 25 / 72',
  },
];

export const TrazarithmMark: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect
      x="1.5"
      y="1.5"
      width="21"
      height="21"
      rx="5.5"
      fill="#15182b"
      stroke="#4f46e5"
      strokeOpacity="0.65"
      strokeWidth="1.25"
    />
    <rect x="5.5" y="13" width="2.6" height="5.5" rx="0.9" fill="#6366f1" />
    <rect x="9.3" y="9" width="2.6" height="9.5" rx="0.9" fill="#818cf8" />
    <rect x="13.1" y="11" width="2.6" height="7.5" rx="0.9" fill="#fbbf24" />
    <rect x="16.9" y="6" width="2.6" height="12.5" rx="0.9" fill="#34d399" />
  </svg>
);

export const HomeHub: React.FC<HomeHubProps> = ({
  onEnterAlgorithmsModule,
  onEnterStudentCodeModule,
  onEnterGuidedTasksModule,
  onEnterEvaluationModule,
  completedTasksCount,
  activeParticipantId = null,
}) => {
  const [frameIdx, setFrameIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % HERO_PREVIEW_FRAMES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentFrame = HERO_PREVIEW_FRAMES[frameIdx];
  const uniqueCatalogAlgorithms = ALGORITHMS_CATALOG.filter(
    algo => algo.id !== 'bubble-sort-classic'
  );
  const insertionAlgo = ALGORITHMS_CATALOG.find(a => a.id === 'insertion-sort');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0e16] text-slate-100 overflow-y-auto custom-scrollbar font-sans">
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-7 flex flex-col justify-center gap-8">
        <header className="flex items-center justify-between border-b border-[#1c2032] pb-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <TrazarithmMark className="w-7 h-7 shrink-0" />
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="text-base font-bold tracking-tight text-white">Trazarithm</span>
              <span className="hidden sm:inline text-xs text-slate-400 truncate">
                Visualizador interactivo de algoritmos
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onEnterEvaluationModule}
            className="min-h-9 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141726] hover:bg-[#1c2035] border border-[#282d46] hover:border-[#3c4469] text-xs font-medium text-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full ${
                activeParticipantId
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {activeParticipantId ? `Evaluación (${activeParticipantId})` : 'Evaluación'}
            </span>
          </button>
        </header>

        <main className="flex flex-col gap-8">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-white">
                Entiende algoritmos{' '}
                <span className="text-indigo-400">mientras se ejecutan.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                Observa el estado del arreglo y las variables en tiempo real, o prueba tu propio código.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onEnterAlgorithmsModule()}
                  className="min-h-10 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Explorar catálogo
                </button>

                <button
                  type="button"
                  onClick={onEnterGuidedTasksModule}
                  className="min-h-10 px-4 py-2.5 rounded-lg bg-[#141726] hover:bg-[#1c2136] border border-[#2b314d] text-slate-200 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  Tareas guiadas ({completedTasksCount}/21)
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <article className="bg-[#121524] border border-[#242942] hover:border-indigo-500/45 rounded-xl p-5 transition-colors">
                <header className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-100">Insertion Sort</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentFrame.stepLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaused(prev => !prev)}
                    aria-label={isPaused ? 'Reanudar vista previa' : 'Pausar vista previa'}
                    className="min-h-7 px-2 py-1 rounded-md bg-[#181c30] hover:bg-[#212742] border border-[#2c3352] text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPaused ? (
                      <>
                        <Play aria-hidden="true" className="w-3 h-3" />
                        <span>Reanudar</span>
                      </>
                    ) : (
                      <>
                        <Pause aria-hidden="true" className="w-3 h-3" />
                        <span>Pausar</span>
                      </>
                    )}
                  </button>
                </header>

                <button
                  type="button"
                  onClick={() => onEnterAlgorithmsModule(insertionAlgo)}
                  aria-label="Abrir Insertion Sort en el visualizador"
                  className="group w-full text-left rounded-lg focus-visible:outline-2 cursor-pointer"
                >
                  <div className="relative h-44 flex items-end justify-between gap-3 sm:gap-4 px-2 pt-6 pb-2 border-b border-[#222842]">
                    {currentFrame.bars.map((val, idx) => {
                      const isActive = idx === currentFrame.activeIdx;
                      const isComparing = idx === currentFrame.compareIdx;

                      return (
                        <div
                          key={idx}
                          className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
                        >
                          <span
                            className={`text-[10px] font-mono ${
                              isActive
                                ? 'text-amber-300 font-semibold'
                                : isComparing
                                ? 'text-indigo-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {val}
                          </span>
                          <div
                            style={{ height: `${Math.round(val * 0.82)}%` }}
                            className={`w-full rounded-t motion-safe:transition-all motion-safe:duration-500 ${
                              isActive
                                ? 'bg-amber-400'
                                : isComparing
                                ? 'bg-indigo-400'
                                : 'bg-indigo-600/85'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-slate-300 truncate">{currentFrame.caption}</span>
                    <span className="text-indigo-300 group-hover:text-indigo-200 flex items-center gap-1 shrink-0 font-sans font-medium">
                      <span>Probar</span>
                      <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              </article>
            </div>
          </section>

          <div className="border-t border-[#1c2032]" />

          <section
            aria-label="Módulos principales"
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            <article className="workspace-card bg-[#121524] border border-[#242942] hover:border-[#343c5e] rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <header className="workspace-card__header">
                  <h2 className="text-sm font-bold text-slate-100">Catálogo de Algoritmos</h2>
                  <span className="text-[11px] font-mono text-slate-300">
                    {uniqueCatalogAlgorithms.length} algoritmos
                  </span>
                </header>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Ordenamiento, búsqueda y divide y vencerás con código sincronizado, variables y modo de comparación.
                </p>

                <ul
                  role="list"
                  className="flex flex-wrap gap-1.5 pt-2.5 border-t border-[#1e2338] list-none m-0 p-0"
                >
                  {uniqueCatalogAlgorithms.map(algo => (
                    <li key={algo.id}>
                      <button
                        type="button"
                        onClick={() => onEnterAlgorithmsModule(algo)}
                        className="text-[11px] px-2 py-1 rounded bg-[#181c30] hover:bg-[#222845] border border-[#2a304d] text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        {algo.name.replace(/\s*\(.*\)/, '')}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="workspace-card__footer">
                <button
                  type="button"
                  onClick={() => onEnterAlgorithmsModule()}
                  className="w-full min-h-9 py-2 px-3 rounded-lg bg-[#191e34] hover:bg-indigo-600 text-slate-100 hover:text-white border border-[#2c3354] hover:border-indigo-500 text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  Abrir catálogo
                </button>
              </footer>
            </article>

            <article className="workspace-card bg-[#121524] border border-[#242942] hover:border-[#343c5e] rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <header className="workspace-card__header">
                  <h2 className="text-sm font-bold text-slate-100">Código del Estudiante</h2>
                </header>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Escribe en C o JavaScript para ejecutar línea por línea y ver cómo cambian tus variables y arreglos.
                </p>
              </div>

              <footer className="workspace-card__footer">
                <button
                  type="button"
                  onClick={onEnterStudentCodeModule}
                  className="w-full min-h-9 py-2 px-3 rounded-lg bg-[#191e34] hover:bg-indigo-600 text-slate-100 hover:text-white border border-[#2c3354] hover:border-indigo-500 text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  Abrir editor
                </button>
              </footer>
            </article>

            <article className="workspace-card bg-[#121524] border border-[#242942] hover:border-[#343c5e] rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <header className="workspace-card__header">
                  <h2 className="text-sm font-bold text-slate-100">Tareas Guiadas</h2>
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                    {completedTasksCount}/21
                  </span>
                </header>

                <p className="text-xs text-slate-300 leading-relaxed">
                  21 ejercicios por niveles (Básico, Intermedio y Avanzado) para predecir pasos y programar en C.
                </p>
              </div>

              <footer className="workspace-card__footer">
                <button
                  type="button"
                  onClick={onEnterGuidedTasksModule}
                  className="w-full min-h-9 py-2 px-3 rounded-lg bg-[#191e34] hover:bg-indigo-600 text-slate-100 hover:text-white border border-[#2c3354] hover:border-indigo-500 text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  Abrir tareas
                </button>
              </footer>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
};

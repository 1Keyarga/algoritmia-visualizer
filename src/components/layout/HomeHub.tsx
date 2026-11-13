import React, { useState, useEffect } from 'react';
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

export const HomeHub: React.FC<HomeHubProps> = ({
  onEnterAlgorithmsModule,
  onEnterStudentCodeModule,
  onEnterGuidedTasksModule,
  onEnterEvaluationModule,
  completedTasksCount,
  activeParticipantId = null,
}) => {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % HERO_PREVIEW_FRAMES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const currentFrame = HERO_PREVIEW_FRAMES[frameIdx];
  const uniqueCatalogAlgorithms = ALGORITHMS_CATALOG.filter(
    algo => algo.id !== 'bubble-sort-classic'
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0e16] text-slate-100 overflow-y-auto select-none font-sans">
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-8 flex flex-col justify-between gap-8">
        {/* Cabecera tipográfica sobria (sin logos decorativos) */}
        <div className="flex items-center justify-between border-b border-[#1b1e2e] pb-4">
          <div className="flex items-baseline gap-2.5">
            <span className="text-base font-bold tracking-tight text-white">Visurithm</span>
            <span className="text-xs text-slate-500">
              Visualización interactiva de algoritmos
            </span>
          </div>

          <button
            onClick={onEnterEvaluationModule}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141726] hover:bg-[#1c2033] border border-[#262a40] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeParticipantId
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]'
                  : 'bg-slate-500'
              }`}
            />
            <span>
              {activeParticipantId ? `Evaluación · ${activeParticipantId}` : 'Evaluación'}
            </span>
          </button>
        </div>

        {/* Sección principal */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-white">
              Comprende algoritmos{' '}
              <span className="text-indigo-400">paso a paso.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-md leading-relaxed">
              Inspecciona el estado de la memoria en cada operación, compara estrategias de la misma familia y verifica invariantes sobre ejecuciones reales.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onEnterAlgorithmsModule()}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Explorar catálogo
              </button>

              <button
                onClick={onEnterGuidedTasksModule}
                className="px-4 py-2.5 rounded-lg bg-[#141726] hover:bg-[#1c2033] border border-[#262a40] text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Tareas guiadas ({completedTasksCount}/21)
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div
              onClick={() => {
                const insertion = ALGORITHMS_CATALOG.find(a => a.id === 'insertion-sort');
                onEnterAlgorithmsModule(insertion);
              }}
              className="bg-[#121422] border border-[#22263c] hover:border-indigo-500/50 rounded-xl p-5 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-slate-100">Insertion Sort</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentFrame.stepLabel}
                </span>
              </div>

              <div className="relative h-44 flex items-end justify-between gap-3 sm:gap-4 px-2 pt-4 pb-2 border-b border-[#1e2236]">
                {currentFrame.bars.map((val, idx) => {
                  const isActive = idx === currentFrame.activeIdx;
                  const isComparing = idx === currentFrame.compareIdx;

                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex items-end justify-center z-10"
                    >
                      <div
                        style={{ height: `${val}%` }}
                        className={`w-full rounded-t transition-all duration-500 ${
                          isActive
                            ? 'bg-amber-400'
                            : isComparing
                            ? 'bg-indigo-400'
                            : 'bg-indigo-600/80'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 text-[11px] font-mono text-slate-400">
                {currentFrame.caption}
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-[#1b1e2e]" />

        {/* Módulos */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-2">
          <div className="bg-[#121422] border border-[#22263c] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-100">Catálogo de Algoritmos</h2>
                <span className="text-[11px] font-mono text-slate-400">
                  {uniqueCatalogAlgorithms.length} algoritmos
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Ordenamiento, Búsqueda y Divide y Vencerás con seguimiento en 4 lenguajes, estado de variables y comparación en paralelo.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1d2136]">
                {uniqueCatalogAlgorithms.map(algo => (
                  <button
                    key={algo.id}
                    onClick={() => onEnterAlgorithmsModule(algo)}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#171a2b] hover:bg-[#222742] border border-[#252a42] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {algo.name.replace(/\s*\(.*\)/, '')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onEnterAlgorithmsModule()}
              className="mt-5 w-full py-2 px-3 rounded-lg bg-[#191d30] hover:bg-indigo-600 text-slate-200 hover:text-white border border-[#282e4a] hover:border-indigo-500 text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Abrir catálogo
            </button>
          </div>

          <div className="bg-[#121422] border border-[#22263c] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-100">Código del Estudiante</h2>
                <span className="text-[11px] font-mono text-slate-400">C / JS</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Editor con instrumentación AST para compilar y depurar paso a paso tus propias implementaciones sobre el lienzo de memoria.
              </p>
            </div>

            <button
              onClick={onEnterStudentCodeModule}
              className="mt-5 w-full py-2 px-3 rounded-lg bg-[#191d30] hover:bg-indigo-600 text-slate-200 hover:text-white border border-[#282e4a] hover:border-indigo-500 text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Abrir editor
            </button>
          </div>

          <div className="bg-[#121422] border border-[#22263c] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-100">Tareas Guiadas</h2>
                <span className="text-[11px] font-mono text-emerald-400">
                  {completedTasksCount}/21
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                21 ejercicios prácticos organizados en niveles Básico, Intermedio y Avanzado con verificación sobre la traza real.
              </p>
            </div>

            <button
              onClick={onEnterGuidedTasksModule}
              className="mt-5 w-full py-2 px-3 rounded-lg bg-[#191d30] hover:bg-indigo-600 text-slate-200 hover:text-white border border-[#282e4a] hover:border-indigo-500 text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Abrir tareas
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

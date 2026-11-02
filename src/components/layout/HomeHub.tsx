import React, { useState, useEffect } from 'react';
import { ALGORITHMS_CATALOG } from '../../core/algorithms/registry';
import type { AlgorithmMetadata } from '../../types/algorithm';
import {
  Layers,
  Code2,
  BookOpen,
  ArrowRight,
  Play,
  CheckCircle2,
} from 'lucide-react';

export type AppModule = 'home' | 'algorithms' | 'student_code' | 'guided_tasks';

interface HomeHubProps {
  onEnterAlgorithmsModule: (initialAlgo?: AlgorithmMetadata) => void;
  onEnterStudentCodeModule: () => void;
  onEnterGuidedTasksModule: () => void;
  completedTasksCount: number;
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
  completedTasksCount,
}) => {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % HERO_PREVIEW_FRAMES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const currentFrame = HERO_PREVIEW_FRAMES[frameIdx];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0e16] text-slate-100 overflow-y-auto select-none font-sans">
      {/* Barra superior institucional sobria */}
      <header className="h-14 bg-[#11131e] border-b border-[#1f2233] px-6 lg:px-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs tracking-tight">
            <span>VA</span>
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            Visualizador Interactivo de Algoritmos
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onEnterAlgorithmsModule()}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-[#191c2c] transition-colors cursor-pointer"
          >
            Catálogo de Algoritmos
          </button>
          <button
            onClick={onEnterStudentCodeModule}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-[#191c2c] transition-colors cursor-pointer"
          >
            Código del Estudiante
          </button>
          <button
            onClick={onEnterGuidedTasksModule}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-[#191c2c] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tareas Guiadas</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#182628] text-emerald-400 border border-emerald-800/60">
              {completedTasksCount}/21
            </span>
          </button>
        </nav>
      </header>

      {/* Contenedor central */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-8 lg:py-10 flex flex-col justify-between gap-9">
        {/* Sección principal */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Columna izquierda */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-400">
              Ruta de Aprendizaje
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
              Comprende
              <br />
              algoritmos
              <br />
              <span className="text-indigo-400">paso a paso.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-md leading-relaxed">
              Observa cada decisión, predice el siguiente movimiento y domina el razonamiento
              detrás del código.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onEnterAlgorithmsModule()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Continuar aprendizaje</span>
              </button>

              <button
                onClick={onEnterGuidedTasksModule}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#141726] hover:bg-[#1c2033] border border-[#262a40] text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Ver mi progreso ({completedTasksCount}/21)</span>
              </button>
            </div>
          </div>

          {/* Columna derecha: Vista previa interactiva de Insertion Sort */}
          <div className="lg:col-span-6">
            <div
              onClick={() => {
                const insertion = ALGORITHMS_CATALOG.find(a => a.id === 'insertion-sort');
                onEnterAlgorithmsModule(insertion);
              }}
              className="bg-[#121422] border border-[#22263c] hover:border-indigo-500/50 rounded-xl p-5 shadow-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-slate-100">Insertion Sort</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  En ejecución
                </span>
              </div>

              <div className="relative h-48 flex items-end justify-between gap-3 sm:gap-4 px-2 pt-4 pb-2 border-b border-[#1e2236]">
                <div className="absolute inset-x-0 top-1/4 border-t border-[#181b2c] pointer-events-none" />
                <div className="absolute inset-x-0 top-2/4 border-t border-[#181b2c] pointer-events-none" />
                <div className="absolute inset-x-0 top-3/4 border-t border-[#181b2c] pointer-events-none" />

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
                            : 'bg-indigo-600/85'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 text-[11px] font-mono">
                <span className="text-slate-400">{currentFrame.caption}</span>
                <span className="text-slate-200 font-semibold">{currentFrame.stepLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-[#1b1e2e]" />

        {/* Módulos del sistema */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-2">
          {/* Módulo 1 */}
          <div className="bg-[#121422] border border-[#22263c] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#191d30] border border-[#292f4c] flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">8 algoritmos</span>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-100">Catálogo de Algoritmos</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ordenamiento, Búsqueda y Divide y Vencerás con seguimiento de líneas en 4
                  lenguajes, estado de variables y árbol de recursión.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1d2136]">
                {ALGORITHMS_CATALOG.map(algo => (
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
              className="mt-5 w-full py-2 px-3 rounded-lg bg-[#191d30] hover:bg-indigo-600 text-slate-200 hover:text-white border border-[#282e4a] hover:border-indigo-500 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Abrir catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Módulo 2 */}
          <div className="bg-[#121422] border border-[#22263c] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#191d30] border border-[#292f4c] flex items-center justify-center text-amber-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">Lenguaje C / JS</span>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-100">Código del Estudiante</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Editor con instrumentación AST (Acorn.js) para compilar y depurar paso a paso tus
                  propias implementaciones en C o JavaScript sobre un lienzo de memoria libre.
                </p>
              </div>
            </div>

            <button
              onClick={onEnterStudentCodeModule}
              className="mt-5 w-full py-2 px-3 rounded-lg bg-[#191d30] hover:bg-indigo-600 text-slate-200 hover:text-white border border-[#282e4a] hover:border-indigo-500 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Abrir laboratorio de código</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Módulo 3 */}
          <div className="bg-[#121422] border border-[#22263c] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#191d30] border border-[#292f4c] flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {completedTasksCount} / 21 resueltas
                </span>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-100">Tareas Interactivas Guiadas</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  21 ejercicios de evaluación práctica (T01–T21) con tablas de traza, predicción de
                  invariantes, construcción manual y verificación AST en C.
                </p>
              </div>
            </div>

            <button
              onClick={onEnterGuidedTasksModule}
              className="mt-5 w-full py-2 px-3 rounded-lg bg-[#191d30] hover:bg-indigo-600 text-slate-200 hover:text-white border border-[#282e4a] hover:border-indigo-500 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Abrir tareas guiadas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

import React from 'react';
import type { ParallelState } from '../../../types/trace';
import { Cpu, ListOrdered, GitMerge, CheckCircle2, ArrowRight } from 'lucide-react';

interface ParallelViewProps {
  parallelState: ParallelState;
}

export const ParallelView: React.FC<ParallelViewProps> = ({ parallelState }) => {
  const { taskQueue, workers, completedTasks } = parallelState;

  return (
    <div className="w-full h-full bg-[#11121b] p-4 flex flex-col justify-between overflow-y-auto font-sans select-none">
      {/* Encabezado Explicativo del Flujo Paralelo */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232535]">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Modelo Conceptual Fork-Join (Divide & Conquer Paralelo)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Divide subproblemas independientes en una Cola de Tareas para su ejecución concurrente en Workers.
          </p>
        </div>

        {/* Flujo Conceptual */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-[#171926] px-3 py-1.5 rounded-lg border border-[#2b2d42]">
          <span className="text-amber-400 font-bold">Divide (Fork)</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-blue-400 font-bold">Task Queue</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-indigo-400 font-bold">Workers</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-emerald-400 font-bold">Join (Merge)</span>
        </div>
      </div>

      {/* Grid de 3 Columnas: Cola de Tareas | Workers Activos | Barrera de Join */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Columna 1: Cola de Tareas (Task Queue) */}
        <div className="bg-[#161724] border border-[#26283d] rounded-xl p-3.5 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#24263b]">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ListOrdered className="w-4 h-4" />
                <span>Cola de Tareas (Queue)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {taskQueue.length} pendientes
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
              {taskQueue.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  No hay tareas pendientes en la cola.
                </div>
              ) : (
                taskQueue.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="bg-[#1c1d2d] border border-[#2f3148] p-2.5 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-indigo-300 font-bold">rango [{task.range[0]}..{task.range[1]}]</span>
                      <span className="text-amber-400 uppercase text-[9px] font-black px-1.5 py-0.2 bg-amber-500/10 rounded border border-amber-500/30">
                        {task.action}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-1.5">{task.description}</div>
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {task.values.map((v, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#272a3e] text-slate-200 border border-[#393d5a]"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Columna 2: Workers Virtuales (Hilos de Procesamiento) */}
        <div className="bg-[#161724] border border-[#26283d] rounded-xl p-3.5 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#24263b]">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Cpu className="w-4 h-4" />
                <span>Workers Virtuales (Hilos)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                2 Hilos
              </span>
            </div>

            <div className="space-y-3">
              {workers.map(worker => {
                const isWorking = worker.status === 'active';
                const isMerging = worker.status === 'merging';

                let statusBadge = { text: 'En espera (Idle)', style: 'bg-slate-800 text-slate-400 border-slate-700' };
                if (isMerging) {
                  statusBadge = { text: 'Mezclando (Merge)', style: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse' };
                } else if (isWorking) {
                  statusBadge = { text: 'Ordenando (Active)', style: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
                }

                return (
                  <div
                    key={worker.id}
                    className={`bg-[#1c1d2e] border p-3 rounded-lg transition-all ${
                      isWorking || isMerging ? 'border-indigo-500/50 shadow-md shadow-indigo-500/10' : 'border-[#2d2f44]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200">{worker.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${statusBadge.style}`}>
                        {statusBadge.text}
                      </span>
                    </div>

                    {worker.currentTask ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="text-[11px] text-slate-300 flex items-center justify-between">
                          <span>Subproblema:</span>
                          <span className="font-mono text-indigo-300 font-bold">
                            [{worker.currentTask.range[0]}..{worker.currentTask.range[1]}]
                          </span>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto py-1">
                          {worker.currentTask.values.map((v, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/40"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic py-2">Sin tarea asignada actualmente.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna 3: Barrera de Sincronización y Resultados (Join) */}
        <div className="bg-[#161724] border border-[#26283d] rounded-xl p-3.5 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#24263b]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <GitMerge className="w-4 h-4" />
                <span>Barrera de Join (Resultados)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {completedTasks.length} resueltos
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
              {completedTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  Esperando finalización de subproblemas...
                </div>
              ) : (
                completedTasks.slice(-5).reverse().map((taskText, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1b2524] border border-emerald-500/30 p-2.5 rounded-lg text-xs flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-emerald-200 font-mono leading-tight">{taskText}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

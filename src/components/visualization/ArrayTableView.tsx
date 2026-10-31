import React from 'react';
import type { Step } from '../../types/trace';

interface ArrayTableViewProps {
  currentStep: Step;
  showHeatmap?: boolean;
}

export const ArrayTableView: React.FC<ArrayTableViewProps> = ({
  currentStep,
  showHeatmap = false,
}) => {
  const { array, activeIndices } = currentStep;
  const maxVal = Math.max(1, ...array.map(el => Math.abs(el.value)));
  const maxAccess = Math.max(1, ...array.map(el => el.accessCount || 0));

  const getPointersForIndex = (idx: number): string[] => {
    const ptrs: string[] = [];
    if (activeIndices.i === idx) ptrs.push('i');
    if (activeIndices.j === idx) ptrs.push('j');
    if (activeIndices.min === idx) ptrs.push('min');
    if (activeIndices.keyIndex === idx) ptrs.push('clave');
    if (activeIndices.pivot === idx) ptrs.push('pivote');
    if (activeIndices.left === idx) ptrs.push('inicio');
    if (activeIndices.mid === idx) ptrs.push('medio');
    if (activeIndices.right === idx) ptrs.push('fin');
    return ptrs;
  };

  const getStateBadge = (state: string, indicator?: string) => {
    switch (state) {
      case 'comparing':
        return {
          label: `Comparando ${indicator ? `(${indicator})` : '(?)'}`,
          cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'swapped':
        return {
          label: `Intercambiado ${indicator ? `(${indicator})` : '(⇄)'}`,
          cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        };
      case 'selected':
        return {
          label: `Seleccionado ${indicator ? `(${indicator})` : '(★)'}`,
          cls: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      case 'sorted':
        return {
          label: `Ordenado ${indicator ? `(${indicator})` : '(✔)'}`,
          cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'discarded':
        return {
          label: `Descartado ${indicator ? `(${indicator})` : '(✗)'}`,
          cls: 'bg-slate-800 text-slate-400 border-slate-700',
        };
      default:
        return {
          label: 'Pendiente',
          cls: 'bg-[#1a1c2b] text-slate-400 border-[#282b40]',
        };
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-[#24273a] bg-[#11121c] p-3">
      <table className="w-full text-left border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-[#25283c] text-[10px] uppercase tracking-wider text-slate-400 bg-[#161826]">
            <th className="py-2.5 px-3 rounded-tl-lg">Índice</th>
            <th className="py-2.5 px-3">Valor</th>
            <th className="py-2.5 px-3">Magnitud Relativa</th>
            <th className="py-2.5 px-3">Estabilidad (Origen)</th>
            <th className="py-2.5 px-3">Punteros Activos</th>
            <th className="py-2.5 px-3">Estado Semántico</th>
            <th className="py-2.5 px-3 rounded-tr-lg">Frecuencia de Accesos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2032]">
          {array.map((item, idx) => {
            const pointers = getPointersForIndex(idx);
            const badge = getStateBadge(item.state, item.nonColorIndicator);
            const pct = Math.max(6, Math.round((Math.abs(item.value) / maxVal) * 100));
            const access = item.accessCount || 0;
            const accessPct = Math.round((access / maxAccess) * 100);
            const displaced = item.originalIndex !== idx;

            let rowBg = 'hover:bg-[#171929]';
            if (item.state === 'comparing') rowBg = 'bg-amber-950/20 hover:bg-amber-950/30';
            else if (item.state === 'swapped') rowBg = 'bg-sky-950/20 hover:bg-sky-950/30';
            else if (item.state === 'selected') rowBg = 'bg-purple-950/20 hover:bg-purple-950/30';
            else if (item.state === 'sorted') rowBg = 'bg-emerald-950/15 hover:bg-emerald-950/25';

            return (
              <tr key={item.id || idx} className={`${rowBg} transition-colors`}>
                <td className="py-2 px-3 font-bold text-indigo-300">arr[{idx}]</td>
                <td className="py-2 px-3 text-sm font-black text-slate-100">{item.value}</td>
                <td className="py-2 px-3 w-36">
                  <div className="w-full h-2 bg-[#1c1e2e] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        item.state === 'comparing'
                          ? 'bg-amber-400'
                          : item.state === 'swapped'
                          ? 'bg-sky-400'
                          : item.state === 'selected'
                          ? 'bg-purple-400'
                          : item.state === 'sorted'
                          ? 'bg-emerald-400'
                          : 'bg-indigo-500/70'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
                <td className="py-2 px-3 text-slate-300">
                  <span className="px-1.5 py-0.5 rounded bg-[#1b1d2e] border border-[#2c304a] text-[11px]">
                    {item.label || `#${item.originalIndex}`}
                  </span>
                  <span className="ml-2 text-[10px] text-slate-400">
                    (idx orig: {item.originalIndex}
                    {displaced ? ` → ${idx}` : ''})
                  </span>
                </td>
                <td className="py-2 px-3">
                  {pointers.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {pointers.map(p => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-200 border border-indigo-400/50 text-[10px] font-bold"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold w-12 ${
                        showHeatmap && access > 0 ? 'text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      {access} acc
                    </span>
                    <div className="w-20 h-1.5 bg-[#1c1e2e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 transition-all duration-200"
                        style={{ width: `${access > 0 ? Math.max(12, accessPct) : 0}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

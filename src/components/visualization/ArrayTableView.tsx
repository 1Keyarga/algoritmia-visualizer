import React, { useId } from 'react';
import type { ElementState, NamedArrayState, Step } from '../../types/trace';

interface ArrayTableViewProps {
  currentStep: Step;
  stepIndex: number;
  totalSteps: number;
}

const STATE_META: Record<ElementState, { label: string; badgeClass: string; symbol: string }> = {
  default: {
    label: 'Pendiente',
    badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-600/60',
    symbol: '•',
  },
  comparing: {
    label: 'Comparando',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    symbol: '⇄',
  },
  swapped: {
    label: 'Intercambiado',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    symbol: '⇅',
  },
  sorted: {
    label: 'Confirmado',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    symbol: '✓',
  },
  selected: {
    label: 'Seleccionado',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    symbol: '★',
  },
  discarded: {
    label: 'Descartado',
    badgeClass: 'bg-slate-900/90 text-slate-400 border-slate-700/70',
    symbol: '×',
  },
};

const INDEX_POINTER_NAMES: Array<[keyof Step['activeIndices'], string]> = [
  ['i', 'i'],
  ['j', 'j'],
  ['min', 'min'],
  ['keyIndex', 'clave'],
  ['pivot', 'pivote'],
  ['left', 'inicio'],
  ['right', 'fin'],
  ['mid', 'medio'],
];

function resolvePointerLabels(
  idx: number,
  activeIndices: Step['activeIndices'],
  nonColorIndicator?: string
): string[] {
  const labels = new Set<string>();
  for (const [key, displayLabel] of INDEX_POINTER_NAMES) {
    if (activeIndices[key] === idx) {
      labels.add(displayLabel);
    }
  }
  if (nonColorIndicator) {
    labels.add(nonColorIndicator);
  }
  return Array.from(labels);
}

/**
 * Vista tabular accesible del arreglo en el paso actual (RF-22), con región
 * enfocable por teclado y encabezados fijos para verificación numérica exacta.
 */
export const ArrayTableView: React.FC<ArrayTableViewProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
}) => {
  const captionId = useId();
  const arraysToRender: NamedArrayState[] =
    currentStep.namedArrays && currentStep.namedArrays.length > 0
      ? currentStep.namedArrays
      : [{ name: 'arr', elements: currentStep.array }];

  const isSingleArray = arraysToRender.length === 1;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 bg-[#10121c] border border-[#232534] rounded-xl p-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shrink-0">
        <span id={captionId} className="font-semibold text-slate-200">
          Tabla del arreglo — Paso {stepIndex + 1} de {totalSteps}
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          {arraysToRender.map((arr) => `${arr.name} (${arr.elements.length})`).join(' · ')}
        </span>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className="array-table-region custom-scrollbar flex-1 min-h-0 rounded-lg border border-[#232534] bg-[#131522] p-0.5 focus-visible:outline-2 focus-visible:outline-indigo-400"
      >
        {arraysToRender.map((namedArr, groupIdx) => (
          <div key={`${namedArr.name}-${groupIdx}`} className={groupIdx > 0 ? 'mt-4' : ''}>
            {!isSingleArray && (
              <h3 className="px-3 py-1.5 text-[11px] font-mono font-semibold text-indigo-300 bg-[#171a29] border-b border-[#232534]">
                {namedArr.name} [{namedArr.elements.length}]
              </h3>
            )}

            {namedArr.elements.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                El arreglo está vacío en este paso.
              </p>
            ) : (
              <table className="array-data-table text-left text-xs">
                <caption className="sr-only">
                  Valores indexados de {namedArr.name} en el paso {stepIndex + 1} de {totalSteps}
                </caption>
                <thead>
                  <tr className="border-b border-[#25283a] text-[11px] uppercase tracking-wider text-slate-400">
                    <th scope="col" className="px-3 py-2.5 font-semibold border-b border-[#25283a]">
                      Índice
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold border-b border-[#25283a]">
                      Valor
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold border-b border-[#25283a]">
                      Estado
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold border-b border-[#25283a]">
                      Punteros
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2132]">
                  {namedArr.elements.map((el, idx) => {
                    const stateMeta = STATE_META[el.state] ?? STATE_META.default;
                    const pointers = isSingleArray
                      ? resolvePointerLabels(idx, currentStep.activeIndices, el.nonColorIndicator)
                      : el.nonColorIndicator
                        ? [el.nonColorIndicator]
                        : [];

                    return (
                      <tr key={el.id ?? `${namedArr.name}-${idx}`} className="hover:bg-[#191c2c]">
                        <th
                          scope="row"
                          className="px-3 py-2 font-mono font-semibold text-slate-300 whitespace-nowrap"
                        >
                          [{idx}]
                        </th>
                        <td
                          data-col="value"
                          className="px-3 py-2 font-mono text-sm font-bold text-slate-100 tabular-nums"
                        >
                          {el.value}
                        </td>
                        <td data-col="state" className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${stateMeta.badgeClass}`}
                          >
                            <span aria-hidden="true">{stateMeta.symbol}</span>
                            <span>{stateMeta.label}</span>
                          </span>
                        </td>
                        <td data-col="pointer" className="px-3 py-2 font-mono text-[11px] text-slate-300">
                          {pointers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pointers.map((ptr) => (
                                <span
                                  key={ptr}
                                  className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/35 text-indigo-200 font-semibold"
                                >
                                  {ptr}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

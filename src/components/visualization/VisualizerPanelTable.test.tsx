// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisualizerPanel } from './VisualizerPanel';
import { generateBubbleSortTrace } from '../../core/algorithms/bubbleSort';

describe('RF-22: Vista tabular alternativa sincronizada en VisualizerPanel', () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeAll(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
      root = null;
    }
    container.remove();
  });

  it('alterna entre vista gráfica y vista tabla mostrando índices, valores y estado exactos', async () => {
    const steps = generateBubbleSortTrace([64, 34, 25], true);
    const step = steps[0];

    root = createRoot(container);
    await act(async () => {
      root!.render(
        <VisualizerPanel
          currentStep={step}
          stepIndex={0}
          totalSteps={steps.length}
          isFullscreen={false}
          onToggleFullscreen={vi.fn()}
          algorithmFamily="sorting"
          algorithmId="bubble-sort-optimized"
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const graphicBtn = buttons.find((b) => b.textContent?.includes('Gráfica'));
    const tableBtn = buttons.find((b) => b.textContent?.includes('Tabla'));

    expect(graphicBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(tableBtn?.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('table')).toBeNull();

    await act(async () => {
      tableBtn!.click();
    });

    expect(graphicBtn?.getAttribute('aria-pressed')).toBe('false');
    expect(tableBtn?.getAttribute('aria-pressed')).toBe('true');

    const region = container.querySelector('[role="region"][tabindex="0"]');
    expect(region).not.toBeNull();

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(table?.querySelector('caption')?.textContent).toContain(`paso 1 de ${steps.length}`);

    const colHeaders = Array.from(table?.querySelectorAll('thead th[scope="col"]') ?? []).map((th) =>
      th.textContent?.trim()
    );
    expect(colHeaders).toEqual(['Índice', 'Valor', 'Estado', 'Punteros']);

    const rows = Array.from(table?.querySelectorAll('tbody tr') ?? []);
    expect(rows.length).toBe(3);

    const parsedRows = rows.map((tr) => ({
      index: tr.querySelector('th[scope="row"]')?.textContent?.trim(),
      value: tr.querySelector('td[data-col="value"]')?.textContent?.trim(),
    }));
    expect(parsedRows).toEqual([
      { index: '[0]', value: '64' },
      { index: '[1]', value: '34' },
      { index: '[2]', value: '25' },
    ]);
  });
});

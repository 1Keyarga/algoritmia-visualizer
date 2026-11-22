// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { EvaluationModule } from './components/evaluation/EvaluationModule';
import {
  GUEST_TASK_PROGRESS_KEY,
  TASK_PROGRESS_BY_PARTICIPANT_KEY,
  generateParticipantCode,
  type ParticipantSession,
} from './core/evaluation/evaluationRepository';

function findButtonByText(container: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find(btn =>
    btn.textContent?.includes(text)
  );
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function flushEffects(waitMs = 0) {
  await act(async () => {
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, waitMs));
  });
}

describe('Tareas accesibles sin cuenta, ocultamiento CSV y sincronización al conectarse', () => {
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

    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }

    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }
  });

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        text: async () => JSON.stringify({ found: false }),
      })
    );
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
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('oculta la descarga CSV al estudiante y exige Pretest antes del Postest en EvaluationModule', async () => {
    const onUpdateSession = vi.fn();
    const onGoToGuidedTasks = vi.fn();

    const baseSession: ParticipantSession = {
      participantId: 'P-7068C7',
      consentedAt: '2026-11-13T05:00:00.000Z',
      startedAt: '2026-11-13T05:00:00.000Z',
    };

    root = createRoot(container);
    await act(async () => {
      root!.render(
        <EvaluationModule
          session={baseSession}
          onUpdateSession={onUpdateSession}
          taskOutcomes={{}}
          completedTasksCount={0}
          onGoToGuidedTasks={onGoToGuidedTasks}
        />
      );
    });

    const textBeforePretest = container.textContent ?? '';
    expect(textBeforePretest).toContain('P-7068C7');
    expect(textBeforePretest).toContain('Iniciar Pretest');
    expect(textBeforePretest).toContain('Completa primero el Pretest');
    expect(textBeforePretest).toContain('Explorar libremente');
    expect(textBeforePretest).not.toContain('Descargar resultados');
    expect(textBeforePretest).not.toContain('.csv');

    const exploreBtn = findButtonByText(container, 'Explorar libremente');
    expect(exploreBtn).toBeDefined();
    await act(async () => {
      exploreBtn!.click();
    });
    expect(onGoToGuidedTasks).toHaveBeenCalledTimes(1);

    const completedSession: ParticipantSession = {
      ...baseSession,
      remotePretestCompletedAt: '2026-11-13T05:12:00.000Z',
    };

    await act(async () => {
      root!.render(
        <EvaluationModule
          session={completedSession}
          onUpdateSession={onUpdateSession}
          taskOutcomes={{}}
          completedTasksCount={0}
          onGoToGuidedTasks={onGoToGuidedTasks}
        />
      );
    });

    const textAfterPretest = container.textContent ?? '';
    expect(textAfterPretest).toContain('Pretest completado');
    expect(textAfterPretest).toContain('Iniciar Postest');
    expect(textAfterPretest).not.toContain('Descargar resultados');
    expect(textAfterPretest).not.toContain('.csv');
  });

  it('permite usar Tareas sin cuenta y fusiona el avance local con Google Sheets al conectarse', async () => {
    // 1. Acceso libre a Tareas sin iniciar sesión
    root = createRoot(container);
    await act(async () => {
      root!.render(<App />);
    });
    await flushEffects();

    expect(container.textContent).toContain('Trazarithm');
    expect(container.textContent).toContain('0/21');

    const openTasksGuest = findButtonByText(container, 'Abrir tareas');
    expect(openTasksGuest).toBeDefined();
    await act(async () => {
      openTasksGuest!.click();
    });
    await flushEffects();

    expect(container.textContent).toContain('Restantes: 3/3');
    expect(container.textContent).not.toContain('Acceso a Tareas Guiadas');

    await act(async () => {
      root?.unmount();
    });
    root = null;

    // 2. Progreso local sin cuenta se fusiona con registro previo en Sheets al iniciar sesión
    localStorage.setItem(
      GUEST_TASK_PROGRESS_KEY,
      JSON.stringify({
        completedTaskIds: ['T01'],
        taskOutcomes: { T01: 'first_attempt' },
        taskAttemptsById: { T01: 0 },
      })
    );

    const participantId = await generateParticipantCode('20214567');
    const postBodiesExisting: Record<string, unknown>[] = [];
    const fetchExistingMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && typeof init.body === 'string') {
        postBodiesExisting.push(JSON.parse(init.body) as Record<string, unknown>);
        return { text: async () => 'OK' };
      }
      return {
        text: async () =>
          JSON.stringify({
            found: true,
            participantId,
            consentedAt: '2026-11-13T05:00:00.000Z',
            pretestCompletedAt: '',
            postestCompletedAt: '',
            tasksDetail: 'T02:no_logrado',
          }),
      };
    });
    vi.stubGlobal('fetch', fetchExistingMock);

    root = createRoot(container);
    await act(async () => {
      root!.render(<App />);
    });
    await flushEffects();

    expect(container.textContent).toContain('1/21');

    const evalBtn = findButtonByText(container, 'Evaluación');
    expect(evalBtn).toBeDefined();
    await act(async () => {
      evalBtn!.click();
    });

    const codeInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    const consentCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const submitBtn = findButtonByText(container, 'Continuar');
    expect(codeInput).not.toBeNull();
    expect(consentCheckbox).not.toBeNull();
    expect(submitBtn).toBeDefined();

    await act(async () => {
      setReactInputValue(codeInput, '20214567');
      consentCheckbox.click();
    });
    await act(async () => {
      submitBtn!.click();
    });
    await flushEffects(120);

    expect(container.textContent).toContain(participantId);
    expect(localStorage.getItem(GUEST_TASK_PROGRESS_KEY)).toBeNull();

    const byParticipant = JSON.parse(
      localStorage.getItem(TASK_PROGRESS_BY_PARTICIPANT_KEY) || '{}'
    ) as Record<string, { taskOutcomes: Record<string, string> }>;
    expect(byParticipant[participantId]?.taskOutcomes).toEqual({
      T01: 'first_attempt',
      T02: 'failed',
    });

    expect(postBodiesExisting.length).toBeGreaterThanOrEqual(1);
    const syncedExisting = postBodiesExisting[postBodiesExisting.length - 1];
    expect(syncedExisting.participantId).toBe(participantId);
    expect(syncedExisting.tasksCompletedCount).toBe(1);
    expect(syncedExisting.tasksFirstAttempt).toBe(1);
    expect(syncedExisting.tasksFailed).toBe(1);
    expect(syncedExisting.tasksDetail).toBe('T01:1er_intento | T02:no_logrado');

    await act(async () => {
      root?.unmount();
    });
    root = null;
    localStorage.clear();

    // 3. Estudiante nuevo (found: false) también sube de inmediato las tareas hechas localmente sin cuenta
    localStorage.setItem(
      GUEST_TASK_PROGRESS_KEY,
      JSON.stringify({
        completedTaskIds: ['T03'],
        taskOutcomes: { T03: 'second_attempt' },
        taskAttemptsById: { T03: 1 },
      })
    );

    const newParticipantId = await generateParticipantCode('NEW2026');
    const postBodiesNew: Record<string, unknown>[] = [];
    const fetchNewMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && typeof init.body === 'string') {
        postBodiesNew.push(JSON.parse(init.body) as Record<string, unknown>);
        return { text: async () => 'OK' };
      }
      return {
        text: async () => JSON.stringify({ found: false }),
      };
    });
    vi.stubGlobal('fetch', fetchNewMock);

    root = createRoot(container);
    await act(async () => {
      root!.render(<App />);
    });
    await flushEffects();

    await act(async () => {
      findButtonByText(container, 'Evaluación')!.click();
    });
    await act(async () => {
      setReactInputValue(
        container.querySelector('input[type="text"]') as HTMLInputElement,
        'NEW2026'
      );
      (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    });
    await act(async () => {
      findButtonByText(container, 'Continuar')!.click();
    });
    await flushEffects(120);

    expect(localStorage.getItem(GUEST_TASK_PROGRESS_KEY)).toBeNull();
    expect(postBodiesNew.length).toBeGreaterThanOrEqual(1);
    const syncedNew = postBodiesNew[postBodiesNew.length - 1];
    expect(syncedNew.participantId).toBe(newParticipantId);
    expect(syncedNew.tasksCompletedCount).toBe(1);
    expect(syncedNew.tasksSecondAttempt).toBe(1);
    expect(syncedNew.tasksDetail).toBe('T03:2do_intento');
  });

  it('muestra el bloque IMI al finalizar Pretest y Postest con enlace cuando está configurado (RF-28)', async () => {
    const completedResult = {
      completedAt: '2026-11-13T19:00:00.000Z',
      durationSeconds: 90,
      totalScore: 8,
      percentage: 89,
      byCompetency: {
        C1: { earned: 2, max: 2 },
        C2: { earned: 2, max: 2 },
        C3: { earned: 2, max: 2 },
        C4: { earned: 2, max: 3 },
      },
      itemScores: {},
      rawAnswers: {},
    };

    const doneSession: ParticipantSession = {
      participantId: 'P-TEST99',
      consentedAt: '2026-11-13T18:50:00.000Z',
      startedAt: '2026-11-13T18:50:00.000Z',
      pretest: completedResult,
      postest: completedResult,
    };

    root = createRoot(container);
    await act(async () => {
      root!.render(
        <EvaluationModule
          session={doneSession}
          onUpdateSession={vi.fn()}
          taskOutcomes={{}}
          completedTasksCount={0}
          onGoToGuidedTasks={vi.fn()}
        />
      );
    });
    await flushEffects();

    const imiLink = container.querySelector('a[href="https://forms.gle/7ZqCniCRg3ijqBiA6"]');
    expect(imiLink).not.toBeNull();
    expect(imiLink?.getAttribute('target')).toBe('_blank');
    expect(imiLink?.getAttribute('rel')).toContain('noopener');
    expect(container.textContent).toContain('P-TEST99');

    await act(async () => {
      root!.render(
        <EvaluationModule
          session={doneSession}
          onUpdateSession={vi.fn()}
          taskOutcomes={{}}
          completedTasksCount={0}
          onGoToGuidedTasks={vi.fn()}
          imiFormUrl=""
        />
      );
    });
    await flushEffects();

    expect(container.querySelector('a[href="https://forms.gle/7ZqCniCRg3ijqBiA6"]')).toBeNull();
    expect(container.textContent).toContain('Cuestionario de percepción y motivación');
    expect(container.textContent).not.toContain('Abrir cuestionario IMI');
    expect(container.textContent).toContain('VITE_IMI_FORM_URL');
  });

  it('muestra tiempos de 5 min (Pretest) y 8 min (Postest) y envía automáticamente al agotarse el tiempo aun con preguntas sin responder', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));

    let latestSession: ParticipantSession | null = {
      participantId: 'P-TIMER1',
      consentedAt: '2026-11-16T12:00:00.000Z',
      startedAt: '2026-11-16T12:00:00.000Z',
    };

    root = createRoot(container);
    await act(async () => {
      root!.render(
        <EvaluationModule
          session={latestSession}
          onUpdateSession={next => {
            latestSession = next;
          }}
          taskOutcomes={{}}
          completedTasksCount={0}
          onGoToGuidedTasks={vi.fn()}
        />
      );
    });
    await flushEffects();

    expect(container.textContent).toContain('5 min');
    expect(container.textContent).toContain('8 min');

    // Al abrir Pretest con un intento que ya superó los 5 minutos (ej. hace 301s) y solo 1 pregunta respondida
    const expiredSession: ParticipantSession = {
      participantId: 'P-TIMER1',
      consentedAt: '2026-11-16T12:00:00.000Z',
      startedAt: '2026-11-16T12:00:00.000Z',
      inProgressAnswers: {
        testType: 'pretest',
        startedAtMs: Date.now() - 301 * 1000,
        answers: {
          'PRE-01': { optionIndex: 1 }, // correcta
        },
      },
    };

    root.unmount();
    root = createRoot(container);
    await act(async () => {
      root!.render(
        <EvaluationModule
          session={expiredSession}
          onUpdateSession={next => {
            latestSession = next;
          }}
          taskOutcomes={{}}
          completedTasksCount={0}
          onGoToGuidedTasks={vi.fn()}
        />
      );
    });
    await flushEffects(60);

    expect(latestSession?.pretest).toBeDefined();
    expect(latestSession?.pretest?.totalScore).toBe(1);
    expect(latestSession?.pretest?.itemScores['PRE-01']).toBe(1);
    expect(latestSession?.pretest?.itemScores['PRE-02']).toBe(0);
    expect(latestSession?.inProgressAnswers).toBeUndefined();
    expect(container.textContent).toContain('Tiempo agotado (05:00)');
  });

  it('permite marcar "No la sé / Dejar en blanco (0 puntos)" o confirmar "Enviar de todos modos" sin obligar a adivinar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));

    let latestSession: ParticipantSession | null = {
      participantId: 'P-SKIP01',
      consentedAt: '2026-11-16T12:00:00.000Z',
      startedAt: '2026-11-16T12:00:00.000Z',
      inProgressAnswers: {
        testType: 'pretest',
        startedAtMs: Date.now(),
        answers: {
          'PRE-01': { optionIndex: 1 }, // correcta (1 pto)
        },
      },
    };

    root = createRoot(container);
    await act(async () => {
      root!.render(
        <EvaluationModule
          session={latestSession}
          onUpdateSession={next => {
            latestSession = next;
          }}
          taskOutcomes={{}}
          completedTasksCount={0}
          onGoToGuidedTasks={vi.fn()}
        />
      );
    });
    await flushEffects();

    // Ir a la Pregunta 2 y marcar "Dejar en blanco"
    const q2Btn = findButtonByText(container, '2');
    await act(async () => {
      q2Btn!.click();
    });
    const skipBtn = findButtonByText(container, 'Dejar en blanco');
    expect(skipBtn).toBeDefined();
    await act(async () => {
      skipBtn!.click();
    });
    expect(latestSession?.inProgressAnswers?.answers['PRE-02']?.optionIndex).toBe(-1);

    // Ir a la Pregunta 9 y pulsar "Finalizar y guardar Pretest" teniendo aún preguntas 3..9 vacías
    const q9Btn = findButtonByText(container, '9');
    await act(async () => {
      q9Btn!.click();
    });
    const finishBtn = findButtonByText(container, 'Finalizar y guardar Pretest');
    await act(async () => {
      finishBtn!.click();
    });
    await flushEffects();

    // Muestra advertencia y el botón "Enviar de todos modos"
    const forceBtn = findButtonByText(container, 'Enviar de todos modos');
    expect(forceBtn).toBeDefined();
    await act(async () => {
      forceBtn!.click();
    });
    await flushEffects(60);

    expect(latestSession?.pretest).toBeDefined();
    expect(latestSession?.pretest?.totalScore).toBe(1);
    expect(latestSession?.pretest?.itemScores['PRE-01']).toBe(1);
    expect(latestSession?.pretest?.itemScores['PRE-02']).toBe(0);
    expect(latestSession?.pretest?.itemScores['PRE-03']).toBe(0);
  });
});

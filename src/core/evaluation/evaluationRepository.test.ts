import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_IMI_FORM_URL,
  EMPTY_TASK_PROGRESS,
  PRETEST_ITEMS,
  POSTEST_ITEMS,
  buildEvaluationPayload,
  fetchParticipantFromSheets,
  generateParticipantCode,
  getImiFormUrl,
  gradeEvaluationAttempt,
  makeTaskProgressSignature,
  mergeTaskProgress,
  parseTasksDetailFromSheets,
  sendEvaluationToGoogleSheets,
  summarizeTaskOutcomes,
  type CompetencyKey,
  type EvaluationAttemptResult,
  type ParticipantSession,
} from './evaluationRepository';
import { ALGORITHMS_CATALOG } from '../algorithms/registry';
import type { TaskAttemptCategory } from '../../components/tasks/InteractiveTaskPanel';

function buildAnswers(
  items: typeof PRETEST_ITEMS,
  mode: 'all_correct' | 'all_wrong'
): EvaluationAttemptResult['rawAnswers'] {
  const answers: EvaluationAttemptResult['rawAnswers'] = {};
  for (const item of items) {
    answers[item.id] = {
      optionIndex:
        mode === 'all_correct'
          ? item.correctOptionIndex
          : (item.correctOptionIndex + 1) % item.options.length,
    };
  }
  return answers;
}

describe('evaluationRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('mantiene 9 reactivos balanceados por competencia (C1=2, C2=3, C3=2, C4=2) en Pretest y Postest', () => {
    const validAlgoIds = new Set(ALGORITHMS_CATALOG.map(a => a.id));

    for (const items of [PRETEST_ITEMS, POSTEST_ITEMS]) {
      expect(items).toHaveLength(9);

      const counts: Record<CompetencyKey, number> = { C1: 0, C2: 0, C3: 0, C4: 0 };
      const ids = new Set<string>();

      items.forEach((item, idx) => {
        expect(item.number).toBe(idx + 1);
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);

        expect(item.options.length).toBeGreaterThanOrEqual(4);
        expect(item.correctOptionIndex).toBeGreaterThanOrEqual(0);
        expect(item.correctOptionIndex).toBeLessThan(item.options.length);
        counts[item.competencyKey] += 1;

        if (item.visualizerScenario) {
          expect(validAlgoIds.has(item.visualizerScenario.algorithmId)).toBe(true);
          expect(item.visualizerScenario.dataset.length).toBeGreaterThan(0);
          if (item.visualizerScenario.compareWithAlgorithmId) {
            expect(validAlgoIds.has(item.visualizerScenario.compareWithAlgorithmId)).toBe(true);
          }
        }
      });

      expect(counts).toEqual({ C1: 2, C2: 3, C3: 2, C4: 2 });
    }

    expect(POSTEST_ITEMS.every(item => Boolean(item.visualizerScenario))).toBe(true);
  });

  it('genera códigos seudonimizados deterministas e insensibles a espacios o mayúsculas', async () => {
    expect(await generateParticipantCode('   ')).toBe('');

    const codeA = await generateParticipantCode('20214567');
    const codeB = await generateParticipantCode('  20214567  ');
    const codeLower = await generateParticipantCode('a2021b');
    const codeUpper = await generateParticipantCode('A2021B');

    expect(codeA).toMatch(/^P-[0-9A-F]{6}$/);
    expect(codeA).toBe(codeB);
    expect(codeLower).toBe(codeUpper);
    expect(codeA).not.toBe(codeUpper);
  });

  it('califica correctamente Pretest y Postest en puntaje total, porcentaje y competencias', () => {
    const allCorrect = gradeEvaluationAttempt(
      PRETEST_ITEMS,
      buildAnswers(PRETEST_ITEMS, 'all_correct'),
      180
    );
    expect(allCorrect.totalScore).toBe(9);
    expect(allCorrect.percentage).toBe(100);
    expect(allCorrect.durationSeconds).toBe(180);
    expect(allCorrect.byCompetency).toEqual({
      C1: { earned: 2, max: 2 },
      C2: { earned: 3, max: 3 },
      C3: { earned: 2, max: 2 },
      C4: { earned: 2, max: 2 },
    });
    expect(Object.values(allCorrect.itemScores).every(v => v === 1)).toBe(true);

    const allWrong = gradeEvaluationAttempt(
      POSTEST_ITEMS,
      buildAnswers(POSTEST_ITEMS, 'all_wrong'),
      210
    );
    expect(allWrong.totalScore).toBe(0);
    expect(allWrong.percentage).toBe(0);
    expect(allWrong.byCompetency).toEqual({
      C1: { earned: 0, max: 2 },
      C2: { earned: 0, max: 3 },
      C3: { earned: 0, max: 2 },
      C4: { earned: 0, max: 2 },
    });
    expect(Object.values(allWrong.itemScores).every(v => v === 0)).toBe(true);

    // Respuesta parcial: acertar solo preguntas de C1 y C3
    const partialAnswers: EvaluationAttemptResult['rawAnswers'] = {};
    for (const item of PRETEST_ITEMS) {
      partialAnswers[item.id] = {
        optionIndex:
          item.competencyKey === 'C1' || item.competencyKey === 'C3'
            ? item.correctOptionIndex
            : null,
      };
    }
    const partial = gradeEvaluationAttempt(PRETEST_ITEMS, partialAnswers, 95);
    expect(partial.totalScore).toBe(4);
    expect(partial.percentage).toBe(44);
    expect(partial.byCompetency.C1.earned).toBe(2);
    expect(partial.byCompetency.C2.earned).toBe(0);
    expect(partial.byCompetency.C3.earned).toBe(2);
    expect(partial.byCompetency.C4.earned).toBe(0);
  });

  it('construye las 31 columnas esperadas por Google Sheets y preserva celdas remotas vacías si no hay intento local', () => {
    const pretest = gradeEvaluationAttempt(
      PRETEST_ITEMS,
      buildAnswers(PRETEST_ITEMS, 'all_wrong'),
      120
    );
    const postest = gradeEvaluationAttempt(
      POSTEST_ITEMS,
      buildAnswers(POSTEST_ITEMS, 'all_correct'),
      240
    );

    const outcomes: Record<string, TaskAttemptCategory> = {
      T01: 'first_attempt',
      T02: 'failed',
      T05: 'second_attempt',
      T10: 'multiple_attempts',
    };

    const session: ParticipantSession = {
      participantId: 'P-1234AB',
      consentedAt: '2026-11-13T10:00:00.000Z',
      startedAt: '2026-11-13T10:00:00.000Z',
      pretest,
      postest,
    };

    const payload = buildEvaluationPayload(session, outcomes, 3);
    expect(Object.keys(payload)).toHaveLength(31);
    expect(payload.pretestTotalScore).toBe(0);
    expect(payload.postestTotalScore).toBe(9);
    expect(payload.gainScore).toBe(9);
    expect(payload.gainPercentagePoints).toBe(100);
    expect(payload.pretestCompetenciesDetail).toBe(
      'Logica:0/2 | Diseno:0/3 | Iteracion:0/2 | Abstraccion:0/2'
    );
    expect(payload.postestCompetenciesDetail).toBe(
      'Logica:2/2 | Diseno:3/3 | Iteracion:2/2 | Abstraccion:2/2'
    );
    expect(payload.tasksCompletedCount).toBe(3);
    expect(payload.tasksFirstAttempt).toBe(1);
    expect(payload.tasksSecondAttempt).toBe(1);
    expect(payload.tasksMultipleAttempts).toBe(1);
    expect(payload.tasksFailed).toBe(1);
    expect(payload.tasksAttemptedTotal).toBe(4);
    expect(payload.tasksDetail).toBe(
      'T01:1er_intento | T02:no_logrado | T05:2do_intento | T10:3er_intento'
    );

    // Al reconectarse desde otro navegador sin puntajes locales, los numéricos deben ir vacíos ('')
    // para que Apps Script no sobrescriba las columnas del Sheet.
    const remoteOnlySession: ParticipantSession = {
      participantId: 'P-1234AB',
      consentedAt: '2026-11-13T10:00:00.000Z',
      startedAt: '2026-11-13T10:05:00.000Z',
      remotePretestCompletedAt: '2026-11-13T10:02:00.000Z',
      remotePostestCompletedAt: '2026-11-13T10:20:00.000Z',
    };
    const remotePayload = buildEvaluationPayload(remoteOnlySession, outcomes, 3);
    expect(remotePayload.pretestCompletedAt).toBe('2026-11-13T10:02:00.000Z');
    expect(remotePayload.postestCompletedAt).toBe('2026-11-13T10:20:00.000Z');
    expect(remotePayload.pretestTotalScore).toBe('');
    expect(remotePayload.postestTotalScore).toBe('');
    expect(remotePayload.gainScore).toBe('');
    expect(remotePayload.pretestItemScores).toBe('');
    expect(remotePayload.tasksCompletedCount).toBe(3);
  });

  it('reconstruye exactamente el progreso de tareas desde tasksDetail (parseTasksDetailFromSheets)', () => {
    expect(parseTasksDetailFromSheets('')).toEqual({
      completedTaskIds: [],
      taskOutcomes: {},
      taskAttemptsById: {},
    });

    const parsed = parseTasksDetailFromSheets(
      'T01:1er_intento | T02:no_logrado | T05:2do_intento | T10:3er_intento | INVALID:desconocido'
    );
    expect(parsed.completedTaskIds).toEqual(['T01', 'T05', 'T10']);
    expect(parsed.taskOutcomes).toEqual({
      T01: 'first_attempt',
      T02: 'failed',
      T05: 'second_attempt',
      T10: 'multiple_attempts',
    });
    expect(parsed.taskAttemptsById).toEqual({
      T01: 0,
      T02: 3,
      T05: 1,
      T10: 2,
    });
    expect(summarizeTaskOutcomes(parsed.taskOutcomes)).toEqual({
      firstAttempt: 1,
      secondAttempt: 1,
      multipleAttempts: 1,
      failed: 1,
      totalAttempted: 4,
    });
  });

  it('consulta y envía sesiones a Google Sheets mediante fetch mockeado sin tocar red real', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      text: async () =>
        JSON.stringify({
          found: true,
          participantId: 'P-7068C7',
          consentedAt: '2026-11-13T05:01:45.677Z',
          pretestCompletedAt: '2026-11-13T05:10:00.000Z',
          postestCompletedAt: '',
          tasksDetail: 'T01:1er_intento | T02:no_logrado',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const record = await fetchParticipantFromSheets('https://example.test/exec', 'P-7068C7');
    expect(record).not.toBeNull();
    expect(record?.found).toBe(true);
    expect(record?.pretestCompletedAt).toBe('2026-11-13T05:10:00.000Z');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('participantId=P-7068C7');

    const sent = await sendEvaluationToGoogleSheets(
      'https://example.test/exec',
      {
        participantId: 'P-7068C7',
        consentedAt: '2026-11-13T05:01:45.677Z',
        startedAt: '2026-11-13T05:01:45.677Z',
      },
      { T01: 'first_attempt' },
      1
    );
    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      mode: 'no-cors',
    });

    fetchMock.mockRejectedValueOnce(new Error('network down'));
    expect(await fetchParticipantFromSheets('https://example.test/exec', 'P-7068C7')).toBeNull();

    fetchMock.mockRejectedValueOnce(new Error('network down'));
    expect(
      await sendEvaluationToGoogleSheets(
        'https://example.test/exec',
        {
          participantId: 'P-7068C7',
          consentedAt: '2026-11-13T05:01:45.677Z',
          startedAt: '2026-11-13T05:01:45.677Z',
        },
        {},
        0
      )
    ).toBe(false);
  });

  it('fusiona el progreso local sin cuenta con el historial remoto sin sobrescribir resultados ya registrados', () => {
    const guest = {
      completedTaskIds: ['T01', 'T02', 'T05'],
      taskOutcomes: {
        T01: 'first_attempt' as TaskAttemptCategory,
        T02: 'first_attempt' as TaskAttemptCategory,
        T05: 'second_attempt' as TaskAttemptCategory,
      },
      taskAttemptsById: { T01: 0, T02: 0, T05: 1, T07: 2 },
    };

    const forNewStudent = mergeTaskProgress(EMPTY_TASK_PROGRESS, guest);
    expect(forNewStudent).toEqual(guest);

    const remoteExisting = parseTasksDetailFromSheets('T01:2do_intento | T02:no_logrado');
    const merged = mergeTaskProgress(remoteExisting, guest);

    // T01 y T02 conservan el resultado remoto ya registrado en Sheets; T05 y el intento parcial T07 se agregan
    expect(merged.taskOutcomes).toEqual({
      T01: 'second_attempt',
      T02: 'failed',
      T05: 'second_attempt',
    });
    expect(merged.completedTaskIds).toEqual(['T01', 'T05']);
    expect(merged.taskAttemptsById).toEqual({
      T01: 1,
      T02: 3,
      T05: 1,
      T07: 2,
    });
    expect(makeTaskProgressSignature(merged)).not.toBe(makeTaskProgressSignature(remoteExisting));
  });

  it('conserva el enlace IMI por defecto aun cuando VITE_IMI_FORM_URL esté vacío o sea inválido', () => {
    vi.stubEnv('VITE_IMI_FORM_URL', '');
    expect(getImiFormUrl()).toBe(DEFAULT_IMI_FORM_URL);

    vi.stubEnv('VITE_IMI_FORM_URL', '   ');
    expect(getImiFormUrl()).toBe(DEFAULT_IMI_FORM_URL);

    vi.stubEnv('VITE_IMI_FORM_URL', 'sin-protocolo');
    expect(getImiFormUrl()).toBe(DEFAULT_IMI_FORM_URL);

    vi.stubEnv('VITE_IMI_FORM_URL', 'https://forms.gle/custom123');
    expect(getImiFormUrl()).toBe('https://forms.gle/custom123');
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  GUIDED_TASKS_REPOSITORY,
  formatStarBadge,
  getTaskStarCount,
} from './tasksRepository';
import { ALGORITHMS_CATALOG } from '../algorithms/registry';
import { instrumentAndTraceStudentCode } from '../ast/astInstrumenter';
import { applyThemeMode, getActiveThemeMode } from '../utils/themeMode';

describe('GUIDED_TASKS_REPOSITORY (21 tareas guiadas)', () => {
  it('contiene exactamente las 21 tareas T01..T21 con metadatos, pistas y preguntas conceptuales válidas', () => {
    expect(GUIDED_TASKS_REPOSITORY).toHaveLength(21);

    const validAlgoIds = new Set(ALGORITHMS_CATALOG.map(a => a.id));
    const difficultyCounts = { Básico: 0, Intermedio: 0, Avanzado: 0 };

    GUIDED_TASKS_REPOSITORY.forEach((task, idx) => {
      const expectedId = `T${String(idx + 1).padStart(2, '0')}`;
      expect(task.id).toBe(expectedId);
      expect(validAlgoIds.has(task.targetAlgorithmId)).toBe(true);
      expect(task.presetDataset.length).toBeGreaterThanOrEqual(4);
      expect(task.breakpointStepIndex).toBeGreaterThanOrEqual(1);

      expect(task.hints).toHaveLength(2);
      expect(task.hints[0].trim().length).toBeGreaterThan(5);
      expect(task.hints[1].trim().length).toBeGreaterThan(5);

      expect(task.conceptualQuestion.options).toHaveLength(3);
      expect([0, 1, 2]).toContain(task.conceptualQuestion.correctIndex);

      difficultyCounts[task.difficulty] += 1;

      const hasValidationMechanism = Boolean(
        task.cExecutableTemplate ||
          task.manualTargetArray ||
          task.arrayPredictionCheck ||
          (task.numericFieldsCheck && task.numericFieldsCheck.length > 0)
      );
      expect(hasValidationMechanism).toBe(true);

      if (task.manualInitialArray && task.manualTargetArray) {
        const sortedInit = [...task.manualInitialArray].sort((a, b) => a - b);
        const sortedTarget = [...task.manualTargetArray].sort((a, b) => a - b);
        expect(sortedTarget).toEqual(sortedInit);
      }

      if (task.arrayPredictionCheck) {
        const sortedInit = [...task.arrayPredictionCheck.initialArray].sort((a, b) => a - b);
        const sortedExpected = [...task.arrayPredictionCheck.expectedArray].sort((a, b) => a - b);
        expect(sortedExpected).toEqual(sortedInit);
      }
    });

    expect(difficultyCounts).toEqual({
      Básico: 4,
      Intermedio: 7,
      Avanzado: 10,
    });
  });

  it('compila y ejecuta con éxito en el motor AST todas las plantillas C con sus soluciones esperadas', () => {
    const templateTasks = GUIDED_TASKS_REPOSITORY.filter(t => Boolean(t.cExecutableTemplate));
    expect(templateTasks.length).toBeGreaterThanOrEqual(8);

    for (const task of templateTasks) {
      let code = task.cExecutableTemplate!;
      const placeholders = Array.from(code.matchAll(/__BLANK_(\d+)__/g)).map(m => Number(m[1]));
      const maxBlank = Math.max(...placeholders);

      expect(task.expectedBlanks).toBeDefined();
      expect(task.expectedBlanks!.length).toBe(maxBlank);

      for (let i = 0; i < maxBlank; i++) {
        const accepted = task.expectedBlanks![i][0];
        expect(accepted.trim().length).toBeGreaterThan(0);
        code = code.replaceAll(`__BLANK_${i + 1}__`, accepted);
      }

      expect(code).not.toMatch(/__BLANK_\d+__/);

      const res = instrumentAndTraceStudentCode(
        code,
        task.presetDataset,
        task.presetSearchTarget
      );
      expect(res.success, `Falló ejecución AST para ${task.id}: ${res.error ?? ''}`).toBe(true);
      expect(res.detectedLanguage).toBe('c');
      expect(res.steps && res.steps.length).toBeGreaterThan(0);
    }
  });

  it('detecta recursión infinita cuando en T21 se usa la condición incorrecta left > right', () => {
    const t21 = GUIDED_TASKS_REPOSITORY.find(t => t.id === 'T21');
    expect(t21?.cExecutableTemplate).toBeDefined();

    const infiniteCode = t21!.cExecutableTemplate!.replaceAll('__BLANK_1__', 'left > right');
    const res = instrumentAndTraceStudentCode(infiniteCode, t21!.presetDataset);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Stack Overflow|recursión infinita/i);
  });

  it('valida los campos numéricos de traza paso a paso en T09 y T12 sin tablas', () => {
    const t09 = GUIDED_TASKS_REPOSITORY.find(t => t.id === 'T09');
    const t12 = GUIDED_TASKS_REPOSITORY.find(t => t.id === 'T12');

    expect(t09?.numericFieldsCheck?.map(f => f.expectedValue)).toEqual([4, 7, 5, 5]);
    expect(t12?.numericFieldsCheck?.map(f => f.expectedValue)).toEqual([2, 1, 0, -1]);
    expect(t09?.prompt.toLowerCase()).not.toContain('tabla');
    expect(t12?.prompt.toLowerCase()).not.toContain('tabla');
  });

  it('incorpora los descriptores de competencias refinados según el juicio de expertos (R1.1) y el sistema de estrellas por nivel (H7 / A5)', () => {
    for (const task of GUIDED_TASKS_REPOSITORY) {
      expect(task.descriptor).not.toContain('Ensaya el camino');
      expect(task.descriptor).not.toContain('orden lógico de las órdenes');
      expect(task.descriptor).not.toContain('una cantidad de veces');
      expect(task.descriptor).not.toContain('instrucciones que llevan a otra instrucción');
      expect(task.descriptor).not.toBe('Selecciona instrucciones finitas');
    }

    const outcomes = {
      T01: 'first_attempt' as const,
      T02: 'second_attempt' as const,
      T03: 'multiple_attempts' as const,
      T04: 'failed' as const,
    };
    const completed = ['T01', 'T02', 'T03'];

    expect(getTaskStarCount('T01', completed, outcomes)).toBe(3);
    expect(formatStarBadge(getTaskStarCount('T01', completed, outcomes))).toBe('★★★');
    expect(getTaskStarCount('T02', completed, outcomes)).toBe(2);
    expect(formatStarBadge(getTaskStarCount('T02', completed, outcomes))).toBe('★★☆');
    expect(getTaskStarCount('T03', completed, outcomes)).toBe(1);
    expect(formatStarBadge(getTaskStarCount('T03', completed, outcomes))).toBe('★☆☆');
    expect(getTaskStarCount('T04', completed, outcomes)).toBe(0);
    expect(formatStarBadge(getTaskStarCount('T04', completed, outcomes))).toBe('☆☆☆');

    applyThemeMode('light', true);
    expect(getActiveThemeMode()).toBe('light');
    if (typeof document !== 'undefined') {
      expect(document.documentElement.dataset.theme).toBe('light');
    }

    applyThemeMode('dark', true);
    expect(getActiveThemeMode()).toBe('dark');
    if (typeof document !== 'undefined') {
      expect(document.documentElement.dataset.theme).toBe('dark');
    }
  });
});

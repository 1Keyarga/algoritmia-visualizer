import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GUIDED_TASKS_REPOSITORY, type GuidedTask } from '../../core/tasks/tasksRepository';
import { instrumentAndTraceStudentCode } from '../../core/ast/astInstrumenter';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';
import type { Step } from '../../types/trace';
import { StepExplanation } from '../pseudocode/StepExplanation';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export type TaskAttemptCategory =
  | 'first_attempt'
  | 'second_attempt'
  | 'multiple_attempts'
  | 'failed';

interface InteractiveTaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTaskScenario: (
    algorithmId: string,
    dataset: number[],
    searchTarget?: number,
    enablePredictionMode?: boolean,
    initialStepIndex?: number
  ) => void;
  onUnlockTaskExecution: (customAstSteps?: Step[]) => void;
  completedTaskIds: string[];
  onMarkTaskCompleted: (taskId: string) => void;
  taskOutcomes?: Record<string, TaskAttemptCategory>;
  onRecordTaskOutcome?: (taskId: string, category: TaskAttemptCategory) => void;
  taskAttemptsById?: Record<string, number>;
  onRecordTaskAttempt?: (taskId: string, attemptsUsed: number) => void;
  isPredictionModeActive: boolean;
  onTogglePredictionMode: () => void;
  selectedTaskId: string;
  onSelectTaskId: (taskId: string) => void;
  isTaskUnlocked: boolean;
  algorithm: AlgorithmMetadata;
  currentStep: Step | null;
  stepIndex: number;
  totalSteps: number;
  selectedLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
}

/**
 * Envuelve arreglos ({6, 3, 8, 1, 5}), accesos indexados (arr[j + 1]) y expresiones
 * cortas (n = 5, i = 0) en bloques indivisibles para que nunca se partan a mitad de línea.
 */
function renderCleanPrompt(text: string): React.ReactNode {
  const cleaned = text.replace(/\bint\s+arr\[\]\s*=\s*/g, '');
  const tokenRegex =
    /\{[0-9,\s]+\}|\[[0-9,\s.]+\]|\b(?:arr|left|right|result)\[[^\]]+\]|\b(?:mid\s*=\s*)?(?:piso|techo|log2|particionar)\((?:[^()]|\([^()]*\))*\)|\b(?:[nij]|mid|pi|inicio|fin|clave|target|pivote)\s*=\s*(?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\s*\.\.\s*[n0-9\s\-+]+)?/g;

  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;

  for (const match of cleaned.matchAll(tokenRegex)) {
    const startIdx = match.index ?? 0;
    if (startIdx > lastIdx) {
      nodes.push(
        <React.Fragment key={`t-${lastIdx}`}>
          {cleaned.slice(lastIdx, startIdx)}
        </React.Fragment>
      );
    }
    const token = match[0];
    nodes.push(
      <code
        key={`c-${startIdx}`}
        className="whitespace-nowrap inline-block font-mono text-[11px] bg-[#121525] text-indigo-200 px-1.5 py-0.2 rounded border border-[#272c48] mx-0.5 leading-snug"
      >
        {token}
      </code>
    );
    lastIdx = startIdx + token.length;
  }

  if (lastIdx < cleaned.length) {
    nodes.push(
      <React.Fragment key={`t-${lastIdx}`}>{cleaned.slice(lastIdx)}</React.Fragment>
    );
  }

  return nodes;
}

interface InteractiveTaskBodyProps extends InteractiveTaskPanelProps {
  currentTask: GuidedTask;
}

export const InteractiveTaskPanel: React.FC<InteractiveTaskPanelProps> = props => {
  if (!props.isOpen) return null;

  const currentTask =
    GUIDED_TASKS_REPOSITORY.find(t => t.id === props.selectedTaskId) || GUIDED_TASKS_REPOSITORY[0];

  return <InteractiveTaskBody key={currentTask.id} {...props} currentTask={currentTask} />;
};

const InteractiveTaskBody: React.FC<InteractiveTaskBodyProps> = ({
  currentTask,
  onLoadTaskScenario,
  onUnlockTaskExecution,
  completedTaskIds,
  onMarkTaskCompleted,
  taskOutcomes = {},
  onRecordTaskOutcome,
  taskAttemptsById = {},
  onRecordTaskAttempt,
  onSelectTaskId,
  isTaskUnlocked,
  algorithm,
  currentStep,
  stepIndex,
  totalSteps,
  selectedLanguage,
  onChangeLanguage,
}) => {
  const [levelFilter, setLevelFilter] = useState<'Básico' | 'Intermedio' | 'Avanzado'>(
    currentTask.difficulty
  );
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'activity' | 'code'>('activity');
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [blankInputs, setBlankInputs] = useState<string[]>(() =>
    Array(currentTask.expectedBlanks ? currentTask.expectedBlanks.length : 0).fill('')
  );
  const [astCompileSummary, setAstCompileSummary] = useState<string | null>(null);

  const [manualArray, setManualArray] = useState<number[]>(() =>
    currentTask.manualInitialArray ? [...currentTask.manualInitialArray] : []
  );
  const [selectedSwapIdx, setSelectedSwapIdx] = useState<number | null>(null);
  const [manualExtraInput, setManualExtraInput] = useState<string>('');

  const [predictedArrayInputs, setPredictedArrayInputs] = useState<string[]>(() =>
    currentTask.arrayPredictionCheck
      ? currentTask.arrayPredictionCheck.initialArray.map(v => String(v))
      : []
  );
  const [predictedExtraInput, setPredictedExtraInput] = useState<string>('');

  const [traceRowsInputs, setTraceRowsInputs] = useState<string[][]>(() =>
    currentTask.traceTableCheck
      ? currentTask.traceTableCheck.expectedRows.map(() => ['', '', ''])
      : []
  );
  const [traceExtraInput, setTraceExtraInput] = useState<string>('');

  const [numericInputs, setNumericInputs] = useState<string[]>(() =>
    Array(currentTask.numericFieldsCheck ? currentTask.numericFieldsCheck.length : 0).fill('')
  );
  const [selectedConceptOption, setSelectedConceptOption] = useState<number | null>(null);

  const [attemptsUsed, setAttemptsUsed] = useState<number>(() =>
    Math.min(3, Math.max(0, taskAttemptsById[currentTask.id] ?? 0))
  );
  const [manualHintLevel, setManualHintLevel] = useState<number>(0);

  const [verificationState, setVerificationState] = useState<{
    checked: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTaskMenuOpen(false);
      }
    };
    if (isTaskMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTaskMenuOpen]);

  const filteredTasks = useMemo(() => {
    return GUIDED_TASKS_REPOSITORY.filter(t => t.difficulty === levelFilter);
  }, [levelFilter]);

  const isCodeCompletionTask = currentTask.interactionType === 'Completar código';
  const isCodeTabSpoiled =
    isCodeCompletionTask && !isTaskUnlocked && !completedTaskIds.includes(currentTask.id);

  const formattedSnippet = useMemo(() => {
    const parts = currentTask.codeSnippet.split('____');
    return parts
      .map((part, idx) => (idx < parts.length - 1 ? `${part}[BLANCO_${idx + 1}]` : part))
      .join('');
  }, [currentTask.codeSnippet]);

  useEffect(() => {
    onLoadTaskScenario(
      currentTask.targetAlgorithmId,
      currentTask.presetDataset,
      currentTask.presetSearchTarget,
      false,
      currentTask.breakpointStepIndex
    );
  }, [currentTask, onLoadTaskScenario]);

  const currentIndexInFiltered = filteredTasks.findIndex(t => t.id === currentTask.id);

  const handlePrevTask = () => {
    if (currentIndexInFiltered > 0) {
      onSelectTaskId(filteredTasks[currentIndexInFiltered - 1].id);
    }
  };

  const handleNextTask = () => {
    if (currentIndexInFiltered < filteredTasks.length - 1) {
      onSelectTaskId(filteredTasks[currentIndexInFiltered + 1].id);
    }
  };

  const normalizeCodeToken = (str: string) =>
    str
      .replace(/\s+/g, '')
      .replace(/;$/g, '')
      .toLowerCase();

  const handleManualCellClick = (idx: number) => {
    if (selectedSwapIdx === null) {
      setSelectedSwapIdx(idx);
    } else if (selectedSwapIdx === idx) {
      setSelectedSwapIdx(null);
    } else {
      const nextArr = [...manualArray];
      const temp = nextArr[selectedSwapIdx];
      nextArr[selectedSwapIdx] = nextArr[idx];
      nextArr[idx] = temp;
      setManualArray(nextArr);
      setSelectedSwapIdx(null);
      setVerificationState(null);
    }
  };

  const registerFailedAttempt = (errorMessage: string) => {
    const nextAttempts = Math.min(3, attemptsUsed + 1);
    setAttemptsUsed(nextAttempts);
    onRecordTaskAttempt?.(currentTask.id, nextAttempts);
    const exhausted = nextAttempts >= 3;
    if (exhausted) {
      if (!completedTaskIds.includes(currentTask.id) && !taskOutcomes[currentTask.id]) {
        onRecordTaskOutcome?.(currentTask.id, 'failed');
      }
      onUnlockTaskExecution();
    }
    setVerificationState({
      checked: true,
      isCorrect: false,
      message: exhausted
        ? `${errorMessage} Se agotaron los 3 intentos y se desbloqueó la traza completa.`
        : `${errorMessage} (Intento ${nextAttempts} de 3).`,
    });
  };

  const registerSuccess = (successMessage: string, customAstSteps?: Step[]) => {
    const alreadyFailed =
      attemptsUsed >= 3 || taskOutcomes[currentTask.id] === 'failed';
    const hasRecordedOutcome = !!taskOutcomes[currentTask.id];
    if (!alreadyFailed && !hasRecordedOutcome) {
      const attemptNumber = attemptsUsed + 1;
      const category: TaskAttemptCategory =
        attemptNumber === 1
          ? 'first_attempt'
          : attemptNumber === 2
          ? 'second_attempt'
          : 'multiple_attempts';
      onRecordTaskOutcome?.(currentTask.id, category);
      onMarkTaskCompleted(currentTask.id);
    }
    onUnlockTaskExecution(customAstSteps);
    setVerificationState({
      checked: true,
      isCorrect: true,
      message: alreadyFailed
        ? `${successMessage} Traza completa habilitada (se conserva el registro previo de intentos agotados).`
        : `${successMessage} La ejecución completa ha sido desbloqueada.`,
    });
  };

  const handleVerifyTask = () => {
    if (selectedConceptOption === null) {
      setVerificationState({
        checked: true,
        isCorrect: false,
        message: 'Selecciona una alternativa en la pregunta conceptual antes de verificar.',
      });
      return;
    }

    const conceptMatches = selectedConceptOption === currentTask.conceptualQuestion.correctIndex;

    if (currentTask.interactionType === 'Completar código' && currentTask.expectedBlanks) {
      const anyEmpty = blankInputs.some(b => !b.trim());
      if (anyEmpty) {
        setVerificationState({
          checked: true,
          isCorrect: false,
          message: 'Completa los espacios en blanco del código antes de verificar.',
        });
        return;
      }

      let astDiagnostic = '';
      let astSuccess = true;
      let generatedAstSteps: Step[] | undefined = undefined;

      if (currentTask.cExecutableTemplate) {
        let compiledC = currentTask.cExecutableTemplate;
        blankInputs.forEach((val, idx) => {
          compiledC = compiledC.replace(`__BLANK_${idx + 1}__`, val.trim());
        });

        const astResult = instrumentAndTraceStudentCode(compiledC, currentTask.presetDataset);
        if (!astResult.success) {
          astSuccess = false;
          astDiagnostic = astResult.error || 'Error de ejecución';
          setAstCompileSummary(astDiagnostic);
        } else {
          generatedAstSteps = astResult.steps;
          const lastStep = astResult.steps?.[astResult.steps.length - 1];
          const finalArr = lastStep?.array.map(e => e.value).join(', ') || '';
          astDiagnostic = `Resultado final: [${finalArr}] (${astResult.steps?.length || 0} pasos).`;
          setAstCompileSummary(astDiagnostic);
        }
      }

      const allBlanksMatch = currentTask.expectedBlanks.every((acceptedList, idx) => {
        const studentVal = normalizeCodeToken(blankInputs[idx] || '');
        return acceptedList.some(acc => normalizeCodeToken(acc) === studentVal);
      });

      if (allBlanksMatch && astSuccess && conceptMatches) {
        registerSuccess('Respuesta correcta.', generatedAstSteps);
      } else if (!astSuccess) {
        registerFailedAttempt(`La expresión produjo un fallo (${astDiagnostic}).`);
      } else if (!allBlanksMatch) {
        registerFailedAttempt('La expresión ingresada en el código no es correcta.');
      } else {
        registerFailedAttempt('El código es correcto, pero la alternativa conceptual no coincide.');
      }
      return;
    }

    if (currentTask.interactionType === 'Construcción manual' && currentTask.manualTargetArray) {
      const arrayMatches =
        manualArray.length === currentTask.manualTargetArray.length &&
        manualArray.every((val, i) => val === currentTask.manualTargetArray![i]);

      const extraMatches = currentTask.manualExtraField
        ? Number(manualExtraInput.trim()) === currentTask.manualExtraField.expectedValue &&
          manualExtraInput.trim() !== ''
        : true;

      if (arrayMatches && extraMatches && conceptMatches) {
        registerSuccess('Respuesta correcta.');
      } else if (!arrayMatches) {
        registerFailedAttempt(
          `El arreglo [${manualArray.join(', ')}] no coincide con el estado esperado.`
        );
      } else if (!extraMatches) {
        registerFailedAttempt('El arreglo es correcto, pero el valor numérico indicado no coincide.');
      } else {
        registerFailedAttempt('La construcción es correcta, pero la alternativa conceptual no coincide.');
      }
      return;
    }

    if (currentTask.arrayPredictionCheck) {
      const { expectedArray, expectedExtraValue } = currentTask.arrayPredictionCheck;
      const studentNums = predictedArrayInputs.map(v => Number(v.trim()));
      const arrayMatches =
        studentNums.length === expectedArray.length &&
        predictedArrayInputs.every(v => v.trim() !== '' && !Number.isNaN(Number(v.trim()))) &&
        studentNums.every((val, idx) => val === expectedArray[idx]);

      const extraMatches =
        predictedExtraInput.trim() !== '' &&
        Number(predictedExtraInput.trim()) === expectedExtraValue;

      if (arrayMatches && extraMatches && conceptMatches) {
        registerSuccess('Respuesta correcta.');
      } else if (!arrayMatches) {
        registerFailedAttempt(
          `El arreglo [${studentNums.join(', ')}] no coincide con el resultado de la operación.`
        );
      } else if (!extraMatches) {
        registerFailedAttempt('El arreglo es correcto, pero el valor de (b) no coincide.');
      } else {
        registerFailedAttempt('Los valores numéricos son correctos, pero la alternativa conceptual no coincide.');
      }
      return;
    }

    if (currentTask.traceTableCheck) {
      const { expectedRows, expectedExtraValue } = currentTask.traceTableCheck;
      let firstWrongRow = -1;

      for (let r = 0; r < expectedRows.length; r++) {
        const rowInputs = traceRowsInputs[r] || ['', '', ''];
        const matchesRow = expectedRows[r].every(
          (expVal, c) =>
            rowInputs[c] !== undefined &&
            rowInputs[c].trim() !== '' &&
            Number(rowInputs[c].trim()) === expVal
        );
        if (!matchesRow) {
          firstWrongRow = r + 1;
          break;
        }
      }

      const extraMatches =
        traceExtraInput.trim() !== '' &&
        Number(traceExtraInput.trim()) === expectedExtraValue;

      if (firstWrongRow === -1 && extraMatches && conceptMatches) {
        registerSuccess('Respuesta correcta.');
      } else if (firstWrongRow !== -1) {
        registerFailedAttempt(`Revisa los punteros en el Paso ${firstWrongRow} de la tabla.`);
      } else if (!extraMatches) {
        registerFailedAttempt('La tabla es correcta, pero el valor retornado no coincide.');
      } else {
        registerFailedAttempt('La traza es correcta, pero la alternativa conceptual no coincide.');
      }
      return;
    }

    if (currentTask.numericFieldsCheck) {
      let wrongIdx = -1;
      currentTask.numericFieldsCheck.forEach((field, idx) => {
        const raw = (numericInputs[idx] || '').trim();
        if (wrongIdx === -1 && (raw === '' || Number(raw) !== field.expectedValue)) {
          wrongIdx = idx;
        }
      });

      if (wrongIdx === -1 && conceptMatches) {
        registerSuccess('Respuesta correcta.');
      } else if (wrongIdx !== -1) {
        registerFailedAttempt(
          `El valor en "${currentTask.numericFieldsCheck[wrongIdx].label}" no es exacto.`
        );
      } else {
        registerFailedAttempt('Los valores numéricos son correctos, pero la alternativa conceptual no coincide.');
      }
    }
  };

  const isCompleted = completedTaskIds.includes(currentTask.id);
  const currentOutcome = taskOutcomes[currentTask.id];
  const unlockedHintsCount = Math.max(attemptsUsed, manualHintLevel);
  const showFullCriteria =
    verificationState?.isCorrect === true || attemptsUsed >= 3 || isCompleted;

  const languages: { id: SupportedLanguage; label: string }[] = [
    { id: 'pseudocode', label: 'Pseudocódigo' },
    { id: 'python', label: 'Python' },
    { id: 'cpp', label: 'C++' },
    { id: 'java', label: 'Java' },
  ];
  const codeLines = algorithm.codeByLanguage[selectedLanguage] || [];
  const activeLineForSelectedLang =
    currentStep?.activeLineByLang?.[selectedLanguage] || currentStep?.activeLine || 0;

  // Lucecita de estado para cada tarea (verde = resuelta, ámbar = intentos agotados, gris = pendiente)
  const renderStatusDot = (taskId: string) => {
    const done = completedTaskIds.includes(taskId);
    const outcome = taskOutcomes[taskId];
    if (done || (outcome && outcome !== 'failed')) {
      return (
        <span
          className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)] shrink-0"
          title="Completada"
        />
      );
    }
    if (outcome === 'failed') {
      return (
        <span
          className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0"
          title="Intentos agotados"
        />
      );
    }
    return <span className="w-2 h-2 rounded-full bg-[#2e334d] shrink-0" title="Pendiente" />;
  };

  return (
    <aside className="w-[410px] lg:w-[460px] xl:w-[500px] bg-[#141520] border-r border-[#232532] flex flex-col min-h-0 shrink-0 select-none z-20 overflow-hidden">
      {/* Cabecera: Actividad / Código + Indicador de posición en el nivel */}
      <div className="h-11 px-3.5 bg-[#161826] border-b border-[#232638] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-[#10121c] p-0.5 rounded-md border border-[#222538]">
          <button
            onClick={() => setActiveWorkspaceTab('activity')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              activeWorkspaceTab === 'activity'
                ? 'bg-[#232741] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Actividad
          </button>
          <button
            onClick={() => {
              if (!isCodeTabSpoiled) setActiveWorkspaceTab('code');
            }}
            disabled={isCodeTabSpoiled}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
              isCodeTabSpoiled
                ? 'text-slate-600 cursor-not-allowed'
                : activeWorkspaceTab === 'code'
                ? 'bg-[#232741] text-white font-semibold cursor-pointer'
                : 'text-slate-400 hover:text-slate-200 cursor-pointer'
            }`}
            title={
              isCodeTabSpoiled
                ? 'Disponible al resolver la actividad'
                : 'Ver código sincronizado con el visualizador'
            }
          >
            Código
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          {currentIndexInFiltered + 1} / {filteredTasks.length}
        </span>
      </div>

      {/* Selector por niveles (Básico, Intermedio, Avanzado) y menú desplegable propio */}
      <div className="p-3 bg-[#151724] border-b border-[#232638] flex flex-col gap-2 shrink-0 min-w-0">
        <div className="grid grid-cols-3 gap-1 bg-[#10121c] p-1 rounded-lg border border-[#222538]">
          {(['Básico', 'Intermedio', 'Avanzado'] as const).map(lvl => {
            const levelTasks = GUIDED_TASKS_REPOSITORY.filter(t => t.difficulty === lvl);
            const solvedCount = levelTasks.filter(t => completedTaskIds.includes(t.id)).length;
            const allSolved = solvedCount === levelTasks.length && levelTasks.length > 0;

            return (
              <button
                key={lvl}
                onClick={() => {
                  setLevelFilter(lvl);
                  setIsTaskMenuOpen(false);
                  if (levelTasks[0]) onSelectTaskId(levelTasks[0].id);
                }}
                className={`py-1 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  levelFilter === lvl
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{lvl}</span>
                {allSolved ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)]" />
                ) : (
                  <span
                    className={`text-[10px] font-mono ${
                      levelFilter === lvl ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {solvedCount}/{levelTasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 min-w-0 relative" ref={dropdownRef}>
          <button
            onClick={handlePrevTask}
            disabled={currentIndexInFiltered <= 0}
            className="p-1.5 rounded-lg bg-[#1b1d2e] hover:bg-[#25283e] border border-[#2b2e44] text-slate-300 disabled:opacity-30 cursor-pointer shrink-0"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsTaskMenuOpen(prev => !prev)}
            className="flex-1 min-w-0 bg-[#1b1d2e] hover:bg-[#22253a] border border-[#2b2e44] rounded-lg px-2.5 py-1.5 text-left flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              {renderStatusDot(currentTask.id)}
              <span className="text-xs font-medium text-slate-200 truncate">
                {currentTask.algorithm} — {currentTask.title}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                isTaskMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            onClick={handleNextTask}
            disabled={currentIndexInFiltered >= filteredTasks.length - 1}
            className="p-1.5 rounded-lg bg-[#1b1d2e] hover:bg-[#25283e] border border-[#2b2e44] text-slate-300 disabled:opacity-30 cursor-pointer shrink-0"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Menú desplegable contenido dentro del panel */}
          {isTaskMenuOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#181a28] border border-[#2d314d] rounded-xl shadow-2xl py-1.5 z-50 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {['Ordenamiento', 'Búsqueda', 'Divide y vencerás'].map(fam => {
                const groupTasks = filteredTasks.filter(t => t.family === fam);
                if (groupTasks.length === 0) return null;
                return (
                  <div key={fam} className="px-1.5 py-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      {fam}
                    </div>
                    {groupTasks.map(task => {
                      const isSelected = task.id === currentTask.id;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => {
                            onSelectTaskId(task.id);
                            setIsTaskMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/20 text-indigo-100 font-medium'
                              : 'text-slate-300 hover:bg-[#22253a] hover:text-white'
                          }`}
                        >
                          <div className="mt-1 shrink-0">{renderStatusDot(task.id)}</div>
                          <div className="min-w-0 flex-1 leading-snug">
                            <span className="text-indigo-300 font-medium">{task.algorithm}: </span>
                            <span>{task.title}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VISTA B: CÓDIGO SINCRONIZADO */}
      {activeWorkspaceTab === 'code' && !isCodeTabSpoiled ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#161722]">
          <div className="p-2 bg-[#13141d] border-b border-[#232532]">
            <div className="flex items-center gap-1 bg-[#1a1c27] p-1 rounded-lg border border-[#27293a]">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => onChangeLanguage(lang.id)}
                  className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer text-center ${
                    selectedLanguage === lang.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2.5 font-mono-code text-xs leading-relaxed">
            {codeLines.map(line => {
              const isActive = line.lineNumber === activeLineForSelectedLang;
              return (
                <div
                  key={line.lineNumber}
                  className={`flex items-center px-3 py-1 border-l-4 ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-950/80 text-indigo-100 font-semibold'
                      : 'border-transparent text-slate-300'
                  }`}
                >
                  <span className="w-7 text-right pr-2.5 text-slate-500 text-[11px] shrink-0">
                    {line.lineNumber}
                  </span>
                  <span className="whitespace-pre overflow-x-auto">{line.code || ' '}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#12131b] border-t border-[#232532]">
            <StepExplanation
              currentStep={currentStep}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              activeLineNumber={activeLineForSelectedLang}
            />
          </div>
        </div>
      ) : (
        /* VISTA A: ACTIVIDAD */
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
          {/* Tarjeta 1: Enunciado limpio sin códigos internos ni textos cortados */}
          <div className="bg-[#181a28] border border-[#262940] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {renderStatusDot(currentTask.id)}
                <span className="text-[11px] font-semibold text-indigo-300">
                  {currentTask.algorithm}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] text-slate-400">
                  {currentTask.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentOutcome && (
                  <span
                    className={`text-[10px] font-medium ${
                      currentOutcome === 'failed' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {currentOutcome === 'first_attempt'
                      ? '1.er intento'
                      : currentOutcome === 'second_attempt'
                      ? '2.° intento'
                      : currentOutcome === 'multiple_attempts'
                      ? '3.er intento'
                      : 'No logrado'}
                  </span>
                )}
                <span className="text-[11px] font-mono text-slate-400">
                  Restantes: {Math.max(0, 3 - attemptsUsed)}/3
                </span>
              </div>
            </div>

            <h3 className="text-[13px] font-bold text-slate-100 leading-snug">
              {currentTask.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed select-text">
              {renderCleanPrompt(currentTask.prompt)}
            </p>
          </div>

          {/* Plantilla de código solo cuando la tarea es de completar código */}
          {isCodeCompletionTask && (
            <div className="bg-[#0d0e17] border border-[#22253a] rounded-xl p-3 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Código C/C++
              </div>
              <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed whitespace-pre-wrap select-text">
                {formattedSnippet}
              </pre>
            </div>
          )}

          {/* Tarjeta 2: Resolución práctica */}
          <div className="bg-[#171929] border border-[#292d46] rounded-xl p-3.5 space-y-3">
            {currentTask.interactionType === 'Completar código' && currentTask.expectedBlanks && (
              <div className="space-y-2.5">
                {currentTask.expectedBlanks.map((_, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="block text-[11px] font-mono text-slate-300">
                      [BLANCO_{idx + 1}]:
                    </label>
                    <input
                      type="text"
                      value={blankInputs[idx] || ''}
                      onChange={e => {
                        const next = [...blankInputs];
                        next[idx] = e.target.value;
                        setBlankInputs(next);
                        setVerificationState(null);
                      }}
                      placeholder="Ej. arr[j] > arr[j + 1]"
                      className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}

                {astCompileSummary && (
                  <div className="p-2 rounded-lg bg-[#111320] border border-[#282c46] text-[11px] font-mono text-indigo-200">
                    {astCompileSummary}
                  </div>
                )}
              </div>
            )}

            {currentTask.interactionType === 'Construcción manual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Selecciona dos celdas para intercambiar sus valores:</span>
                  <button
                    onClick={() => {
                      setManualArray(
                        currentTask.manualInitialArray ? [...currentTask.manualInitialArray] : []
                      );
                      setSelectedSwapIdx(null);
                      setVerificationState(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Reiniciar
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 py-1 flex-wrap">
                  {manualArray.map((val, idx) => {
                    const isSelected = selectedSwapIdx === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleManualCellClick(idx)}
                        className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-between p-1.5 font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 -translate-y-0.5'
                            : 'bg-[#111320] hover:bg-[#1b1f33] border-[#2d314d] text-slate-200'
                        }`}
                      >
                        <span className="text-[9px] text-slate-400">[{idx}]</span>
                        <span className="text-sm font-bold">{val}</span>
                      </button>
                    );
                  })}
                </div>

                {currentTask.manualExtraField && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] text-slate-300 leading-snug">
                      {renderCleanPrompt(currentTask.manualExtraField.label)}
                    </label>
                    <input
                      type="number"
                      value={manualExtraInput}
                      onChange={e => {
                        setManualExtraInput(e.target.value);
                        setVerificationState(null);
                      }}
                      placeholder="Valor entero"
                      className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

            {currentTask.arrayPredictionCheck && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>(a) Estado resultante del arreglo:</span>
                  <button
                    onClick={() => {
                      setPredictedArrayInputs(
                        currentTask.arrayPredictionCheck!.initialArray.map(v => String(v))
                      );
                      setVerificationState(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Restaurar
                  </button>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
                  {predictedArrayInputs.map((val, idx) => (
                    <div
                      key={idx}
                      className="bg-[#111320] border border-[#2c304c] rounded-lg p-1.5 flex flex-col items-center"
                    >
                      <span className="text-[9px] font-mono text-slate-400 mb-1">[{idx}]</span>
                      <input
                        type="number"
                        value={val}
                        onChange={e => {
                          const next = [...predictedArrayInputs];
                          next[idx] = e.target.value;
                          setPredictedArrayInputs(next);
                          setVerificationState(null);
                        }}
                        className="w-full bg-[#191c2e] border border-[#343958] rounded text-center text-xs font-mono font-bold text-amber-200 py-1 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300 leading-snug">
                    {renderCleanPrompt(currentTask.arrayPredictionCheck.extraFieldLabel)}
                  </label>
                  <input
                    type="number"
                    value={predictedExtraInput}
                    onChange={e => {
                      setPredictedExtraInput(e.target.value);
                      setVerificationState(null);
                    }}
                    placeholder="Valor numérico"
                    className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {currentTask.traceTableCheck && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-300">
                  Valores de los punteros en cada iteración:
                </div>

                <div className="overflow-x-auto border border-[#2b2f4a] rounded-lg">
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead>
                      <tr className="bg-[#111320] text-slate-400 border-b border-[#2b2f4a]">
                        <th className="py-1.5 px-2">Iteración</th>
                        {currentTask.traceTableCheck.columns.map((col, cIdx) => (
                          <th key={cIdx} className="py-1.5 px-2 text-center">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {traceRowsInputs.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-[#22253a] last:border-b-0">
                          <td className="py-1.5 px-2 text-indigo-300 font-bold">
                            Paso {rIdx + 1}
                          </td>
                          {row.map((cellVal, cIdx) => (
                            <td key={cIdx} className="p-1">
                              <input
                                type="number"
                                value={cellVal}
                                onChange={e => {
                                  const next = traceRowsInputs.map(r => [...r]);
                                  next[rIdx][cIdx] = e.target.value;
                                  setTraceRowsInputs(next);
                                  setVerificationState(null);
                                }}
                                placeholder="0"
                                className="w-full bg-[#10121d] border border-[#2f3452] rounded px-1.5 py-1 text-center text-xs font-bold text-amber-200 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300 leading-snug">
                    {renderCleanPrompt(currentTask.traceTableCheck.extraFieldLabel)}
                  </label>
                  <input
                    type="number"
                    value={traceExtraInput}
                    onChange={e => {
                      setTraceExtraInput(e.target.value);
                      setVerificationState(null);
                    }}
                    placeholder="Valor de retorno"
                    className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {currentTask.numericFieldsCheck && (
              <div className="space-y-2.5">
                {currentTask.numericFieldsCheck.map((field, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="block text-[11px] text-slate-300 leading-snug">
                      {renderCleanPrompt(field.label)}
                    </label>
                    <input
                      type="number"
                      value={numericInputs[idx] || ''}
                      onChange={e => {
                        const next = [...numericInputs];
                        next[idx] = e.target.value;
                        setNumericInputs(next);
                        setVerificationState(null);
                      }}
                      placeholder="Valor numérico"
                      className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tarjeta 3: Pregunta conceptual */}
          <div className="bg-[#171929] border border-[#292d46] rounded-xl p-3.5 space-y-2.5">
            <p className="text-xs font-medium text-slate-200 leading-relaxed">
              {renderCleanPrompt(currentTask.conceptualQuestion.question)}
            </p>
            <div className="space-y-1.5">
              {currentTask.conceptualQuestion.options.map((opt, idx) => {
                const isSelected = selectedConceptOption === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedConceptOption(idx);
                      setVerificationState(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs leading-relaxed transition-colors cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 font-medium'
                        : 'bg-[#111320] hover:bg-[#191c2e] border-[#282c46] text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-600 text-white font-bold'
                          : 'border-slate-500 text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-relaxed">{renderCleanPrompt(opt)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pistas desplegadas */}
          {unlockedHintsCount > 0 && (
            <div className="space-y-1.5">
              {unlockedHintsCount >= 1 && (
                <div className="p-2.5 rounded-lg bg-[#181b2c] border border-amber-500/30 text-[11px] text-slate-200 leading-relaxed">
                  <span className="font-semibold text-amber-300">Pista 1: </span>
                  {renderCleanPrompt(currentTask.hints[0])}
                </div>
              )}
              {unlockedHintsCount >= 2 && (
                <div className="p-2.5 rounded-lg bg-[#181b2c] border border-indigo-500/30 text-[11px] text-slate-200 leading-relaxed">
                  <span className="font-semibold text-indigo-300">Pista 2: </span>
                  {renderCleanPrompt(currentTask.hints[1])}
                </div>
              )}
            </div>
          )}

          {/* Barra de acción: Verificar + Pista discreta */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyTask}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Verificar respuesta
            </button>

            {unlockedHintsCount < 2 && (
              <button
                type="button"
                onClick={() =>
                  setManualHintLevel(prev => Math.min(2, Math.max(prev, unlockedHintsCount) + 1))
                }
                className="px-3 py-2.5 rounded-lg bg-[#1b1e30] hover:bg-[#242840] border border-[#2d3250] text-slate-300 text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                Pista ({unlockedHintsCount}/2)
              </button>
            )}
          </div>

          {/* Retroalimentación */}
          {verificationState && (
            <div
              className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                verificationState.isCorrect
                  ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/35 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="font-semibold">{verificationState.message}</div>

              {showFullCriteria && (
                <div className="pt-1.5 border-t border-white/10 text-[11px] text-slate-200 leading-relaxed select-text">
                  {renderCleanPrompt(currentTask.expectedCriteria)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

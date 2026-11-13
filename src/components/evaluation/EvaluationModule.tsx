import React, { useState, useEffect } from 'react';
import {
  PRETEST_ITEMS,
  POSTEST_ITEMS,
  DEFAULT_SHEETS_WEBHOOK_URL,
  EMPTY_TASK_PROGRESS,
  generateParticipantCode,
  gradeEvaluationAttempt,
  sendEvaluationToGoogleSheets,
  fetchParticipantFromSheets,
  parseTasksDetailFromSheets,
  loadSavedParticipantSession,
  removeSavedParticipantSession,
  readGuestTaskProgress,
  clearGuestTaskProgress,
  readParticipantTaskProgress,
  mergeTaskProgress,
  makeTaskProgressSignature,
  type EvaluationItem,
  type ParticipantSession,
  type EvaluationAttemptResult,
  type PostestVisualizerScenario,
  type TaskProgressState,
} from '../../core/evaluation/evaluationRepository';
import type { TaskAttemptCategory } from '../tasks/InteractiveTaskPanel';
import type { AlgorithmMetadata, SupportedLanguage } from '../../types/algorithm';
import type { Step } from '../../types/trace';
import { StepExplanation } from '../pseudocode/StepExplanation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EvaluationModuleProps {
  session: ParticipantSession | null;
  onUpdateSession: (next: ParticipantSession | null) => void;
  onApplyRemoteTaskProgress?: (
    participantId: string,
    progress: TaskProgressState,
    markAsSynced?: boolean
  ) => void;
  taskOutcomes: Record<string, TaskAttemptCategory>;
  completedTasksCount: number;
  onGoToGuidedTasks: () => void;
  onPostestScenarioChange?: (
    isPostestActive: boolean,
    scenario?: PostestVisualizerScenario
  ) => void;
  algorithm?: AlgorithmMetadata;
  currentStep?: Step | null;
  stepIndex?: number;
  totalSteps?: number;
  selectedLanguage?: SupportedLanguage;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
}

function renderCleanText(text: string): React.ReactNode {
  const tokenRegex =
    /(\{[0-9,\s]+\}|\[[0-9a-zA-Z,\s.+-]+\]|\([nijklowhigm\s=0-9+/,-]+\)|\b(?:arr|left|right|result)\[[^\]]+\]|\b(?:mid|particionar|mergeSort|quickSort|binarySearch|merge|swap)\([^)]*\)|\b(?:low|high|mid|left|right|pi|min_idx|swapped|clave|target|bajo|alto)\b|\b[nij]\s*==?\s*[0-9a-zA-Z+-]+|\bO\([^)]+\))/g;

  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (tokenRegex.test(part)) {
      tokenRegex.lastIndex = 0;
      return (
        <code
          key={idx}
          className="whitespace-nowrap inline-block font-mono text-[11px] bg-[#121525] text-indigo-200 px-1 py-px rounded border border-[#272c48] leading-snug"
        >
          {part}
        </code>
      );
    }
    tokenRegex.lastIndex = 0;
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function createEmptyAnswers(items: EvaluationItem[]): EvaluationAttemptResult['rawAnswers'] {
  const initial: EvaluationAttemptResult['rawAnswers'] = {};
  items.forEach(item => {
    initial[item.id] = {
      optionIndex: null,
    };
  });
  return initial;
}

function isItemAnswered(
  _item: EvaluationItem,
  ans?: EvaluationAttemptResult['rawAnswers'][string]
): boolean {
  return !!ans && ans.optionIndex !== null && ans.optionIndex !== undefined;
}

export const EvaluationModule: React.FC<EvaluationModuleProps> = ({
  session,
  onUpdateSession,
  onApplyRemoteTaskProgress,
  taskOutcomes,
  completedTasksCount,
  onGoToGuidedTasks,
  onPostestScenarioChange,
  algorithm,
  currentStep,
  stepIndex = 0,
  totalSteps = 0,
  selectedLanguage = 'pseudocode',
  onChangeLanguage,
}) => {
  const [rawStudentCode, setRawStudentCode] = useState('');
  const [previewHash, setPreviewHash] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isCheckingRemote, setIsCheckingRemote] = useState(false);

  const [activeExam, setActiveExam] = useState<'pretest' | 'postest' | null>(
    () => session?.inProgressAnswers?.testType ?? null
  );
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [examStartedAtMs, setExamStartedAtMs] = useState<number>(
    () => session?.inProgressAnswers?.startedAtMs ?? Date.now()
  );
  const [answers, setAnswers] = useState<EvaluationAttemptResult['rawAnswers']>(
    () => session?.inProgressAnswers?.answers ?? {}
  );
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [postestPanelTab, setPostestPanelTab] = useState<'question' | 'code'>('question');

  const displayedPreviewHash = rawStudentCode.trim() ? previewHash : '';

  useEffect(() => {
    let cancelled = false;
    if (!rawStudentCode.trim()) {
      return;
    }
    generateParticipantCode(rawStudentCode).then(code => {
      if (!cancelled) setPreviewHash(code);
    });
    return () => {
      cancelled = true;
    };
  }, [rawStudentCode]);

  // Sincronizar automáticamente el visualizador cuando el estudiante está en el Postest
  useEffect(() => {
    if (!onPostestScenarioChange) return;
    if (activeExam === 'postest') {
      const currentItem = POSTEST_ITEMS[currentQuestionIdx];
      onPostestScenarioChange(true, currentItem?.visualizerScenario);
    } else {
      onPostestScenarioChange(false, undefined);
    }
  }, [activeExam, currentQuestionIdx, onPostestScenarioChange]);

  // Limpiar estado del visualizador sincronizado al desmontar Evaluación
  useEffect(() => {
    return () => {
      onPostestScenarioChange?.(false, undefined);
    };
  }, [onPostestScenarioChange]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCheckingRemote) return;
    if (rawStudentCode.trim().length < 3) {
      setLoginError('Ingresa un código válido (al menos 3 caracteres).');
      return;
    }
    if (!consentChecked) {
      setLoginError('Debes aceptar el consentimiento informado para continuar.');
      return;
    }

    setIsCheckingRemote(true);
    try {
      const participantId = await generateParticipantCode(rawStudentCode);
      const localSaved = loadSavedParticipantSession(participantId);
      const guestTasks = readGuestTaskProgress();
      const hasGuestProgress =
        guestTasks.completedTaskIds.length > 0 ||
        Object.keys(guestTasks.taskOutcomes).length > 0 ||
        Object.keys(guestTasks.taskAttemptsById).length > 0;
      const remote = await fetchParticipantFromSheets(
        DEFAULT_SHEETS_WEBHOOK_URL,
        participantId
      );
      const nowIso = new Date().toISOString();

      let nextSession: ParticipantSession;
      if (remote !== null) {
        if (remote.found) {
          const parsedTasks = parseTasksDetailFromSheets(remote.tasksDetail || '');
          const mergedTasks = mergeTaskProgress(parsedTasks, guestTasks);
          const didGuestAddTaskChanges =
            makeTaskProgressSignature(mergedTasks) !== makeTaskProgressSignature(parsedTasks);
          if (hasGuestProgress) {
            clearGuestTaskProgress();
          }
          onApplyRemoteTaskProgress?.(participantId, mergedTasks, !didGuestAddTaskChanges);
          const keepLocalPre =
            !!remote.pretestCompletedAt &&
            localSaved?.pretest?.completedAt === remote.pretestCompletedAt;
          const keepLocalPos =
            !!remote.postestCompletedAt &&
            localSaved?.postest?.completedAt === remote.postestCompletedAt;
          nextSession = {
            participantId,
            consentedAt: remote.consentedAt || localSaved?.consentedAt || nowIso,
            startedAt: localSaved?.startedAt || nowIso,
            pretest: keepLocalPre ? localSaved?.pretest : undefined,
            postest: keepLocalPos ? localSaved?.postest : undefined,
            remotePretestCompletedAt: remote.pretestCompletedAt || undefined,
            remotePostestCompletedAt: remote.postestCompletedAt || undefined,
            inProgressAnswers:
              remote.pretestCompletedAt && remote.postestCompletedAt
                ? undefined
                : localSaved?.inProgressAnswers,
          };
        } else {
          removeSavedParticipantSession(participantId);
          const initialTasks = mergeTaskProgress(EMPTY_TASK_PROGRESS, guestTasks);
          if (hasGuestProgress) {
            clearGuestTaskProgress();
          }
          onApplyRemoteTaskProgress?.(participantId, initialTasks, true);
          nextSession = {
            participantId,
            consentedAt: nowIso,
            startedAt: nowIso,
          };
          void sendEvaluationToGoogleSheets(
            DEFAULT_SHEETS_WEBHOOK_URL,
            nextSession,
            initialTasks.taskOutcomes,
            initialTasks.completedTaskIds.length
          );
        }
      } else {
        // Respaldo local cuando no hay conexión o doGet aún no está desplegado
        const savedParticipantTasks = readParticipantTaskProgress(participantId);
        const offlineTasks = mergeTaskProgress(savedParticipantTasks, guestTasks);
        if (hasGuestProgress) {
          clearGuestTaskProgress();
        }
        onApplyRemoteTaskProgress?.(participantId, offlineTasks, false);
        nextSession = localSaved
          ? localSaved
          : {
              participantId,
              consentedAt: nowIso,
              startedAt: nowIso,
            };
      }

      setLoginError(null);
      setRawStudentCode('');
      onUpdateSession(nextSession);
    } finally {
      setIsCheckingRemote(false);
    }
  };

  const handleOpenExam = (type: 'pretest' | 'postest') => {
    if (!session) return;
    if (type === 'pretest' && (session.pretest || session.remotePretestCompletedAt)) return;
    if (type === 'postest' && (session.postest || session.remotePostestCompletedAt)) return;
    const items = type === 'pretest' ? PRETEST_ITEMS : POSTEST_ITEMS;
    const initialAns =
      session.inProgressAnswers?.testType === type
        ? session.inProgressAnswers.answers
        : createEmptyAnswers(items);
    const startedMs =
      session.inProgressAnswers?.testType === type
        ? session.inProgressAnswers.startedAtMs
        : Date.now();

    setAnswers(initialAns);
    setExamStartedAtMs(startedMs);
    setCurrentQuestionIdx(0);
    setPostestPanelTab('question');
    setSubmitWarning(null);
    setActiveExam(type);

    onUpdateSession({
      ...session,
      inProgressAnswers: {
        testType: type,
        startedAtMs: startedMs,
        answers: initialAns,
      },
    });
  };

  const selectOption = (itemId: string, optionIndex: number) => {
    if (!session || !activeExam) return;
    const next = {
      ...answers,
      [itemId]: { optionIndex },
    };
    setAnswers(next);
    onUpdateSession({
      ...session,
      inProgressAnswers: {
        testType: activeExam,
        startedAtMs: examStartedAtMs,
        answers: next,
      },
    });
    setSubmitWarning(null);
  };

  const handleSubmitExam = async () => {
    if (!session || !activeExam) return;
    const items = activeExam === 'pretest' ? PRETEST_ITEMS : POSTEST_ITEMS;
    const firstIncompleteIdx = items.findIndex(it => !isItemAnswered(it, answers[it.id]));

    if (firstIncompleteIdx !== -1) {
      setCurrentQuestionIdx(firstIncompleteIdx);
      setPostestPanelTab('question');
      setSubmitWarning(
        `Selecciona una alternativa en la Pregunta ${firstIncompleteIdx + 1} antes de finalizar.`
      );
      return;
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - examStartedAtMs) / 1000));
    const result = gradeEvaluationAttempt(items, answers, durationSeconds);

    const updatedSession: ParticipantSession = {
      ...session,
      pretest: activeExam === 'pretest' ? result : session.pretest,
      postest: activeExam === 'postest' ? result : session.postest,
      inProgressAnswers: undefined,
    };

    onUpdateSession(updatedSession);
    setActiveExam(null);
    setSubmitWarning(null);

    if (DEFAULT_SHEETS_WEBHOOK_URL.trim()) {
      const ok = await sendEvaluationToGoogleSheets(
        DEFAULT_SHEETS_WEBHOOK_URL,
        updatedSession,
        taskOutcomes,
        completedTasksCount
      );
      if (ok) {
        onUpdateSession({ ...updatedSession, sheetsSynced: true });
      }
    }
  };

  // VISTA 1: INGRESO DE PARTICIPANTE Y CONSENTIMIENTO INFORMADO
  if (!session) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#0f1019] p-6 flex items-center justify-center select-none">
        <div className="max-w-lg w-full bg-[#151724] border border-[#24283e] rounded-2xl p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white">Evaluación</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingresa tu código de estudiante para continuar. Primero responderás el Pretest y luego el Postest.
            </p>
          </div>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Código de estudiante
              </label>
              <input
                type="text"
                value={rawStudentCode}
                onChange={e => {
                  setRawStudentCode(e.target.value);
                  setLoginError(null);
                }}
                placeholder="Ej. 20210458"
                className="w-full h-10 px-3 rounded-lg bg-[#0d0f18] border border-[#282d46] text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              {displayedPreviewHash && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Código anónimo asignado:</span>
                  <span className="font-mono font-semibold text-indigo-300 bg-[#1a1e33] px-2 py-0.5 rounded border border-[#2c3252]">
                    {displayedPreviewHash}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-[#10121d] border border-[#22263a] rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-200">
                Consentimiento informado (Ley N.° 29733)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Los puntajes del Pretest y Postest se almacenan asociados únicamente a tu código seudonimizado (<code className="font-mono text-slate-300">P-XXXXXX</code>) con fines exclusivamente académicos de investigación universitaria. No se almacena tu nombre, correo ni código original.
              </p>
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => {
                    setConsentChecked(e.target.checked);
                    setLoginError(null);
                  }}
                  className="mt-0.5 rounded border-slate-600 bg-[#0d0f18] text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-200 leading-snug">
                  He leído la información y acepto participar voluntariamente en la evaluación.
                </span>
              </label>
            </div>

            {loginError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isCheckingRemote}
              className={`w-full h-10 rounded-lg text-white text-xs font-semibold transition-colors ${
                isCheckingRemote
                  ? 'bg-indigo-700/70 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
              }`}
            >
              {isCheckingRemote
                ? 'Consultando registro...'
                : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2A: POSTEST SINCRONIZADO EN PANTALLA DIVIDIDA CON EL VISUALIZADOR A LA DERECHA
  if (activeExam === 'postest') {
    const items = POSTEST_ITEMS;
    const item = items[currentQuestionIdx];
    const currentAns = answers[item.id] || { optionIndex: null };
    const answeredCount = items.filter(it => isItemAnswered(it, answers[it.id])).length;
    const codeLines = algorithm ? algorithm.codeByLanguage[selectedLanguage] || [] : [];
    const activeLine =
      currentStep?.activeLineByLang?.[selectedLanguage] || currentStep?.activeLine || -1;

    return (
      <aside className="w-[420px] lg:w-[470px] xl:w-[510px] bg-[#141520] border-r border-[#232532] flex flex-col min-h-0 shrink-0 select-none z-20 overflow-hidden">
        {/* Cabecera del panel lateral del Postest */}
        <div className="h-11 px-3.5 bg-[#161826] border-b border-[#232638] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveExam(null)}
              className="px-2 py-1 rounded bg-[#1d2033] hover:bg-[#272b42] text-[11px] text-slate-300 transition-colors cursor-pointer"
            >
              Resumen
            </button>
            <div className="flex items-center gap-1 bg-[#10121c] p-0.5 rounded-md border border-[#222538]">
              <button
                onClick={() => setPostestPanelTab('question')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  postestPanelTab === 'question'
                    ? 'bg-[#232741] text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pregunta Postest
              </button>
              <button
                onClick={() => setPostestPanelTab('code')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  postestPanelTab === 'code'
                    ? 'bg-[#232741] text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Código en vivo
              </button>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            {answeredCount}/{items.length} listas
          </span>
        </div>

        {/* Selector numérico de las 9 preguntas del Postest */}
        <div className="px-3.5 py-2.5 bg-[#151724] border-b border-[#232638] flex items-center justify-between gap-1 shrink-0">
          <div className="flex items-center gap-1">
            {items.map((it, idx) => {
              const done = isItemAnswered(it, answers[it.id]);
              const isCurrent = idx === currentQuestionIdx;
              return (
                <button
                  key={it.id}
                  onClick={() => {
                    setCurrentQuestionIdx(idx);
                    setSubmitWarning(null);
                  }}
                  className={`w-7 h-7 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center relative ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border border-indigo-400'
                      : done
                      ? 'bg-[#1a2436] text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#10121c] text-slate-400 border border-[#24283e] hover:text-slate-200'
                  }`}
                  title={`Pregunta ${idx + 1}: ${it.title}`}
                >
                  {idx + 1}
                  {done && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)] absolute -top-0.5 -right-0.5" />
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-mono text-indigo-300">
            P{item.number}/9
          </span>
        </div>

        {postestPanelTab === 'code' && algorithm ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#161722]">
            <div className="p-3 bg-[#1a1c29] border-b border-[#232533] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">{algorithm.name}</span>
              {onChangeLanguage && (
                <div className="flex gap-1 bg-[#11121a] p-0.5 rounded-md border border-[#252838]">
                  {(
                    [
                      { id: 'pseudocode', label: 'Pseudocódigo' },
                      { id: 'python', label: 'Python' },
                      { id: 'cpp', label: 'C++' },
                      { id: 'java', label: 'Java' },
                    ] as const
                  ).map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => onChangeLanguage(lang.id)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer ${
                        selectedLanguage === lang.id
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto py-2 font-mono text-xs select-text custom-scrollbar">
              {codeLines.map(lineObj => {
                const isCurrentLine = lineObj.lineNumber === activeLine;
                return (
                  <div
                    key={lineObj.lineNumber}
                    className={`flex items-start px-3 py-1 transition-colors ${
                      isCurrentLine
                        ? 'bg-indigo-500/20 border-l-4 border-indigo-400 text-white font-semibold'
                        : 'border-l-4 border-transparent text-slate-400'
                    }`}
                  >
                    <span className="w-6 text-right pr-3 text-[10px] text-slate-600 shrink-0">
                      {lineObj.lineNumber}
                    </span>
                    <pre className="flex-1 whitespace-pre-wrap break-all">
                      {lineObj.code || ' '}
                    </pre>
                  </div>
                );
              })}
            </div>
            <StepExplanation
              currentStep={currentStep || null}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              activeLineNumber={activeLine}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
              {/* Barra compacta de sincronización con el visualizador en vivo */}
              <div className="bg-[#111424] border border-indigo-500/30 rounded-lg px-3 py-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-indigo-300 truncate">
                    Visualizador: {item.algorithm}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    Paso {totalSteps > 0 ? stepIndex + 1 : 0}/{totalSteps}
                  </span>
                </div>

                {currentStep?.explanation && (
                  <div className="px-2.5 py-1.5 rounded-md bg-[#0c0e18] border border-[#232842] text-[11px] text-emerald-200 leading-snug">
                    <span className="font-semibold text-emerald-400">Paso actual: </span>
                    {renderCleanText(currentStep.explanation)}
                  </div>
                )}
              </div>

              {/* Tarjeta unificada de enunciado, pregunta y 4 alternativas (A, B, C, D) */}
              <div className="bg-[#171928] border border-[#25283e] rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-400">
                    Pregunta {item.number} de {items.length}
                  </span>
                  <span className="text-slate-400">{item.competencyName}</span>
                </div>

                <h2 className="text-[13px] font-bold text-white leading-snug">
                  {item.title}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {renderCleanText(item.prompt)}
                </p>

                <div className="pt-2 border-t border-[#23273d] space-y-2">
                  <p className="text-xs font-semibold text-white leading-relaxed">
                    {renderCleanText(item.question)}
                  </p>

                  <div className="space-y-1.5">
                    {item.options.map((opt, idx) => {
                      const isSelected = currentAns.optionIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectOption(item.id, idx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs leading-snug transition-colors cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 font-medium'
                              : 'bg-[#10121d] hover:bg-[#191c2e] border-[#282c46] text-slate-300'
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
                          <span className="leading-snug">{renderCleanText(opt)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {submitWarning && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200">
                  {submitWarning}
                </div>
              )}
            </div>

            {/* Pie fijo con controles Anterior / Siguiente / Finalizar Postest */}
            <div className="px-3.5 py-2.5 bg-[#151724] border-t border-[#232638] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIdx > 0) {
                    setCurrentQuestionIdx(currentQuestionIdx - 1);
                    setSubmitWarning(null);
                  }
                }}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1f32] hover:bg-[#252942] border border-[#2d3250] text-xs font-medium text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {currentQuestionIdx < items.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIdx(currentQuestionIdx + 1);
                    setSubmitWarning(null);
                  }}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Finalizar y guardar Postest
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    );
  }

  // VISTA 2B: PRETEST (SIN VISUALIZADOR, CENTRADO A PANTALLA COMPLETA)
  if (activeExam === 'pretest') {
    const items = PRETEST_ITEMS;
    const item = items[currentQuestionIdx];
    const currentAns = answers[item.id] || { optionIndex: null };
    const answeredCount = items.filter(it => isItemAnswered(it, answers[it.id])).length;

    return (
      <div className="flex-1 min-h-0 flex flex-col bg-[#0f1019] select-none overflow-hidden">
        <div className="h-12 px-6 bg-[#151724] border-b border-[#23263a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveExam(null)}
              className="px-2.5 py-1 rounded bg-[#1d2033] hover:bg-[#272b42] text-xs text-slate-300 transition-colors cursor-pointer"
            >
              Volver al resumen
            </button>
            <span className="text-xs font-bold text-white">
              Pretest — Evaluación Diagnóstica Inicial (sin visualizador)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Participante: {session.participantId}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {items.map((it, idx) => {
              const done = isItemAnswered(it, answers[it.id]);
              const isCurrent = idx === currentQuestionIdx;
              return (
                <button
                  key={it.id}
                  onClick={() => {
                    setCurrentQuestionIdx(idx);
                    setSubmitWarning(null);
                  }}
                  className={`w-7 h-7 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center relative ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border border-indigo-400'
                      : done
                      ? 'bg-[#1a2436] text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#121420] text-slate-400 border border-[#24283e] hover:text-slate-200'
                  }`}
                  title={`Pregunta ${idx + 1}: ${it.title}`}
                >
                  {idx + 1}
                  {done && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)] absolute -top-0.5 -right-0.5" />
                  )}
                </button>
              );
            })}
            <span className="ml-2 text-[11px] font-mono text-slate-400">
              {answeredCount}/{items.length} respondidas
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-[#161826] border border-[#262940] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-indigo-300">
                  Pregunta {item.number} de {items.length} · {item.algorithm}
                </span>
                <span className="text-[11px] text-slate-400">{item.competencyName}</span>
              </div>

              <h2 className="text-sm font-bold text-white leading-snug">{item.title}</h2>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {renderCleanText(item.prompt)}
              </p>
            </div>

            <div className="bg-[#161826] border border-[#262940] rounded-xl p-5 space-y-3">
              <p className="text-xs font-semibold text-white leading-relaxed">
                {renderCleanText(item.question)}
              </p>

              <div className="space-y-2">
                {item.options.map((opt, idx) => {
                  const isSelected = currentAns.optionIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectOption(item.id, idx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs leading-relaxed transition-colors cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 font-medium'
                          : 'bg-[#10121d] hover:bg-[#191c2e] border-[#282c46] text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-600 text-white font-bold'
                            : 'border-slate-500 text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{renderCleanText(opt)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {submitWarning && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200">
                {submitWarning}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 pb-4">
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIdx > 0) {
                    setCurrentQuestionIdx(currentQuestionIdx - 1);
                    setSubmitWarning(null);
                  }
                }}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161826] hover:bg-[#1f2236] border border-[#282c44] text-xs font-medium text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {currentQuestionIdx < items.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIdx(currentQuestionIdx + 1);
                    setSubmitWarning(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Finalizar y guardar Pretest
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 3: PANEL PRINCIPAL DE LA EVALUACIÓN
  const preDone = !!(session.pretest || session.remotePretestCompletedAt);
  const posDone = !!(session.postest || session.remotePostestCompletedAt);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#0f1019] p-6 select-none custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-[#151724] border border-[#24283e] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">
                  {session.participantId}
                </span>
                <span className="text-[11px] text-emerald-300 bg-emerald-500/12 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Sesión activa
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateSession(null)}
              className="px-3 py-1.5 rounded-lg bg-[#181a28] hover:bg-rose-950/40 border border-[#262a40] hover:border-rose-700/50 text-xs text-slate-400 hover:text-rose-200 transition-colors cursor-pointer"
            >
              Cambiar participante
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Etapa 1: Pretest (sin visualizador) */}
          <div className="bg-[#151724] border border-[#24283e] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      preDone
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-100">
                    1. Pretest (sin visualizador)
                  </span>
                </div>
                {preDone && (
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Completado
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                9 preguntas iniciales de opción múltiple antes de usar el visualizador.
              </p>

              {preDone && (
                <div className="pt-2 border-t border-[#21253a] text-[11px] text-slate-400">
                  Pretest registrado.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleOpenExam('pretest')}
              disabled={preDone}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                preDone
                  ? 'bg-[#171926] border border-[#23263a] text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
              }`}
            >
              {preDone
                ? 'Pretest completado'
                : session.inProgressAnswers?.testType === 'pretest'
                ? 'Continuar Pretest'
                : 'Iniciar Pretest'}
            </button>
          </div>

          {/* Etapa 2: Postest con Visualizador sincronizado al costado */}
          <div className="bg-[#151724] border border-[#24283e] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      posDone
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]'
                        : preDone
                        ? 'bg-indigo-400'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-100">
                    2. Postest (con visualizador)
                  </span>
                </div>
                {posDone && (
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Completado
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                9 preguntas con el visualizador a la derecha para probar cada caso mientras respondes.
              </p>

              {posDone && (
                <div className="pt-2 border-t border-[#21253a] text-[11px] text-slate-400">
                  Postest registrado.
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onGoToGuidedTasks}
                className="py-2.5 px-3 rounded-lg bg-[#181b2c] hover:bg-[#22263d] border border-[#2b304d] text-xs font-medium text-slate-300 transition-colors cursor-pointer shrink-0"
              >
                Explorar libremente
              </button>
              <button
                type="button"
                onClick={() => handleOpenExam('postest')}
                disabled={!preDone || posDone}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  !preDone || posDone
                    ? 'bg-[#171926] border border-[#23263a] text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                }`}
              >
                {!preDone
                  ? 'Completa primero el Pretest'
                  : posDone
                  ? 'Postest completado'
                  : session.inProgressAnswers?.testType === 'postest'
                  ? 'Continuar Postest'
                  : 'Iniciar Postest'}
              </button>
            </div>
          </div>
        </div>

        {preDone && posDone && (
          <div className="bg-[#151724] border border-emerald-500/30 rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-100">
                Evaluación completada ({session.participantId})
              </h3>
              <p className="text-xs text-slate-400">
                Pretest y Postest registrados.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 shrink-0">
              Finalizado
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

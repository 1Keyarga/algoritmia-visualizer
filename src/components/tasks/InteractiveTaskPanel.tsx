import React, { useState, useEffect, useMemo } from 'react';
import { GUIDED_TASKS_REPOSITORY, type GuidedTask } from '../../core/tasks/tasksRepository';
import { instrumentAndTraceStudentCode } from '../../core/ast/astInstrumenter';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowLeftRight,
  SlidersHorizontal,
  Crosshair,
  Cpu,
} from 'lucide-react';

interface InteractiveTaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTaskScenario: (
    algorithmId: string,
    dataset: number[],
    searchTarget?: number,
    enablePredictionMode?: boolean
  ) => void;
  completedTaskIds: string[];
  onMarkTaskCompleted: (taskId: string) => void;
  isPredictionModeActive: boolean;
  onTogglePredictionMode: () => void;
}

export const InteractiveTaskPanel: React.FC<InteractiveTaskPanelProps> = ({
  isOpen,
  onLoadTaskScenario,
  completedTaskIds,
  onMarkTaskCompleted,
  isPredictionModeActive,
  onTogglePredictionMode,
}) => {
  const [familyFilter, setFamilyFilter] = useState<string>('Todas');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('T01');

  // 1. Estados para 'Completar código'
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  const [astCompileSummary, setAstCompileSummary] = useState<string | null>(null);

  // 2. Estados para 'Construcción manual'
  const [manualArray, setManualArray] = useState<number[]>([]);
  const [selectedSwapIdx, setSelectedSwapIdx] = useState<number | null>(null);
  const [manualExtraInput, setManualExtraInput] = useState<string>('');

  // 3. Estados para 'Predicción de arreglo' (T01, T03, T16)
  const [predictedArrayInputs, setPredictedArrayInputs] = useState<string[]>([]);
  const [predictedExtraInput, setPredictedExtraInput] = useState<string>('');

  // 4. Estados para 'Tabla de traza' (T09, T12)
  const [traceRowsInputs, setTraceRowsInputs] = useState<string[][]>([]);
  const [traceExtraInput, setTraceExtraInput] = useState<string>('');

  // 5. Estados para 'Campos numéricos exactos' (T05, T07, T11, T13, T15, T19)
  const [numericInputs, setNumericInputs] = useState<string[]>([]);

  // Justificación técnica abierta y resultado de verificación
  const [openResponse, setOpenResponse] = useState<string>('');
  const [verificationState, setVerificationState] = useState<{
    checked: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const filteredTasks = useMemo(() => {
    if (familyFilter === 'Todas') return GUIDED_TASKS_REPOSITORY;
    return GUIDED_TASKS_REPOSITORY.filter(t => t.family === familyFilter);
  }, [familyFilter]);

  const currentTask: GuidedTask = useMemo(() => {
    return (
      GUIDED_TASKS_REPOSITORY.find(t => t.id === selectedTaskId) ||
      filteredTasks[0] ||
      GUIDED_TASKS_REPOSITORY[0]
    );
  }, [selectedTaskId, filteredTasks]);

  // Renderizado del snippet con numeración de blancos [BLANCO_1], [BLANCO_2]
  const formattedSnippet = useMemo(() => {
    let blankCounter = 0;
    return currentTask.codeSnippet.replace(/____/g, () => {
      blankCounter += 1;
      return `[BLANCO_${blankCounter}]`;
    });
  }, [currentTask.codeSnippet]);

  // Reiniciar controles interactivos y sincronizar escenario cuando cambia la tarea seleccionada
  useEffect(() => {
    if (!currentTask) return;
    const numBlanks = currentTask.expectedBlanks ? currentTask.expectedBlanks.length : 0;
    setBlankInputs(Array(numBlanks).fill(''));
    setAstCompileSummary(null);

    setManualArray(currentTask.manualInitialArray ? [...currentTask.manualInitialArray] : []);
    setSelectedSwapIdx(null);
    setManualExtraInput('');

    if (currentTask.arrayPredictionCheck) {
      setPredictedArrayInputs(
        currentTask.arrayPredictionCheck.initialArray.map(v => String(v))
      );
      setPredictedExtraInput('');
    } else {
      setPredictedArrayInputs([]);
      setPredictedExtraInput('');
    }

    if (currentTask.traceTableCheck) {
      setTraceRowsInputs(
        currentTask.traceTableCheck.expectedRows.map(() => ['', '', ''])
      );
      setTraceExtraInput('');
    } else {
      setTraceRowsInputs([]);
      setTraceExtraInput('');
    }

    if (currentTask.numericFieldsCheck) {
      setNumericInputs(Array(currentTask.numericFieldsCheck.length).fill(''));
    } else {
      setNumericInputs([]);
    }

    setOpenResponse('');
    setVerificationState(null);

    if (isOpen) {
      onLoadTaskScenario(
        currentTask.targetAlgorithmId,
        currentTask.presetDataset,
        currentTask.presetSearchTarget,
        false
      );
    }
  }, [currentTask.id, isOpen]);

  if (!isOpen) return null;

  const currentIndexInFiltered = filteredTasks.findIndex(t => t.id === currentTask.id);

  const handlePrevTask = () => {
    if (currentIndexInFiltered > 0) {
      setSelectedTaskId(filteredTasks[currentIndexInFiltered - 1].id);
    }
  };

  const handleNextTask = () => {
    if (currentIndexInFiltered < filteredTasks.length - 1) {
      setSelectedTaskId(filteredTasks[currentIndexInFiltered + 1].id);
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

  const handleVerifyTask = () => {
    // 1. Verificación de Completar Código + Compilación AST Real
    if (currentTask.interactionType === 'Completar código' && currentTask.expectedBlanks) {
      const anyEmpty = blankInputs.some(b => !b.trim());
      if (anyEmpty) {
        setVerificationState({
          checked: true,
          isCorrect: false,
          message: 'Completa todas las expresiones en blanco antes de compilar y verificar.',
        });
        return;
      }

      // Ejecutar realmente el código C completado en el motor AST si tiene plantilla ejecutable
      let astDiagnostic = '';
      let astSuccess = true;
      if (currentTask.cExecutableTemplate) {
        let compiledC = currentTask.cExecutableTemplate;
        blankInputs.forEach((val, idx) => {
          compiledC = compiledC.replace(`__BLANK_${idx + 1}__`, val.trim());
        });

        const astResult = instrumentAndTraceStudentCode(compiledC, currentTask.presetDataset);
        if (!astResult.success) {
          astSuccess = false;
          astDiagnostic = `Diagnóstico del motor AST: ${astResult.error}`;
          setAstCompileSummary(astDiagnostic);
        } else {
          const lastStep = astResult.steps?.[astResult.steps.length - 1];
          const finalArr = lastStep?.array.map(e => e.value).join(', ') || '';
          astDiagnostic = `Motor AST ejecutó ${astResult.steps?.length || 0} pasos sin errores (Estado final: [${finalArr}]).`;
          setAstCompileSummary(astDiagnostic);
        }
      }

      const allBlanksMatch = currentTask.expectedBlanks.every((acceptedList, idx) => {
        const studentVal = normalizeCodeToken(blankInputs[idx] || '');
        return acceptedList.some(acc => normalizeCodeToken(acc) === studentVal);
      });

      if (allBlanksMatch && astSuccess) {
        onMarkTaskCompleted(currentTask.id);
        setVerificationState({
          checked: true,
          isCorrect: true,
          message: 'Código verificado y validado por el motor de ejecución AST.',
        });
      } else {
        setVerificationState({
          checked: true,
          isCorrect: false,
          message: !astSuccess
            ? `La condición ingresada produjo un fallo en ejecución (${astDiagnostic}).`
            : 'La condición ingresada compila pero no cumple la propiedad algorítmica requerida (estabilidad, cota o caso base).',
        });
      }
      return;
    }

    // 2. Verificación de Construcción Manual + Invariante/Pivote
    if (currentTask.interactionType === 'Construcción manual' && currentTask.manualTargetArray) {
      const arrayMatches =
        manualArray.length === currentTask.manualTargetArray.length &&
        manualArray.every((val, i) => val === currentTask.manualTargetArray![i]);

      const extraMatches = currentTask.manualExtraField
        ? Number(manualExtraInput.trim()) === currentTask.manualExtraField.expectedValue &&
          manualExtraInput.trim() !== ''
        : true;

      if (arrayMatches && extraMatches) {
        onMarkTaskCompleted(currentTask.id);
        setVerificationState({
          checked: true,
          isCorrect: true,
          message: 'Construcción del arreglo e invariante verificados correctamente.',
        });
      } else {
        setVerificationState({
          checked: true,
          isCorrect: false,
          message: !arrayMatches
            ? `El arreglo construido [${manualArray.join(', ')}] aún no coincide con el estado exacto tras la operación.`
            : 'El arreglo es correcto, pero el valor numérico del prefijo/pivote indicado no es exacto.',
        });
      }
      return;
    }

    // 3. Verificación de Predicción Exacta de Arreglo + Valor de Invariante (T01, T03, T16)
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

      if (arrayMatches && extraMatches) {
        onMarkTaskCompleted(currentTask.id);
        setVerificationState({
          checked: true,
          isCorrect: true,
          message: 'Predicción del arreglo y valor de invariante verificados con exactitud.',
        });
      } else {
        setVerificationState({
          checked: true,
          isCorrect: false,
          message: !arrayMatches
            ? `El estado predicho [${studentNums.join(', ')}] no coincide con el resultado exacto de la operación.`
            : 'El arreglo predicho es correcto, pero el valor numérico de la pregunta (b) es incorrecto.',
        });
      }
      return;
    }

    // 4. Verificación de Tabla de Traza Paso a Paso (low, high, mid) (T09, T12)
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

      if (firstWrongRow === -1 && extraMatches) {
        onMarkTaskCompleted(currentTask.id);
        setVerificationState({
          checked: true,
          isCorrect: true,
          message: 'Traza completa (low, high, mid) y retorno verificados correctamente.',
        });
      } else {
        setVerificationState({
          checked: true,
          isCorrect: false,
          message:
            firstWrongRow !== -1
              ? `Error en la Iteración ${firstWrongRow} de la tabla de traza: verifica el cálculo entero mid = Math.floor((low + high) / 2) y qué mitad se descarta.`
              : 'Las iteraciones de la traza son correctas, pero el valor final retornado no coincide.',
        });
      }
      return;
    }

    // 5. Verificación de Campos Cuantitativos Exactos (T05, T07, T11, T13, T15, T19)
    if (currentTask.numericFieldsCheck) {
      let wrongIdx = -1;
      currentTask.numericFieldsCheck.forEach((field, idx) => {
        const raw = (numericInputs[idx] || '').trim();
        if (wrongIdx === -1 && (raw === '' || Number(raw) !== field.expectedValue)) {
          wrongIdx = idx;
        }
      });

      if (wrongIdx === -1) {
        onMarkTaskCompleted(currentTask.id);
        setVerificationState({
          checked: true,
          isCorrect: true,
          message: 'Cálculos cuantitativos y métricas verificados correctamente.',
        });
      } else {
        setVerificationState({
          checked: true,
          isCorrect: false,
          message: `El valor ingresado en "${currentTask.numericFieldsCheck[wrongIdx].label}" no es exacto. Compáralo con las métricas del visualizador.`,
        });
      }
    }
  };

  const isCompleted = completedTaskIds.includes(currentTask.id);

  return (
    <aside className="w-[400px] xl:w-[450px] bg-[#141520] border-l border-[#232532] flex flex-col min-h-0 shrink-0 select-none z-30">
      {/* Cabecera del repositorio de tareas */}
      <div className="h-11 px-3.5 bg-[#181a28] border-b border-[#25283a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
            Laboratorio de Tareas ({completedTaskIds.length}/21)
          </span>
        </div>

        <button
          onClick={onTogglePredictionMode}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer ${
            isPredictionModeActive
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-[#1f2235] hover:bg-[#272b42] border-[#313652] text-slate-300'
          }`}
          title="Activar/Desactivar predicción paso a paso sobre el visualizador"
        >
          <Crosshair className="w-3 h-3" />
          <span>Predicción en Vivo</span>
        </button>
      </div>

      {/* Filtro por familia y selector de tarea T01-T21 */}
      <div className="p-3 bg-[#151724] border-b border-[#232638] flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-4 gap-1 bg-[#10121c] p-1 rounded-lg border border-[#222538]">
          {['Todas', 'Ordenamiento', 'Búsqueda', 'Divide y vencerás'].map(fam => (
            <button
              key={fam}
              onClick={() => {
                setFamilyFilter(fam);
                const firstMatch =
                  fam === 'Todas'
                    ? GUIDED_TASKS_REPOSITORY[0]
                    : GUIDED_TASKS_REPOSITORY.find(t => t.family === fam);
                if (firstMatch) setSelectedTaskId(firstMatch.id);
              }}
              className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-colors cursor-pointer ${
                familyFilter === fam
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={fam}
            >
              {fam === 'Divide y vencerás' ? 'Div. y Venc.' : fam}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevTask}
            disabled={currentIndexInFiltered <= 0}
            className="p-1.5 rounded-lg bg-[#1b1d2e] hover:bg-[#25283e] border border-[#2b2e44] text-slate-300 disabled:opacity-30 cursor-pointer"
            title="Tarea anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={currentTask.id}
            onChange={e => setSelectedTaskId(e.target.value)}
            className="flex-1 bg-[#1b1d2e] border border-[#2b2e44] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
          >
            {filteredTasks.map(task => {
              const done = completedTaskIds.includes(task.id);
              return (
                <option key={task.id} value={task.id}>
                  {task.id} [{task.algorithm}] — {task.title} {done ? '(Resuelta)' : ''}
                </option>
              );
            })}
          </select>

          <button
            onClick={handleNextTask}
            disabled={currentIndexInFiltered >= filteredTasks.length - 1}
            className="p-1.5 rounded-lg bg-[#1b1d2e] hover:bg-[#25283e] border border-[#2b2e44] text-slate-300 disabled:opacity-30 cursor-pointer"
            title="Siguiente tarea"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenido desplazable de la tarea */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
        {/* Metadatos taxonómicos de la tesis */}
        <div className="bg-[#181a28] border border-[#262940] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
                {currentTask.id}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                Bloom: {currentTask.bloom}
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-semibold">
                {currentTask.interactionType}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#212438] text-slate-300 border border-[#2f334d] text-[10px]">
                {currentTask.difficulty}
              </span>
            </div>

            {isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                Resuelta
              </span>
            )}
          </div>

          <h3 className="text-xs font-bold text-slate-100 leading-snug">{currentTask.title}</h3>

          <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-[#23263a]">
            <div>
              <span className="text-slate-300 font-semibold">Competencia:</span>{' '}
              {currentTask.competence}
            </div>
            <div>
              <span className="text-slate-300 font-semibold">Indicador:</span>{' '}
              {currentTask.indicator}
            </div>
          </div>
        </div>

        {/* Botón para recargar escenario exacto en el visualizador */}
        <button
          onClick={() =>
            onLoadTaskScenario(
              currentTask.targetAlgorithmId,
              currentTask.presetDataset,
              currentTask.presetSearchTarget,
              false
            )
          }
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e2136] hover:bg-[#272b46] border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Reiniciar Escenario de {currentTask.id} en el Visualizador</span>
        </button>

        {/* Enunciado para el estudiante */}
        <div className="bg-[#12131f] border border-[#22253a] rounded-xl p-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Enunciado
          </div>
          <p className="text-xs text-slate-300 leading-relaxed select-text">{currentTask.prompt}</p>
        </div>

        {/* Código / Pseudocódigo de referencia */}
        <div className="bg-[#0d0e17] border border-[#22253a] rounded-xl p-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Código / Escenario ({currentTask.algorithm})
          </div>
          <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed whitespace-pre-wrap select-text">
            {formattedSnippet}
          </pre>
        </div>

        {/* ÁREA DE EVALUACIÓN PRÁCTICA UNIVERSITARIA */}
        <div className="bg-[#171929] border border-[#292d46] rounded-xl p-3.5 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
            <span>Evaluación Práctica ({currentTask.interactionType})</span>
          </div>

          {/* MECÁNICA 1: Completar código en C con ejecución AST real */}
          {currentTask.interactionType === 'Completar código' && currentTask.expectedBlanks && (
            <div className="space-y-2.5">
              {currentTask.expectedBlanks.map((_, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-300">
                    Condición C/C++ para [BLANCO_{idx + 1}]:
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
                    placeholder="Escribe la expresión en C (ej. arr[j] > arr[j + 1])"
                    className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}

              {astCompileSummary && (
                <div className="p-2 rounded-lg bg-[#111320] border border-[#282c46] flex items-start gap-2 text-[11px] font-mono text-indigo-200">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{astCompileSummary}</span>
                </div>
              )}
            </div>
          )}

          {/* MECÁNICA 2: Construcción manual de arreglo + Invariante/Pivote */}
          {currentTask.interactionType === 'Construcción manual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                  Haz clic en dos celdas para intercambiar sus valores:
                </span>
                <button
                  onClick={() => {
                    setManualArray(
                      currentTask.manualInitialArray ? [...currentTask.manualInitialArray] : []
                    );
                    setSelectedSwapIdx(null);
                    setVerificationState(null);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
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
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/30 -translate-y-0.5'
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
                  <label className="block text-[11px] text-slate-300">
                    {currentTask.manualExtraField.label}
                  </label>
                  <input
                    type="number"
                    value={manualExtraInput}
                    onChange={e => {
                      setManualExtraInput(e.target.value);
                      setVerificationState(null);
                    }}
                    placeholder="Ingresa el valor entero"
                    className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* MECÁNICA 3: Predicción exacta de celdas del arreglo + valor clave (T01, T03, T16) */}
          {currentTask.arrayPredictionCheck && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>(a) Ingresa el valor de cada celda del arreglo resultante:</span>
                <button
                  onClick={() => {
                    setPredictedArrayInputs(
                      currentTask.arrayPredictionCheck!.initialArray.map(v => String(v))
                    );
                    setVerificationState(null);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restaurar inicial
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
                <label className="block text-[11px] text-slate-300">
                  {currentTask.arrayPredictionCheck.extraFieldLabel}
                </label>
                <input
                  type="number"
                  value={predictedExtraInput}
                  onChange={e => {
                    setPredictedExtraInput(e.target.value);
                    setVerificationState(null);
                  }}
                  placeholder="Ingresa el valor numérico exacto"
                  className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* MECÁNICA 4: Tabla de Traza Paso a Paso (low, high, mid) (T09, T12) */}
          {currentTask.traceTableCheck && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-300">
                Completa los valores enteros de los punteros en cada iteración:
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
                <label className="block text-[11px] text-slate-300">
                  {currentTask.traceTableCheck.extraFieldLabel}
                </label>
                <input
                  type="number"
                  value={traceExtraInput}
                  onChange={e => {
                    setTraceExtraInput(e.target.value);
                    setVerificationState(null);
                  }}
                  placeholder="Ej. 5 o -1"
                  className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* MECÁNICA 5: Campos Cuantitativos Exactos (T05, T07, T11, T13, T15, T19) */}
          {currentTask.numericFieldsCheck && (
            <div className="space-y-2.5">
              {currentTask.numericFieldsCheck.map((field, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-[11px] text-slate-300">{field.label}</label>
                  <input
                    type="number"
                    value={numericInputs[idx] || ''}
                    onChange={e => {
                      const next = [...numericInputs];
                      next[idx] = e.target.value;
                      setNumericInputs(next);
                      setVerificationState(null);
                    }}
                    placeholder="Ingresa el valor calculado"
                    className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Campo de argumentación técnica para las tareas que lo requieren */}
          {currentTask.requiresJustification && (
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] text-slate-400">
                Argumentación / justificación algorítmica:
              </label>
              <textarea
                rows={2}
                value={openResponse}
                onChange={e => setOpenResponse(e.target.value)}
                placeholder="Fundamenta en función del invariante, estabilidad, precondición o cota asintótica..."
                className="w-full bg-[#10121d] border border-[#2d314d] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          )}

          <button
            onClick={handleVerifyTask}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            {currentTask.interactionType === 'Completar código'
              ? 'Compilar en Motor AST y Verificar'
              : 'Verificar Resolución'}
          </button>

          {/* Retroalimentación inmediata y criterio de éxito oficial */}
          {verificationState && (
            <div
              className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                verificationState.isCorrect
                  ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/35 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {verificationState.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{verificationState.message}</span>
              </div>

              <div className="pt-1.5 border-t border-white/10 text-[11px] text-slate-200 leading-relaxed select-text">
                <span className="font-bold text-amber-300 block mb-0.5">
                  Fundamento algorítmico (Criterio de validación):
                </span>
                {currentTask.expectedCriteria}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

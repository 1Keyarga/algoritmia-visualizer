import React, { useState, useEffect } from 'react';
import { parseCustomDataset, generateRandomDataset } from '../../core/utils/generator';
import { X, Sparkles, AlertCircle, Dices, TrendingDown, TrendingUp } from 'lucide-react';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDataset: (dataset: number[]) => void;
  currentDataset: number[];
}

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  onClose,
  onApplyDataset,
  currentDataset,
}) => {
  const [inputValue, setInputValue] = useState(currentDataset.join(', '));
  const [error, setError] = useState<string | null>(null);

  // Sync input value when modal opens with a different dataset
  useEffect(() => {
    if (isOpen) {
      setInputValue(currentDataset.join(', '));
      setError(null);
    }
  }, [isOpen, currentDataset]);

  if (!isOpen) return null;

  const handleApply = () => {
    const parsed = parseCustomDataset(inputValue);
    if (!parsed) {
      setError('Por favor ingresa entre 3 y 30 números válidos (1 - 999), separados por comas o espacios.');
      return;
    }
    setError(null);
    onApplyDataset(parsed);
    onClose();
  };

  const setPreset = (type: 'random' | 'reversed' | 'nearly_sorted') => {
    setError(null);
    const size = 14;
    let data: number[] = [];
    if (type === 'random') {
      data = generateRandomDataset(size, 10, 99);
    } else if (type === 'reversed') {
      data = Array.from({ length: size }, (_, i) => 99 - i * 6);
    } else if (type === 'nearly_sorted') {
      data = [10, 15, 22, 28, 35, 41, 48, 55, 62, 70, 75, 83, 80, 95];
    }
    setInputValue(data.join(', '));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#171821] border border-[#2d2f3f] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262837] bg-[#1d1e2a]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white text-base">Configuración de Dataset</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Valores numéricos personalizados (separados por coma o espacio):
            </label>
            <textarea
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-[#111217] border border-[#2d2f3f] rounded-lg p-3 text-sm text-slate-200 font-mono-code focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
              placeholder="Ejemplo: 12, 23, 67, 12, 56, 11, 45, 23, 78, 56, 78, 89, 98, 45"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Plantillas predefinidas:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('random')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222433] hover:bg-[#2b2e40] text-slate-200 border border-[#36394d] rounded-md transition-colors"
              >
                <Dices className="w-3.5 h-3.5" /> Aleatorio (14 elementos)
              </button>
              <button
                type="button"
                onClick={() => setPreset('reversed')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222433] hover:bg-[#2b2e40] text-slate-200 border border-[#36394d] rounded-md transition-colors"
              >
                <TrendingDown className="w-3.5 h-3.5" /> Invertido (Peor Caso)
              </button>
              <button
                type="button"
                onClick={() => setPreset('nearly_sorted')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222433] hover:bg-[#2b2e40] text-slate-200 border border-[#36394d] rounded-md transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Casi Ordenado (Mejor Caso)
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-[#14151e] border-t border-[#262837]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Aplicar Dataset
          </button>
        </div>
      </div>
    </div>
  );
};

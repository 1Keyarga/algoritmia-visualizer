import React, { useState } from 'react';
import { parseCustomDataset, generateRandomDataset } from '../../core/utils/generator';
import { X, Sliders, AlertCircle, Dices, TrendingDown, TrendingUp } from 'lucide-react';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDataset: (dataset: number[]) => void;
  currentDataset: number[];
  isBinarySearch?: boolean;
}

const DatasetModalContent: React.FC<Omit<DatasetModalProps, 'isOpen'>> = ({
  onClose,
  onApplyDataset,
  currentDataset,
  isBinarySearch = false,
}) => {
  const [inputValue, setInputValue] = useState(currentDataset.join(', '));
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    const parsed = parseCustomDataset(inputValue);
    if (!parsed) {
      setError('Ingresa entre 3 y 30 números enteros (1 - 999), separados por comas o espacios.');
      return;
    }
    setError(null);
    onApplyDataset(parsed);
    onClose();
  };

  const setPreset = (type: 'random' | 'reversed' | 'nearly_sorted') => {
    setError(null);
    const size = 10;
    let data: number[] = [];
    if (type === 'random') {
      data = generateRandomDataset(size, 10, 99);
    } else if (type === 'reversed') {
      data = Array.from({ length: size }, (_, i) => 90 - i * 8);
    } else if (type === 'nearly_sorted') {
      data = [12, 18, 25, 31, 44, 39, 56, 68, 74, 85];
    }
    setInputValue(data.join(', '));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#161824] border border-[#2a2d42] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#24273a] bg-[#1a1c2b]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Editar Conjunto de Datos</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#25283c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Valores del arreglo:
            </label>
            <textarea
              rows={3}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="w-full bg-[#10121c] border border-[#2b2e44] rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ejemplo: 38, 27, 43, 3, 9, 82, 10, 19"
            />
          </div>

          {isBinarySearch && (
            <div className="text-[11px] text-indigo-200/90 bg-indigo-950/35 border border-indigo-500/30 px-3 py-2 rounded-lg leading-snug">
              La Búsqueda Binaria requiere un arreglo ordenado: si ingresas valores desordenados, se ordenarán ascendentemente al aplicar.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Casos de prueba predefinidos:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('random')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#1e2133] hover:bg-[#262a40] text-slate-200 border border-[#323650] rounded-md transition-colors cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5 text-indigo-400" /> Aleatorio
              </button>
              <button
                type="button"
                onClick={() => setPreset('reversed')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#1e2133] hover:bg-[#262a40] text-slate-200 border border-[#323650] rounded-md transition-colors cursor-pointer"
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Orden inverso
              </button>
              <button
                type="button"
                onClick={() => setPreset('nearly_sorted')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#1e2133] hover:bg-[#262a40] text-slate-200 border border-[#323650] rounded-md transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Casi ordenado
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 px-5 py-3.5 bg-[#131520] border-t border-[#24273a]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors cursor-pointer"
          >
            Aplicar datos
          </button>
        </div>
      </div>
    </div>
  );
};

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  ...rest
}) => {
  if (!isOpen) return null;
  return <DatasetModalContent key={rest.currentDataset.join(',')} {...rest} />;
};

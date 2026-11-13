import React from 'react';
import type { MemoryFrame } from '../../types/trace';

interface StackFramesProps {
  frames: MemoryFrame[];
}

export const StackFrames: React.FC<StackFramesProps> = ({ frames }) => {
  const activeFrame = frames.find(f => f.isActive) || frames[0];
  const entries = activeFrame ? Object.entries(activeFrame.variables) : [];

  return (
    <div className="flex flex-col justify-between w-[240px] xl:w-[270px] shrink-0 font-mono-code text-xs self-stretch">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Variables locales
        </span>
      </div>

      {activeFrame && (
        <div className="flex-1 bg-[#1b1c2a] border border-[#2e3146] rounded-xl p-2.5 flex flex-col justify-between min-h-[104px]">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#292b3d]">
            <span className="text-amber-400 font-bold text-xs truncate">
              {activeFrame.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 content-start flex-1">
            {entries.map(([key, val]) => {
              const isIndexVar = ['i', 'j', 'k', 'inicio', 'fin', 'medio', 'bajo', 'alto'].includes(key);
              const isFocusVar = ['min', 'clave', 'key', 'pivote', 'pi'].includes(key);
              const isFlagTrue =
                (key === 'swapped' || key === 'intercambiado') &&
                (val === 'Verdadero' || val === 'True' || val === true);

              return (
                <div
                  key={key}
                  className="flex items-center justify-between bg-[#141520] border border-[#25283a] rounded-md px-2 py-1 min-w-0"
                >
                  <span className="text-[10px] text-slate-400 font-medium truncate mr-1">{key}</span>
                  <span
                    className={`font-bold font-mono text-[11px] truncate ${
                      isIndexVar
                        ? 'text-amber-300'
                        : isFocusVar
                        ? 'text-purple-300'
                        : isFlagTrue
                        ? 'text-emerald-300'
                        : 'text-slate-100'
                    }`}
                    title={val === null || val === undefined ? '—' : String(val)}
                  >
                    {val === null || val === undefined ? '—' : String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

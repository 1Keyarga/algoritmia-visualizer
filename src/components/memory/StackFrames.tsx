import React from 'react';
import type { MemoryFrame } from '../../types/trace';
import { Globe, Layers } from 'lucide-react';

interface StackFramesProps {
  frames: MemoryFrame[];
}

export const StackFrames: React.FC<StackFramesProps> = ({ frames }) => {
  const activeFrame = frames.find(f => f.isActive) || frames[0];
  const globalFrame = frames.find(f => !f.isActive && f.name.includes('Global') || f.name.includes('Entorno')) || frames[1];

  return (
    <div className="flex flex-col gap-2 w-[220px] shrink-0 font-mono-code text-xs">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
        Pila de Ejecución (Frames)
      </div>

      {/* Active Stack Frame Card */}
      {activeFrame && (
        <div className="bg-[#1c1d2b] border border-[#2e3146] rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#292b3d]">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Layers className="w-4 h-4" />
              <span>{activeFrame.name}</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              activo
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {Object.entries(activeFrame.variables).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-0.5 border-b border-[#252737] last:border-0">
                <span className="text-slate-400 font-medium">{key}</span>
                <span className={`font-bold font-mono ${
                  key === 'j' || key === 'i' 
                    ? 'text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60' 
                    : key === 'swapped' && (val === 'Verdadero' || val === 'True')
                    ? 'text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-700/50'
                    : 'text-slate-100'
                }`}>
                  {val === null || val === undefined ? '-' : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Frame */}
      {globalFrame && (
        <div className="bg-[#161722] border border-[#252737] rounded-xl p-2.5 flex items-center justify-between text-slate-400 opacity-75 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{globalFrame.name}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">›</span>
        </div>
      )}
    </div>
  );
};

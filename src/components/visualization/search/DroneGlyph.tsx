import React from 'react';

export type DroneStatus = 'idle' | 'scanning' | 'matched' | 'missed';

interface DroneGlyphProps {
  x: number;
  y: number;
  targetNodeY: number;
  vbWidth: number;
  status: DroneStatus;
  hudText?: string;
  gradientId: string;
  showBeam?: boolean;
  compact?: boolean;
}

const STATUS_PALETTE: Record<
  DroneStatus,
  { accent: string; glow: string; border: string; text: string }
> = {
  idle: {
    accent: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.25)',
    border: '#4f46e5',
    text: '#c7d2fe',
  },
  scanning: {
    accent: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.28)',
    border: '#d97706',
    text: '#fde68a',
  },
  matched: {
    accent: '#34d399',
    glow: 'rgba(52, 211, 153, 0.35)',
    border: '#10b981',
    text: '#a7f3d0',
  },
  missed: {
    accent: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.25)',
    border: '#e11d48',
    text: '#fecdd3',
  },
};

export const DroneGlyph: React.FC<DroneGlyphProps> = ({
  x,
  y,
  targetNodeY,
  vbWidth,
  status,
  hudText,
  gradientId,
  showBeam = true,
  compact = false,
}) => {
  const palette = STATUS_PALETTE[status];
  const beamHeight = Math.max(0, targetNodeY - (y + 12));
  const halfCone = compact ? 15 : 21;

  const hudWidth = hudText ? Math.max(compact ? 74 : 92, hudText.length * 7.2 + 20) : 0;
  const clampedHudOffsetX = hudText
    ? Math.max(hudWidth / 2 + 8 - x, Math.min(vbWidth - hudWidth / 2 - 8 - x, 0))
    : 0;

  return (
    <g
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Haz óptico descendente hacia el nodo evaluado */}
      {showBeam && beamHeight > 4 && (
        <g>
          <polygon
            points={`-5,10 5,10 ${halfCone},${beamHeight + 10} ${-halfCone},${beamHeight + 10}`}
            fill={`url(#${gradientId})`}
          />
          <line
            x1={0}
            y1={10}
            x2={0}
            y2={beamHeight + 8}
            stroke={palette.accent}
            strokeWidth={1.2}
            strokeDasharray="3 3"
            strokeOpacity={0.85}
          />
        </g>
      )}

      {/* Cápsula de telemetría sobre el dron */}
      {hudText && (
        <g transform={`translate(${clampedHudOffsetX}, -30)`}>
          <rect
            x={-hudWidth / 2}
            y={-12}
            width={hudWidth}
            height={22}
            rx={6}
            fill="#141726"
            stroke={palette.border}
            strokeWidth={1.2}
          />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            fill={palette.text}
            fontSize={compact ? 10 : 11}
            fontWeight={700}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          >
            {hudText}
          </text>
        </g>
      )}

      {/* Halo sutil del dron */}
      <circle cx={0} cy={0} r={compact ? 18 : 22} fill={palette.glow} />

      {/* Brazos laterales y rotores */}
      <line x1={-22} y1={-3} x2={22} y2={-3} stroke="#475569" strokeWidth={2.2} strokeLinecap="round" />
      <ellipse cx={-21} cy={-6} rx={8} ry={2.2} fill="none" stroke={palette.accent} strokeWidth={1.2} strokeOpacity={0.75} />
      <ellipse cx={21} cy={-6} rx={8} ry={2.2} fill="none" stroke={palette.accent} strokeWidth={1.2} strokeOpacity={0.75} />
      <circle cx={-21} cy={-3} r={2} fill="#94a3b8" />
      <circle cx={21} cy={-3} r={2} fill="#94a3b8" />

      {/* Cuerpo central geométrico */}
      <polygon
        points="-12,-7 12,-7 15,2 8,9 -8,9 -15,2"
        fill="#1a1d30"
        stroke={palette.accent}
        strokeWidth={1.6}
      />

      {/* Antena superior */}
      <line x1={0} y1={-7} x2={0} y2={-13} stroke="#64748b" strokeWidth={1.3} />
      <circle cx={0} cy={-14} r={2} fill={palette.accent} />

      {/* Lente óptico inferior */}
      <circle cx={0} cy={2} r={4.2} fill="#0b0d17" stroke={palette.accent} strokeWidth={1.4} />
      <circle cx={0} cy={2} r={1.8} fill={palette.accent} />
    </g>
  );
};

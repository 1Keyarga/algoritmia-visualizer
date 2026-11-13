import React, { useId } from 'react';
import type { ArrayElement, Step } from '../../../types/trace';
import { DroneGlyph, type DroneStatus } from './DroneGlyph';
import type { SearchTelemetry } from './searchHistory';

interface LinearSearchCanvasProps {
  array: ArrayElement[];
  currentStep: Step | null;
  telemetry: SearchTelemetry;
  compact?: boolean;
}

export const LinearSearchCanvas: React.FC<LinearSearchCanvasProps> = ({
  array,
  currentStep,
  telemetry,
  compact = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const n = Math.max(1, array.length);
  const { target, currI, resultado, isFound, isFinalNotFound, checkedIndices } = telemetry;

  const pitch = compact ? 44 : Math.max(54, Math.min(72, Math.floor(740 / n)));
  const minW = compact ? 350 : 580;
  const vbWidth = Math.max(minW, n * pitch + (compact ? 72 : 96));
  const vbHeight = compact ? 220 : 272;

  const startX = (vbWidth - (n - 1) * pitch) / 2;
  const colX = (idx: number) => startX + idx * pitch;

  const railY = compact ? 56 : 70;
  const nodeY = compact ? 140 : 168;
  const rulerY = compact ? 196 : 232;
  const podRadius = compact ? 18 : Math.min(23, Math.floor(pitch * 0.34));

  const gradBeamId = `lin-beam-${uid}`;
  const gridPatternId = `lin-grid-${uid}`;

  // Determinar posición y estado del dron en el monorriel
  let droneX = colX(0) - pitch * 0.52;
  let droneStatus: DroneStatus = 'idle';
  let showBeam = false;
  let hudText = `clave = ${target}`;

  if (isFound && resultado !== undefined && resultado >= 0 && resultado < n) {
    droneX = colX(resultado);
    droneStatus = 'matched';
    showBeam = true;
    hudText = `${array[resultado]?.value} == ${target}`;
  } else if (isFinalNotFound) {
    droneX = Math.min(vbWidth - 36, colX(n - 1) + pitch * 0.52);
    droneStatus = 'missed';
    showBeam = false;
    hudText = 'retorno: -1';
  } else if (currI !== undefined && currI >= 0 && currI < n) {
    droneX = colX(currI);
    droneStatus = 'scanning';
    showBeam = true;
    const val = array[currI]?.value;
    const op = currentStep?.operationType === 'compare' ? '!=' : 'vs';
    hudText = `${val} ${op} ${target}`;
  }

  const railStart = colX(0) - pitch * 0.52;
  const railEnd = Math.min(vbWidth - 28, colX(n - 1) + pitch * 0.56);
  const trailEnd = Math.max(railStart, droneX);
  const trailColor =
    droneStatus === 'matched' ? '#34d399' : droneStatus === 'missed' ? '#f43f5e' : '#f59e0b';

  const inspectedCount = isFound && resultado !== undefined
    ? resultado + 1
    : isFinalNotFound
      ? n
      : checkedIndices.size + (currI !== undefined && !checkedIndices.has(currI) ? 1 : 0);

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-[#0e1019] rounded-lg border border-[#1f2336]">
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-full"
        role="img"
        aria-label="Diagrama de escaneo secuencial en búsqueda lineal"
      >
        <defs>
          <pattern id={gridPatternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#171b2c"
              strokeWidth="0.7"
            />
          </pattern>
          <linearGradient id={gradBeamId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={trailColor} stopOpacity="0.34" />
            <stop offset="100%" stopColor={trailColor} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <rect width={vbWidth} height={vbHeight} fill={`url(#${gridPatternId})`} />

        {/* Monorriel superior y estela de distancia recorrida */}
        <line
          x1={railStart}
          y1={railY}
          x2={railEnd}
          y2={railY}
          stroke="#252940"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <line
          x1={railStart}
          y1={railY}
          x2={trailEnd}
          y2={railY}
          stroke={trailColor}
          strokeWidth={2.5}
          strokeOpacity={0.7}
          strokeLinecap="round"
        />

        {/* Marcas verticales en el riel sobre cada nodo */}
        {array.map((_, idx) => (
          <line
            key={`tick-${idx}`}
            x1={colX(idx)}
            y1={railY - 4}
            x2={colX(idx)}
            y2={railY + 4}
            stroke="#333958"
            strokeWidth={1}
          />
        ))}

        {/* Conducto secuencial entre nodos consecutivos */}
        {n > 1 && (
          <line
            x1={colX(0)}
            y1={nodeY}
            x2={colX(n - 1)}
            y2={nodeY}
            stroke="#23283f"
            strokeWidth={2}
          />
        )}

        {/* Segmentos ya recorridos sobre la pista inferior */}
        {array.map((_, idx) => {
          if (idx >= n - 1) return null;
          const x1 = colX(idx) + podRadius + 3;
          const x2 = colX(idx + 1) - podRadius - 3;
          if (x2 <= x1) return null;
          const isTraversed =
            isFinalNotFound ||
            (currI !== undefined && idx < currI) ||
            (isFound && resultado !== undefined && idx < resultado);

          const midLink = (x1 + x2) / 2;
          return (
            <g key={`link-${idx}`}>
              <line
                x1={x1}
                y1={nodeY}
                x2={x2}
                y2={nodeY}
                stroke={isTraversed ? '#475569' : '#262b42'}
                strokeWidth={2}
              />
              <polyline
                points={`${midLink - 3},${nodeY - 3} ${midLink + 2},${nodeY} ${midLink - 3},${nodeY + 3}`}
                fill="none"
                stroke={isTraversed ? '#94a3b8' : '#3b4264'}
                strokeWidth={1.3}
              />
            </g>
          );
        })}

        {/* Nodos de telemetría (cápsulas circulares, no cajas de arreglo) */}
        {array.map((item, idx) => {
          const cx = colX(idx);
          const isMatchNode = isFound && idx === resultado;
          const isScanningNode = !isFound && !isFinalNotFound && currI === idx;
          const isVisitedNode =
            !isMatchNode &&
            !isScanningNode &&
            (isFinalNotFound || checkedIndices.has(idx) || (currI !== undefined && idx < currI));

          let ringColor = '#384062';
          let fillColor = '#161a2b';
          let textColor = '#e2e8f0';

          if (isMatchNode) {
            ringColor = '#34d399';
            fillColor = '#0b2920';
            textColor = '#a7f3d0';
          } else if (isScanningNode) {
            ringColor = '#fbbf24';
            fillColor = '#282010';
            textColor = '#fde68a';
          } else if (isVisitedNode) {
            ringColor = '#252a40';
            fillColor = '#11131e';
            textColor = '#64748b';
          }

          return (
            <g key={item.id || idx}>
              {(isMatchNode || isScanningNode) && (
                <circle
                  cx={cx}
                  cy={nodeY}
                  r={podRadius + 6}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={1.4}
                  strokeDasharray={isScanningNode ? '4 3' : undefined}
                  strokeOpacity={0.75}
                />
              )}

              <circle
                cx={cx}
                cy={nodeY}
                r={podRadius}
                fill={fillColor}
                stroke={ringColor}
                strokeWidth={isMatchNode || isScanningNode ? 2 : 1.3}
              />

              <text
                x={cx}
                y={nodeY + 4}
                textAnchor="middle"
                fill={textColor}
                fontSize={compact ? 11 : 13}
                fontWeight={700}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              >
                {item.value}
              </text>

              {/* Micro-indicador de nodo ya inspeccionado sin coincidencia */}
              {isVisitedNode && (
                <text
                  x={cx}
                  y={nodeY - podRadius - 6}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={9}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                >
                  !=
                </text>
              )}

              {/* Índice debajo del nodo */}
              <text
                x={cx}
                y={nodeY + podRadius + 15}
                textAnchor="middle"
                fill={isScanningNode ? '#fbbf24' : isMatchNode ? '#34d399' : '#64748b'}
                fontSize={9.5}
                fontWeight={isScanningNode || isMatchNode ? 700 : 500}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              >
                [{idx}]
              </text>

              {/* Puntero i o match */}
              {isScanningNode && (
                <g transform={`translate(${cx}, ${nodeY + podRadius + 29})`}>
                  <rect x={-11} y={-9} width={22} height={15} rx={4} fill="#f59e0b" />
                  <text
                    x={0}
                    y={2}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize={9.5}
                    fontWeight={800}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  >
                    i
                  </text>
                </g>
              )}

              {isMatchNode && (
                <g transform={`translate(${cx}, ${nodeY + podRadius + 29})`}>
                  <rect x={-18} y={-9} width={36} height={15} rx={4} fill="#10b981" />
                  <text
                    x={0}
                    y={2}
                    textAnchor="middle"
                    fill="#06281e"
                    fontSize={8.5}
                    fontWeight={800}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  >
                    idx {idx}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Medidor lineal de cobertura O(n) en la parte inferior */}
        <g transform={`translate(28, ${rulerY})`}>
          <text
            x={0}
            y={4}
            fill="#64748b"
            fontSize={9.5}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          >
            Recorrido lineal
          </text>
          <rect
            x={116}
            y={-5}
            width={Math.max(80, vbWidth - 230)}
            height={7}
            rx={3.5}
            fill="#181c2e"
          />
          <rect
            x={116}
            y={-5}
            width={
              Math.max(80, vbWidth - 230) * Math.min(1, Math.max(0, inspectedCount / n))
            }
            height={7}
            rx={3.5}
            fill={isFound ? '#34d399' : isFinalNotFound ? '#f43f5e' : '#f59e0b'}
          />
          <text
            x={vbWidth - 56}
            y={4}
            textAnchor="end"
            fill="#cbd5e1"
            fontSize={10}
            fontWeight={700}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          >
            {inspectedCount}/{n}
          </text>
        </g>

        {/* Dron autónomo de lectura */}
        <DroneGlyph
          x={droneX}
          y={railY}
          targetNodeY={nodeY - podRadius - 4}
          vbWidth={vbWidth}
          status={droneStatus}
          hudText={hudText}
          gradientId={gradBeamId}
          showBeam={showBeam}
          compact={compact}
        />
      </svg>
    </div>
  );
};

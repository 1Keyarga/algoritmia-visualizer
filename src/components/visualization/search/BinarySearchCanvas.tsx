import React, { useId } from 'react';
import type { ArrayElement, Step } from '../../../types/trace';
import { DroneGlyph, type DroneStatus } from './DroneGlyph';
import type { SearchTelemetry } from './searchHistory';

interface BinarySearchCanvasProps {
  array: ArrayElement[];
  currentStep: Step | null;
  telemetry: SearchTelemetry;
  compact?: boolean;
}

export const BinarySearchCanvas: React.FC<BinarySearchCanvasProps> = ({
  array,
  currentStep,
  telemetry,
  compact = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const n = Math.max(1, array.length);
  const {
    target,
    inicio,
    fin,
    medio,
    resultado,
    isFound,
    isFinalNotFound,
    binaryIterations,
  } = telemetry;

  const pitch = compact ? 44 : Math.max(48, Math.min(68, Math.floor(740 / n)));
  const minW = compact ? 350 : 580;
  const vbWidth = Math.max(minW, n * pitch + (compact ? 72 : 96));

  const visibleHistory = compact ? binaryIterations.slice(-3) : binaryIterations.slice(-5);
  const cascadeRowH = compact ? 17 : 20;
  const cascadeHeaderH = 20;
  const cascadeHeight = Math.max(compact ? 56 : 74, cascadeHeaderH + Math.max(1, visibleHistory.length) * cascadeRowH + 10);

  const capW = compact ? 38 : Math.min(48, Math.floor(pitch * 0.78));
  const capH = compact ? 30 : 34;

  const railY = compact ? 58 : 70;
  const nodeY = compact ? 132 : 154;
  const frameTop = nodeY - capH / 2 - 7;
  const frameH = capH + 13;
  const gateTop = nodeY - capH / 2 - 9;
  const gateBottom = nodeY + capH / 2 + 8;
  const indexY = nodeY + capH / 2 + 21;
  const pointerY = nodeY + capH / 2 + 34;
  const cascadeTopY = nodeY + capH / 2 + (compact ? 48 : 54);
  const vbHeight = cascadeTopY + cascadeHeight;

  const startX = (vbWidth - (n - 1) * pitch) / 2;
  const colX = (idx: number) => startX + idx * pitch;

  const leftBound = inicio !== undefined ? inicio : 0;
  const rightBound = fin !== undefined ? fin : n - 1;
  const hasEmptyRange = isFinalNotFound || leftBound > rightBound;

  const gradBeamId = `bin-beam-${uid}`;
  const hatchPatternId = `bin-hatch-${uid}`;
  const gridPatternId = `bin-grid-${uid}`;

  // Coordenadas de puertas lógicas [inicio..fin]
  const clampedLeft = Math.min(Math.max(0, leftBound), n - 1);
  const clampedRight = Math.min(Math.max(0, rightBound), n - 1);
  const leftGateX = colX(clampedLeft) - pitch * 0.48;
  const rightGateX = colX(clampedRight) + pitch * 0.48;
  const trackLeftEdge = colX(0) - pitch * 0.5;
  const trackRightEdge = colX(n - 1) + pitch * 0.5;
  const activeRangeCenterX = hasEmptyRange
    ? (trackLeftEdge + trackRightEdge) / 2
    : (colX(clampedLeft) + colX(clampedRight)) / 2;

  // Posición y estado del dron de bisección (se mantiene centrado sobre el rango activo en el bucle while)
  const midSafe =
    medio !== undefined && medio >= 0 && medio < n
      ? medio
      : binaryIterations.length > 0
        ? binaryIterations[binaryIterations.length - 1].mid
        : undefined;

  let droneX = activeRangeCenterX;
  let droneStatus: DroneStatus = 'idle';
  let showBeam = false;
  let hudText = `[${Math.max(0, leftBound)}..${Math.max(0, rightBound)}]`;

  if (isFound && resultado !== undefined && resultado >= 0 && resultado < n) {
    droneX = colX(resultado);
    droneStatus = 'matched';
    showBeam = true;
    hudText = `${array[resultado]?.value} == ${target}`;
  } else if (isFinalNotFound) {
    droneX = midSafe !== undefined ? colX(midSafe) : (trackLeftEdge + trackRightEdge) / 2;
    droneStatus = 'missed';
    showBeam = false;
    hudText = 'rango vacío · -1';
  } else if (medio !== undefined && medio >= 0 && medio < n) {
    droneX = colX(medio);
    droneStatus = 'scanning';
    showBeam = true;
    const midVal = array[medio]?.value ?? 0;
    const rel = midVal < target ? '<' : midVal > target ? '>' : '==';
    const nextHint =
      midVal < target
        ? 'ini=med+1'
        : midVal > target
          ? 'fin=med-1'
          : 'hallado';
    hudText =
      currentStep?.operationType === 'compare'
        ? `${midVal} ${rel} ${target} · ${nextHint}`
        : `med=${medio} (${midVal})`;
  }

  const droneAccent =
    droneStatus === 'matched'
      ? '#34d399'
      : droneStatus === 'missed'
        ? '#f43f5e'
        : droneStatus === 'scanning'
          ? '#fbbf24'
          : '#818cf8';

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-[#0e1019] rounded-lg border border-[#1f2336]">
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-full"
        role="img"
        aria-label="Diagrama de contracción por bisección en búsqueda binaria"
      >
        <defs>
          <pattern id={gridPatternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#171b2c" strokeWidth="0.7" />
          </pattern>
          <pattern
            id={hatchPatternId}
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1.4" strokeOpacity="0.35" />
          </pattern>
          <linearGradient id={gradBeamId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={droneAccent} stopOpacity="0.34" />
            <stop offset="100%" stopColor={droneAccent} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <rect width={vbWidth} height={vbHeight} fill={`url(#${gridPatternId})`} />

        {/* Trayectoria del dron: nodos visitados + arcos parabólicos conectados sin trazos sueltos */}
        {binaryIterations.map((it, i) => {
          const x2 = colX(it.mid);
          const prev = i > 0 ? binaryIterations[i - 1] : null;
          const x1 = prev ? colX(prev.mid) : x2;
          const hasJump = !!prev && Math.abs(x2 - x1) >= 2;
          const isActiveArrival =
            i === binaryIterations.length - 1 &&
            ((medio !== undefined && it.mid === medio) ||
              (isFound && resultado !== undefined && it.mid === resultado));
          const arcLift = Math.min(46, Math.max(18, Math.abs(x2 - x1) * 0.22));
          const midX = (x1 + x2) / 2;
          const arcColor =
            isFound && isActiveArrival
              ? '#34d399'
              : isActiveArrival
                ? '#fbbf24'
                : '#4f46e5';

          return (
            <g key={`jump-${it.iteration}`}>
              {hasJump && (
                <path
                  d={`M ${x1},${railY} Q ${midX},${railY - arcLift} ${x2},${railY}`}
                  fill="none"
                  stroke={arcColor}
                  strokeWidth={isActiveArrival ? 1.8 : 1.15}
                  strokeDasharray="4 3"
                  strokeOpacity={isActiveArrival ? 0.78 : 0.36}
                />
              )}
              <circle
                cx={x2}
                cy={railY}
                r={compact ? 2.2 : 2.6}
                fill={
                  isFound && it.mid === resultado
                    ? '#34d399'
                    : isActiveArrival
                      ? '#fbbf24'
                      : '#6366f1'
                }
                fillOpacity={isActiveArrival ? 0.9 : 0.55}
              />
            </g>
          );
        })}

        {/* Vector activo de desplazamiento cuando el dron se centra sobre el nuevo rango */}
        {!isFound &&
          !isFinalNotFound &&
          medio === undefined &&
          binaryIterations.length > 0 &&
          (() => {
            const lastMidX = colX(binaryIterations[binaryIterations.length - 1].mid);
            if (Math.abs(droneX - lastMidX) < 2) return null;
            const arcLift = Math.min(40, Math.max(16, Math.abs(droneX - lastMidX) * 0.22));
            const midX = (lastMidX + droneX) / 2;
            return (
              <path
                d={`M ${lastMidX},${railY} Q ${midX},${railY - arcLift} ${droneX},${railY}`}
                fill="none"
                stroke="#818cf8"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeOpacity={0.72}
              />
            );
          })()}

        {/* Zonas de exclusión (mitades descartadas detrás de las compuertas) */}
        {hasEmptyRange ? (
          <rect
            x={trackLeftEdge}
            y={frameTop}
            width={trackRightEdge - trackLeftEdge}
            height={frameH}
            rx={8}
            fill={`url(#${hatchPatternId})`}
            stroke="#312e4a"
            strokeOpacity={0.5}
          />
        ) : (
          <>
            {leftBound > 0 && (
              <rect
                x={trackLeftEdge}
                y={frameTop}
                width={Math.max(0, leftGateX - trackLeftEdge)}
                height={frameH}
                rx={6}
                fill={`url(#${hatchPatternId})`}
              />
            )}
            {rightBound < n - 1 && (
              <rect
                x={rightGateX}
                y={frameTop}
                width={Math.max(0, trackRightEdge - rightGateX)}
                height={frameH}
                rx={6}
                fill={`url(#${hatchPatternId})`}
              />
            )}
            {/* Marco del rango activo [inicio..fin] (sin invadir la fila de índices) */}
            <rect
              x={leftGateX}
              y={frameTop}
              width={Math.max(8, rightGateX - leftGateX)}
              height={frameH}
              rx={8}
              fill="rgba(99, 102, 241, 0.05)"
              stroke="#3b4370"
              strokeWidth={1.1}
            />
          </>
        )}

        {/* Compuertas móviles de límite inicio / fin */}
        {!hasEmptyRange && !isFound && (
          <g>
            <g
              style={{
                transform: `translateX(${leftGateX}px)`,
                transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <line
                x1={0}
                y1={gateTop}
                x2={0}
                y2={gateBottom}
                stroke="#60a5fa"
                strokeWidth={2}
              />
              <path
                d={`M 0,${gateTop} L 6,${gateTop} M 0,${gateBottom} L 6,${gateBottom}`}
                stroke="#60a5fa"
                strokeWidth={2}
              />
            </g>

            <g
              style={{
                transform: `translateX(${rightGateX}px)`,
                transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <line
                x1={0}
                y1={gateTop}
                x2={0}
                y2={gateBottom}
                stroke="#a78bfa"
                strokeWidth={2}
              />
              <path
                d={`M -6,${gateTop} L 0,${gateTop} M -6,${gateBottom} L 0,${gateBottom}`}
                stroke="#a78bfa"
                strokeWidth={2}
              />
            </g>
          </g>
        )}

        {/* Línea base ordenada */}
        <line
          x1={colX(0)}
          y1={nodeY}
          x2={colX(n - 1)}
          y2={nodeY}
          stroke="#262b42"
          strokeWidth={1.5}
        />

        {/* Cápsulas de valores ordenados */}
        {array.map((item, idx) => {
          const cx = colX(idx);
          const isMatchNode = isFound && idx === resultado;
          const isMidNode = !isFound && !isFinalNotFound && medio === idx;
          const isDiscardedNode =
            isFinalNotFound ||
            (!isMatchNode && (idx < leftBound || idx > rightBound));

          const isIniHere = !isFinalNotFound && inicio === idx;
          const isFinHere = !isFinalNotFound && fin === idx;
          const pointerTags: Array<{ label: string; bg: string; fg: string }> = [];
          if (isIniHere) pointerTags.push({ label: 'ini', bg: '#2563eb', fg: '#ffffff' });
          if (isMidNode || isMatchNode) {
            pointerTags.push({
              label: isMatchNode ? `idx ${idx}` : 'med',
              bg: isMatchNode ? '#10b981' : '#f59e0b',
              fg: '#0f172a',
            });
          }
          if (isFinHere) pointerTags.push({ label: 'fin', bg: '#7c3aed', fg: '#ffffff' });

          let strokeColor = '#3f476e';
          let fillColor = '#171b2d';
          let textColor = '#e2e8f0';

          if (isMatchNode) {
            strokeColor = '#34d399';
            fillColor = '#0a2b21';
            textColor = '#a7f3d0';
          } else if (isMidNode) {
            strokeColor = '#fbbf24';
            fillColor = '#2b2211';
            textColor = '#fde68a';
          } else if (isDiscardedNode) {
            strokeColor = '#222638';
            fillColor = '#10121c';
            textColor = '#475569';
          }

          return (
            <g key={item.id || idx} opacity={isDiscardedNode ? 0.55 : 1}>
              <rect
                x={cx - capW / 2}
                y={nodeY - capH / 2 + (isMidNode ? -2 : 0)}
                width={capW}
                height={capH}
                rx={capH / 2}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isMatchNode || isMidNode ? 2 : 1.2}
              />
              <text
                x={cx}
                y={nodeY + 4 + (isMidNode ? -2 : 0)}
                textAnchor="middle"
                fill={textColor}
                fontSize={compact ? 11 : 12.5}
                fontWeight={700}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              >
                {item.value}
              </text>

              <text
                x={cx}
                y={indexY}
                textAnchor="middle"
                fill={isMidNode ? '#fbbf24' : isMatchNode ? '#34d399' : '#64748b'}
                fontSize={9}
                fontWeight={isMidNode || isMatchNode ? 700 : 500}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              >
                [{idx}]
              </text>

              {/* Etiquetas compactas de punteros sin colisión */}
              {pointerTags.length > 0 && (
                <g transform={`translate(${cx}, ${pointerY})`}>
                  {pointerTags.map((tag, tIdx) => {
                    const tagW = tag.label.length > 3 ? 34 : 24;
                    const totalTagW = pointerTags.reduce(
                      (acc, t) => acc + (t.label.length > 3 ? 34 : 24) + 2,
                      -2
                    );
                    const prevW = pointerTags
                      .slice(0, tIdx)
                      .reduce((acc, t) => acc + (t.label.length > 3 ? 34 : 24) + 2, 0);
                    const tx = -totalTagW / 2 + prevW;
                    return (
                      <g key={tag.label} transform={`translate(${tx}, 0)`}>
                        <rect x={0} y={-8} width={tagW} height={13} rx={3} fill={tag.bg} />
                        <text
                          x={tagW / 2}
                          y={1.5}
                          textAnchor="middle"
                          fill={tag.fg}
                          fontSize={8}
                          fontWeight={800}
                          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                        >
                          {tag.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}

        {/* Escalera de bisección: muestra la reducción O(log n) alineada por columna */}
        <g transform={`translate(0, ${cascadeTopY})`}>
          <text
            x={trackLeftEdge}
            y={10}
            fill="#64748b"
            fontSize={9.5}
            fontWeight={600}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          >
            Contracción del espacio
          </text>

          {visibleHistory.length === 0 ? (
            <g transform={`translate(0, ${cascadeHeaderH})`}>
              <rect
                x={trackLeftEdge}
                y={0}
                width={trackRightEdge - trackLeftEdge}
                height={11}
                rx={5}
                fill="#191d30"
                stroke="#2e3556"
              />
              <text
                x={(trackLeftEdge + trackRightEdge) / 2}
                y={9}
                textAnchor="middle"
                fill="#64748b"
                fontSize={8.5}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              >
                rango inicial [{Math.max(0, leftBound)}..{Math.max(0, rightBound)}]
              </text>
            </g>
          ) : (
            visibleHistory.map((it, rowIdx) => {
              const rowY = cascadeHeaderH + rowIdx * cascadeRowH;
              const bx = colX(it.left) - pitch * 0.42;
              const bw = Math.max(20, colX(it.right) + pitch * 0.42 - bx);
              const mx = colX(it.mid);
              const isCurrentIter = rowIdx === visibleHistory.length - 1;
              const spanColor =
                it.outcome === 'match'
                  ? '#10b981'
                  : isCurrentIter
                    ? '#f59e0b'
                    : '#6366f1';

              return (
                <g key={`cascade-${it.iteration}`} transform={`translate(0, ${rowY})`}>
                  {/* Pista base de referencia [0..n-1] */}
                  <rect
                    x={trackLeftEdge}
                    y={2}
                    width={trackRightEdge - trackLeftEdge}
                    height={9}
                    rx={4.5}
                    fill="#141726"
                  />
                  {/* Rango activo en esta iteración */}
                  <rect
                    x={bx}
                    y={2}
                    width={bw}
                    height={9}
                    rx={4.5}
                    fill={spanColor}
                    fillOpacity={isCurrentIter ? 0.28 : 0.16}
                    stroke={spanColor}
                    strokeWidth={isCurrentIter ? 1.2 : 0.8}
                    strokeOpacity={0.8}
                  />
                  {/* Punto medio evaluado */}
                  <circle cx={mx} cy={6.5} r={3.5} fill={spanColor} />

                  {/* Etiqueta iterativa compacta al margen izquierdo */}
                  <text
                    x={trackLeftEdge - 6}
                    y={10}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize={8.5}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  >
                    #{it.iteration}
                  </text>
                </g>
              );
            })
          )}
        </g>

        {/* Dron de bisección */}
        <DroneGlyph
          x={droneX}
          y={railY}
          targetNodeY={nodeY - capH / 2 - 4}
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

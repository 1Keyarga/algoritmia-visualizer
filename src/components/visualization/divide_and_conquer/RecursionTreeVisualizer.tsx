import React, { useMemo, useRef, useState } from 'react';
import type { RecursionTreeNode, DivideAndConquerState } from '../../../types/trace';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface RecursionTreeVisualizerProps {
  dcState: DivideAndConquerState;
}

interface PositionedNode {
  node: RecursionTreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const RecursionTreeVisualizer: React.FC<RecursionTreeVisualizerProps> = ({ dcState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { nodes, activeNodeId } = dcState;

  // Calcular posiciones del árbol de forma geométrica y alineada con los rangos [inicio..fin]
  const { positionedNodes, connections, svgBounds } = useMemo(() => {
    const nodeArray = Object.values(nodes);
    if (nodeArray.length === 0) {
      return { positionedNodes: [], connections: [], svgBounds: { width: 900, height: 500 } };
    }

    const nodeWidth = 144;
    const nodeHeight = 80;
    const levelHeight = 125;

    // Obtener rango global
    const rootNode = nodeArray.find(n => n.depth === 0) || nodeArray[0];
    const totalElements = rootNode.range[1] - rootNode.range[0] + 1;
    const maxDepth = Math.max(...nodeArray.map(n => n.depth), 0);

    const horizontalStep = Math.max(120, 960 / Math.max(totalElements, 4));
    const paddingX = 90;
    const paddingY = 60;

    const baseCanvasWidth = Math.max(900, (totalElements - 1) * horizontalStep + paddingX * 2);
    const baseCanvasHeight = (maxDepth + 1) * levelHeight + paddingY * 2;

    const posMap: Record<string, PositionedNode> = {};

    nodeArray.forEach(node => {
      const midRange = (node.range[0] + node.range[1]) / 2;
      const x = paddingX + midRange * horizontalStep;
      const y = paddingY + node.depth * levelHeight;

      posMap[node.id] = {
        node,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
      };
    });

    // Conexiones de ramas del árbol
    const conns: Array<{
      id: string;
      from: PositionedNode;
      to: PositionedNode;
      state: RecursionTreeNode['state'];
      isLeft: boolean;
    }> = [];

    Object.values(posMap).forEach(pNode => {
      if (pNode.node.parentId && posMap[pNode.node.parentId]) {
        const parent = posMap[pNode.node.parentId];
        conns.push({
          id: `conn-${parent.node.id}-${pNode.node.id}`,
          from: parent,
          to: pNode,
          state: pNode.node.state,
          isLeft: !!pNode.node.isLeftChild,
        });
      }
    });

    return {
      positionedNodes: Object.values(posMap),
      connections: conns,
      svgBounds: { width: baseCanvasWidth, height: baseCanvasHeight },
    };
  }, [nodes]);

  // Manejadores de Zoom y Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeBadge = (state: RecursionTreeNode['state']) => {
    switch (state) {
      case 'dividing':
        return { text: 'Dividiendo', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50', icon: '⚡' };
      case 'processing':
        return { text: 'Procesando', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/50', icon: '⚙' };
      case 'base_case':
        return { text: 'Caso Base', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', icon: '✔' };
      case 'combining':
        return { text: 'Combinando', bg: 'bg-purple-500/25 text-purple-300 border-purple-500/60 animate-pulse', icon: '⮁' };
      case 'solved':
        return { text: 'Resuelto', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50', icon: '★' };
      case 'completed':
        return { text: 'Completado', bg: 'bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold', icon: '🏆' };
      default:
        return { text: 'En espera', bg: 'bg-slate-700/30 text-slate-400 border-slate-600/40', icon: '•' };
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full bg-[#11121b] overflow-hidden select-none cursor-${
        isDragging ? 'grabbing' : 'grab'
      }`}
    >
      {/* Controles de Zoom Flotantes */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#181a27]/90 border border-[#2b2d42] backdrop-blur p-1 rounded-lg shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Acercar"
          className="p-1.5 hover:bg-slate-700/60 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Alejar"
          className="p-1.5 hover:bg-slate-700/60 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Restablecer vista"
          className="p-1.5 hover:bg-slate-700/60 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1.5 border-l border-[#2e3146]">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* SVG Canvas del Árbol de Recursión con viewBox que llena la pantalla */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgBounds.width} ${svgBounds.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <defs>
          <filter id="glow-active-node" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Conexiones (Ramas del Árbol de Recursión) */}
        <g className="connections-layer">
          {connections.map(conn => {
            const startX = conn.from.x;
            const startY = conn.from.y + conn.from.height / 2;
            const endX = conn.to.x;
            const endY = conn.to.y - conn.to.height / 2;
            const midY = (startY + endY) / 2;

            const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
            const isActive = conn.to.node.id === activeNodeId || conn.from.node.id === activeNodeId;
            const isCombining = conn.to.node.state === 'combining' || conn.from.node.state === 'combining';
            const isSolved = conn.to.node.state === 'solved' || conn.to.node.state === 'completed';

            let strokeColor = '#2b2d42';
            let strokeWidth = 2.5;
            let strokeDash = 'none';

            if (isCombining) {
              strokeColor = '#c084fc';
              strokeWidth = 3.5;
              strokeDash = '5,5';
            } else if (isActive) {
              strokeColor = '#fbbf24';
              strokeWidth = 3.5;
            } else if (isSolved) {
              strokeColor = '#10b981';
              strokeWidth = 3;
            }

            return (
              <g key={conn.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                <text
                  x={(startX + endX) / 2 + (conn.isLeft ? -16 : 16)}
                  y={midY}
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {conn.isLeft ? 'izq' : 'der'}
                </text>
              </g>
            );
          })}
        </g>

        {/* 2. Nodos del Árbol de Recursión (Con subarreglos vivos y legibles) */}
        <g className="nodes-layer">
          {positionedNodes.map(pNode => {
            const { node, x, y, width, height } = pNode;
            const isActive = node.id === activeNodeId;
            const badge = getNodeBadge(node.state);
            const currentVals = node.currentValues || node.values;

            let cardBg = '#171926';
            let borderColor = '#2d3046';

            if (isActive) {
              borderColor = '#fbbf24';
              cardBg = '#1e1f32';
            } else if (node.state === 'combining') {
              borderColor = '#a855f7';
              cardBg = '#221935';
            } else if (node.state === 'base_case') {
              borderColor = '#10b981';
              cardBg = '#132420';
            } else if (node.state === 'solved' || node.state === 'completed') {
              borderColor = '#34d399';
              cardBg = '#122220';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${x - width / 2}, ${y - height / 2})`}
                className="transition-all duration-300"
                filter={isActive ? 'url(#glow-active-node)' : undefined}
              >
                {/* Rectángulo Base */}
                <rect
                  width={width}
                  height={height}
                  rx="10"
                  fill={cardBg}
                  stroke={borderColor}
                  strokeWidth={isActive ? 3 : 1.5}
                  className="transition-colors duration-300 shadow-xl"
                />

                {/* Contenido HTML del Nodo */}
                <foreignObject width={width} height={height} x={0} y={0}>
                  <div className="w-full h-full p-2 flex flex-col justify-between font-sans select-none">
                    {/* Cabecera: Rango + Estado */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-black text-slate-200">
                        [{node.range[0]}..{node.range[1]}]
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${badge.bg}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.text}</span>
                      </span>
                    </div>

                    {/* Micro-subarreglo con valores visibles grandes */}
                    <div className="flex items-center justify-center gap-1 overflow-x-auto py-0.5">
                      {currentVals.map((val, vIdx) => {
                        let valBg = 'bg-[#222538] text-slate-100 border-[#383d5a]';
                        if (node.state === 'base_case') {
                          valBg = 'bg-emerald-500/30 text-emerald-200 border-emerald-500 font-bold';
                        } else if (node.state === 'combining') {
                          valBg = 'bg-purple-500/30 text-purple-200 border-purple-500 font-bold';
                        } else if (node.state === 'solved' || node.state === 'completed') {
                          valBg = 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold';
                        }

                        return (
                          <div
                            key={vIdx}
                            className={`px-1.5 py-0.5 text-xs font-mono font-bold rounded border ${valBg} shrink-0 text-center min-w-[22px] shadow-xs`}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { RecursionTreeNode, DivideAndConquerState } from '../../../types/trace';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useContainerSize } from '../../../hooks/useContainerSize';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const lastFitKeyRef = useRef<string>('');
  const viewSize = useContainerSize(containerRef);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, activeNodeId } = dcState;

  // 1. Geometría sin solapamiento entre nodos
  const { positionedNodes, connections, fixedWorldBounds, totalElements } = useMemo(() => {
    const nodeArray = Object.values(nodes);
    if (nodeArray.length === 0) {
      return {
        positionedNodes: [],
        connections: [],
        fixedWorldBounds: null,
        totalElements: 0,
      };
    }

    const rootNode = nodeArray.find(n => n.depth === 0) || nodeArray[0];
    const totalElems = Math.max(1, rootNode.range[1] - rootNode.range[0] + 1);

    const SPACING_PER_ELEMENT = 118;
    const PADDING_X = 90;
    const PADDING_Y = 56;
    const LEVEL_HEIGHT = 122;

    const posMap: Record<string, PositionedNode> = {};

    nodeArray.forEach(node => {
      const start = node.range[0];
      const end = node.range[1];
      const count = Math.max(1, end - start + 1);

      const width = Math.max(84, count * 34 + 20);
      const height = 74;

      const centerIndex = (start + end) / 2;
      const x = PADDING_X + centerIndex * SPACING_PER_ELEMENT;
      const y = PADDING_Y + node.depth * LEVEL_HEIGHT;

      posMap[node.id] = { node, x, y, width, height };
    });

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

    const expectedTreeDepth = Math.max(3, Math.ceil(Math.log2(totalElems)));
    const minX = PADDING_X - 54;
    const maxX = PADDING_X + (totalElems - 1) * SPACING_PER_ELEMENT + 54;
    const minY = PADDING_Y - 42;
    const maxY = PADDING_Y + expectedTreeDepth * LEVEL_HEIGHT + 42;

    return {
      positionedNodes: Object.values(posMap),
      connections: conns,
      totalElements: totalElems,
      fixedWorldBounds: {
        minX,
        maxX,
        minY,
        maxY,
        width: Math.max(200, maxX - minX),
        height: Math.max(180, maxY - minY),
      },
    };
  }, [nodes]);

  // 2. Configurar D3 Zoom libre para que el usuario se desplace sin restricciones
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    zoomBehavior.current = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.2])
      .on('zoom', event => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior.current);
    svg.on('dblclick.zoom', null);
  }, []);

  // 3. Encajar el árbol en pantalla (solo al iniciar o al pulsar el botón Encajar)
  const applyFitToView = useCallback(
    (animate: boolean) => {
      if (!svgRef.current || !fixedWorldBounds || !zoomBehavior.current) return;
      const vw = viewSize.width;
      const vh = viewSize.height;
      if (vw < 20 || vh < 20) return;

      const paddingX = 36;
      const paddingY = 32;
      const scale = Math.min(
        (vw - paddingX * 2) / Math.max(1, fixedWorldBounds.width),
        (vh - paddingY * 2) / Math.max(1, fixedWorldBounds.height),
        1.0
      );

      const clampedScale = Math.max(0.32, scale);
      const cx = fixedWorldBounds.minX + fixedWorldBounds.width / 2;
      const cy = fixedWorldBounds.minY + fixedWorldBounds.height / 2;
      const transform = d3.zoomIdentity
        .translate(vw / 2, vh / 2)
        .scale(clampedScale)
        .translate(-cx, -cy);

      const svg = d3.select(svgRef.current);
      if (animate) {
        svg
          .transition()
          .duration(240)
          .ease(d3.easeCubicOut)
          .call(zoomBehavior.current.transform, transform);
      } else {
        svg.call(zoomBehavior.current.transform, transform);
      }
    },
    [fixedWorldBounds, viewSize.width, viewSize.height]
  );

  // Solo encaja cuando cambia el tamaño de la ventana o la cantidad de elementos del arreglo.
  // Durante la ejecución paso a paso, nunca mueve ni reinicia la vista del usuario.
  useEffect(() => {
    if (!fixedWorldBounds || viewSize.width < 20 || viewSize.height < 20 || totalElements === 0) {
      return;
    }
    const fitKey = `${totalElements}-${viewSize.width}x${viewSize.height}`;
    if (lastFitKeyRef.current !== fitKey) {
      lastFitKeyRef.current = fitKey;
      applyFitToView(false);
    }
  }, [totalElements, viewSize.width, viewSize.height, fixedWorldBounds, applyFitToView]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(180).call(zoomBehavior.current.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(180).call(zoomBehavior.current.scaleBy, 0.8);
    }
  };

  const handleResetView = () => {
    applyFitToView(true);
  };

  const getNodeBadge = (state: RecursionTreeNode['state'], count: number) => {
    const isCompact = count <= 2;
    switch (state) {
      case 'dividing':
        return {
          text: isCompact ? 'Div' : 'Dividiendo',
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        };
      case 'processing':
        return {
          text: 'Activo',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        };
      case 'base_case':
        return {
          text: isCompact ? 'Base' : 'Caso Base',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        };
      case 'combining':
        return {
          text: isCompact ? 'Comb' : 'Combinando',
          bg: 'bg-purple-500/25 text-purple-300 border-purple-500/60',
        };
      case 'solved':
      case 'completed':
        return {
          text: isCompact ? 'Listo' : 'Ordenado',
          bg: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60 font-bold',
        };
      default:
        return {
          text: isCompact ? '...' : 'Pendiente',
          bg: 'bg-[#151722] text-slate-400 border-[#232537]',
        };
    }
  };

  const selectedNode = positionedNodes.find(p => p.node.id === selectedNodeId) || null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0d0e15] overflow-hidden select-none"
    >
      {/* Controles de zoom y encuadre */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#161825]/95 border border-[#2a2d42] px-1.5 py-1 rounded-lg shadow-md">
        <button
          onClick={handleZoomIn}
          title="Acercar"
          className="p-1.5 hover:bg-[#23263a] rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Alejar"
          className="p-1.5 hover:bg-[#23263a] rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetView}
          title="Centrar árbol"
          className="px-2 py-1 hover:bg-[#23263a] rounded text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Maximize className="w-3 h-3 text-indigo-400" />
          <span>Centrar</span>
        </button>
      </div>

      {/* Lienzo SVG del Árbol de Recursión */}
      <svg
        ref={svgRef}
        className="w-full h-full block"
        style={{ cursor: 'grab' }}
        onMouseDown={() => {
          if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
        }}
        onMouseUp={() => {
          if (svgRef.current) svgRef.current.style.cursor = 'grab';
        }}
        onMouseLeave={() => {
          if (svgRef.current) svgRef.current.style.cursor = 'grab';
        }}
        onClick={() => setSelectedNodeId(null)}
      >
        <g ref={gRef}>
          {/* Aristas de llamada recursiva */}
          <g className="connections">
            {connections.map(conn => {
              const startX = conn.from.x;
              const startY = conn.from.y + conn.from.height / 2;
              const endX = conn.to.x;
              const endY = conn.to.y - conn.to.height / 2;

              const isCombining =
                conn.to.node.state === 'combining' || conn.from.node.state === 'combining';
              const isActive =
                conn.to.node.id === activeNodeId || conn.from.node.id === activeNodeId;
              const isSolved =
                conn.to.node.state === 'solved' || conn.to.node.state === 'completed';

              let color = '#2a2e45';
              let strokeW = 2;
              if (isActive) {
                color = '#fbbf24';
                strokeW = 2.5;
              } else if (isCombining) {
                color = '#c084fc';
                strokeW = 2.5;
              } else if (isSolved) {
                color = '#10b981';
                strokeW = 2;
              }

              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              return (
                <g key={conn.id}>
                  <path
                    d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeDasharray={isCombining ? '5,4' : 'none'}
                  />
                  <rect
                    x={midX - 16}
                    y={midY - 7}
                    width={32}
                    height={14}
                    rx={4}
                    fill="#131521"
                    stroke={color}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    fill="#cbd5e1"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {conn.isLeft ? 'Izq' : 'Der'}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Nodos de subproblemas */}
          <g className="nodes">
            {positionedNodes.map(pNode => {
              const { node, x, y, width, height } = pNode;
              const isActive = node.id === activeNodeId;
              const isSelected = selectedNodeId === node.id;
              const currentVals = node.currentValues || node.values;
              const badge = getNodeBadge(node.state, currentVals.length);

              let bg = '#151724';
              let border = '#2b2f47';
              if (isActive) {
                bg = '#1e2036';
                border = '#fbbf24';
              } else if (isSelected) {
                bg = '#1b1e34';
                border = '#818cf8';
              } else if (node.state === 'combining') {
                bg = '#1d162b';
                border = '#a855f7';
              } else if (
                node.state === 'base_case' ||
                node.state === 'solved' ||
                node.state === 'completed'
              ) {
                bg = '#11221e';
                border = '#10b981';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${x - width / 2}, ${y - height / 2})`}
                  style={{ cursor: 'pointer' }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedNodeId(prev => (prev === node.id ? null : node.id));
                  }}
                >
                  <rect
                    width={width}
                    height={height}
                    rx="10"
                    fill={bg}
                    stroke={border}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />

                  <foreignObject
                    width={width}
                    height={height}
                    x={0}
                    y={0}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="w-full h-full flex flex-col justify-between p-1.5 box-border overflow-hidden">
                      {/* Cabecera de 1 sola línea */}
                      <div className="flex items-center justify-between gap-1 px-0.5 whitespace-nowrap">
                        <span className="text-[9.5px] font-mono text-indigo-300 font-bold leading-none">
                          [{node.range[0]}..{node.range[1]}]
                        </span>
                        {node.pivotValue !== undefined && currentVals.length > 2 && (
                          <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-purple-500/25 text-purple-200 border border-purple-400/40 leading-none">
                            piv:{node.pivotValue}
                          </span>
                        )}
                        <span
                          className={`text-[8.5px] font-mono px-1 py-0.2 rounded border leading-none whitespace-nowrap ${badge.bg}`}
                        >
                          {badge.text}
                        </span>
                      </div>

                      {/* Celdas del subarreglo */}
                      <div className="flex items-center justify-center gap-1">
                        {currentVals.map((val, idx) => {
                          const globalIdx = node.range[0] + idx;
                          const isPivotCell =
                            node.pivotIndex !== undefined && globalIdx === node.pivotIndex;

                          let cellCls = 'bg-[#1d2033] border-[#323652] text-slate-100';
                          if (isPivotCell) {
                            cellCls =
                              'bg-purple-500/30 border-purple-400 text-purple-100 font-black';
                          } else if (
                            node.state === 'base_case' ||
                            node.state === 'solved' ||
                            node.state === 'completed'
                          ) {
                            cellCls =
                              'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 font-bold';
                          } else if (node.state === 'combining') {
                            cellCls = 'bg-purple-950/60 border-purple-500/40 text-purple-200';
                          }

                          return (
                            <div
                              key={idx}
                              className={`w-7 h-7 flex items-center justify-center text-[11px] font-mono font-bold border rounded shrink-0 ${cellCls}`}
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
        </g>
      </svg>

      {/* Detalle al hacer clic en un nodo */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 z-20 bg-[#171929]/95 border border-[#2f334d] rounded-xl p-3 shadow-xl text-xs font-mono w-64">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#262940]">
            <span className="font-bold text-indigo-300">
              Rango [{selectedNode.node.range[0]}..{selectedNode.node.range[1]}]
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border ${
                getNodeBadge(selectedNode.node.state, 4).bg
              }`}
            >
              {getNodeBadge(selectedNode.node.state, 4).text}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Nivel:</span>
              <span>{selectedNode.node.depth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Valores:</span>
              <span>
                [{(selectedNode.node.currentValues || selectedNode.node.values).join(', ')}]
              </span>
            </div>
            {selectedNode.node.pivotValue !== undefined && (
              <div className="flex justify-between text-purple-300">
                <span>Pivote:</span>
                <span>{selectedNode.node.pivotValue}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

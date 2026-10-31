import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { RecursionTreeNode, DivideAndConquerState } from '../../../types/trace';
import { ZoomIn, ZoomOut, Target, Maximize } from 'lucide-react';
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
  const currentTransform = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const userHasPannedRef = useRef<boolean>(false);
  const viewSize = useContainerSize(containerRef);

  const [isAutoTracking, setIsAutoTracking] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, activeNodeId } = dcState;

  // 1. Geometría proporcionada y sin desbordes para cualquier cantidad de elementos
  const { positionedNodes, connections, bounds } = useMemo(() => {
    const nodeArray = Object.values(nodes);
    if (nodeArray.length === 0) {
      return { positionedNodes: [], connections: [], bounds: null };
    }

    const rootNode = nodeArray.find(n => n.depth === 0) || nodeArray[0];
    const totalElements = Math.max(1, rootNode.range[1] - rootNode.range[0] + 1);
    const SPACING_PER_ELEMENT = totalElements > 12 ? 68 : totalElements > 8 ? 78 : 90;
    const PADDING_X = 80;
    const PADDING_Y = 64;
    const LEVEL_HEIGHT = 128;

    const posMap: Record<string, PositionedNode> = {};
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodeArray.forEach(node => {
      const start = node.range[0];
      const end = node.range[1];
      const count = Math.max(1, end - start + 1);

      const width = Math.max(118, count * 34 + 24);
      const height = 78;

      const centerIndex = (start + end) / 2;
      const x = PADDING_X + centerIndex * SPACING_PER_ELEMENT;
      const y = PADDING_Y + node.depth * LEVEL_HEIGHT;

      posMap[node.id] = { node, x, y, width, height };

      if (x - width / 2 < minX) minX = x - width / 2;
      if (x + width / 2 > maxX) maxX = x + width / 2;
      if (y - height / 2 < minY) minY = y - height / 2;
      if (y + height / 2 > maxY) maxY = y + height / 2;
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

    return {
      positionedNodes: Object.values(posMap),
      connections: conns,
      bounds: {
        minX,
        maxX,
        minY,
        maxY,
        width: Math.max(160, maxX - minX),
        height: Math.max(100, maxY - minY),
      },
    };
  }, [nodes]);

  // 2. Configurar D3 Zoom sobre el lienzo SVG
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    zoomBehavior.current = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.2])
      .on('zoom', event => {
        currentTransform.current = event.transform;
        g.attr('transform', event.transform.toString());
      })
      .on('start', event => {
        if (event.sourceEvent) {
          userHasPannedRef.current = true;
          setIsAutoTracking(false);
        }
      });

    svg.call(zoomBehavior.current);
    svg.on('dblclick.zoom', null);
  }, []);

  // 3. Encajar el árbol automáticamente en el contenedor
  const fitToView = useCallback(
    (animate: boolean) => {
      if (!svgRef.current || !bounds || !zoomBehavior.current) return;
      const vw = viewSize.width;
      const vh = viewSize.height;
      if (vw < 20 || vh < 20) return;

      const paddingX = 48;
      const paddingY = 36;
      const scale = Math.min(
        (vw - paddingX * 2) / Math.max(1, bounds.width),
        (vh - paddingY * 2) / Math.max(1, bounds.height),
        1.05
      );

      const clampedScale = Math.max(0.35, scale);
      const cx = bounds.minX + bounds.width / 2;
      const cy = bounds.minY + bounds.height / 2;
      const transform = d3.zoomIdentity
        .translate(vw / 2, vh / 2)
        .scale(clampedScale)
        .translate(-cx, -cy);

      const svg = d3.select(svgRef.current);
      if (animate) {
        svg
          .transition()
          .duration(260)
          .ease(d3.easeCubicOut)
          .call(zoomBehavior.current.transform, transform);
      } else {
        svg.call(zoomBehavior.current.transform, transform);
      }
    },
    [bounds, viewSize.width, viewSize.height]
  );

  // Auto-encajar cuando cambia el tamaño del contenedor o crece el árbol (si el usuario no ha arrastrado manualmente)
  useEffect(() => {
    if (!bounds || viewSize.width < 20 || viewSize.height < 20) return;
    if (!isAutoTracking && !userHasPannedRef.current) {
      fitToView(positionedNodes.length > 1);
    }
  }, [bounds?.width, bounds?.height, viewSize.width, viewSize.height, isAutoTracking, fitToView, positionedNodes.length]);

  // Al reiniciar al paso inicial (un solo nodo raíz), volver a encajar automáticamente
  useEffect(() => {
    if (positionedNodes.length <= 1) {
      userHasPannedRef.current = false;
      fitToView(false);
    }
  }, [positionedNodes.length, fitToView]);

  // 4. Modo Seguimiento Opcional del Nodo Activo
  const centerOnNode = useCallback(
    (nodeId: string, animate: boolean) => {
      if (!svgRef.current || !zoomBehavior.current) return;
      const pNode = positionedNodes.find(n => n.node.id === nodeId);
      if (!pNode) return;

      const vw = viewSize.width;
      const vh = viewSize.height;
      if (vw < 20 || vh < 20) return;

      const comfortScale = 0.85;
      const transform = d3.zoomIdentity
        .translate(vw / 2, vh / 2)
        .scale(comfortScale)
        .translate(-pNode.x, -pNode.y);

      const svg = d3.select(svgRef.current);
      if (animate) {
        svg
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .call(zoomBehavior.current.transform, transform);
      } else {
        svg.call(zoomBehavior.current.transform, transform);
      }
    },
    [positionedNodes, viewSize.width, viewSize.height]
  );

  useEffect(() => {
    if (!activeNodeId || !isAutoTracking) return;
    centerOnNode(activeNodeId, true);
  }, [activeNodeId, isAutoTracking, centerOnNode]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehavior.current) {
      userHasPannedRef.current = true;
      d3.select(svgRef.current).transition().duration(200).call(zoomBehavior.current.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehavior.current) {
      userHasPannedRef.current = true;
      d3.select(svgRef.current).transition().duration(200).call(zoomBehavior.current.scaleBy, 0.8);
    }
  };

  const handleResetView = () => {
    userHasPannedRef.current = false;
    setIsAutoTracking(false);
    fitToView(true);
  };

  const handleToggleAutoTracking = () => {
    const nextState = !isAutoTracking;
    setIsAutoTracking(nextState);
    if (nextState && activeNodeId) {
      centerOnNode(activeNodeId, true);
    } else if (!nextState) {
      userHasPannedRef.current = false;
      fitToView(true);
    }
  };

  const getNodeBadge = (state: RecursionTreeNode['state']) => {
    switch (state) {
      case 'dividing':
        return { text: 'Dividiendo', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
      case 'processing':
        return { text: 'Activo', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50' };
      case 'base_case':
        return { text: 'Caso Base', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' };
      case 'combining':
        return { text: 'Combinando', bg: 'bg-purple-500/25 text-purple-300 border-purple-500/60' };
      case 'solved':
      case 'completed':
        return { text: 'Ordenado ✔', bg: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60 font-bold' };
      default:
        return { text: 'Pendiente', bg: 'bg-[#151722] text-slate-400 border-[#232537]' };
    }
  };

  const selectedNode = positionedNodes.find(p => p.node.id === selectedNodeId) || null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0d0e15] overflow-hidden select-none"
    >
      {/* Barra flotante superior derecha: Zoom y Encaje Automático */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#161825]/95 border border-[#2a2d42] px-1.5 py-1 rounded-lg shadow-md">
        <button
          onClick={handleZoomIn}
          title="Acercar árbol"
          className="p-1.5 hover:bg-[#23263a] rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Alejar árbol"
          className="p-1.5 hover:bg-[#23263a] rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetView}
          title="Encajar árbol completo en pantalla"
          className="px-2 py-1 hover:bg-[#23263a] rounded text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Maximize className="w-3 h-3 text-indigo-400" />
          <span>Encajar</span>
        </button>
        <div className="w-[1px] h-4 bg-[#2b2d42] mx-0.5" />
        <button
          onClick={handleToggleAutoTracking}
          title={isAutoTracking ? 'Desactivar enfoque en nodo activo' : 'Enfocar nodo activo'}
          className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
            isAutoTracking
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
              : 'bg-transparent border-transparent text-slate-400 hover:bg-[#23263a] hover:text-slate-200'
          }`}
        >
          <Target className="w-3 h-3" />
          <span>{isAutoTracking ? 'Enfoque Activo' : 'Vista Global'}</span>
        </button>
      </div>

      {/* Leyenda compacta del árbol en esquina superior izquierda */}
      <div className="absolute top-3 left-3 z-20 hidden sm:flex items-center gap-2 bg-[#161825]/90 border border-[#26293e] px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Nodo Activo
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Combinando/Pivote
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Subarreglo Ordenado
        </span>
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
                    x={midX - 18}
                    y={midY - 8}
                    width={36}
                    height={16}
                    rx={4}
                    fill="#131521"
                    stroke={color}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    fill="#cbd5e1"
                    fontSize="9"
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
              const badge = getNodeBadge(node.state);
              const currentVals = node.currentValues || node.values;

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
              } else if (node.state === 'base_case' || node.state === 'solved' || node.state === 'completed') {
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
                    <div className="w-full h-full flex flex-col justify-between p-2 box-border">
                      {/* Cabecera del nodo: Rango [inicio..fin], pivote opcional y estado */}
                      <div className="flex items-center justify-between gap-1 px-0.5">
                        <span className="text-[10px] font-mono text-indigo-300 font-bold">
                          [{node.range[0]}..{node.range[1]}]
                        </span>
                        {node.pivotValue !== undefined && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/25 text-purple-200 border border-purple-400/40">
                            piv:{node.pivotValue}
                          </span>
                        )}
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </div>

                      {/* Celdas del subarreglo dentro del nodo */}
                      <div className="flex items-center justify-center gap-1">
                        {currentVals.map((val, idx) => {
                          const globalIdx = node.range[0] + idx;
                          const isPivotCell =
                            node.pivotIndex !== undefined && globalIdx === node.pivotIndex;

                          let cellCls = 'bg-[#1d2033] border-[#323652] text-slate-100';
                          if (isPivotCell) {
                            cellCls = 'bg-purple-500/30 border-purple-400 text-purple-100 font-black';
                          } else if (
                            node.state === 'base_case' ||
                            node.state === 'solved' ||
                            node.state === 'completed'
                          ) {
                            cellCls = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 font-bold';
                          } else if (node.state === 'combining') {
                            cellCls = 'bg-purple-950/60 border-purple-500/40 text-purple-200';
                          }

                          return (
                            <div
                              key={idx}
                              className={`w-7 h-7 flex items-center justify-center text-[11px] font-mono font-bold border rounded ${cellCls}`}
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

      {/* Inspector fijo en esquina inferior izquierda al seleccionar un nodo (no se sale de pantalla) */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 z-20 bg-[#171929]/95 border border-[#2f334d] rounded-xl p-3 shadow-xl text-xs font-mono w-64">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#262940]">
            <span className="font-bold text-indigo-300">
              Subproblema [{selectedNode.node.range[0]}..{selectedNode.node.range[1]}]
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getNodeBadge(selectedNode.node.state).bg}`}>
              {getNodeBadge(selectedNode.node.state).text}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Nivel recursivo:</span>
              <span>Profundidad {selectedNode.node.depth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elementos:</span>
              <span>[{(selectedNode.node.currentValues || selectedNode.node.values).join(', ')}]</span>
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

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { RecursionTreeNode, DivideAndConquerState } from '../../../types/trace';
import { ZoomIn, ZoomOut, Target, RefreshCw } from 'lucide-react';
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
  const viewSize = useContainerSize(containerRef);

  const [isAutoTracking, setIsAutoTracking] = useState(false);
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { nodes, activeNodeId } = dcState;

  // 1. Geometría del Árbol
  const { positionedNodes, connections, bounds } = useMemo(() => {
    const nodeArray = Object.values(nodes);
    if (nodeArray.length === 0) {
      return { positionedNodes: [], connections: [], bounds: null };
    }

    const SPACING_PER_ELEMENT = 120;
    const PADDING_X = 180;
    const PADDING_Y = 120;
    const LEVEL_HEIGHT = 180;

    const posMap: Record<string, PositionedNode> = {};
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodeArray.forEach(node => {
      const start = node.range[0];
      const end = node.range[1];
      const count = end - start + 1;

      const width = Math.max(100, count * 40 + 30);
      const height = 85;

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
      bounds: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY },
    };
  }, [nodes]);

  // 2. D3 Zoom — se bindea al SVG y almacena el transform actual
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    zoomBehavior.current = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        currentTransform.current = event.transform;
        g.attr('transform', event.transform.toString());
      })
      .on('start', (event) => {
        // Solo desactivar auto-tracking si el usuario arrastra manualmente
        if (event.sourceEvent) {
          setIsAutoTracking(false);
        }
      });

    // Aplicar al SVG — esto habilita drag y wheel en todo el viewport SVG
    svg.call(zoomBehavior.current);

    // Prevenir doble-click zoom (confunde al usuario)
    svg.on('dblclick.zoom', null);
  }, []);

  const fitToView = useCallback((animate: boolean) => {
    if (!svgRef.current || !bounds || !zoomBehavior.current) return;
    const vw = viewSize.width;
    const vh = viewSize.height;
    if (vw < 8 || vh < 8) return;

    const padding = 60;
    const scale = Math.min(
      (vw - padding * 2) / (bounds.width || 1),
      (vh - padding * 2) / (bounds.height || 1),
      1.2
    );

    const cx = bounds.minX + bounds.width / 2;
    const cy = bounds.minY + bounds.height / 2;
    const transform = d3.zoomIdentity
      .translate(vw / 2, vh / 2)
      .scale(scale)
      .translate(-cx, -cy);

    const svg = d3.select(svgRef.current);
    if (animate) {
      svg.transition().duration(400).call(zoomBehavior.current.transform, transform);
    } else {
      svg.call(zoomBehavior.current.transform, transform);
    }
  }, [bounds, viewSize.width, viewSize.height]);

  // 4. Auto-Tracking del Nodo Activo — centra en el nodo activo a un zoom legible
  const centerOnNode = useCallback((nodeId: string, animate: boolean) => {
    if (!svgRef.current || !zoomBehavior.current) return;
    const pNode = positionedNodes.find(n => n.node.id === nodeId);
    if (!pNode) return;

    const vw = viewSize.width;
    const vh = viewSize.height;
    if (vw < 8 || vh < 8) return;

    // Escala confortable: lo suficientemente cerca para leer los nodos
    const comfortScale = 0.75;
    const transform = d3.zoomIdentity
      .translate(vw / 2, vh / 2)
      .scale(comfortScale)
      .translate(-pNode.x, -pNode.y);

    const svg = d3.select(svgRef.current);
    if (animate) {
      svg.transition().duration(500).ease(d3.easeCubicOut).call(zoomBehavior.current.transform, transform);
    } else {
      svg.call(zoomBehavior.current.transform, transform);
    }
  }, [positionedNodes, viewSize.width, viewSize.height]);

  useEffect(() => {
    if (!activeNodeId || !isAutoTracking) return;
    centerOnNode(activeNodeId, true);
  }, [activeNodeId, isAutoTracking, centerOnNode]);

  // Handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 0.7);
    }
  };

  const handleResetView = () => {
    setIsAutoTracking(false);
    fitToView(true);
  };

  const handleToggleAutoTracking = () => {
    const newState = !isAutoTracking;
    setIsAutoTracking(newState);
    if (newState && activeNodeId) {
      // Al activar, centrar inmediatamente en el nodo activo a zoom legible
      setTimeout(() => centerOnNode(activeNodeId, true), 50);
    }
  };

  // Calcula la posición óptima del tooltip relativa al contenedor, clampeada
  const computeTooltipPos = useCallback((pNode: PositionedNode): { x: number; y: number; above: boolean } | null => {
    if (!containerRef.current) return null;
    const t = currentTransform.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;

    const TOOLTIP_W = 260;
    const TOOLTIP_H = 220;
    const GAP = 14;

    // Coordenadas del nodo en espacio de pantalla (relativas al contenedor)
    const screenX = t.applyX(pNode.x);
    const screenNodeTop = t.applyY(pNode.y - pNode.height / 2);
    const screenNodeBottom = t.applyY(pNode.y + pNode.height / 2);

    // Decidir si va arriba o abajo
    const spaceBelow = containerH - screenNodeBottom;
    const above = spaceBelow < TOOLTIP_H + GAP && screenNodeTop > TOOLTIP_H + GAP;

    let posY = above ? screenNodeTop - GAP : screenNodeBottom + GAP;

    // Clampear horizontalmente
    let posX = Math.max(TOOLTIP_W / 2 + 8, Math.min(screenX, containerW - TOOLTIP_W / 2 - 8));
    // Clampear verticalmente
    if (above) {
      posY = Math.max(8, posY);
    } else {
      posY = Math.min(containerH - TOOLTIP_H - 8, posY);
    }

    return { x: posX, y: posY, above };
  }, []);

  // Click en un nodo
  const handleNodeClick = (pNode: PositionedNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedNode?.node.id === pNode.node.id) {
      setSelectedNode(null);
      setTooltipPos(null);
      return;
    }
    setSelectedNode(pNode);
    const pos = computeTooltipPos(pNode);
    if (pos) setTooltipPos(pos);
  };

  // Cerrar tooltip al hacer click en el fondo
  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setTooltipPos(null);
  };

  // Actualizar posición del tooltip cuando cambia el transform (pan/zoom)
  useEffect(() => {
    if (!selectedNode || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const updateTooltipOnZoom = () => {
      const pos = computeTooltipPos(selectedNode);
      if (pos) setTooltipPos(pos);
    };

    svg.on('zoom.tooltip', updateTooltipOnZoom);
    return () => { svg.on('zoom.tooltip', null); };
  }, [selectedNode, computeTooltipPos]);

  const getNodeBadge = (state: RecursionTreeNode['state']) => {
    switch (state) {
      case 'dividing':
        return { text: 'Dividiendo', bg: 'bg-slate-700/50 text-slate-300 border-slate-600' };
      case 'processing':
        return { text: 'Procesando', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50' };
      case 'base_case':
        return { text: 'Caso Base', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' };
      case 'combining':
        return { text: 'Combinando', bg: 'bg-purple-500/25 text-purple-300 border-purple-500/60' };
      case 'solved':
      case 'completed':
        return { text: 'Resuelto', bg: 'bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold' };
      default:
        return { text: 'Pendiente', bg: 'bg-[#151722] text-slate-500 border-[#232537]' };
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0d0e15] overflow-hidden select-none"
    >
      {/* Controles Flotantes */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1 bg-[#181a27]/90 border border-[#2b2d42] backdrop-blur p-1 rounded-lg shadow-lg">
          <button onClick={handleZoomIn} title="Acercar" className="p-2 hover:bg-[#25283d] rounded-md text-slate-300 transition-colors cursor-pointer">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} title="Alejar" className="p-2 hover:bg-[#25283d] rounded-md text-slate-300 transition-colors cursor-pointer">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleResetView} title="Reiniciar Vista" className="p-2 hover:bg-[#25283d] rounded-md text-slate-300 transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-[#2b2d42] mx-1" />
          <button
            onClick={handleToggleAutoTracking}
            title={isAutoTracking ? "Seguimiento automático activo" : "Activar seguimiento automático"}
            className={`p-2 rounded-md transition-all flex items-center gap-1.5 border cursor-pointer ${
              isAutoTracking
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-xs'
                : 'bg-[#181a27] border-[#2b2d42] text-slate-400 hover:bg-[#25283d] hover:text-slate-200 hover:border-[#4a4e66]'
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-mono font-medium">
              {isAutoTracking ? 'Seguimiento' : 'Libre'}
            </span>
          </button>
        </div>
      </div>

      {/* Lienzo SVG interactivo */}
      <svg
        ref={svgRef}
        className="w-full h-full"
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
        onClick={handleBackgroundClick}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g ref={gRef}>
          {/* Conexiones / Aristas */}
          <g className="connections">
            {connections.map(conn => {
              const startX = conn.from.x;
              const startY = conn.from.y + conn.from.height / 2;
              const endX = conn.to.x;
              const endY = conn.to.y - conn.to.height / 2;

              const isCombining = conn.to.node.state === 'combining' || conn.from.node.state === 'combining';
              const isActive = conn.to.node.id === activeNodeId || conn.from.node.id === activeNodeId;
              const isSolved = conn.to.node.state === 'solved' || conn.to.node.state === 'completed';

              let color = '#232537';
              let strokeW = 2;
              if (isActive) { color = '#fbbf24'; strokeW = 3; }
              else if (isCombining) { color = '#c084fc'; strokeW = 3.5; }
              else if (isSolved) { color = '#10b981'; strokeW = 2.5; }

              return (
                <g key={conn.id}>
                  <path
                    d={`M ${startX} ${startY} C ${startX} ${(startY + endY) / 2}, ${endX} ${(startY + endY) / 2}, ${endX} ${endY}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeDasharray={isCombining ? '6,6' : 'none'}
                    className="transition-all duration-300"
                  />
                  {conn.from.node.state === 'dividing' && isActive && (
                    <>
                      <rect x={(startX + endX) / 2 - 25} y={(startY + endY) / 2 - 10} width="50" height="20" rx="4" fill="#1e1f32" stroke="#444866" />
                      <text x={(startX + endX) / 2} y={(startY + endY) / 2 + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        Hilo {conn.isLeft ? '1' : '2'}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodos */}
          <g className="nodes">
            {positionedNodes.map(pNode => {
              const { node, x, y, width, height } = pNode;
              const isActive = node.id === activeNodeId;
              const isSelected = selectedNode?.node.id === node.id;
              const badge = getNodeBadge(node.state);
              const currentVals = node.currentValues || node.values;

              let bg = '#151622';
              let border = '#232537';
              if (isActive) { bg = '#1e1f32'; border = '#fbbf24'; }
              else if (isSelected) { bg = '#1a1c2e'; border = '#6366f1'; }
              else if (node.state === 'combining') { bg = '#1a1625'; border = '#a855f7'; }
              else if (node.state === 'base_case') { bg = '#121f1b'; border = '#10b981'; }
              else if (node.state === 'solved' || node.state === 'completed') { bg = '#121b18'; border = '#34d399'; }

              return (
                <g
                  key={node.id}
                  transform={`translate(${x - width / 2}, ${y - height / 2})`}
                  className="transition-all duration-300"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleNodeClick(pNode, e)}
                >
                  <rect
                    width={width}
                    height={height}
                    rx="8"
                    fill={bg}
                    stroke={border}
                    strokeWidth={isActive ? 2.5 : isSelected ? 2 : 1.5}
                    filter={isActive ? 'url(#glow)' : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Contenido del nodo renderizado con foreignObject */}
                  <foreignObject
                    width={width}
                    height={height}
                    x={0}
                    y={0}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="w-full h-full flex flex-col justify-between p-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          [{node.range[0]}..{node.range[1]}]
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 px-1">
                        {currentVals.map((val, idx) => {
                          let cellBg = 'bg-[#1c1d2c] border-[#2b2d42] text-slate-200';
                          if (node.state === 'base_case') cellBg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
                          if (node.state === 'combining') cellBg = 'bg-purple-500/20 border-purple-500/40 text-purple-300';
                          if (node.state === 'solved' || node.state === 'completed') cellBg = 'bg-emerald-950 border-emerald-700/60 text-emerald-400 font-bold';

                          return (
                            <div key={idx} className={`w-8 h-8 flex items-center justify-center text-xs font-mono font-bold border rounded ${cellBg} shadow-sm`}>
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

      {/* Tooltip HTML — se posiciona como overlay absoluto sobre el contenedor */}
      {selectedNode && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-[#1a1c2e] border-2 border-[#2b2d42] rounded-xl shadow-2xl p-4 text-[11px] w-[280px]">
            <div className="font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <span className="text-[10px] font-mono bg-indigo-500/20 px-2 py-0.5 rounded">
                [{selectedNode.node.range[0]}..{selectedNode.node.range[1]}]
              </span>
              <span>{getNodeBadge(selectedNode.node.state).text}</span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Valores:</span>
                <span className="font-mono font-semibold">
                  [{(selectedNode.node.currentValues || selectedNode.node.values).join(', ')}]
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Inicio:</span>
                <span className="font-mono font-semibold">{selectedNode.node.range[0]}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Fin:</span>
                <span className="font-mono font-semibold">{selectedNode.node.range[1]}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Profundidad:</span>
                <span className="font-mono">{selectedNode.node.depth}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Tamaño:</span>
                <span className="font-mono">{selectedNode.node.range[1] - selectedNode.node.range[0] + 1} elems</span>
              </div>

              {selectedNode.node.state === 'combining' && (
                <div className="mt-3 pt-2 border-t border-[#2b2d42]">
                  <div className="text-purple-300 text-[10px]">Combinando subarrays ordenados</div>
                </div>
              )}

              {selectedNode.node.state === 'base_case' && (
                <div className="mt-3 pt-2 border-t border-[#2b2d42]">
                  <div className="text-emerald-400 text-[10px]">Caso base: 1 elemento (ya ordenado)</div>
                </div>
              )}

              {selectedNode.node.state === 'dividing' && (
                <div className="mt-3 pt-2 border-t border-[#2b2d42]">
                  <div className="text-slate-400 text-[10px]">Dividiendo en subproblemas</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

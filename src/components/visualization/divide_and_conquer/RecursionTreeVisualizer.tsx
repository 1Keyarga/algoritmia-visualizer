import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { RecursionTreeNode, DivideAndConquerState } from '../../../types/trace';
import { Maximize, ZoomIn, ZoomOut, Target } from 'lucide-react';
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
  const viewSize = useContainerSize(containerRef);

  const [isAutoTracking, setIsAutoTracking] = useState(true);

  const { nodes, activeNodeId } = dcState;

  // 1. Geometría Matemática del Árbol (Anchos dinámicos y sin colisiones)
  const { positionedNodes, connections, bounds, rootRangeId } = useMemo(() => {
    const nodeArray = Object.values(nodes);
    if (nodeArray.length === 0) {
      return { positionedNodes: [], connections: [], bounds: null, rootRangeId: 'empty' };
    }

    const SPACING_PER_ELEMENT = 90; 
    const PADDING_X = 150;
    const PADDING_Y = 100;
    const LEVEL_HEIGHT = 160;

    const posMap: Record<string, PositionedNode> = {};
    const rootNode = nodeArray.find(n => n.depth === 0) || nodeArray[0];
    const rootRangeId = `${rootNode.range[0]}-${rootNode.range[1]}`;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodeArray.forEach(node => {
      const start = node.range[0];
      const end = node.range[1];
      const count = end - start + 1;
      
      const width = Math.max(90, count * 32 + 20);
      const height = 76;

      const centerIndex = (start + end) / 2;
      const x = PADDING_X + centerIndex * SPACING_PER_ELEMENT;
      const y = PADDING_Y + node.depth * LEVEL_HEIGHT;

      posMap[node.id] = { node, x, y, width, height };

      if (x - width/2 < minX) minX = x - width/2;
      if (x + width/2 > maxX) maxX = x + width/2;
      if (y - height/2 < minY) minY = y - height/2;
      if (y + height/2 > maxY) maxY = y + height/2;
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
      rootRangeId,
    };
  }, [nodes]);

  // 2. Inicialización de D3 Zoom
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    zoomBehavior.current = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      })
      .on('start', (event) => {
        if (event.sourceEvent && event.sourceEvent.type !== 'wheel') {
          // Si el usuario arrastra manualmente, desactivar temporalmente el auto-tracking
          setIsAutoTracking(false);
        }
      });

    svg.call(zoomBehavior.current);
  }, []);

  const fitToView = useCallback((animate: boolean) => {
    if (!svgRef.current || !bounds || !zoomBehavior.current) return;
    const viewWidth = viewSize.width;
    const viewHeight = viewSize.height;
    if (viewWidth < 8 || viewHeight < 8) return;

    const padding = 60;
    const scale = Math.min(
      (viewWidth - padding * 2) / (bounds.width || 1),
      (viewHeight - padding * 2) / (bounds.height || 1),
      1.2
    );

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    const transform = d3.zoomIdentity
      .translate(viewWidth / 2, viewHeight / 2)
      .scale(scale)
      .translate(-centerX, -centerY);

    const svg = d3.select(svgRef.current);
    if (animate) {
      svg.transition().duration(400).call(zoomBehavior.current.transform, transform);
    } else {
      svg.call(zoomBehavior.current.transform, transform);
    }
  }, [bounds, viewSize.height, viewSize.width]);

  // Fit when the dataset changes, and whenever the container size / browser zoom changes.
  useEffect(() => {
    if (!bounds || !zoomBehavior.current) return;
    fitToView(false);
    setIsAutoTracking(true);
  }, [rootRangeId, viewSize.width, viewSize.height, fitToView, bounds]);

  // 4. Auto-Tracking del Nodo Activo
  useEffect(() => {
    if (!svgRef.current || !activeNodeId || !isAutoTracking || !zoomBehavior.current || positionedNodes.length === 0) return;
    const activePNode = positionedNodes.find(n => n.node.id === activeNodeId);
    if (!activePNode) return;

    const svg = d3.select(svgRef.current);
    
    // Pan suave al nodo activo sin cambiar la escala actual del usuario
    svg.transition().duration(600).ease(d3.easeCubicOut).call(
      zoomBehavior.current.translateTo,
      activePNode.x,
      activePNode.y
    );
  }, [activeNodeId, isAutoTracking, positionedNodes]);

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
    setIsAutoTracking(true);
    fitToView(true);
  };

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
      {/* Controles Flotantes UI */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1 bg-[#181a27]/90 border border-[#2b2d42] backdrop-blur p-1 rounded-lg shadow-lg">
          <button onClick={handleZoomIn} title="Acercar" className="p-2 hover:bg-[#25283d] rounded-md text-slate-300 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} title="Alejar" className="p-2 hover:bg-[#25283d] rounded-md text-slate-300 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleResetView} title="Enfocar Todo" className="p-2 hover:bg-[#25283d] rounded-md text-slate-300 transition-colors">
            <Maximize className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-[#2b2d42] mx-1" />
          <button 
            onClick={() => setIsAutoTracking(!isAutoTracking)} 
            title={isAutoTracking ? "Desactivar Auto-Tracking" : "Activar Auto-Tracking"}
            className={`p-2 rounded-md transition-colors flex items-center gap-1 ${isAutoTracking ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-[#25283d] text-slate-400'}`}
          >
            <Target className="w-4 h-4" />
          </button>
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing">
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
              let width = 2;
              if (isActive) { color = '#fbbf24'; width = 3; }
              else if (isCombining) { color = '#c084fc'; width = 3.5; }
              else if (isSolved) { color = '#10b981'; width = 2.5; }

              return (
                <g key={conn.id}>
                  <path
                    d={`M ${startX} ${startY} C ${startX} ${(startY+endY)/2}, ${endX} ${(startY+endY)/2}, ${endX} ${endY}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={width}
                    strokeDasharray={isCombining ? '6,6' : 'none'}
                    className="transition-all duration-300"
                  />
                  {/* Fork/Join thread badge if actively dividing */}
                  {(conn.from.node.state === 'dividing' && isActive) && (
                    <rect x={(startX + endX)/2 - 25} y={(startY + endY)/2 - 10} width="50" height="20" rx="4" fill="#1e1f32" stroke="#444866" />
                  )}
                  {(conn.from.node.state === 'dividing' && isActive) && (
                    <text x={(startX + endX)/2} y={(startY + endY)/2 + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      Thread {conn.isLeft ? '1' : '2'}
                    </text>
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
              const badge = getNodeBadge(node.state);
              const currentVals = node.currentValues || node.values;

              let bg = '#151622';
              let border = '#232537';
              if (isActive) { bg = '#1e1f32'; border = '#fbbf24'; }
              else if (node.state === 'combining') { bg = '#1a1625'; border = '#a855f7'; }
              else if (node.state === 'base_case') { bg = '#121f1b'; border = '#10b981'; }
              else if (node.state === 'solved' || node.state === 'completed') { bg = '#121b18'; border = '#34d399'; }

              return (
                <g key={node.id} transform={`translate(${x - width / 2}, ${y - height / 2})`} className="transition-all duration-500">
                  <rect
                    width={width}
                    height={height}
                    rx="8"
                    fill={bg}
                    stroke={border}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    filter={isActive ? 'url(#glow)' : undefined}
                    className="transition-all duration-300 shadow-xl"
                  />
                  
                  <foreignObject width={width} height={height} x={0} y={0}>
                    <div className="w-full h-full flex flex-col justify-between p-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          [{node.range[0]}..{node.range[1]}]
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-1 px-1">
                        {currentVals.map((val, idx) => {
                          let cellBg = 'bg-[#1c1d2c] border-[#2b2d42] text-slate-200';
                          if (node.state === 'base_case') cellBg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
                          if (node.state === 'combining') cellBg = 'bg-purple-500/20 border-purple-500/40 text-purple-300';
                          if (node.state === 'solved' || node.state === 'completed') cellBg = 'bg-emerald-950 border-emerald-700/60 text-emerald-400 font-bold';

                          return (
                            <div key={idx} className={`w-7 h-7 flex items-center justify-center text-xs font-mono font-bold border rounded ${cellBg} shadow-sm`}>
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
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ArrayElement } from '../../types/trace';

interface D3BarChartProps {
  array: ArrayElement[];
  maxVal?: number;
}

export const D3BarChart: React.FC<D3BarChartProps> = ({
  array,
  maxVal = 100,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || array.length === 0) return;

    const width = containerRef.current.clientWidth || 700;
    const height = containerRef.current.clientHeight || 340;

    // Margen superior generoso para dar espacio a los números altos (ej. 98)
    const margin = { top: 38, right: 30, bottom: 40, left: 40 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(100, height - margin.top - margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');
    
    // Gradiente default (índigo / púrpura)
    const gradDefault = defs.append('linearGradient')
      .attr('id', 'grad-default')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradDefault.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1');
    gradDefault.append('stop').attr('offset', '100%').attr('stop-color', '#4338ca');

    // Gradiente comparing (ámbar / dorado)
    const gradComparing = defs.append('linearGradient')
      .attr('id', 'grad-comparing')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradComparing.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24');
    gradComparing.append('stop').attr('offset', '100%').attr('stop-color', '#d97706');

    // Gradiente sorted (esmeralda)
    const gradSorted = defs.append('linearGradient')
      .attr('id', 'grad-sorted')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradSorted.append('stop').attr('offset', '0%').attr('stop-color', '#34d399');
    gradSorted.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    // Gradiente swapped (violeta)
    const gradSwapped = defs.append('linearGradient')
      .attr('id', 'grad-swapped')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradSwapped.append('stop').attr('offset', '0%').attr('stop-color', '#a78bfa');
    gradSwapped.append('stop').attr('offset', '100%').attr('stop-color', '#7c3aed');

    // Patrón rayado para accesibilidad daltónica (RF-05)
    const patternComparing = defs
      .append('pattern')
      .attr('id', 'hatch-comparing')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternTransform', 'rotate(45 0 0)')
      .attr('patternUnits', 'userSpaceOnUse');
    patternComparing
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 8)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.25);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calcular máximo con 15% de holgura superior para que las barras nunca toquen el borde
    const rawMax = Math.max(maxVal, ...array.map(d => d.value), 90);
    const domainMax = Math.ceil((rawMax * 1.15) / 10) * 10;

    const yScale = d3
      .scaleLinear()
      .domain([0, domainMax])
      .range([innerHeight, 0]);

    const xScale = d3
      .scaleBand<string>()
      .domain(array.map((_, idx) => String(idx)))
      .range([0, innerWidth])
      .padding(0.20);

    // Eje Y con líneas de cuadrícula punteadas
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickSize(-innerWidth)
      .tickFormat(d => `${d}`);

    const yAxisG = g
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    yAxisG.select('.domain').remove();
    yAxisG
      .selectAll('.tick line')
      .attr('stroke', '#242738')
      .attr('stroke-dasharray', '3,3');
    yAxisG
      .selectAll('.tick text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace');

    const getFill = (state: ArrayElement['state']) => {
      switch (state) {
        case 'comparing':
          return 'url(#grad-comparing)';
        case 'swapped':
          return 'url(#grad-swapped)';
        case 'sorted':
          return 'url(#grad-sorted)';
        default:
          return 'url(#grad-default)';
      }
    };

    const barGroups = g
      .selectAll('.bar-group')
      .data(array, (d: any, i: number) => d.id || String(i))
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (_, i) => `translate(${xScale(String(i)) || 0}, 0)`);

    // Rectángulos de las barras
    barGroups
      .append('rect')
      .attr('class', 'bar-rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => Math.max(4, innerHeight - yScale(d.value)))
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', d => getFill(d.state))
      .attr('stroke', d => (d.state === 'comparing' ? '#fef08a' : d.state === 'sorted' ? '#6ee7b7' : '#818cf8'))
      .attr('stroke-width', d => (d.state === 'comparing' || d.state === 'sorted' ? 2 : 1))
      .style('transition', 'all 0.18s ease-out');

    // Textura de accesibilidad para daltónicos
    barGroups
      .filter(d => d.state === 'comparing')
      .append('rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => Math.max(4, innerHeight - yScale(d.value)))
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', 'url(#hatch-comparing)')
      .attr('pointer-events', 'none');

    // Etiquetas X inferiores (Letras A-N)
    barGroups
      .append('text')
      .attr('class', 'x-label')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', innerHeight + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', d => (d.state === 'comparing' ? '#fbbf24' : d.state === 'sorted' ? '#34d399' : '#94a3b8'))
      .attr('font-size', '11px')
      .attr('font-weight', d => (d.state === 'comparing' || d.state === 'sorted' ? 'bold' : '500'))
      .attr('font-family', 'Inter, sans-serif')
      .text(d => d.label || '');

    // Valores numéricos consistentemente SOBRE las barras (con holgura segura)
    barGroups
      .append('text')
      .attr('class', 'val-label')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', d => (d.state === 'comparing' ? '#fef08a' : d.state === 'sorted' ? '#a7f3d0' : '#e2e8f0'))
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(d => d.value);

  }, [array, maxVal]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[240px] relative flex-1 flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full overflow-visible" />
    </div>
  );
};

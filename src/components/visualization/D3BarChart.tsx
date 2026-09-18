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

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 300;

    const margin = { top: 20, right: 25, bottom: 35, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');
    
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

    const actualMax = Math.max(maxVal, ...array.map(d => d.value), 90);
    const yScale = d3
      .scaleLinear()
      .domain([0, actualMax])
      .range([innerHeight, 0])
      .nice();

    const xScale = d3
      .scaleBand<string>()
      .domain(array.map((_, idx) => String(idx)))
      .range([0, innerWidth])
      .padding(0.24);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(9)
      .tickSize(-innerWidth)
      .tickFormat(d => `${d}`);

    const yAxisG = g
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    yAxisG.select('.domain').remove();
    yAxisG
      .selectAll('.tick line')
      .attr('stroke', '#232537')
      .attr('stroke-dasharray', '2,2');
    yAxisG
      .selectAll('.tick text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace');

    const getColor = (state: ArrayElement['state']) => {
      switch (state) {
        case 'comparing':
          return '#f59e0b';
        case 'swapped':
          return '#818cf8';
        case 'sorted':
          return '#10b981';
        case 'selected':
          return '#ec4899';
        default:
          return '#5c60c8';
      }
    };

    const barGroups = g
      .selectAll('.bar-group')
      .data(array, (d: any, i: number) => d.id || String(i))
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (_, i) => `translate(${xScale(String(i)) || 0}, 0)`);

    barGroups
      .append('rect')
      .attr('class', 'bar-rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', d => getColor(d.state))
      .attr('stroke', d => (d.state === 'comparing' ? '#fbbf24' : d.state === 'sorted' ? '#34d399' : '#4338ca'))
      .attr('stroke-width', d => (d.state === 'comparing' || d.state === 'sorted' ? 1.5 : 0))
      .style('transition', 'all 0.15s ease-out');

    barGroups
      .filter(d => d.state === 'comparing')
      .append('rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#hatch-comparing)')
      .attr('pointer-events', 'none');

    barGroups
      .append('text')
      .attr('class', 'x-label')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', innerHeight + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', d => (d.state === 'comparing' ? '#f59e0b' : d.state === 'sorted' ? '#10b981' : '#64748b'))
      .attr('font-size', '10px')
      .attr('font-weight', d => (d.state === 'comparing' || d.state === 'sorted' ? 'bold' : 'normal'))
      .attr('font-family', 'Inter, sans-serif')
      .text(d => d.label || '');

    barGroups
      .append('text')
      .attr('class', 'val-label')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', d => Math.max(12, yScale(d.value) - 4))
      .attr('text-anchor', 'middle')
      .attr('fill', d => (d.state === 'comparing' ? '#fbbf24' : d.state === 'sorted' ? '#34d399' : '#94a3b8'))
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(d => d.value);

  }, [array, maxVal]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[220px] relative">
      <svg ref={svgRef} className="w-full h-full overflow-visible" />
    </div>
  );
};

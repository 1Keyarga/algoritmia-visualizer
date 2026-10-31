import React, { useEffect, useId, useRef } from 'react';
import * as d3 from 'd3';
import type { ArrayElement } from '../../types/trace';
import { useContainerSize } from '../../hooks/useContainerSize';

interface D3BarChartProps {
  array: ArrayElement[];
}

export const D3BarChart: React.FC<D3BarChartProps> = ({ array }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dimensions = useContainerSize(containerRef);
  const reactId = useId().replace(/:/g, '');
  const ids = {
    default: `grad-default-${reactId}`,
    comparing: `grad-comparing-${reactId}`,
    sorted: `grad-sorted-${reactId}`,
    swapped: `grad-swapped-${reactId}`,
    selected: `grad-selected-${reactId}`,
    discarded: `grad-discarded-${reactId}`,
    hatch: `hatch-comparing-${reactId}`,
  };

  useEffect(() => {
    if (!svgRef.current || array.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const width = dimensions.width;
    const height = dimensions.height;

    const margin = { top: 32, right: 25, bottom: 42, left: 35 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(100, height - margin.top - margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', '100%');

    const defs = svg.append('defs');

    const addGradient = (id: string, from: string, to: string) => {
      const grad = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', from);
      grad.append('stop').attr('offset', '100%').attr('stop-color', to);
    };

    // Paleta semántica RF-05: Gris (pendiente), Ámbar (comparación), Azul (intercambio), Púrpura (seleccionado/min/clave), Verde (ordenado)
    addGradient(ids.default, '#64748b', '#334155');
    addGradient(ids.comparing, '#fbbf24', '#d97706');
    addGradient(ids.sorted, '#34d399', '#059669');
    addGradient(ids.swapped, '#38bdf8', '#0284c7');
    addGradient(ids.selected, '#c084fc', '#7e22ce');
    addGradient(ids.discarded, '#334155', '#1e293b');

    const patternComparing = defs
      .append('pattern')
      .attr('id', ids.hatch)
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

    const maxDataVal = d3.max(array, d => d.value) || 100;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxDataVal])
      .range([innerHeight, 0])
      .nice();

    const xScale = d3
      .scaleBand<string>()
      .domain(array.map((_, idx) => String(idx)))
      .range([0, innerWidth])
      .padding(0.20);

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
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace');

    const getFill = (state: ArrayElement['state']) => {
      switch (state) {
        case 'comparing':
          return `url(#${ids.comparing})`;
        case 'swapped':
          return `url(#${ids.swapped})`;
        case 'selected':
          return `url(#${ids.selected})`;
        case 'sorted':
          return `url(#${ids.sorted})`;
        case 'discarded':
          return `url(#${ids.discarded})`;
        default:
          return `url(#${ids.default})`;
      }
    };

    const getStroke = (state: ArrayElement['state']) => {
      switch (state) {
        case 'comparing':
          return '#fef08a';
        case 'swapped':
          return '#7dd3fc';
        case 'selected':
          return '#e9d5ff';
        case 'sorted':
          return '#6ee7b7';
        case 'discarded':
          return '#334155';
        default:
          return '#94a3b8';
      }
    };

    const barGroups = g
      .selectAll('.bar-group')
      .data(array, (d: any, i: number) => d.id || String(i))
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (_, i) => `translate(${xScale(String(i)) || 0}, 0)`)
      .attr('opacity', d => (d.state === 'discarded' ? 0.45 : 1));

    barGroups
      .append('rect')
      .attr('class', 'bar-rect')
      .attr('x', 0)
      .attr('y', d => {
        const rawHeight = innerHeight - yScale(d.value);
        const barHeight = Math.max(4, rawHeight);
        return innerHeight - barHeight;
      })
      .attr('width', xScale.bandwidth())
      .attr('height', d => Math.max(4, innerHeight - yScale(d.value)))
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', d => getFill(d.state))
      .attr('stroke', d => getStroke(d.state))
      .attr('stroke-width', d => (d.state !== 'default' && d.state !== 'discarded' ? 2 : 1));

    // Patrón diagonal adicional para elementos en comparación (accesibilidad daltonismo RNF-07)
    barGroups
      .filter(d => d.state === 'comparing')
      .append('rect')
      .attr('x', 0)
      .attr('y', d => {
        const rawHeight = innerHeight - yScale(d.value);
        const barHeight = Math.max(4, rawHeight);
        return innerHeight - barHeight;
      })
      .attr('width', xScale.bandwidth())
      .attr('height', d => Math.max(4, innerHeight - yScale(d.value)))
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', `url(#${ids.hatch})`)
      .attr('pointer-events', 'none');

    // Etiqueta inferior: combina etiqueta de estabilidad (A, B, C...) e indicador no cromático (RNF-07: ✔, ⇄, min, clave, j)
    barGroups
      .append('text')
      .attr('class', 'x-label')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', innerHeight + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', d => {
        if (d.state === 'comparing') return '#fbbf24';
        if (d.state === 'swapped') return '#38bdf8';
        if (d.state === 'selected') return '#c084fc';
        if (d.state === 'sorted') return '#34d399';
        return '#94a3b8';
      })
      .attr('font-size', '11px')
      .attr('font-weight', d => (d.state !== 'default' ? 'bold' : '500'))
      .attr('font-family', 'JetBrains Mono, Inter, sans-serif')
      .text(d => {
        if (d.nonColorIndicator && d.label) {
          return `${d.label} (${d.nonColorIndicator})`;
        }
        return d.nonColorIndicator || d.label || '';
      });

    // Valor numérico sobre la barra
    barGroups
      .append('text')
      .attr('class', 'val-label')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', d => {
        const rawHeight = innerHeight - yScale(d.value);
        const barHeight = Math.max(4, rawHeight);
        return innerHeight - barHeight - 7;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', d => {
        if (d.state === 'comparing') return '#fef08a';
        if (d.state === 'swapped') return '#bae6fd';
        if (d.state === 'selected') return '#f3e8ff';
        if (d.state === 'sorted') return '#a7f3d0';
        return '#e2e8f0';
      })
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(d => d.value);
  }, [
    array,
    dimensions.height,
    dimensions.width,
    ids.comparing,
    ids.default,
    ids.discarded,
    ids.hatch,
    ids.selected,
    ids.sorted,
    ids.swapped,
  ]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
      <svg
        ref={svgRef}
        className="absolute inset-0 block h-full w-full overflow-visible"
        role="img"
        aria-label="Visualización del arreglo"
      />
    </div>
  );
};

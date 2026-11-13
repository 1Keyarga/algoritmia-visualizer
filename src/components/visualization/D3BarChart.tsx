import React, { useEffect, useId, useRef } from 'react';
import * as d3 from 'd3';
import type { ArrayElement } from '../../types/trace';
import { useContainerSize } from '../../hooks/useContainerSize';

interface D3BarChartProps {
  array: ArrayElement[];
  showHeatmap?: boolean;
}

export const D3BarChart: React.FC<D3BarChartProps> = ({ array, showHeatmap = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dimensions = useContainerSize(containerRef);
  const prevSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const reactId = useId().replace(/:/g, '');
  const ids = {
    default: `grad-default-${reactId}`,
    comparing: `grad-comparing-${reactId}`,
    sorted: `grad-sorted-${reactId}`,
    swapped: `grad-swapped-${reactId}`,
    selected: `grad-selected-${reactId}`,
    discarded: `grad-discarded-${reactId}`,
    heatCold: `grad-heat-cold-${reactId}`,
    heatWarm: `grad-heat-warm-${reactId}`,
    heatHot: `grad-heat-hot-${reactId}`,
    heatMax: `grad-heat-max-${reactId}`,
    hatch: `hatch-comparing-${reactId}`,
  };

  useEffect(() => {
    if (!svgRef.current || array.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const width = dimensions.width;
    const height = dimensions.height;
    const isResize =
      prevSizeRef.current.width !== width || prevSizeRef.current.height !== height;
    prevSizeRef.current = { width, height };

    const margin = { top: 34, right: 24, bottom: 44, left: 38 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(100, height - margin.top - margin.bottom);

    const svg = d3.select(svgRef.current);
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', '100%');

    // Inicializar estructura persistente (<defs> y capas <g>) una sola vez
    if (svg.select('g.chart-root').empty()) {
      const defs = svg.append('defs');

      const addGradient = (id: string, from: string, to: string) => {
        const grad = defs
          .append('linearGradient')
          .attr('id', id)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '0%')
          .attr('y2', '100%');
        grad.append('stop').attr('offset', '0%').attr('stop-color', from);
        grad.append('stop').attr('offset', '100%').attr('stop-color', to);
      };

      // Paleta semántica RF-05
      addGradient(ids.default, '#64748b', '#334155');
      addGradient(ids.comparing, '#fbbf24', '#d97706');
      addGradient(ids.sorted, '#34d399', '#059669');
      addGradient(ids.swapped, '#38bdf8', '#0284c7');
      addGradient(ids.selected, '#c084fc', '#7e22ce');
      addGradient(ids.discarded, '#334155', '#1e293b');

      // Paleta térmica de frecuencia de accesos (RF-19 / T19)
      addGradient(ids.heatCold, '#38bdf8', '#1d4ed8');
      addGradient(ids.heatWarm, '#facc15', '#ca8a04');
      addGradient(ids.heatHot, '#fb923c', '#ea580c');
      addGradient(ids.heatMax, '#f43f5e', '#be123c');

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

      const root = svg.append('g').attr('class', 'chart-root');
      root.append('g').attr('class', 'y-axis');
      root.append('g').attr('class', 'bars-layer');
    }

    const g = svg
      .select<SVGGElement>('g.chart-root')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxDataVal = d3.max(array, d => d.value) || 100;
    const maxAccess = Math.max(1, d3.max(array, d => d.accessCount || 0) || 1);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxDataVal])
      .range([innerHeight, 0])
      .nice();

    const xScale = d3
      .scaleBand<string>()
      .domain(array.map((_, idx) => String(idx)))
      .range([0, innerWidth])
      .padding(0.2);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickSize(-innerWidth)
      .tickFormat(d => `${d}`);

    const yAxisG = g.select<SVGGElement>('g.y-axis').call(yAxis);
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

    const getHeatRatio = (d: ArrayElement) => (d.accessCount || 0) / maxAccess;

    const getFill = (d: ArrayElement) => {
      if (showHeatmap) {
        const count = d.accessCount || 0;
        if (count === 0) return `url(#${ids.default})`;
        const ratio = getHeatRatio(d);
        if (ratio >= 0.75) return `url(#${ids.heatMax})`;
        if (ratio >= 0.45) return `url(#${ids.heatHot})`;
        if (ratio >= 0.2) return `url(#${ids.heatWarm})`;
        return `url(#${ids.heatCold})`;
      }
      switch (d.state) {
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

    const getStroke = (d: ArrayElement) => {
      if (showHeatmap) {
        const count = d.accessCount || 0;
        if (count === 0) return '#64748b';
        const ratio = getHeatRatio(d);
        if (ratio >= 0.75) return '#fda4af';
        if (ratio >= 0.45) return '#fdba74';
        if (ratio >= 0.2) return '#fde047';
        return '#93c5fd';
      }
      switch (d.state) {
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

    const duration = isResize ? 0 : 220;
    const barsLayer = g.select<SVGGElement>('g.bars-layer');

    const barGroups = barsLayer
      .selectAll<SVGGElement, ArrayElement>('g.bar-group')
      .data(array, (d: ArrayElement, i: number) => d.id || String(i))
      .join(
        enter => {
          const grp = enter
            .append('g')
            .attr('class', 'bar-group')
            .attr('transform', (_, i) => `translate(${xScale(String(i)) || 0}, 0)`)
            .attr('opacity', d => (d.state === 'discarded' ? 0.45 : 1));

          grp
            .append('rect')
            .attr('class', 'bar-rect')
            .attr('x', 0)
            .attr('y', d => {
              const barHeight = Math.max(4, innerHeight - yScale(d.value));
              return innerHeight - barHeight;
            })
            .attr('width', xScale.bandwidth())
            .attr('height', d => Math.max(4, innerHeight - yScale(d.value)))
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', d => getFill(d))
            .attr('stroke', d => getStroke(d))
            .attr('stroke-width', d =>
              d.state !== 'default' && d.state !== 'discarded' ? 2 : 1
            );

          grp
            .append('rect')
            .attr('class', 'hatch-rect')
            .attr('x', 0)
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', `url(#${ids.hatch})`)
            .attr('pointer-events', 'none');

          grp
            .append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-family', 'JetBrains Mono, Inter, sans-serif');

          grp
            .append('text')
            .attr('class', 'val-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('font-family', 'JetBrains Mono, monospace');

          return grp;
        },
        update => update,
        exit => exit.remove()
      );

    // Transición suave de posición horizontal (deslizamiento de barras al intercambiar)
    barGroups
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr('transform', (_, i) => `translate(${xScale(String(i)) || 0}, 0)`)
      .attr('opacity', d => (d.state === 'discarded' ? 0.45 : 1));

    // Actualizar rectángulo principal de la barra
    barGroups
      .select<SVGRectElement>('rect.bar-rect')
      .attr('fill', d => getFill(d))
      .attr('stroke', d => getStroke(d))
      .attr('stroke-width', d => (d.state !== 'default' && d.state !== 'discarded' ? 2 : 1))
      .attr('stroke-dasharray', d => (d.state === 'selected' ? '4,2' : null))
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr('width', xScale.bandwidth())
      .attr('y', d => {
        const barHeight = Math.max(4, innerHeight - yScale(d.value));
        return innerHeight - barHeight;
      })
      .attr('height', d => Math.max(4, innerHeight - yScale(d.value)));

    // Patrón diagonal para elementos en comparación (accesibilidad RNF-07)
    barGroups
      .select<SVGRectElement>('rect.hatch-rect')
      .attr('width', xScale.bandwidth())
      .attr('y', d => {
        const barHeight = Math.max(4, innerHeight - yScale(d.value));
        return innerHeight - barHeight;
      })
      .attr('height', d => Math.max(4, innerHeight - yScale(d.value)))
      .attr('opacity', d => (d.state === 'comparing' ? 1 : 0));

    const getStateIndicator = (d: ArrayElement) => {
      if (d.nonColorIndicator) return d.nonColorIndicator;
      if (d.state === 'comparing') return 'CMP';
      if (d.state === 'swapped') return 'SWP';
      if (d.state === 'selected') return 'SEL';
      if (d.state === 'sorted') return 'OK';
      return '';
    };

    // Etiqueta inferior: estabilidad / indicador no cromático o contador de accesos en modo Mapa de Calor
    barGroups
      .select<SVGTextElement>('text.x-label')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', innerHeight + 18)
      .attr('fill', d => {
        if (showHeatmap) {
          const ratio = getHeatRatio(d);
          if (ratio >= 0.75) return '#fda4af';
          if (ratio >= 0.45) return '#fdba74';
          if ((d.accessCount || 0) > 0) return '#fde047';
          return '#94a3b8';
        }
        if (d.state === 'comparing') return '#fbbf24';
        if (d.state === 'swapped') return '#38bdf8';
        if (d.state === 'selected') return '#c084fc';
        if (d.state === 'sorted') return '#34d399';
        return '#94a3b8';
      })
      .attr('font-weight', d => (d.state !== 'default' || showHeatmap ? 'bold' : '500'))
      .text(d => {
        if (showHeatmap) {
          return `${d.accessCount || 0} acc`;
        }
        const indicator = getStateIndicator(d);
        if (indicator && d.label) {
          return array.length <= 12 ? `${d.label}·${indicator}` : indicator;
        }
        return indicator || d.label || '';
      });

    // Valor numérico sobre la barra
    barGroups
      .select<SVGTextElement>('text.val-label')
      .attr('fill', d => {
        if (d.state === 'comparing') return '#fef08a';
        if (d.state === 'swapped') return '#bae6fd';
        if (d.state === 'selected') return '#f3e8ff';
        if (d.state === 'sorted') return '#a7f3d0';
        return '#e2e8f0';
      })
      .text(d => d.value)
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', d => {
        const barHeight = Math.max(4, innerHeight - yScale(d.value));
        return innerHeight - barHeight - 7;
      });
  }, [
    array,
    dimensions.height,
    dimensions.width,
    showHeatmap,
    ids.comparing,
    ids.default,
    ids.discarded,
    ids.hatch,
    ids.heatCold,
    ids.heatHot,
    ids.heatMax,
    ids.heatWarm,
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

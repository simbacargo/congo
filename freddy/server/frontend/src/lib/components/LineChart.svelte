<script lang="ts">
  export let points: Array<{ label: string; value: number }> = [];
  export let color = "#1c5cab";
  $: max = Math.max(1, ...points.map((point) => point.value));
  $: min = Math.min(0, ...points.map((point) => point.value));
  $: range = Math.max(1, max - min);
  $: plotted = points.map((point, index) => ({
    ...point,
    x: points.length <= 1 ? 50 : (index / (points.length - 1)) * 100,
    y: 92 - ((point.value - min) / range) * 78,
  }));
  $: path = plotted.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
</script>

<div class="chart-wrap">
  {#if points.length}
    <svg class="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Trend chart">
      <line x1="0" y1="92" x2="100" y2="92" class="chart-axis" />
      <line x1="0" y1="53" x2="100" y2="53" class="chart-grid" />
      <line x1="0" y1="14" x2="100" y2="14" class="chart-grid" />
      <path d={`${path} L100,92 L0,92 Z`} fill={color} opacity=".10" />
      <path d={path} fill="none" stroke={color} stroke-width="1.5" vector-effect="non-scaling-stroke" />
      {#each plotted as point}<circle cx={point.x} cy={point.y} r="1.4" fill={color} />{/each}
    </svg>
    <div class="chart-labels"><span>{points[0]?.label}</span><span>{points[Math.floor(points.length / 2)]?.label}</span><span>{points[points.length - 1]?.label}</span></div>
  {:else}<div class="chart-empty">No chart data</div>{/if}
</div>

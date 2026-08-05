<script lang="ts">
  export let items: Array<{ label: string; value: number }> = [];
  export let color = "#1c5cab";
  $: max = Math.max(1, ...items.map((item) => item.value));
</script>

<div class="bar-chart" role="img" aria-label="Bar chart">
  {#if items.length}
    {#each items.slice(0, 8) as item}
      <div class="bar-row"><span title={item.label}>{item.label}</span><div class="bar-track"><div class="bar-fill" style={`width:${Math.max(2, (item.value / max) * 100)}%;background:${color}`}></div></div><strong>{item.value}</strong></div>
    {/each}
  {:else}<div class="chart-empty">No chart data</div>{/if}
</div>

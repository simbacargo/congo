<script lang="ts">
  export let values: number[] = [];
  export let labels: string[] = [];
  export let colors = ["#b45309", "#15803d", "#1c5cab"];
  $: total = values.reduce((sum, value) => sum + value, 0);
  $: gradient = (() => {
    if (!total) return "#e3e1d8 0 100%";
    let start = 0;
    return values.map((value, index) => {
      const end = start + (value / total) * 100;
      const part = `${colors[index % colors.length]} ${start}% ${end}%`;
      start = end;
      return part;
    }).join(", ");
  })();
</script>

<div class="donut-layout">
  <div class="donut" style={`background: conic-gradient(${gradient})`}><span>{total}</span></div>
  <div class="legend">{#each values as value, index}<div><i style={`background:${colors[index % colors.length]}`}></i><span>{labels[index] || "—"}</span><strong>{value}</strong></div>{/each}</div>
</div>

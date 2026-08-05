<script lang="ts">
  export let label = "";
  export let value: string | number = "—";
  export let hint = "";
  export let tone: "default" | "accent" | "success" | "warning" = "default";
</script>

<article class={`kpi-card tone-${tone}`}>
  <p class="kpi-label">{label}</p>
  <p class="kpi-value">{value}</p>
  {#if hint}<p class="kpi-hint">{hint}</p>{/if}
</article>

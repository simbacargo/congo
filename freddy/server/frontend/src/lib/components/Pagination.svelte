<script lang="ts">
  export let count = 0;
  export let page = 1;
  export let pageSize = 25;
  export let onPage: (page: number) => void = () => undefined;
  $: pages = Math.max(1, Math.ceil(count / pageSize));
</script>

{#if count > pageSize}
  <div class="pagination"><span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} of {count}</span><div><button class="btn btn-quiet" disabled={page <= 1} on:click={() => onPage(page - 1)}>←</button><span class="page-number">{page} / {pages}</span><button class="btn btn-quiet" disabled={page >= pages} on:click={() => onPage(page + 1)}>→</button></div></div>
{/if}

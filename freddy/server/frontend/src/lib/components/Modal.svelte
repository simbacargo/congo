<script lang="ts">
  export let open = false;
  export let title = "";
  export let onClose: () => void = () => undefined;
</script>

{#if open}
  <div class="modal-backdrop" role="presentation" on:click={(event) => event.target === event.currentTarget && onClose()}>
    <section class="modal" role="dialog" aria-modal="true" aria-label={title}>
      <header class="modal-header"><h2>{title}</h2><button class="icon-button" aria-label="Close" on:click={onClose}>×</button></header>
      <div class="modal-body"><slot /></div>
    </section>
  </div>
{/if}

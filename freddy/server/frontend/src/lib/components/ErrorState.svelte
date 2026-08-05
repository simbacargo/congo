<script lang="ts">
  export let message = "Something went wrong.";
  export let retry: () => void = () => undefined;
</script>
<div class="error-state"><strong>{message}</strong><button class="btn btn-quiet" on:click={retry}>Retry</button></div>

<script lang="ts">
  import { statusClass, statusLabel } from "../format";
  export let status = "";
</script>
<span class={statusClass(status)}>{statusLabel(status)}</span>

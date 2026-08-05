<script lang="ts">
  import { ApiError } from "../lib/api";
  import { login } from "../lib/auth";
  import { navigate, routePath } from "../lib/router";

  let username = "";
  let password = "";
  let loading = false;
  let error = "";

  async function submit(): Promise<void> {
    error = "";
    loading = true;
    try {
      await login(username, password);
      navigate(routePath("dashboard"));
    } catch (err) {
      error = err instanceof ApiError ? err.message : "Unable to sign in. Check your credentials.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-frame">
  <section class="login-hero">
    <div class="login-brand"><div class="brand-mark">LC</div><div><strong>LCI Office</strong><span>Charity Fuel Initiative</span></div></div>
    <span class="login-badge">LUBUMBASHI · DR CONGO</span>
    <h1>Make every levy count.</h1>
    <p>Track collection, verify receipts, and direct support to partner churches with one shared operational ledger.</p>
  </section>
  <section class="login-panel">
    <form class="login-card" on:submit|preventDefault={submit}>
      <div class="login-brand mobile-card"><div class="brand-mark">LC</div><div><strong>LCI Office</strong><span>Fuel levy management</span></div></div>
      <h2>Welcome back</h2>
      <p>Sign in to continue to the operations dashboard.</p>
      {#if error}<div class="form-error">{error}</div>{/if}
      <div class="form-field"><label class="field-label" for="username">Username</label><input id="username" class="field" bind:value={username} autocomplete="username" required /></div>
      <div class="form-field"><label class="field-label" for="password">Password</label><input id="password" class="field" type="password" bind:value={password} autocomplete="current-password" required /></div>
      <button class="btn btn-primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
    </form>
  </section>
</div>

<script lang="ts">
  import { currentUser, displayName, logout, pendingCount, permissions } from "../auth";
  import { locale, setLocale, t, type Locale } from "../i18n";
  import { navigate, route, routePath } from "../router";

  export let title = "LCI Office";
  let mobileOpen = false;

  const links = [
    { name: "dashboard", label: "dashboard", icon: "▦" },
    { name: "transactions", label: "transactions", icon: "↔", permission: "view_transactions" },
    { name: "companies", label: "companies", icon: "▤", permission: "manage_companies" },
    { name: "stations", label: "stations", icon: "⌂", permission: "manage_stations" },
    { name: "churches", label: "churches", icon: "✦", permission: "manage_churches" },
    { name: "drivers", label: "drivers", icon: "▱", permission: "view_drivers" },
    { name: "agents", label: "agents", icon: "♙", permission: "manage_agents" },
    { name: "disbursements", label: "disbursements", icon: "◴", permission: "manage_disbursements" },
    { name: "reports", label: "reports", icon: "▥", permission: "view_reports" },
    { name: "audit", label: "audit", icon: "✓", permission: "view_audit" },
    { name: "fuel-types", label: "settings", icon: "⚙", permission: "manage_fuel_types" },
    { name: "targets", label: "targets", icon: "◎", permission: "manage_stations" },
    { name: "verify", label: "verify", icon: "⌕" },
  ];

  $: activeRoute = $route.name;
  $: userInitial = ($currentUser?.username || "L").slice(0, 1).toUpperCase();

  function allowed(permission?: string): boolean {
    return !permission || Boolean($currentUser?.is_superuser || $permissions[permission]);
  }

  function go(name: string, event: MouseEvent): void {
    event.preventDefault();
    mobileOpen = false;
    navigate(routePath(name));
  }

  async function signOut(): Promise<void> {
    await logout();
    navigate("/frontend");
  }
</script>

<div class="app-frame">
  {#if mobileOpen}<button class="backdrop" aria-label="Close navigation" on:click={() => mobileOpen = false}></button>{/if}
  <aside class:mobile-open={mobileOpen} class="sidebar">
    <div class="brand">
      <div class="brand-mark">LC</div>
      <div><strong>LCI Office</strong><span>Charity Fuel Initiative</span></div>
    </div>

    <nav class="nav-list" aria-label="Main navigation">
      <p class="nav-section">{t("dashboard", "Overview")}</p>
      {#each links as link, index}
        {#if allowed(link.permission)}
          {#if index === 1}<p class="nav-section nav-section-spaced">Operations</p>{/if}
          {#if index === 2}<p class="nav-section nav-section-spaced">Directory</p>{/if}
          {#if index === 7}<p class="nav-section nav-section-spaced">Management</p>{/if}
          {#if index === 9}<p class="nav-section nav-section-spaced">System</p>{/if}
          <a href={routePath(link.name)} class:active={activeRoute === link.name || activeRoute.startsWith(`${link.name.slice(0, -1)}-`)} class="nav-link" on:click={(event) => go(link.name, event)}>
            <span class="nav-icon" aria-hidden="true">{link.icon}</span>
            <span>{t(link.label, link.label)}</span>
            {#if link.name === "transactions" && $pendingCount}<span class="nav-count">{$pendingCount}</span>{/if}
          </a>
        {/if}
      {/each}
    </nav>
    <div class="sidebar-footer">Lubumbashi Charity Fuel Initiative</div>
  </aside>

  <section class="content-frame">
    <header class="topbar">
      <div class="topbar-title">
        <button class="icon-button mobile-menu" aria-label="Open navigation" on:click={() => mobileOpen = true}>☰</button>
        <div><h1>{title}</h1><p>Fuel levy management platform</p></div>
      </div>
      <div class="topbar-actions">
        <select class="language-select" aria-label="Language" bind:value={$locale} on:change={(event) => setLocale((event.currentTarget as HTMLSelectElement).value as Locale)}>
          <option value="fr">FR</option><option value="en">EN</option><option value="sw">SW</option>
        </select>
        <div class="user-menu">
          <div class="avatar">{userInitial}</div>
          <div class="user-copy"><strong>{displayName($currentUser)}</strong><span>{$currentUser?.role}</span></div>
          <button class="btn btn-quiet" on:click={signOut}>{t("logout", "Logout")}</button>
        </div>
      </div>
    </header>
    <main class="main-content"><slot /></main>
  </section>
</div>

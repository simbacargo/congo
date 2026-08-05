<script lang="ts">
  import { onMount } from "svelte";
  import { can } from "../lib/auth";
  import { agentsApi, churchesApi, companiesApi, fuelTypesApi, stationsApi, targetsApi } from "../lib/api";
  import { money, dateTime } from "../lib/format";
  import { navigate, routePath } from "../lib/router";
  import EmptyState from "../lib/components/EmptyState.svelte";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import Loading from "../lib/components/Loading.svelte";
  import Modal from "../lib/components/Modal.svelte";
  import Pagination from "../lib/components/Pagination.svelte";

  export let resource: "companies" | "stations" | "churches" | "fuel-types" | "targets";
  let rows: any[] = []; let companies: any[] = []; let stations: any[] = [];
  let page = 1; let pageSize = 50; let total = 0; let loading = true; let error = "";
  let modalOpen = false; let editing: any = null; let busy = false; let formError = "";
  let form: Record<string, any> = {};

  $: title = ({ companies: "Companies", stations: "Stations", churches: "Churches", "fuel-types": "Fuel types", targets: "Station targets" } as Record<string, string>)[resource];
  $: writePermission = resource === "companies" ? "manage_companies" : resource === "fuel-types" ? "manage_fuel_types" : resource === "targets" || resource === "stations" || resource === "churches" ? (resource === "churches" ? "manage_churches" : "manage_stations") : "";
  $: writable = can(writePermission);

  function blank(): Record<string, any> {
    if (resource === "companies") return { name: "", code: "", contact_email: "", contact_phone: "", is_active: true };
    if (resource === "stations") return { name: "", code: "", company: "", address: "", latitude: "", longitude: "", is_active: true };
    if (resource === "churches") return { name: "", station: "", contact_person: "", contact_phone: "", beneficiary_count: 0, is_active: true };
    if (resource === "fuel-types") return { name: "", code: "", is_active: true };
    return { station: "", year: new Date().getFullYear(), month: new Date().getMonth() + 1, target_usd: "" };
  }

  async function load(): Promise<void> {
    loading = true; error = "";
    try {
      if (resource === "companies") { const response = await companiesApi.list({ page, page_size: pageSize }); rows = response.results; total = response.count; }
      if (resource === "stations") { const response = await stationsApi.list({ page, page_size: pageSize }); rows = response.results; total = response.count; }
      if (resource === "churches") { const response = await churchesApi.list({ page, page_size: pageSize }); rows = response.results; total = response.count; }
      if (resource === "fuel-types") { rows = await fuelTypesApi.list(); total = rows.length; }
      if (resource === "targets") { const response = await targetsApi.list({ page, page_size: pageSize }); rows = response.results; total = response.count; }
      if (resource === "stations" || resource === "churches" || resource === "targets") {
        const [companiesResponse, stationsResponse] = await Promise.all([companiesApi.list({ page_size: 100 }), stationsApi.list({ page_size: 100 })]);
        companies = companiesResponse.results; stations = stationsResponse.results;
      }
    } catch (err) { error = err instanceof Error ? err.message : `Unable to load ${title.toLowerCase()}.`; }
    finally { loading = false; }
  }
  function openCreate(): void { editing = null; form = blank(); formError = ""; modalOpen = true; }
  function openEdit(row: any): void { editing = row; form = { ...blank(), ...row, target_usd: row.target_usd ?? "", latitude: row.latitude ?? "", longitude: row.longitude ?? "" }; modalOpen = true; formError = ""; }
  function close(): void { if (!busy) modalOpen = false; }
  function body(): Record<string, any> {
    const value = { ...form };
    ["latitude", "longitude"].forEach((key) => { if (value[key] === "") value[key] = null; });
    if (resource === "stations" || resource === "churches") value.beneficiary_count = Number(value.beneficiary_count || 0);
    if (resource === "targets") { value.year = Number(value.year); value.month = Number(value.month); value.target_usd = String(value.target_usd); }
    return value;
  }
  async function save(): Promise<void> {
    busy = true; formError = "";
    try {
      const data = body();
      if (resource === "companies") editing ? await companiesApi.update(editing.id, data) : await companiesApi.create(data);
      if (resource === "stations") editing ? await stationsApi.update(editing.id, data) : await stationsApi.create(data);
      if (resource === "churches") editing ? await churchesApi.update(editing.id, data) : await churchesApi.create(data);
      if (resource === "fuel-types") editing ? await fuelTypesApi.update(editing.id, data) : await fuelTypesApi.create(data);
      if (resource === "targets") editing ? await targetsApi.update(editing.id, data) : await targetsApi.create(data);
      modalOpen = false; await load();
    } catch (err) { formError = err instanceof Error ? err.message : "Unable to save changes."; }
    finally { busy = false; }
  }
  async function removeTarget(row: any): Promise<void> { if (!confirm(`Delete target for ${row.station_name}?`)) return; try { await targetsApi.remove(row.id); await load(); } catch (err) { error = err instanceof Error ? err.message : "Unable to delete target."; } }
  onMount(load);
</script>

<div class="page-heading"><div><h2>{title}</h2><p>Manage the records available to your role.</p></div>{#if writable}<button class="btn btn-primary" on:click={openCreate}>＋ New {resource === "fuel-types" ? "fuel type" : resource === "targets" ? "target" : resource.slice(0, -1)}</button>{/if}</div>
<section class="card">{#if loading}<Loading />{:else if error}<ErrorState message={error} retry={load} />{:else if rows.length}<div class="table-wrap"><table class="data-table"><thead><tr>{#if resource === "companies"}<th>Company</th><th>Code</th><th>Stations</th><th>Transactions</th><th>Levy</th><th>Status</th><th></th>{/if}{#if resource === "stations"}<th>Station</th><th>Company</th><th>Churches</th><th>Transactions</th><th>Levy</th><th></th>{/if}{#if resource === "churches"}<th>Church</th><th>Station</th><th>Beneficiaries</th><th>Transactions</th><th>Levy</th><th></th>{/if}{#if resource === "fuel-types"}<th>Name</th><th>Code</th><th>Status</th><th></th>{/if}{#if resource === "targets"}<th>Station</th><th>Company</th><th>Period</th><th>Target</th><th></th>{/if}</tr></thead><tbody>
  {#each rows as row}
    {#if resource === "companies"}<tr><td><a class="text-link" href={routePath("company-detail", row.id)} on:click={(event) => { event.preventDefault(); navigate(routePath("company-detail", row.id)); }}><strong>{row.name}</strong></a><small class="subtext">{row.contact_email || "No email"}</small></td><td class="receipt-code">{row.code}</td><td>{row.station_count ?? 0}</td><td>{row.tx_count ?? 0}</td><td class="money">{money(row.total_levy)}</td><td><span class="status" class:status-verified={row.is_active} class:status-cancelled={!row.is_active}>{row.is_active ? "Active" : "Inactive"}</span></td><td><button class="btn btn-small" on:click={() => openEdit(row)}>Edit</button></td></tr>{/if}
    {#if resource === "stations"}<tr><td><a class="text-link" href={routePath("station-detail", row.id)} on:click={(event) => { event.preventDefault(); navigate(routePath("station-detail", row.id)); }}><strong>{row.name}</strong></a><small class="subtext receipt-code">{row.code}</small></td><td>{row.company_name}</td><td>{row.church_count ?? 0}</td><td>{row.tx_count ?? 0}</td><td class="money">{money(row.total_levy)}</td><td><button class="btn btn-small" on:click={() => openEdit(row)}>Edit</button></td></tr>{/if}
    {#if resource === "churches"}<tr><td><a class="text-link" href={routePath("church-detail", row.id)} on:click={(event) => { event.preventDefault(); navigate(routePath("church-detail", row.id)); }}><strong>{row.name}</strong></a><small class="subtext">{row.company_name}</small></td><td>{row.station_name}</td><td>{row.beneficiary_count}</td><td>{row.tx_count ?? 0}</td><td class="money">{money(row.total_levy)}</td><td><button class="btn btn-small" on:click={() => openEdit(row)}>Edit</button></td></tr>{/if}
    {#if resource === "fuel-types"}<tr><td><strong>{row.name}</strong></td><td class="receipt-code">{row.code}</td><td><span class="status" class:status-verified={row.is_active} class:status-cancelled={!row.is_active}>{row.is_active ? "Active" : "Inactive"}</span></td><td><button class="btn btn-small" on:click={() => openEdit(row)}>Edit</button></td></tr>{/if}
    {#if resource === "targets"}<tr><td>{row.station_name}</td><td>{row.company_name}</td><td>{row.year}/{String(row.month).padStart(2, "0")}</td><td class="money">{money(row.target_usd)}</td><td class="table-actions"><button class="btn btn-small" on:click={() => openEdit(row)}>Edit</button><button class="btn btn-small btn-danger" on:click={() => removeTarget(row)}>Delete</button></td></tr>{/if}
  {/each}</tbody></table></div><Pagination count={total} page={page} pageSize={pageSize} onPage={(next) => { page = next; load(); }} />{:else}<EmptyState message={`No ${title.toLowerCase()} found.`} />{/if}</section>

<Modal bind:open={modalOpen} title={`${editing ? "Edit" : "New"} ${resource === "fuel-types" ? "fuel type" : resource === "targets" ? "station target" : resource.slice(0, -1)}`} onClose={close}>
  {#if formError}<div class="form-error">{formError}</div>{/if}
  <form class="form-grid" on:submit|preventDefault={save}>
    {#if resource === "companies"}<div class="form-field"><label class="field-label required">Name</label><input class="field" bind:value={form.name} required /></div><div class="form-field"><label class="field-label required">Code</label><input class="field" bind:value={form.code} required /></div><div class="form-field"><label class="field-label">Contact email</label><input class="field" type="email" bind:value={form.contact_email} /></div><div class="form-field"><label class="field-label">Contact phone</label><input class="field" bind:value={form.contact_phone} /></div><label class="form-check"><input type="checkbox" bind:checked={form.is_active} /> Active</label>{/if}
    {#if resource === "stations"}<div class="form-field"><label class="field-label required">Name</label><input class="field" bind:value={form.name} required /></div><div class="form-field"><label class="field-label required">Code</label><input class="field" bind:value={form.code} required /></div><div class="form-field full"><label class="field-label required">Company</label><select class="field" bind:value={form.company} required><option value="">Select company</option>{#each companies as company}<option value={company.id}>{company.name}</option>{/each}</select></div><div class="form-field full"><label class="field-label">Address</label><textarea class="field" bind:value={form.address}></textarea></div><div class="form-field"><label class="field-label">Latitude</label><input class="field" type="number" step="0.000001" bind:value={form.latitude} /></div><div class="form-field"><label class="field-label">Longitude</label><input class="field" type="number" step="0.000001" bind:value={form.longitude} /></div><label class="form-check"><input type="checkbox" bind:checked={form.is_active} /> Active</label>{/if}
    {#if resource === "churches"}<div class="form-field"><label class="field-label required">Name</label><input class="field" bind:value={form.name} required /></div><div class="form-field"><label class="field-label required">Station</label><select class="field" bind:value={form.station} required><option value="">Select station</option>{#each stations as station}<option value={station.id}>{station.name} · {station.company_name}</option>{/each}</select></div><div class="form-field"><label class="field-label">Contact person</label><input class="field" bind:value={form.contact_person} /></div><div class="form-field"><label class="field-label">Contact phone</label><input class="field" bind:value={form.contact_phone} /></div><div class="form-field"><label class="field-label">Beneficiaries</label><input class="field" type="number" min="0" bind:value={form.beneficiary_count} /></div><label class="form-check"><input type="checkbox" bind:checked={form.is_active} /> Active</label>{/if}
    {#if resource === "fuel-types"}<div class="form-field"><label class="field-label required">Name</label><input class="field" bind:value={form.name} required /></div><div class="form-field"><label class="field-label required">Code</label><input class="field" bind:value={form.code} required /></div><label class="form-check"><input type="checkbox" bind:checked={form.is_active} /> Active</label>{/if}
    {#if resource === "targets"}<div class="form-field full"><label class="field-label required">Station</label><select class="field" bind:value={form.station} required><option value="">Select station</option>{#each stations as station}<option value={station.id}>{station.name} · {station.company_name}</option>{/each}</select></div><div class="form-field"><label class="field-label required">Year</label><input class="field" type="number" min="2000" max="2200" bind:value={form.year} required /></div><div class="form-field"><label class="field-label required">Month</label><input class="field" type="number" min="1" max="12" bind:value={form.month} required /></div><div class="form-field"><label class="field-label required">Target USD</label><input class="field" type="number" min="0" step="0.01" bind:value={form.target_usd} required /></div>{/if}
    <div class="form-actions form-field full"><button class="btn" type="button" on:click={close}>Cancel</button><button class="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
  </form>
</Modal>

<style>.subtext{display:block;font-size:10px;color:var(--muted);margin-top:3px}.table-actions{justify-content:flex-end}.status-verified{color:#166534;background:var(--ok-soft)}.status-cancelled{color:#991b1b;background:var(--danger-soft)}</style>

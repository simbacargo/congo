<script lang="ts">
  import { onMount } from "svelte";
  import { can } from "../lib/auth";
  import { agentsApi, companiesApi, stationsApi } from "../lib/api";
  import { humanRole, dateTime } from "../lib/format";
  import { navigate, routePath } from "../lib/router";
  import EmptyState from "../lib/components/EmptyState.svelte";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import Loading from "../lib/components/Loading.svelte";
  import Modal from "../lib/components/Modal.svelte";
  import Pagination from "../lib/components/Pagination.svelte";

  let rows: any[] = []; let companies: any[] = []; let stations: any[] = [];
  let total = 0; let page = 1; let loading = true; let error = ""; let modalOpen = false; let editing: any = null; let formError = ""; let busy = false;
  let form: Record<string, any> = {};
  $: writable = can("manage_agents");

  function blank(): Record<string, any> { return { username: "", firstname: "", lastname: "", email: "", mobile: "", role: "STATION_AGENT", assigned_station: "", managed_company: "", is_active: true, password: "" }; }
  async function load(): Promise<void> { loading = true; error = ""; try { const [response, companyResponse, stationResponse] = await Promise.all([agentsApi.list({ page, page_size: 50 }), companiesApi.list({ page_size: 100 }), stationsApi.list({ page_size: 100 })]); rows = response.results; total = response.count; companies = companyResponse.results; stations = stationResponse.results; } catch (err) { error = err instanceof Error ? err.message : "Unable to load agents."; } finally { loading = false; } }
  function openCreate(): void { editing = null; form = blank(); formError = ""; modalOpen = true; }
  function openEdit(row: any): void { editing = row; form = { ...blank(), ...row, password: "" }; formError = ""; modalOpen = true; }
  function close(): void { if (!busy) modalOpen = false; }
  async function save(): Promise<void> { busy = true; formError = ""; try { const body = { ...form }; if (!body.password) delete body.password; if (body.role !== "COMPANY_MANAGER") body.managed_company = null; if (body.role !== "STATION_AGENT") body.assigned_station = null; editing ? await agentsApi.update(editing.id, body) : await agentsApi.create(body); modalOpen = false; await load(); } catch (err) { formError = err instanceof Error ? err.message : "Unable to save agent."; } finally { busy = false; } }
  onMount(load);
</script>

<div class="page-heading"><div><h2>Agents</h2><p>Manage accounts, roles, and operational assignments.</p></div>{#if writable}<button class="btn btn-primary" on:click={openCreate}>＋ New agent</button>{/if}</div>
<section class="card">{#if loading}<Loading />{:else if error}<ErrorState message={error} retry={load} />{:else if rows.length}<div class="table-wrap"><table class="data-table"><thead><tr><th>User</th><th>Role</th><th>Assignment</th><th>Status</th><th>Last seen</th><th></th></tr></thead><tbody>{#each rows as agent}<tr><td><a class="text-link" href={routePath("agent-detail", agent.id)} on:click={(event) => { event.preventDefault(); navigate(routePath("agent-detail", agent.id)); }}><strong>{agent.username}</strong></a><small class="subtext">{[agent.firstname, agent.lastname].filter(Boolean).join(" ") || "No name"} · {agent.email || "No email"}</small></td><td><span class="role-chip">{humanRole(agent.role)}</span></td><td>{agent.assigned_station_name || agent.managed_company_name || "Unassigned"}</td><td><span class="status" class:status-verified={agent.is_active} class:status-cancelled={!agent.is_active}>{agent.is_active ? "Active" : "Inactive"}</span></td><td class="muted nowrap">{dateTime(agent.last_seen)}</td><td>{#if writable}<button class="btn btn-small" on:click={() => openEdit(agent)}>Edit</button>{/if}</td></tr>{/each}</tbody></table></div><Pagination count={total} page={page} pageSize={50} onPage={(next) => { page = next; load(); }} />{:else}<EmptyState message="No agents found." />{/if}</section>

<Modal bind:open={modalOpen} title={`${editing ? "Edit" : "New"} agent`} onClose={close}>
  {#if formError}<div class="form-error">{formError}</div>{/if}
  <form class="form-grid" on:submit|preventDefault={save}><div class="form-field"><label class="field-label required">Username</label><input class="field" bind:value={form.username} required /></div><div class="form-field"><label class="field-label">Email</label><input class="field" type="email" bind:value={form.email} /></div><div class="form-field"><label class="field-label">First name</label><input class="field" bind:value={form.firstname} /></div><div class="form-field"><label class="field-label">Last name</label><input class="field" bind:value={form.lastname} /></div><div class="form-field"><label class="field-label">Mobile</label><input class="field" bind:value={form.mobile} /></div><div class="form-field"><label class="field-label required">Role</label><select class="field" bind:value={form.role} required><option value="STATION_AGENT">Station agent</option><option value="COMPANY_MANAGER">Company manager</option><option value="NGO_ADMIN">NGO admin</option></select></div>{#if form.role === "STATION_AGENT"}<div class="form-field full"><label class="field-label">Assigned station</label><select class="field" bind:value={form.assigned_station}><option value="">Unassigned</option>{#each stations as station}<option value={station.id}>{station.name} · {station.company_name}</option>{/each}</select></div>{/if}{#if form.role === "COMPANY_MANAGER"}<div class="form-field full"><label class="field-label">Managed company</label><select class="field" bind:value={form.managed_company}><option value="">Unassigned</option>{#each companies as company}<option value={company.id}>{company.name}</option>{/each}</select></div>{/if}<div class="form-field full"><label class="field-label">{editing ? "New password (optional)" : "Password"}</label><input class="field" type="password" bind:value={form.password} required={!editing} autocomplete="new-password" /></div><label class="form-check"><input type="checkbox" bind:checked={form.is_active} /> Active</label><div class="form-actions form-field full"><button class="btn" type="button" on:click={close}>Cancel</button><button class="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save agent"}</button></div></form>
</Modal>

<style>.subtext{display:block;font-size:10px;color:var(--muted);margin-top:3px}.role-chip{font-size:10px;font-weight:600;padding:4px 7px;border-radius:5px;background:var(--accent-soft);color:var(--accent)}</style>

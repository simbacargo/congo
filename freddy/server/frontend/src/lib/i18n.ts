import { writable } from "svelte/store";
import { getStoredLocale, setStoredLocale } from "./storage";

export type Locale = "fr" | "en" | "sw";
export const locale = writable<Locale>((getStoredLocale() as Locale) || "fr");

const dictionary: Record<Locale, Record<string, string>> = {
  fr: {
    dashboard: "Tableau de bord", transactions: "Transactions", companies: "Entreprises",
    stations: "Stations", churches: "Églises", drivers: "Chauffeurs", agents: "Agents",
    disbursements: "Décaissements", reports: "Rapports", audit: "Journal d’audit",
    settings: "Paramètres", logout: "Déconnexion", login: "Connexion", search: "Rechercher",
    loading: "Chargement…", save: "Enregistrer", cancel: "Annuler", create: "Créer",
    edit: "Modifier", details: "Détails", no_results: "Aucun résultat", pending: "En attente",
  },
  en: {
    dashboard: "Dashboard", transactions: "Transactions", companies: "Companies",
    stations: "Stations", churches: "Churches", drivers: "Drivers", agents: "Agents",
    disbursements: "Disbursements", reports: "Reports", audit: "Audit log",
    settings: "Settings", logout: "Logout", login: "Login", search: "Search",
    loading: "Loading…", save: "Save", cancel: "Cancel", create: "Create",
    edit: "Edit", details: "Details", no_results: "No results", pending: "Pending",
  },
  sw: {
    dashboard: "Dashibodi", transactions: "Miamala", companies: "Kampuni",
    stations: "Vituo", churches: "Makanisa", drivers: "Madereva", agents: "Mawakala",
    disbursements: "Malipo", reports: "Ripoti", audit: "Kumbukumbu ya ukaguzi",
    settings: "Mipangilio", logout: "Ondoka", login: "Ingia", search: "Tafuta",
    loading: "Inapakia…", save: "Hifadhi", cancel: "Ghairi", create: "Unda",
    edit: "Hariri", details: "Maelezo", no_results: "Hakuna matokeo", pending: "Inasubiri",
  },
};

export function setLocale(value: Locale): void {
  locale.set(value);
  setStoredLocale(value);
}

export function t(key: string, fallback = key): string {
  const current = getStoredLocale() as Locale;
  return dictionary[current]?.[key] || dictionary.en[key] || fallback;
}

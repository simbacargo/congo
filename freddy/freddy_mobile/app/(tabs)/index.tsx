import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCurrencyRate } from "../../lib/api";
import { flushOfflineQueue } from "../../lib/sync";
import { getPendingTxs } from "../../lib/db";

export default function HomeScreen() {
  const [rate, setRate] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const pending = await getPendingTxs();
    setPendingCount(pending.length);
    try {
      const r = await fetchCurrencyRate();
      setRate(r);
    } catch {
      // offline — rate not available
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const { synced, failed } = await flushOfflineQueue();
      await loadData();
      Alert.alert("Sync Complete", `${synced} synced, ${failed} failed.`);
    } catch (e: any) {
      Alert.alert("Sync Failed", e.message ?? "Network error");
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    await AsyncStorage.removeItem("auth_token");
    router.replace("/login");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>LCI Agent</Text>
          <Text style={styles.subtitle}>Lubumbashi Charity Fuel Initiative</Text>
        </View>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Rate Card */}
      <View style={styles.rateCard}>
        <Text style={styles.rateLabel}>Live Exchange Rate</Text>
        {rate ? (
          <Text style={styles.rateValue}>1 USD = {rate.toLocaleString()} CDF</Text>
        ) : (
          <Text style={[styles.rateValue, { color: "#64748b" }]}>Offline — rate unavailable</Text>
        )}
      </View>

      {/* Offline Queue Banner */}
      {pendingCount > 0 && (
        <Pressable
          style={styles.syncBanner}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.syncText}>
              {pendingCount} offline transaction{pendingCount > 1 ? "s" : ""} — Tap to sync
            </Text>
          )}
        </Pressable>
      )}

      {/* New Transaction CTA */}
      <Pressable style={styles.newTxBtn} onPress={() => router.push("/transaction/new")}>
        <Text style={styles.newTxText}>+ New Transaction</Text>
      </Pressable>

      {/* Quick Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>2%</Text>
          <Text style={styles.infoLabel}>Charity Levy</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={[styles.infoValue, { color: pendingCount > 0 ? "#f59e0b" : "#22c55e" }]}>
            {pendingCount}
          </Text>
          <Text style={styles.infoLabel}>Pending Sync</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#f1f5f9" },
  subtitle: { fontSize: 11, color: "#64748b", marginTop: 2 },
  logoutText: { color: "#64748b", fontSize: 13 },
  rateCard: {
    backgroundColor: "#1e293b", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#334155", marginBottom: 16,
  },
  rateLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  rateValue: { fontSize: 20, fontWeight: "700", color: "#34d399" },
  syncBanner: {
    backgroundColor: "#92400e", borderRadius: 10, padding: 14,
    marginBottom: 16, alignItems: "center",
  },
  syncText: { color: "#fef3c7", fontWeight: "600" },
  newTxBtn: {
    backgroundColor: "#2563eb", borderRadius: 14, padding: 18,
    alignItems: "center", marginBottom: 20,
  },
  newTxText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoGrid: { flexDirection: "row", gap: 12 },
  infoCard: {
    flex: 1, backgroundColor: "#1e293b", borderRadius: 12,
    padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#334155",
  },
  infoValue: { fontSize: 28, fontWeight: "700", color: "#3b82f6" },
  infoLabel: { fontSize: 11, color: "#64748b", marginTop: 4 },
});

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCurrencyRate, fetchProfile, AgentProfile } from "../../lib/api";
import { flushOfflineQueue } from "../../lib/sync";
import { getLocalStats, getRecentTxs, LocalStats, OfflineTx } from "../../lib/db";

export default function HomeScreen() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [stats, setStats] = useState<LocalStats | null>(null);
  const [recent, setRecent] = useState<OfflineTx[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(true);

  const load = useCallback(async () => {
    const [s, r] = await Promise.all([getLocalStats(), getRecentTxs(5)]);
    setStats(s);
    setRecent(r);
    try {
      const [rt, prof] = await Promise.all([fetchCurrencyRate(), fetchProfile()]);
      setRate(rt);
      setProfile(prof);
      setOnline(true);
    } catch {
      setOnline(false);
      const cached = await AsyncStorage.getItem("agent_profile");
      if (cached) setProfile(JSON.parse(cached));
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSync() {
    setSyncing(true);
    try {
      const { synced, failed } = await flushOfflineQueue();
      await load();
      if (synced > 0 || failed > 0) {
        Alert.alert("Sync Complete", `${synced} synced${failed > 0 ? `, ${failed} failed` : ""}.`);
      }
    } catch (e: any) {
      Alert.alert("Sync Failed", e.message ?? "Network error");
    } finally {
      setSyncing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const agentName = profile?.username ?? "Agent";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <FontAwesome name="tint" size={18} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.agentName}>{agentName}</Text>
          </View>
        </View>
        <View style={[styles.statusDot, online ? styles.statusOnline : styles.statusOffline]} />
      </View>

      {/* Offline sync banner */}
      {(stats?.pendingCount ?? 0) > 0 && (
        <Pressable style={styles.syncBanner} onPress={handleSync} disabled={syncing}>
          {syncing ? (
            <View style={styles.syncRow}>
              <ActivityIndicator size="small" color="#fef3c7" />
              <Text style={styles.syncText}>Syncing…</Text>
            </View>
          ) : (
            <View style={styles.syncRow}>
              <FontAwesome name="cloud-upload" size={14} color="#fef3c7" />
              <Text style={styles.syncText}>
                {stats!.pendingCount} pending — Tap to sync
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="calendar-o"
          iconColor="#60a5fa"
          value={String(stats?.todayCount ?? 0)}
          label="Today"
        />
        <StatCard
          icon="dollar"
          iconColor="#34d399"
          value={`$${(stats?.todayLevyUsd ?? 0).toFixed(2)}`}
          label="Today's Levy"
        />
        <StatCard
          icon="clock-o"
          iconColor="#f59e0b"
          value={String(stats?.pendingCount ?? 0)}
          label="Pending"
        />
      </View>

      {/* Exchange rate */}
      <View style={styles.rateCard}>
        <View style={styles.rateLeft}>
          <Text style={styles.rateLabel}>LIVE RATE</Text>
          {rate ? (
            <Text style={styles.rateValue}>1 USD = {rate.toLocaleString()} CDF</Text>
          ) : (
            <Text style={[styles.rateValue, { color: "#475569", fontSize: 16 }]}>
              Rate unavailable
            </Text>
          )}
        </View>
        <View style={[styles.rateBadge, online ? styles.rateBadgeOnline : styles.rateBadgeOffline]}>
          <FontAwesome name={online ? "wifi" : "ban"} size={11} color={online ? "#4ade80" : "#94a3b8"} />
          <Text style={[styles.rateBadgeText, { color: online ? "#4ade80" : "#94a3b8" }]}>
            {online ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <Pressable style={styles.ctaBtn} onPress={() => router.push("/transaction/new")}>
        <View style={styles.ctaInner}>
          <View style={styles.ctaIconWrap}>
            <FontAwesome name="plus" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.ctaTitle}>New Transaction</Text>
            <Text style={styles.ctaSub}>Record a fuel sale with 2% levy</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={14} color="#93c5fd" />
      </Pressable>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={() => router.push("/verify")}>
          <FontAwesome name="check-circle-o" size={20} color="#818cf8" />
          <Text style={styles.quickLabel}>Verify Receipt</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(tabs)/history")}>
          <FontAwesome name="list-ul" size={20} color="#818cf8" />
          <Text style={styles.quickLabel}>All History</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(tabs)/analytics")}>
          <FontAwesome name="bar-chart" size={20} color="#818cf8" />
          <Text style={styles.quickLabel}>Analytics</Text>
        </Pressable>
      </View>

      {/* Monthly summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.monthGrid}>
          <MonthStat label="Transactions" value={String(stats?.monthCount ?? 0)} />
          <MonthStat label="Levy Collected" value={`$${(stats?.monthLevyUsd ?? 0).toFixed(2)}`} highlight />
          <MonthStat label="Synced" value={String(stats?.syncedCount ?? 0)} />
          <MonthStat label="Total All-Time" value={String(stats?.totalCount ?? 0)} />
        </View>
      </View>

      {/* Recent transactions */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <Pressable onPress={() => router.push("/(tabs)/history")}>
              <Text style={styles.sectionLink}>See all</Text>
            </Pressable>
          </View>
          {recent.map((tx) => (
            <Pressable
              key={tx.sync_id}
              style={styles.recentRow}
              onPress={() => router.push({ pathname: "/transaction/detail", params: { syncId: tx.sync_id } })}
            >
              <View style={styles.recentLeft}>
                <Text style={styles.recentChurch} numberOfLines={1}>{tx.church_name}</Text>
                <Text style={styles.recentMeta}>{tx.fuel_type_name} · {new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.recentRight}>
                <Text style={styles.recentLevy}>${parseFloat(tx.levy_preview).toFixed(4)}</Text>
                <View style={[styles.recentBadge, tx.synced ? styles.badgeSynced : styles.badgePending]}>
                  <Text style={styles.recentBadgeText}>{tx.synced ? "Synced" : "Pending"}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Levy info footer */}
      <View style={styles.levyInfo}>
        <FontAwesome name="info-circle" size={12} color="#334155" />
        <Text style={styles.levyInfoText}>2% charity levy supports the LCI humanitarian fund</Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, iconColor, value, label }: { icon: string; iconColor: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <FontAwesome name={icon as any} size={16} color={iconColor} style={{ marginBottom: 6 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MonthStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.monthStat}>
      <Text style={[styles.monthValue, highlight && { color: "#34d399" }]}>{value}</Text>
      <Text style={styles.monthLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#0f2040", borderWidth: 1, borderColor: "#1e3a5f",
    justifyContent: "center", alignItems: "center",
  },
  greeting: { fontSize: 12, color: "#475569" },
  agentName: { fontSize: 17, fontWeight: "700", color: "#f8fafc" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOnline: { backgroundColor: "#22c55e" },
  statusOffline: { backgroundColor: "#475569" },

  syncBanner: {
    backgroundColor: "#451a03", borderWidth: 1, borderColor: "#78350f",
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  syncText: { color: "#fef3c7", fontWeight: "600", fontSize: 13 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#111827", borderRadius: 14,
    padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#1e2d45",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#f8fafc" },
  statLabel: { fontSize: 10, color: "#475569", marginTop: 2, textAlign: "center" },

  rateCard: {
    backgroundColor: "#111827", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#1e2d45", marginBottom: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  rateLeft: {},
  rateLabel: { fontSize: 10, color: "#334155", letterSpacing: 1.5, marginBottom: 4 },
  rateValue: { fontSize: 20, fontWeight: "700", color: "#34d399" },
  rateBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  rateBadgeOnline: { backgroundColor: "#052e16", borderColor: "#166534" },
  rateBadgeOffline: { backgroundColor: "#1e293b", borderColor: "#334155" },
  rateBadgeText: { fontSize: 11, fontWeight: "600" },

  ctaBtn: {
    backgroundColor: "#1d4ed8", borderRadius: 16, padding: 18, marginBottom: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#2563eb",
  },
  ctaInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  ctaIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center",
  },
  ctaTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  ctaSub: { fontSize: 11, color: "#93c5fd", marginTop: 2 },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  quickCard: {
    flex: 1, backgroundColor: "#111827", borderRadius: 14,
    padding: 14, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#1e2d45",
  },
  quickLabel: { fontSize: 10, color: "#64748b", fontWeight: "600", textAlign: "center" },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
  sectionLink: { fontSize: 12, color: "#3b82f6", fontWeight: "600" },

  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  monthStat: {
    width: "47%", backgroundColor: "#111827", borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#1e2d45",
  },
  monthValue: { fontSize: 18, fontWeight: "700", color: "#f8fafc" },
  monthLabel: { fontSize: 11, color: "#475569", marginTop: 4 },

  recentRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#1e2d45",
  },
  recentLeft: { flex: 1, marginRight: 12 },
  recentRight: { alignItems: "flex-end" },
  recentChurch: { fontSize: 13, fontWeight: "600", color: "#f8fafc" },
  recentMeta: { fontSize: 11, color: "#475569", marginTop: 2 },
  recentLevy: { fontSize: 14, fontWeight: "700", color: "#34d399" },
  recentBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeSynced: { backgroundColor: "#14532d" },
  badgePending: { backgroundColor: "#451a03" },
  recentBadgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },

  levyInfo: {
    flexDirection: "row", alignItems: "center", gap: 6,
    justifyContent: "center", marginTop: 8,
  },
  levyInfoText: { fontSize: 11, color: "#334155" },
});

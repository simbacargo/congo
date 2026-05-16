import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { getLocalStats, LocalStats } from "../../lib/db";

type Period = "today" | "month" | "all";

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<LocalStats | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const s = await getLocalStats();
    setStats(s);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const count = period === "today" ? stats?.todayCount : period === "month" ? stats?.monthCount : stats?.totalCount;
  const levy = period === "today" ? stats?.todayLevyUsd : period === "month" ? stats?.monthLevyUsd : stats?.totalLevyUsd;

  const maxChurchCount = Math.max(...(stats?.topChurches.map((c) => c.count) ?? [1]), 1);
  const maxFuelCount = Math.max(...(stats?.byFuelType.map((f) => f.count) ?? [1]), 1);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Period selector */}
      <View style={styles.periodRow}>
        {(["today", "month", "all"] as Period[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === "today" ? "Today" : p === "month" ? "This Month" : "All Time"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Primary metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <FontAwesome name="exchange" size={18} color="#60a5fa" style={styles.metricIcon} />
          <Text style={styles.metricValue}>{count ?? 0}</Text>
          <Text style={styles.metricLabel}>Transactions</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardHighlight]}>
          <FontAwesome name="dollar" size={18} color="#34d399" style={styles.metricIcon} />
          <Text style={[styles.metricValue, { color: "#34d399" }]}>
            ${(levy ?? 0).toFixed(2)}
          </Text>
          <Text style={styles.metricLabel}>Levy Collected</Text>
        </View>
        <View style={styles.metricCard}>
          <FontAwesome name="line-chart" size={18} color="#a78bfa" style={styles.metricIcon} />
          <Text style={styles.metricValue}>
            ${(count && levy ? levy / count : 0).toFixed(4)}
          </Text>
          <Text style={styles.metricLabel}>Avg per Tx</Text>
        </View>
      </View>

      {/* Sync status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sync Status</Text>
        <View style={styles.syncStatusRow}>
          <View style={styles.syncItem}>
            <View style={[styles.syncDot, styles.syncDotGreen]} />
            <View>
              <Text style={styles.syncCount}>{stats?.syncedCount ?? 0}</Text>
              <Text style={styles.syncLabel}>Synced</Text>
            </View>
          </View>
          <View style={styles.syncDivider} />
          <View style={styles.syncItem}>
            <View style={[styles.syncDot, styles.syncDotAmber]} />
            <View>
              <Text style={styles.syncCount}>{stats?.pendingCount ?? 0}</Text>
              <Text style={styles.syncLabel}>Pending</Text>
            </View>
          </View>
          <View style={styles.syncDivider} />
          <View style={styles.syncItem}>
            <View style={[styles.syncDot, styles.syncDotBlue]} />
            <View>
              <Text style={styles.syncCount}>{stats?.totalCount ?? 0}</Text>
              <Text style={styles.syncLabel}>Total</Text>
            </View>
          </View>
        </View>
        {(stats?.totalCount ?? 0) > 0 && (
          <View style={styles.syncBarOuter}>
            <View
              style={[
                styles.syncBarInner,
                { width: `${Math.round(((stats?.syncedCount ?? 0) / (stats?.totalCount ?? 1)) * 100)}%` },
              ]}
            />
          </View>
        )}
        <Text style={styles.syncPercent}>
          {stats?.totalCount ? Math.round(((stats.syncedCount) / stats.totalCount) * 100) : 0}% synced
        </Text>
      </View>

      {/* Top churches */}
      {(stats?.topChurches.length ?? 0) > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Churches</Text>
          {stats!.topChurches.map((ch, i) => (
            <View key={ch.church_name} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barRank}>#{i + 1}</Text>
                <Text style={styles.barName} numberOfLines={1}>{ch.church_name}</Text>
                <Text style={styles.barValue}>{ch.count} tx</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((ch.count / maxChurchCount) * 100)}%`, backgroundColor: barColor(i) },
                  ]}
                />
              </View>
              <Text style={styles.barLevy}>${ch.levy.toFixed(2)} levy</Text>
            </View>
          ))}
        </View>
      )}

      {/* Fuel type breakdown */}
      {(stats?.byFuelType.length ?? 0) > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Fuel Type</Text>
          {stats!.byFuelType.map((ft, i) => (
            <View key={ft.fuel_type_name} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <FontAwesome name="tint" size={12} color={barColor(i)} style={{ marginRight: 6 }} />
                <Text style={styles.barName} numberOfLines={1}>{ft.fuel_type_name}</Text>
                <Text style={styles.barValue}>{ft.count}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((ft.count / maxFuelCount) * 100)}%`, backgroundColor: barColor(i) },
                  ]}
                />
              </View>
              <Text style={styles.barLevy}>${ft.levy.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Levy information */}
      <View style={styles.levyCard}>
        <FontAwesome name="heart" size={14} color="#f43f5e" style={{ marginBottom: 8 }} />
        <Text style={styles.levyCardTitle}>Charity Levy Programme</Text>
        <Text style={styles.levyCardBody}>
          Every fuel transaction you record contributes a 2% levy to the LCI humanitarian fund.
          Your work directly supports communities in Lubumbashi.
        </Text>
        <View style={styles.levyStatRow}>
          <View style={styles.levyStat}>
            <Text style={styles.levyStatValue}>${(stats?.totalLevyUsd ?? 0).toFixed(2)}</Text>
            <Text style={styles.levyStatLabel}>Total contributed</Text>
          </View>
          <View style={styles.levyStat}>
            <Text style={styles.levyStatValue}>2%</Text>
            <Text style={styles.levyStatLabel}>Levy rate</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function barColor(index: number): string {
  const colors = ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 16, paddingBottom: 32 },

  periodRow: {
    flexDirection: "row", gap: 8, marginBottom: 16,
    backgroundColor: "#111827", borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: "#1e2d45",
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  periodBtnActive: { backgroundColor: "#1d4ed8" },
  periodText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  periodTextActive: { color: "#fff" },

  metricsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  metricCard: {
    flex: 1, backgroundColor: "#111827", borderRadius: 14,
    padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#1e2d45",
  },
  metricCardHighlight: { borderColor: "#166534", backgroundColor: "#052e16" },
  metricIcon: { marginBottom: 6 },
  metricValue: { fontSize: 16, fontWeight: "800", color: "#f8fafc", textAlign: "center" },
  metricLabel: { fontSize: 10, color: "#475569", marginTop: 2, textAlign: "center" },

  card: {
    backgroundColor: "#111827", borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: "#1e2d45",
  },
  cardTitle: { fontSize: 12, fontWeight: "700", color: "#475569", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 },

  syncStatusRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  syncItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncDotGreen: { backgroundColor: "#22c55e" },
  syncDotAmber: { backgroundColor: "#f59e0b" },
  syncDotBlue: { backgroundColor: "#3b82f6" },
  syncCount: { fontSize: 18, fontWeight: "700", color: "#f8fafc" },
  syncLabel: { fontSize: 10, color: "#475569" },
  syncDivider: { width: 1, height: 32, backgroundColor: "#1e2d45" },
  syncBarOuter: {
    height: 6, backgroundColor: "#1e2d45", borderRadius: 3, marginBottom: 6, overflow: "hidden",
  },
  syncBarInner: { height: 6, backgroundColor: "#22c55e", borderRadius: 3 },
  syncPercent: { fontSize: 11, color: "#475569", textAlign: "right" },

  barRow: { marginBottom: 14 },
  barLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  barRank: { fontSize: 11, color: "#334155", fontWeight: "700", marginRight: 6, width: 20 },
  barName: { flex: 1, fontSize: 13, color: "#e2e8f0", fontWeight: "600" },
  barValue: { fontSize: 12, color: "#64748b", marginLeft: 8 },
  barTrack: { height: 6, backgroundColor: "#1e2d45", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  barFill: { height: 6, borderRadius: 3 },
  barLevy: { fontSize: 11, color: "#34d399", textAlign: "right" },

  levyCard: {
    backgroundColor: "#1a0a14", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#3f1a2b", alignItems: "center",
  },
  levyCardTitle: { fontSize: 14, fontWeight: "700", color: "#f8fafc", marginBottom: 8 },
  levyCardBody: { fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 18, marginBottom: 16 },
  levyStatRow: { flexDirection: "row", gap: 20 },
  levyStat: { alignItems: "center" },
  levyStatValue: { fontSize: 18, fontWeight: "700", color: "#fb7185" },
  levyStatLabel: { fontSize: 10, color: "#475569", marginTop: 2 },
});

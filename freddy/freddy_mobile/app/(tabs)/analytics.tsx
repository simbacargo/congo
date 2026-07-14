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
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

type Period = "today" | "month" | "all";

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

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

  const periodLabels: Record<Period, string> = {
    today: t("analytics.today"),
    month: t("analytics.this.month"),
    all: t("analytics.all.time"),
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
              {periodLabels[p]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Primary metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <FontAwesome name="exchange" size={18} color={colors.primary} style={styles.metricIcon} />
          <Text style={styles.metricValue}>{count ?? 0}</Text>
          <Text style={styles.metricLabel}>{t("analytics.transactions")}</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardHighlight]}>
          <FontAwesome name="dollar" size={18} color={colors.success} style={styles.metricIcon} />
          <Text style={[styles.metricValue, { color: colors.success }]}>
            ${(levy ?? 0).toFixed(2)}
          </Text>
          <Text style={styles.metricLabel}>{t("analytics.levy.collected")}</Text>
        </View>
        <View style={styles.metricCard}>
          <FontAwesome name="line-chart" size={18} color={colors.accent} style={styles.metricIcon} />
          <Text style={styles.metricValue}>
            ${(count && levy ? levy / count : 0).toFixed(4)}
          </Text>
          <Text style={styles.metricLabel}>{t("analytics.avg.per.tx")}</Text>
        </View>
      </View>

      {/* Sync status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("analytics.sync.status")}</Text>
        <View style={styles.syncStatusRow}>
          <View style={styles.syncItem}>
            <View style={[styles.syncDot, { backgroundColor: colors.success }]} />
            <View>
              <Text style={styles.syncCount}>{stats?.syncedCount ?? 0}</Text>
              <Text style={styles.syncLabel}>{t("synced")}</Text>
            </View>
          </View>
          <View style={styles.syncDivider} />
          <View style={styles.syncItem}>
            <View style={[styles.syncDot, { backgroundColor: colors.warning }]} />
            <View>
              <Text style={styles.syncCount}>{stats?.pendingCount ?? 0}</Text>
              <Text style={styles.syncLabel}>{t("pending")}</Text>
            </View>
          </View>
          <View style={styles.syncDivider} />
          <View style={styles.syncItem}>
            <View style={[styles.syncDot, { backgroundColor: colors.primary }]} />
            <View>
              <Text style={styles.syncCount}>{stats?.totalCount ?? 0}</Text>
              <Text style={styles.syncLabel}>{t("analytics.total")}</Text>
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
          {stats?.totalCount ? Math.round(((stats.syncedCount) / stats.totalCount) * 100) : 0}% {t("analytics.synced.pct")}
        </Text>
      </View>

      {/* Top churches */}
      {(stats?.topChurches.length ?? 0) > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("analytics.top.churches")}</Text>
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
                    { width: `${Math.round((ch.count / maxChurchCount) * 100)}%`, backgroundColor: barColor(i, colors) },
                  ]}
                />
              </View>
              <Text style={styles.barLevy}>${ch.levy.toFixed(2)} {t("analytics.levy.lower")}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Fuel type breakdown */}
      {(stats?.byFuelType.length ?? 0) > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("analytics.by.fuel.type")}</Text>
          {stats!.byFuelType.map((ft, i) => (
            <View key={ft.fuel_type_name} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <FontAwesome name="tint" size={12} color={barColor(i, colors)} style={{ marginRight: 6 }} />
                <Text style={styles.barName} numberOfLines={1}>{ft.fuel_type_name}</Text>
                <Text style={styles.barValue}>{ft.count}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((ft.count / maxFuelCount) * 100)}%`, backgroundColor: barColor(i, colors) },
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
        <Text style={styles.levyCardTitle}>{t("analytics.levy.programme")}</Text>
        <Text style={styles.levyCardBody}>{t("analytics.levy.programme.body")}</Text>
        <View style={styles.levyStatRow}>
          <View style={styles.levyStat}>
            <Text style={styles.levyStatValue}>${(stats?.totalLevyUsd ?? 0).toFixed(2)}</Text>
            <Text style={styles.levyStatLabel}>{t("analytics.total.contributed")}</Text>
          </View>
          <View style={styles.levyStat}>
            <Text style={styles.levyStatValue}>2%</Text>
            <Text style={styles.levyStatLabel}>{t("analytics.levy.rate")}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function barColor(index: number, colors: any): string {
  const palette = [colors.primary, colors.accent, "#8b5cf6", "#a78bfa", "#c4b5fd"];
  return palette[index % palette.length];
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 32 },

    periodRow: {
      flexDirection: "row", gap: 8, marginBottom: 16,
      backgroundColor: colors.surface, borderRadius: 12, padding: 4,
      borderWidth: 1, borderColor: colors.border,
    },
    periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    periodBtnActive: { backgroundColor: colors.primary },
    periodText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
    periodTextActive: { color: colors.onPrimary },

    metricsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    metricCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 14,
      padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border,
    },
    metricCardHighlight: { borderColor: colors.successBorder, backgroundColor: colors.successBg },
    metricIcon: { marginBottom: 6 },
    metricValue: { fontSize: 16, fontWeight: "800", color: colors.text, textAlign: "center" },
    metricLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: "center" },

    card: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      marginBottom: 14, borderWidth: 1, borderColor: colors.border,
    },
    cardTitle: { fontSize: 12, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 },

    syncStatusRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    syncItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    syncDot: { width: 8, height: 8, borderRadius: 4 },
    syncCount: { fontSize: 18, fontWeight: "700", color: colors.text },
    syncLabel: { fontSize: 10, color: colors.textSecondary },
    syncDivider: { width: 1, height: 32, backgroundColor: colors.border },
    syncBarOuter: {
      height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 6, overflow: "hidden",
    },
    syncBarInner: { height: 6, backgroundColor: colors.success, borderRadius: 3 },
    syncPercent: { fontSize: 11, color: colors.textSecondary, textAlign: "right" },

    barRow: { marginBottom: 14 },
    barLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    barRank: { fontSize: 11, color: colors.textSecondary, fontWeight: "700", marginRight: 6, width: 20 },
    barName: { flex: 1, fontSize: 13, color: colors.text, fontWeight: "600" },
    barValue: { fontSize: 12, color: colors.textSecondary, marginLeft: 8 },
    barTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
    barFill: { height: 6, borderRadius: 3 },
    barLevy: { fontSize: 11, color: colors.success, textAlign: "right" },

    levyCard: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 18,
      borderWidth: 1, borderColor: colors.border, alignItems: "center",
    },
    levyCardTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
    levyCardBody: { fontSize: 12, color: colors.textSecondary, textAlign: "center", lineHeight: 18, marginBottom: 16 },
    levyStatRow: { flexDirection: "row", gap: 20 },
    levyStat: { alignItems: "center" },
    levyStatValue: { fontSize: 18, fontWeight: "700", color: "#fb7185" },
    levyStatLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  });
}

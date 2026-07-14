import { useCallback, useState } from "react";
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
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

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
        Alert.alert(t("home.sync.complete"), `${synced} ${t("home.sync.synced")}${failed > 0 ? `, ${failed} ${t("home.sync.failed")}` : ""}.`);
      }
    } catch (e: any) {
      Alert.alert(t("home.sync.failed.title"), e.message ?? "Network error");
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
    if (h < 12) return t("home.greeting.morning");
    if (h < 17) return t("home.greeting.afternoon");
    return t("home.greeting.evening");
  };

  const agentName = profile?.username ?? "Agent";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <FontAwesome name="tint" size={18} color={colors.primary} />
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
              <ActivityIndicator size="small" color={colors.warning} />
              <Text style={styles.syncText}>{t("home.syncing")}</Text>
            </View>
          ) : (
            <View style={styles.syncRow}>
              <FontAwesome name="cloud-upload" size={14} color={colors.warning} />
              <Text style={styles.syncText}>
                {stats!.pendingCount} {t("home.pending.tap")}
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="calendar-o"
          iconColor={colors.primary}
          value={String(stats?.todayCount ?? 0)}
          label={t("home.today")}
          styles={styles}
        />
        <StatCard
          icon="dollar"
          iconColor={colors.success}
          value={`$${(stats?.todayLevyUsd ?? 0).toFixed(2)}`}
          label={t("home.today.levy")}
          styles={styles}
        />
        <StatCard
          icon="clock-o"
          iconColor={colors.warning}
          value={String(stats?.pendingCount ?? 0)}
          label={t("home.pending")}
          styles={styles}
        />
      </View>

      {/* Exchange rate */}
      <View style={styles.rateCard}>
        <View style={styles.rateLeft}>
          <Text style={styles.rateLabel}>{t("home.live.rate")}</Text>
          {rate ? (
            <Text style={styles.rateValue}>1 USD = {rate.toLocaleString()} CDF</Text>
          ) : (
            <Text style={[styles.rateValue, { color: colors.textSecondary, fontSize: 16 }]}>
              {t("home.rate.unavailable")}
            </Text>
          )}
        </View>
        <View style={[styles.rateBadge, online ? styles.rateBadgeOnline : styles.rateBadgeOffline]}>
          <FontAwesome name={online ? "wifi" : "ban"} size={11} color={online ? colors.success : colors.textSecondary} />
          <Text style={[styles.rateBadgeText, { color: online ? colors.success : colors.textSecondary }]}>
            {online ? t("online") : t("offline")}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <Pressable style={styles.ctaBtn} onPress={() => router.push("/transaction/new")}>
        <View style={styles.ctaInner}>
          <View style={styles.ctaIconWrap}>
            <FontAwesome name="plus" size={18} color={colors.onPrimary} />
          </View>
          <View>
            <Text style={styles.ctaTitle}>{t("home.new.transaction")}</Text>
            <Text style={styles.ctaSub}>{t("home.new.transaction.sub")}</Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={14} color={colors.onPrimary} />
      </Pressable>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={() => router.push("/verify")}>
          <FontAwesome name="check-circle-o" size={20} color={colors.accent} />
          <Text style={styles.quickLabel}>{t("home.verify.receipt")}</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(tabs)/history")}>
          <FontAwesome name="list-ul" size={20} color={colors.accent} />
          <Text style={styles.quickLabel}>{t("home.all.history")}</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(tabs)/analytics")}>
          <FontAwesome name="bar-chart" size={20} color={colors.accent} />
          <Text style={styles.quickLabel}>{t("nav.analytics")}</Text>
        </Pressable>
      </View>

      {/* Monthly summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("home.this.month")}</Text>
        <View style={styles.monthGrid}>
          <MonthStat label={t("home.transactions")} value={String(stats?.monthCount ?? 0)} styles={styles} />
          <MonthStat label={t("home.levy.collected")} value={`$${(stats?.monthLevyUsd ?? 0).toFixed(2)}`} highlight styles={styles} colors={colors} />
          <MonthStat label={t("home.synced")} value={String(stats?.syncedCount ?? 0)} styles={styles} />
          <MonthStat label={t("home.total.alltime")} value={String(stats?.totalCount ?? 0)} styles={styles} />
        </View>
      </View>

      {/* Recent transactions */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.recent")}</Text>
            <Pressable onPress={() => router.push("/(tabs)/history")}>
              <Text style={styles.sectionLink}>{t("home.see.all")}</Text>
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
                  <Text style={styles.recentBadgeText}>{tx.synced ? t("synced") : t("pending")}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Levy info footer */}
      <View style={styles.levyInfo}>
        <FontAwesome name="info-circle" size={12} color={colors.textSecondary} />
        <Text style={styles.levyInfoText}>{t("home.levy.footer")}</Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, iconColor, value, label, styles }: { icon: string; iconColor: string; value: string; label: string; styles: any }) {
  return (
    <View style={styles.statCard}>
      <FontAwesome name={icon as any} size={16} color={iconColor} style={{ marginBottom: 6 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MonthStat({ label, value, highlight, styles, colors }: { label: string; value: string; highlight?: boolean; styles: any; colors?: any }) {
  return (
    <View style={styles.monthStat}>
      <Text style={[styles.monthValue, highlight && { color: colors?.success }]}>{value}</Text>
      <Text style={styles.monthLabel}>{label}</Text>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },

    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    logoCircle: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
      justifyContent: "center", alignItems: "center",
    },
    greeting: { fontSize: 12, color: colors.textSecondary },
    agentName: { fontSize: 17, fontWeight: "700", color: colors.text },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusOnline: { backgroundColor: colors.success },
    statusOffline: { backgroundColor: colors.textSecondary },

    syncBanner: {
      backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warningBorder,
      borderRadius: 12, padding: 12, marginBottom: 16,
    },
    syncRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
    syncText: { color: colors.warning, fontWeight: "600", fontSize: 13 },

    statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    statCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 14,
      padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border,
    },
    statValue: { fontSize: 20, fontWeight: "800", color: colors.text },
    statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: "center" },

    rateCard: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    rateLeft: {},
    rateLabel: { fontSize: 10, color: colors.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
    rateValue: { fontSize: 20, fontWeight: "700", color: colors.success },
    rateBadge: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
    },
    rateBadgeOnline: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
    rateBadgeOffline: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
    rateBadgeText: { fontSize: 11, fontWeight: "600" },

    ctaBtn: {
      backgroundColor: colors.primary, borderRadius: 16, padding: 18, marginBottom: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      borderWidth: 1, borderColor: colors.primary,
    },
    ctaInner: { flexDirection: "row", alignItems: "center", gap: 14 },
    ctaIconWrap: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center",
    },
    ctaTitle: { fontSize: 16, fontWeight: "700", color: colors.onPrimary },
    ctaSub: { fontSize: 11, color: colors.onPrimary, opacity: 0.8, marginTop: 2 },

    quickRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    quickCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 14,
      padding: 14, alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border,
    },
    quickLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: "600", textAlign: "center" },

    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
    sectionLink: { fontSize: 12, color: colors.primary, fontWeight: "600" },

    monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    monthStat: {
      width: "47%", backgroundColor: colors.surface, borderRadius: 12,
      padding: 14, borderWidth: 1, borderColor: colors.border,
    },
    monthValue: { fontSize: 18, fontWeight: "700", color: colors.text },
    monthLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

    recentRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    recentLeft: { flex: 1, marginRight: 12 },
    recentRight: { alignItems: "flex-end" },
    recentChurch: { fontSize: 13, fontWeight: "600", color: colors.text },
    recentMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    recentLevy: { fontSize: 14, fontWeight: "700", color: colors.success },
    recentBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    badgeSynced: { backgroundColor: colors.successBorder },
    badgePending: { backgroundColor: colors.warningBorder },
    recentBadgeText: { fontSize: 9, color: colors.text, fontWeight: "700" },

    levyInfo: {
      flexDirection: "row", alignItems: "center", gap: 6,
      justifyContent: "center", marginTop: 8,
    },
    levyInfoText: { fontSize: 11, color: colors.textSecondary },
  });
}

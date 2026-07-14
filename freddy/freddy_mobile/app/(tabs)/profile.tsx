import { useCallback, useState } from "react";
import {
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
import { AgentProfile, fetchProfile, logout } from "../../lib/api";
import { getLocalStats } from "../../lib/db";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [totalTx, setTotalTx] = useState(0);
  const [totalLevy, setTotalLevy] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    const [prof, stats] = await Promise.all([fetchProfile(), getLocalStats()]);
    setProfile(prof);
    setTotalTx(stats.totalCount);
    setTotalLevy(stats.totalLevyUsd);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleLogout() {
    Alert.alert(t("profile.signout"), t("profile.signout.confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("profile.signout"),
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  const roleLabel: Record<string, string> = {
    agent: t("profile.role.agent"),
    manager: t("profile.role.manager"),
    admin: t("profile.role.admin"),
    auditor: t("profile.role.auditor"),
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={36} color={colors.primary} />
        </View>
        <Text style={styles.name}>{profile?.username ?? "—"}</Text>
        <Text style={styles.role}>{roleLabel[profile?.role ?? ""] ?? profile?.role ?? "Agent"}</Text>
        {profile?.email ? <Text style={styles.email}>{profile.email}</Text> : null}
      </View>

      {/* Agent stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalTx}</Text>
          <Text style={styles.statLabel}>{t("analytics.transactions")}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={[styles.statValue, { color: colors.success }]}>${totalLevy.toFixed(2)}</Text>
          <Text style={styles.statLabel}>{t("profile.levy.raised")}</Text>
        </View>
      </View>

      {/* Assignment info */}
      {(profile?.assigned_station || profile?.managed_company) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("profile.assignment")}</Text>
          {profile.assigned_station && (
            <InfoRow icon="map-marker" label={t("station")} value={profile.assigned_station} colors={colors} styles={styles} />
          )}
          {profile.managed_company && (
            <InfoRow icon="building-o" label={t("company")} value={profile.managed_company} colors={colors} styles={styles} />
          )}
        </View>
      )}

      {/* App section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("profile.quick.actions")}</Text>
        <ActionRow
          icon="qrcode"
          label={t("profile.verify.receipt")}
          sub={t("profile.verify.receipt.sub")}
          onPress={() => router.push("/verify")}
          colors={colors}
          styles={styles}
        />
        <ActionRow
          icon="cog"
          label={t("settings")}
          sub={t("profile.settings.sub")}
          onPress={() => router.push("/settings")}
          colors={colors}
          styles={styles}
        />
        <ActionRow
          icon="cloud-upload"
          label={t("profile.pending.tx")}
          sub={t("profile.pending.tx.sub")}
          onPress={() => router.push("/(tabs)/history")}
          colors={colors}
          styles={styles}
          last
        />
      </View>

      {/* App info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("profile.about")}</Text>
        <InfoRow icon="info-circle" label={t("profile.app")} value="LCI Agent" colors={colors} styles={styles} />
        <InfoRow icon="tag" label={t("profile.version")} value="1.0.0" colors={colors} styles={styles} />
        <InfoRow icon="shield" label={t("profile.levy.rate")} value="2%" colors={colors} styles={styles} />
        <InfoRow icon="globe" label={t("profile.programme")} value="Lubumbashi Charity Fuel Initiative" colors={colors} styles={styles} last />
      </View>

      {/* Sign out */}
      <Pressable
        style={[styles.logoutBtn, loggingOut && { opacity: 0.5 }]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <FontAwesome name="sign-out" size={16} color={colors.error} />
        <Text style={styles.logoutText}>{t("profile.signout")}</Text>
      </Pressable>

      <Text style={styles.footer}>LCI Agent · Offline-capable · Secure</Text>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
  colors,
  styles,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
  colors: any;
  styles: any;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <FontAwesome name={icon as any} size={13} color={colors.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  sub,
  onPress,
  last,
  colors,
  styles,
}: {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
  last?: boolean;
  colors: any;
  styles: any;
}) {
  return (
    <Pressable style={[styles.actionRow, !last && styles.infoRowBorder]} onPress={onPress}>
      <View style={styles.actionIconWrap}>
        <FontAwesome name={icon as any} size={14} color={colors.accent} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <FontAwesome name="chevron-right" size={11} color={colors.textSecondary} />
    </Pressable>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },

    avatarSection: { alignItems: "center", marginBottom: 24, paddingTop: 8 },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.surfaceAlt, borderWidth: 2, borderColor: colors.border,
      justifyContent: "center", alignItems: "center", marginBottom: 12,
    },
    name: { fontSize: 22, fontWeight: "800", color: colors.text },
    role: { fontSize: 13, color: colors.primary, fontWeight: "600", marginTop: 4 },
    email: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },

    statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    statCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      alignItems: "center", borderWidth: 1, borderColor: colors.border,
    },
    statCardGreen: { borderColor: colors.successBorder, backgroundColor: colors.successBg },
    statValue: { fontSize: 22, fontWeight: "800", color: colors.text },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

    card: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      marginBottom: 14, borderWidth: 1, borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 11, fontWeight: "700", color: colors.textSecondary,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
    },

    infoRow: {
      flexDirection: "row", alignItems: "center", paddingVertical: 10,
    },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.background },
    infoIcon: { width: 20, marginRight: 10 },
    infoLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
    infoValue: { fontSize: 13, color: colors.text, fontWeight: "600", maxWidth: "55%" },

    actionRow: {
      flexDirection: "row", alignItems: "center", paddingVertical: 12,
    },
    actionIconWrap: {
      width: 32, height: 32, borderRadius: 8,
      backgroundColor: colors.surfaceAlt, justifyContent: "center", alignItems: "center", marginRight: 12,
    },
    actionText: { flex: 1 },
    actionLabel: { fontSize: 13, color: colors.text, fontWeight: "600" },
    actionSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

    logoutBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 10, backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder,
      borderRadius: 14, padding: 16, marginBottom: 16,
    },
    logoutText: { color: colors.error, fontWeight: "700", fontSize: 15 },

    footer: { textAlign: "center", fontSize: 11, color: colors.textSecondary },
  });
}

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

export default function ProfileScreen() {
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
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
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
    agent: "Field Agent",
    manager: "Station Manager",
    admin: "Administrator",
    auditor: "Auditor",
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={36} color="#3b82f6" />
        </View>
        <Text style={styles.name}>{profile?.username ?? "—"}</Text>
        <Text style={styles.role}>{roleLabel[profile?.role ?? ""] ?? profile?.role ?? "Agent"}</Text>
        {profile?.email ? <Text style={styles.email}>{profile.email}</Text> : null}
      </View>

      {/* Agent stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalTx}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={[styles.statValue, { color: "#34d399" }]}>${totalLevy.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Levy Raised</Text>
        </View>
      </View>

      {/* Assignment info */}
      {(profile?.assigned_station || profile?.managed_company) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assignment</Text>
          {profile.assigned_station && (
            <InfoRow icon="map-marker" label="Station" value={profile.assigned_station} />
          )}
          {profile.managed_company && (
            <InfoRow icon="building-o" label="Company" value={profile.managed_company} />
          )}
        </View>
      )}

      {/* App section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <ActionRow
          icon="qrcode"
          label="Verify a Receipt"
          sub="Check any LCI receipt code"
          onPress={() => router.push("/verify")}
        />
        <ActionRow
          icon="cloud-upload"
          label="View Pending Transactions"
          sub="Records awaiting sync"
          onPress={() => router.push("/(tabs)/history")}
          last
        />
      </View>

      {/* App info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <InfoRow icon="info-circle" label="App" value="LCI Agent" />
        <InfoRow icon="tag" label="Version" value="1.0.0" />
        <InfoRow icon="shield" label="Levy Rate" value="2%" />
        <InfoRow icon="globe" label="Programme" value="Lubumbashi Charity Fuel Initiative" last />
      </View>

      {/* Sign out */}
      <Pressable
        style={[styles.logoutBtn, loggingOut && { opacity: 0.5 }]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <FontAwesome name="sign-out" size={16} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
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
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <FontAwesome name={icon as any} size={13} color="#475569" style={styles.infoIcon} />
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
}: {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.actionRow, !last && styles.infoRowBorder]} onPress={onPress}>
      <View style={styles.actionIconWrap}>
        <FontAwesome name={icon as any} size={14} color="#818cf8" />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <FontAwesome name="chevron-right" size={11} color="#334155" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 20, paddingBottom: 40 },

  avatarSection: { alignItems: "center", marginBottom: 24, paddingTop: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#0f2040", borderWidth: 2, borderColor: "#1e3a5f",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: "800", color: "#f8fafc" },
  role: { fontSize: 13, color: "#3b82f6", fontWeight: "600", marginTop: 4 },
  email: { fontSize: 12, color: "#475569", marginTop: 4 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#111827", borderRadius: 14, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#1e2d45",
  },
  statCardGreen: { borderColor: "#166534", backgroundColor: "#052e16" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#f8fafc" },
  statLabel: { fontSize: 11, color: "#475569", marginTop: 4 },

  card: {
    backgroundColor: "#111827", borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: "#1e2d45",
  },
  cardTitle: {
    fontSize: 11, fontWeight: "700", color: "#334155",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#0a0f1e" },
  infoIcon: { width: 20, marginRight: 10 },
  infoLabel: { flex: 1, fontSize: 13, color: "#64748b" },
  infoValue: { fontSize: 13, color: "#f8fafc", fontWeight: "600", maxWidth: "55%" },

  actionRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
  },
  actionIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#1e2d45", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 13, color: "#e2e8f0", fontWeight: "600" },
  actionSub: { fontSize: 11, color: "#475569", marginTop: 2 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: "#1a0a0a", borderWidth: 1, borderColor: "#3f1a1a",
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },

  footer: { textAlign: "center", fontSize: 11, color: "#1e2d45" },
});

import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { getRecentTxs, OfflineTx } from "../../lib/db";

function TxRow({ item }: { item: OfflineTx }) {
  const date = new Date(item.created_at);
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.church} numberOfLines={1}>{item.church_name}</Text>
        <Text style={styles.details}>{item.fuel_type_name} · {item.currency_used}</Text>
        <Text style={styles.date}>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.levy}>${parseFloat(item.levy_preview).toFixed(4)}</Text>
        <Text style={styles.levyLabel}>levy</Text>
        <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
          <Text style={styles.badgeText}>{item.synced ? "Synced" : "Pending"}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [txs, setTxs] = useState<OfflineTx[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getRecentTxs(50);
    setTxs(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <FlatList
      data={txs}
      keyExtractor={(item) => item.sync_id}
      renderItem={({ item }) => <TxRow item={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      style={styles.list}
      contentContainerStyle={txs.length === 0 ? styles.empty : undefined}
      ListEmptyComponent={
        <View style={styles.emptyInner}>
          <Text style={styles.emptyText}>No transactions yet.</Text>
          <Text style={styles.emptySubtext}>Post your first sale to see it here.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#0f172a" },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#1e293b", marginHorizontal: 16, marginVertical: 4,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#334155",
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowRight: { alignItems: "flex-end" },
  church: { fontWeight: "600", color: "#f1f5f9", fontSize: 14 },
  details: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  date: { color: "#475569", fontSize: 11, marginTop: 4 },
  levy: { fontWeight: "700", color: "#34d399", fontSize: 16 },
  levyLabel: { fontSize: 10, color: "#64748b" },
  badge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeSynced: { backgroundColor: "#14532d" },
  badgePending: { backgroundColor: "#78350f" },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center" },
  emptyInner: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: "#64748b", fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: "#334155", fontSize: 13, marginTop: 6 },
});

import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { getRecentTxs, OfflineTx } from "../../lib/db";

type Filter = "all" | "synced" | "pending";

function TxRow({ item, onPress }: { item: OfflineTx; onPress: () => void }) {
  const date = new Date(item.created_at);
  const levy = parseFloat(item.levy_preview);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <FontAwesome name="tint" size={14} color="#3b82f6" />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.church} numberOfLines={1}>{item.church_name}</Text>
        <Text style={styles.meta}>{item.fuel_type_name} · {item.currency_used}</Text>
        <Text style={styles.date}>
          {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {item.receipt_code ? (
          <Text style={styles.receipt} numberOfLines={1}>{item.receipt_code}</Text>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.levy}>${levy.toFixed(4)}</Text>
        <Text style={styles.levyLabel}>levy</Text>
        <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
          <Text style={styles.badgeText}>{item.synced ? "Synced" : "Pending"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const [allTxs, setAllTxs] = useState<OfflineTx[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getRecentTxs(200);
    setAllTxs(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const displayed = allTxs
    .filter((tx) => {
      if (filter === "synced" && !tx.synced) return false;
      if (filter === "pending" && tx.synced) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          tx.church_name.toLowerCase().includes(q) ||
          tx.fuel_type_name.toLowerCase().includes(q) ||
          (tx.receipt_code ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={13} color="#475569" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search church, fuel, receipt…"
          placeholderTextColor="#334155"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
            <FontAwesome name="times-circle" size={14} color="#475569" />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(["all", "synced", "pending"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.countText}>{displayed.length} records</Text>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.sync_id}
        renderItem={({ item }) => (
          <TxRow
            item={item}
            onPress={() => router.push({ pathname: "/transaction/detail", params: { syncId: item.sync_id } })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        contentContainerStyle={displayed.length === 0 ? styles.empty : { paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <FontAwesome name="inbox" size={40} color="#1e2d45" />
            <Text style={styles.emptyText}>
              {search || filter !== "all" ? "No matching transactions" : "No transactions yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {search || filter !== "all" ? "Try adjusting your search or filter" : "Your first sale will appear here"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1e" },

  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#111827", borderWidth: 1, borderColor: "#1e2d45",
    borderRadius: 12, marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 14, paddingVertical: 12 },
  clearBtn: { padding: 4 },

  filterRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 8, gap: 8,
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#1e2d45", backgroundColor: "#111827",
  },
  chipActive: { backgroundColor: "#1d4ed8", borderColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  countText: { marginLeft: "auto", fontSize: 11, color: "#334155" },

  row: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#111827", marginHorizontal: 16, marginVertical: 4,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#1e2d45",
  },
  rowIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#0f2040", borderWidth: 1, borderColor: "#1e3a5f",
    justifyContent: "center", alignItems: "center", marginRight: 12, marginTop: 2,
  },
  rowBody: { flex: 1, marginRight: 8 },
  rowRight: { alignItems: "flex-end" },

  church: { fontWeight: "700", color: "#f8fafc", fontSize: 14 },
  meta: { color: "#64748b", fontSize: 12, marginTop: 2 },
  date: { color: "#334155", fontSize: 11, marginTop: 3 },
  receipt: { fontSize: 10, color: "#3b82f6", fontFamily: "monospace", marginTop: 3 },

  levy: { fontWeight: "700", color: "#34d399", fontSize: 15 },
  levyLabel: { fontSize: 10, color: "#475569", textAlign: "right" },
  badge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeSynced: { backgroundColor: "#14532d" },
  badgePending: { backgroundColor: "#451a03" },
  badgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },

  empty: { flex: 1, justifyContent: "center" },
  emptyInner: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyText: { color: "#475569", fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: "#1e2d45", fontSize: 13 },
});

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
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

type Filter = "all" | "synced" | "pending";

function TxRow({ item, onPress }: { item: OfflineTx; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const date = new Date(item.created_at);
  const levy = parseFloat(item.levy_preview);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <FontAwesome name="tint" size={14} color={colors.primary} />
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
        <Text style={styles.levyLabel}>{t("history.levy")}</Text>
        <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
          <Text style={styles.badgeText}>{item.synced ? t("synced") : t("pending")}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

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

  const filterLabels: Record<Filter, string> = {
    all: t("history.filter.all"),
    synced: t("history.filter.synced"),
    pending: t("history.filter.pending"),
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={13} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("history.search.placeholder")}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
            <FontAwesome name="times-circle" size={14} color={colors.textSecondary} />
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
              {filterLabels[f]}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.countText}>{displayed.length} {t("history.records")}</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={displayed.length === 0 ? styles.empty : { paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <FontAwesome name="inbox" size={40} color={colors.border} />
            <Text style={styles.emptyText}>
              {search || filter !== "all" ? t("history.empty.nomatch") : t("history.empty.none")}
            </Text>
            <Text style={styles.emptySubtext}>
              {search || filter !== "all" ? t("history.empty.nomatch.sub") : t("history.empty.none.sub")}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    searchWrap: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, marginHorizontal: 16, marginTop: 12, marginBottom: 8,
      paddingHorizontal: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12 },
    clearBtn: { padding: 4 },

    filterRow: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, marginBottom: 8, gap: 8,
    },
    chip: {
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
    chipTextActive: { color: colors.onPrimary },
    countText: { marginLeft: "auto", fontSize: 11, color: colors.textSecondary },

    row: {
      flexDirection: "row", alignItems: "flex-start",
      backgroundColor: colors.surface, marginHorizontal: 16, marginVertical: 4,
      borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border,
    },
    rowIconWrap: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
      justifyContent: "center", alignItems: "center", marginRight: 12, marginTop: 2,
    },
    rowBody: { flex: 1, marginRight: 8 },
    rowRight: { alignItems: "flex-end" },

    church: { fontWeight: "700", color: colors.text, fontSize: 14 },
    meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    date: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
    receipt: { fontSize: 10, color: colors.primary, fontFamily: "monospace", marginTop: 3 },

    levy: { fontWeight: "700", color: colors.success, fontSize: 15 },
    levyLabel: { fontSize: 10, color: colors.textSecondary, textAlign: "right" },
    badge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeSynced: { backgroundColor: colors.successBorder },
    badgePending: { backgroundColor: colors.warningBorder },
    badgeText: { fontSize: 9, color: colors.text, fontWeight: "700" },

    empty: { flex: 1, justifyContent: "center" },
    emptyInner: { alignItems: "center", paddingTop: 80, gap: 10 },
    emptyText: { color: colors.textSecondary, fontSize: 16, fontWeight: "600" },
    emptySubtext: { color: colors.textSecondary, fontSize: 13 },
  });
}

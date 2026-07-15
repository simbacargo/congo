import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTxBySyncId, OfflineTx } from "../../lib/db";
import { printReceipt } from "../../lib/print";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

export default function TransactionDetailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  const { syncId } = useLocalSearchParams<{ syncId: string }>();
  const [tx, setTx] = useState<OfflineTx | null>(null);
  const [loading, setLoading] = useState(true);
  const [cachedRate, setCachedRate] = useState<number>(2800);

  useEffect(() => {
    (async () => {
      const [data, rate] = await Promise.all([
        getTxBySyncId(syncId),
        AsyncStorage.getItem("cached_rate"),
      ]);
      setTx(data);
      if (rate) setCachedRate(parseFloat(rate));
      setLoading(false);
    })();
  }, [syncId]);

  async function handlePrint() {
    if (!tx) return;
    const agent = (await AsyncStorage.getItem("agent_username")) ?? "Agent";
    await printReceipt({
      receiptCode: tx.receipt_code ?? `OFFLINE-${tx.sync_id.slice(0, 8).toUpperCase()}`,
      companyName: tx.company_name ?? "",
      stationName: tx.station_name ?? "",
      churchName: tx.church_name,
      fuelType: tx.fuel_type_name,
      currencyUsed: tx.currency_used,
      amountUsd: tx.amount_usd,
      amountCdf: tx.amount_cdf,
      levyUsd: tx.levy_preview,
      levyCdf: (parseFloat(tx.levy_preview) * cachedRate).toFixed(2),
      agentName: agent,
      date: new Date(tx.created_at).toLocaleString(),
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tx) {
    return (
      <View style={styles.center}>
        <FontAwesome name="exclamation-circle" size={40} color={colors.textSecondary} />
        <Text style={styles.notFound}>{t("detail.not.found")}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>{t("detail.go.back")}</Text>
        </Pressable>
      </View>
    );
  }

  const date = new Date(tx.created_at);
  const levy = parseFloat(tx.levy_preview);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      {/* Status banner */}
      <View style={[styles.statusBanner, tx.synced ? styles.bannerSynced : styles.bannerPending]}>
        <FontAwesome
          name={tx.synced ? "check-circle" : "clock-o"}
          size={16}
          color={tx.synced ? colors.success : colors.warning}
        />
        <Text style={[styles.statusText, { color: tx.synced ? colors.success : colors.warning }]}>
          {tx.synced ? t("detail.synced") : t("detail.pending")}
        </Text>
      </View>

      {/* Receipt code */}
      {tx.receipt_code ? (
        <View style={styles.receiptBox}>
          <Text style={styles.receiptLabel}>{t("receipt.code")}</Text>
          <Text style={styles.receiptCode}>{tx.receipt_code}</Text>
          <Text style={styles.receiptHint}>{t("receipt.verify")}</Text>
        </View>
      ) : (
        <View style={[styles.receiptBox, styles.receiptBoxOffline]}>
          <Text style={styles.receiptLabel}>{t("receipt.local")}</Text>
          <Text style={[styles.receiptCode, { color: colors.warning, fontSize: 14 }]}>
            {`OFFLINE-${tx.sync_id.slice(0, 8).toUpperCase()}`}
          </Text>
          <Text style={styles.receiptHint}>{t("receipt.sync.msg")}</Text>
        </View>
      )}

      {/* Main details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("detail.transaction.details")}</Text>
        <Row label={t("church")} value={tx.church_name} styles={styles} />
        {tx.station_name ? <Row label={t("station")} value={tx.station_name} styles={styles} /> : null}
        {tx.company_name ? <Row label={t("company")} value={tx.company_name} styles={styles} /> : null}
        <Row label={t("fuel.type")} value={tx.fuel_type_name} styles={styles} />
        <Row label={t("newtx.currency")} value={tx.currency_used} styles={styles} />
        <Row label={t("amount.usd")} value={`$${parseFloat(tx.amount_usd).toFixed(2)}`} styles={styles} />
        <Row label={t("amount.cdf")} value={`${parseFloat(tx.amount_cdf).toFixed(0)} FC`} styles={styles} />
        <View style={styles.levyRow}>
          <Text style={styles.levyLabel}>{t("levy")}</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.levyValue}>${levy.toFixed(4)}</Text>
            <Text style={styles.levyCdf}>{(levy * cachedRate).toFixed(2)} FC ({t("detail.est")})</Text>
          </View>
        </View>
      </View>

      {/* Timestamp */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("detail.timestamp")}</Text>
        <Row label={t("detail.date")} value={date.toLocaleDateString()} styles={styles} />
        <Row label={t("detail.time")} value={date.toLocaleTimeString()} styles={styles} last />
      </View>

      {/* Notes */}
      {tx.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("newtx.notes")}</Text>
          <Text style={styles.notesText}>{tx.notes}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <Pressable style={styles.printBtn} onPress={handlePrint}>
        <FontAwesome name="print" size={16} color={colors.onPrimary} />
        <Text style={styles.printBtnText}>{t("receipt.print")}</Text>
      </Pressable>

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>{t("detail.back.history")}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, last, styles }: { label: string; value: string; last?: boolean; styles: any }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", gap: 16 },
    notFound: { color: colors.textSecondary, fontSize: 16, fontWeight: "600" },
    backLink: { padding: 12 },
    backLinkText: { color: colors.primary, fontWeight: "600" },

    statusBanner: {
      flexDirection: "row", alignItems: "center", gap: 8,
      borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1,
    },
    bannerSynced: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
    bannerPending: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
    statusText: { fontSize: 13, fontWeight: "600" },

    receiptBox: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 18,
      alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: colors.border,
    },
    receiptBoxOffline: { borderColor: colors.warningBorder },
    receiptLabel: { fontSize: 10, color: colors.textSecondary, letterSpacing: 1.5, marginBottom: 8 },
    receiptCode: { fontSize: 18, fontWeight: "700", color: colors.primary, letterSpacing: 2, fontFamily: "monospace" },
    receiptHint: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },

    card: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      marginBottom: 14, borderWidth: 1, borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 11, fontWeight: "700", color: colors.textSecondary,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 12,
    },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.background },
    rowLabel: { color: colors.textSecondary, fontSize: 13 },
    rowValue: { color: colors.text, fontWeight: "600", fontSize: 13, textAlign: "right", flex: 1, marginLeft: 12 },

    levyRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: colors.successBg, borderRadius: 8, padding: 12, marginTop: 8,
    },
    levyLabel: { color: colors.success, fontWeight: "700", fontSize: 13 },
    levyValue: { color: colors.success, fontWeight: "700", fontSize: 15 },
    levyCdf: { color: colors.success, fontSize: 11 },

    notesText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },

    printBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 10, backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginBottom: 10,
    },
    printBtnText: { color: colors.onPrimary, fontWeight: "700", fontSize: 16 },
    backBtn: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 16,
      alignItems: "center", borderWidth: 1, borderColor: colors.border,
    },
    backBtnText: { color: colors.textSecondary, fontWeight: "600", fontSize: 14 },
  });
}

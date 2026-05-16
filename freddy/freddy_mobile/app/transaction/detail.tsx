import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function TransactionDetailScreen() {
  const { syncId } = useLocalSearchParams<{ syncId: string }>();
  const [tx, setTx] = useState<OfflineTx | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getTxBySyncId(syncId);
      setTx(data);
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
      levyCdf: (parseFloat(tx.levy_preview) * 2800).toFixed(2),
      agentName: agent,
      date: new Date(tx.created_at).toLocaleString(),
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!tx) {
    return (
      <View style={styles.center}>
        <FontAwesome name="exclamation-circle" size={40} color="#475569" />
        <Text style={styles.notFound}>Transaction not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const date = new Date(tx.created_at);
  const levy = parseFloat(tx.levy_preview);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Status banner */}
      <View style={[styles.statusBanner, tx.synced ? styles.bannerSynced : styles.bannerPending]}>
        <FontAwesome
          name={tx.synced ? "check-circle" : "clock-o"}
          size={16}
          color={tx.synced ? "#4ade80" : "#fbbf24"}
        />
        <Text style={[styles.statusText, { color: tx.synced ? "#4ade80" : "#fbbf24" }]}>
          {tx.synced ? "Synced to server" : "Pending sync — will upload when online"}
        </Text>
      </View>

      {/* Receipt code */}
      {tx.receipt_code ? (
        <View style={styles.receiptBox}>
          <Text style={styles.receiptLabel}>RECEIPT CODE</Text>
          <Text style={styles.receiptCode}>{tx.receipt_code}</Text>
          <Text style={styles.receiptHint}>Present to NGO for verification</Text>
        </View>
      ) : (
        <View style={[styles.receiptBox, styles.receiptBoxOffline]}>
          <Text style={styles.receiptLabel}>LOCAL REFERENCE</Text>
          <Text style={[styles.receiptCode, { color: "#fbbf24", fontSize: 14 }]}>
            {`OFFLINE-${tx.sync_id.slice(0, 8).toUpperCase()}`}
          </Text>
          <Text style={styles.receiptHint}>Receipt code assigned after sync</Text>
        </View>
      )}

      {/* Main details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transaction Details</Text>
        <Row label="Church" value={tx.church_name} />
        {tx.station_name ? <Row label="Station" value={tx.station_name} /> : null}
        {tx.company_name ? <Row label="Company" value={tx.company_name} /> : null}
        <Row label="Fuel Type" value={tx.fuel_type_name} />
        <Row label="Currency" value={tx.currency_used} />
        <Row label="Amount (USD)" value={`$${parseFloat(tx.amount_usd).toFixed(2)}`} />
        <Row label="Amount (CDF)" value={`${parseFloat(tx.amount_cdf).toFixed(0)} FC`} />
        <View style={styles.levyRow}>
          <Text style={styles.levyLabel}>2% Charity Levy</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.levyValue}>${levy.toFixed(4)}</Text>
            <Text style={styles.levyCdf}>{(levy * 2800).toFixed(2)} FC (est.)</Text>
          </View>
        </View>
      </View>

      {/* Timestamp */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timestamp</Text>
        <Row label="Date" value={date.toLocaleDateString()} />
        <Row label="Time" value={date.toLocaleTimeString()} last />
      </View>

      {/* Notes */}
      {tx.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notesText}>{tx.notes}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <Pressable style={styles.printBtn} onPress={handlePrint}>
        <FontAwesome name="print" size={16} color="#fff" />
        <Text style={styles.printBtnText}>Print Receipt</Text>
      </Pressable>

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back to History</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: "#0a0f1e", justifyContent: "center", alignItems: "center", gap: 16 },
  notFound: { color: "#64748b", fontSize: 16, fontWeight: "600" },
  backLink: { padding: 12 },
  backLinkText: { color: "#3b82f6", fontWeight: "600" },

  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1,
  },
  bannerSynced: { backgroundColor: "#052e16", borderColor: "#166534" },
  bannerPending: { backgroundColor: "#451a03", borderColor: "#78350f" },
  statusText: { fontSize: 13, fontWeight: "600" },

  receiptBox: {
    backgroundColor: "#111827", borderRadius: 14, padding: 18,
    alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: "#1e3a5f",
  },
  receiptBoxOffline: { borderColor: "#78350f" },
  receiptLabel: { fontSize: 10, color: "#334155", letterSpacing: 1.5, marginBottom: 8 },
  receiptCode: { fontSize: 18, fontWeight: "700", color: "#60a5fa", letterSpacing: 2, fontFamily: "monospace" },
  receiptHint: { fontSize: 11, color: "#475569", marginTop: 6 },

  card: {
    backgroundColor: "#111827", borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: "#1e2d45",
  },
  cardTitle: {
    fontSize: 11, fontWeight: "700", color: "#334155",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#0a0f1e" },
  rowLabel: { color: "#64748b", fontSize: 13 },
  rowValue: { color: "#f8fafc", fontWeight: "600", fontSize: 13, textAlign: "right", flex: 1, marginLeft: 12 },

  levyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#052e16", borderRadius: 8, padding: 12, marginTop: 8,
  },
  levyLabel: { color: "#4ade80", fontWeight: "700", fontSize: 13 },
  levyValue: { color: "#34d399", fontWeight: "700", fontSize: 15 },
  levyCdf: { color: "#86efac", fontSize: 11 },

  notesText: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },

  printBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: "#1e40af", borderRadius: 12, padding: 16, marginBottom: 10,
  },
  printBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backBtn: {
    backgroundColor: "#111827", borderRadius: 12, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#1e2d45",
  },
  backBtnText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
});

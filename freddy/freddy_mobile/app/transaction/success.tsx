import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { printReceipt } from "../../lib/print";

export default function SuccessScreen() {
  const params = useLocalSearchParams<{
    receiptCode: string;
    levyUsd: string;
    levyCdf: string;
    churchName: string;
    stationName: string;
    companyName: string;
    fuelType: string;
    currency: string;
    amountUsd: string;
    amountCdf: string;
    offline?: string;
  }>();

  const isOffline = params.offline === "true";

  async function handlePrint() {
    const agent = await AsyncStorage.getItem("agent_username") ?? "Agent";
    await printReceipt({
      receiptCode: params.receiptCode,
      companyName: params.companyName,
      stationName: params.stationName,
      churchName: params.churchName,
      fuelType: params.fuelType,
      currencyUsed: params.currency,
      amountUsd: params.amountUsd,
      amountCdf: params.amountCdf,
      levyUsd: params.levyUsd,
      levyCdf: params.levyCdf,
      agentName: agent,
      date: new Date().toLocaleString(),
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Icon */}
      <View style={[styles.iconCircle, isOffline && styles.iconCircleOffline]}>
        <Text style={styles.icon}>{isOffline ? "📦" : "✓"}</Text>
      </View>
      <Text style={styles.title}>{isOffline ? "Saved Offline" : "Transaction Posted!"}</Text>
      <Text style={styles.subtitle}>
        {isOffline
          ? "No internet connection. This transaction is saved locally and will sync when you're back online."
          : "Transaction has been recorded and verified."}
      </Text>

      {/* Receipt Code */}
      <View style={styles.receiptBox}>
        <Text style={styles.receiptLabel}>Receipt Code</Text>
        <Text style={styles.receiptCode}>{params.receiptCode}</Text>
        {!isOffline && <Text style={styles.receiptHint}>Present this code for NGO verification</Text>}
      </View>

      {/* Details */}
      <View style={styles.detailsCard}>
        <DetailRow label="Company" value={params.companyName} />
        {params.stationName ? <DetailRow label="Station" value={params.stationName} /> : null}
        <DetailRow label="Church" value={params.churchName} />
        <DetailRow label="Fuel Type" value={params.fuelType} />
        <DetailRow label="Amount (USD)" value={`$${parseFloat(params.amountUsd).toFixed(2)}`} />
        <DetailRow label="Amount (CDF)" value={`${parseFloat(params.amountCdf).toFixed(0)} FC`} />
        <View style={styles.levyRow}>
          <Text style={styles.levyLabel}>2% Charity Levy</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.levyValue}>${parseFloat(params.levyUsd).toFixed(4)}</Text>
            <Text style={styles.levyCdf}>{parseFloat(params.levyCdf).toFixed(2)} FC</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <Pressable style={styles.printBtn} onPress={handlePrint}>
        <Text style={styles.printBtnText}>Print Receipt</Text>
      </Pressable>

      <Pressable style={styles.doneBtn} onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.doneBtnText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 24, alignItems: "center" },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#14532d",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  iconCircleOffline: { backgroundColor: "#7c2d12" },
  icon: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: "700", color: "#f1f5f9", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginTop: 8, lineHeight: 20, maxWidth: 300 },

  receiptBox: {
    backgroundColor: "#1e293b", borderRadius: 14, padding: 18, width: "100%",
    alignItems: "center", marginTop: 24, borderWidth: 1, borderColor: "#334155",
  },
  receiptLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  receiptCode: { fontSize: 18, fontWeight: "700", color: "#60a5fa", letterSpacing: 2, fontFamily: "monospace" },
  receiptHint: { fontSize: 11, color: "#475569", marginTop: 6 },

  detailsCard: {
    backgroundColor: "#1e293b", borderRadius: 14, padding: 18, width: "100%",
    marginTop: 16, borderWidth: 1, borderColor: "#334155",
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#0f172a",
  },
  detailLabel: { color: "#64748b", fontSize: 13 },
  detailValue: { color: "#f1f5f9", fontWeight: "600", fontSize: 13 },
  levyRow: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#052e16", borderRadius: 8, padding: 12, marginTop: 8,
  },
  levyLabel: { color: "#4ade80", fontWeight: "700" },
  levyValue: { color: "#34d399", fontWeight: "700", fontSize: 15 },
  levyCdf: { color: "#86efac", fontSize: 11 },

  printBtn: {
    backgroundColor: "#1e40af", borderRadius: 12, padding: 16,
    width: "100%", alignItems: "center", marginTop: 20,
  },
  printBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  doneBtn: {
    backgroundColor: "#1e293b", borderRadius: 12, padding: 16,
    width: "100%", alignItems: "center", marginTop: 12,
    borderWidth: 1, borderColor: "#334155",
  },
  doneBtnText: { color: "#94a3b8", fontWeight: "600", fontSize: 16 },
});

import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NoPrinterError, printReceipt } from "../../lib/print";

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
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    setPrinting(true);
    try {
      const agent = (await AsyncStorage.getItem("agent_username")) ?? "Agent";
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
    } catch (e) {
      if (e instanceof NoPrinterError) {
        Alert.alert(
          "No Printer Selected",
          "Choose your Bluetooth thermal printer, then print again.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Select Printer", onPress: () => router.push("/settings/printer") },
          ],
        );
      } else {
        Alert.alert(
          "Print Failed",
          (e as Error)?.message ?? "Could not reach the printer. Check it is on and in range.",
        );
      }
    } finally {
      setPrinting(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={[styles.iconCircle, isOffline && styles.iconCircleOffline]}>
        <FontAwesome
          name={isOffline ? "cloud-upload" : "check"}
          size={36}
          color={isOffline ? "#fbbf24" : "#4ade80"}
        />
      </View>
      <Text style={styles.title}>{isOffline ? "Saved Offline" : "Transaction Posted"}</Text>
      <Text style={styles.subtitle}>
        {isOffline
          ? "No connection — saved locally and will sync automatically when you're back online."
          : "Transaction recorded and submitted to the LCI server."}
      </Text>

      {/* Receipt code */}
      <View style={[styles.receiptBox, isOffline && styles.receiptBoxOffline]}>
        <Text style={styles.receiptLabel}>{isOffline ? "LOCAL REFERENCE" : "RECEIPT CODE"}</Text>
        <Text style={[styles.receiptCode, isOffline && { color: "#fbbf24", fontSize: 15 }]}>
          {params.receiptCode}
        </Text>
        {!isOffline && <Text style={styles.receiptHint}>Present to NGO for verification</Text>}
        {isOffline && <Text style={styles.receiptHint}>Receipt code assigned after sync</Text>}
      </View>

      {/* Details card */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsCardTitle}>Transaction Summary</Text>
        {params.companyName ? <DetailRow label="Company" value={params.companyName} /> : null}
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
      <Pressable style={[styles.printBtn, printing && { opacity: 0.6 }]} onPress={handlePrint} disabled={printing}>
        {printing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome name="print" size={16} color="#fff" />
            <Text style={styles.printBtnText}>Print Receipt</Text>
          </>
        )}
      </Pressable>

      <Pressable style={styles.doneBtn} onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.doneBtnText}>Back to Home</Text>
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
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 24, alignItems: "center", paddingBottom: 40 },

  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#052e16", borderWidth: 2, borderColor: "#166534",
    justifyContent: "center", alignItems: "center", marginBottom: 18,
  },
  iconCircleOffline: { backgroundColor: "#451a03", borderColor: "#78350f" },

  title: { fontSize: 24, fontWeight: "800", color: "#f8fafc", textAlign: "center", marginBottom: 8 },
  subtitle: {
    fontSize: 13, color: "#64748b", textAlign: "center",
    lineHeight: 20, maxWidth: 300, marginBottom: 24,
  },

  receiptBox: {
    backgroundColor: "#111827", borderRadius: 14, padding: 18, width: "100%",
    alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#1e3a5f",
  },
  receiptBoxOffline: { borderColor: "#78350f" },
  receiptLabel: { fontSize: 10, color: "#334155", letterSpacing: 1.5, marginBottom: 8 },
  receiptCode: { fontSize: 18, fontWeight: "700", color: "#60a5fa", letterSpacing: 2, fontFamily: "monospace" },
  receiptHint: { fontSize: 11, color: "#475569", marginTop: 6 },

  detailsCard: {
    backgroundColor: "#111827", borderRadius: 14, padding: 18, width: "100%",
    marginBottom: 20, borderWidth: 1, borderColor: "#1e2d45",
  },
  detailsCardTitle: {
    fontSize: 11, fontWeight: "700", color: "#334155",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#0a0f1e",
  },
  detailLabel: { color: "#64748b", fontSize: 13 },
  detailValue: { color: "#f8fafc", fontWeight: "600", fontSize: 13 },

  levyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#052e16", borderRadius: 8, padding: 12, marginTop: 8,
  },
  levyLabel: { color: "#4ade80", fontWeight: "700", fontSize: 13 },
  levyValue: { color: "#34d399", fontWeight: "700", fontSize: 16 },
  levyCdf: { color: "#86efac", fontSize: 11 },

  printBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: "#1e40af", borderRadius: 14, padding: 16,
    width: "100%", marginBottom: 10,
  },
  printBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  doneBtn: {
    backgroundColor: "#111827", borderRadius: 14, padding: 16, width: "100%",
    alignItems: "center", borderWidth: 1, borderColor: "#1e2d45",
  },
  doneBtnText: { color: "#64748b", fontWeight: "600", fontSize: 15 },
});

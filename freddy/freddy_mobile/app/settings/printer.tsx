import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import type { BluetoothDevice } from "react-native-bluetooth-classic";
import {
  SavedPrinter,
  clearSavedPrinter,
  getSavedPrinter,
  listPairedPrinters,
  savePrinter,
} from "../../lib/printer";
import { printReceipt } from "../../lib/print";

export default function PrinterSettingsScreen() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [saved, setSaved] = useState<SavedPrinter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, current] = await Promise.all([
        listPairedPrinters(),
        getSavedPrinter(),
      ]);
      setDevices(list);
      setSaved(current);
    } catch (e: any) {
      setError(e?.message ?? "Could not list Bluetooth devices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function select(device: BluetoothDevice) {
    const printer = { address: device.address, name: device.name || device.address };
    await savePrinter(printer);
    setSaved(printer);
    Alert.alert("Printer Set", `${printer.name} will be used for receipts.`);
  }

  async function forget() {
    await clearSavedPrinter();
    setSaved(null);
  }

  async function testPrint() {
    setTesting(true);
    try {
      await printReceipt({
        receiptCode: "LCI-TEST-0000-DEMO",
        companyName: "Test Company",
        stationName: "Test Station",
        churchName: "Test Church",
        fuelType: "Diesel",
        currencyUsed: "USD",
        amountUsd: "20.00",
        amountCdf: "56000",
        levyUsd: "0.4000",
        levyCdf: "1120.00",
        agentName: "Test Agent",
        date: new Date().toLocaleString(),
      });
    } catch (e: any) {
      Alert.alert("Print Failed", e?.message ?? "Could not reach the printer.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Pair your 58mm thermal printer in Android Bluetooth settings first, then
        select it below. Receipts print directly to this printer.
      </Text>

      {saved && (
        <View style={styles.savedCard}>
          <View style={styles.savedIcon}>
            <FontAwesome name="print" size={18} color="#34d399" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.savedLabel}>ACTIVE PRINTER</Text>
            <Text style={styles.savedName}>{saved.name}</Text>
            <Text style={styles.savedAddr}>{saved.address}</Text>
          </View>
        </View>
      )}

      {saved && (
        <View style={styles.actionRow}>
          <Pressable style={styles.testBtn} onPress={testPrint} disabled={testing}>
            {testing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="print" size={14} color="#fff" />
                <Text style={styles.testBtnText}>Test Print</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.forgetBtn} onPress={forget}>
            <Text style={styles.forgetBtnText}>Forget</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Paired Devices</Text>
        <Pressable onPress={load} hitSlop={10}>
          <FontAwesome name="refresh" size={15} color="#3b82f6" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#3b82f6" />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <FontAwesome name="exclamation-triangle" size={16} color="#fbbf24" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : devices.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            No paired Bluetooth devices found. Pair your printer in Android
            Settings, then tap refresh.
          </Text>
        </View>
      ) : (
        devices.map((d) => {
          const isActive = saved?.address === d.address;
          return (
            <Pressable
              key={d.address}
              style={[styles.deviceRow, isActive && styles.deviceRowActive]}
              onPress={() => select(d)}
            >
              <FontAwesome
                name="bluetooth-b"
                size={16}
                color={isActive ? "#34d399" : "#64748b"}
                style={{ width: 22 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{d.name || "Unknown device"}</Text>
                <Text style={styles.deviceAddr}>{d.address}</Text>
              </View>
              {isActive && <FontAwesome name="check" size={15} color="#34d399" />}
            </Pressable>
          );
        })
      )}

      <Pressable style={styles.doneBtn} onPress={() => router.back()}>
        <Text style={styles.doneBtnText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 20, paddingBottom: 40 },

  intro: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 20 },

  savedCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#052e16", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#166534", marginBottom: 12,
  },
  savedIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#04270f",
    justifyContent: "center", alignItems: "center",
  },
  savedLabel: { fontSize: 10, color: "#4ade80", letterSpacing: 1.5 },
  savedName: { fontSize: 16, fontWeight: "700", color: "#f8fafc", marginTop: 2 },
  savedAddr: { fontSize: 11, color: "#4b7f5e", marginTop: 2, fontFamily: "monospace" },

  actionRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  testBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#1e40af", borderRadius: 12, padding: 14,
  },
  testBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  forgetBtn: {
    borderRadius: 12, padding: 14, paddingHorizontal: 20,
    backgroundColor: "#1a0a0a", borderWidth: 1, borderColor: "#3f1a1a",
  },
  forgetBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },

  listHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: "#334155",
    letterSpacing: 1, textTransform: "uppercase",
  },

  centerBox: { padding: 24, alignItems: "center" },
  emptyText: { color: "#475569", fontSize: 13, textAlign: "center", lineHeight: 20 },

  errorBox: {
    backgroundColor: "#1c1408", borderRadius: 12, padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: "#78350f", gap: 8,
  },
  errorText: { color: "#fbbf24", fontSize: 13, textAlign: "center", lineHeight: 19 },
  retryBtn: {
    marginTop: 4, backgroundColor: "#78350f", borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 20,
  },
  retryText: { color: "#fde68a", fontWeight: "600" },

  deviceRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#1e2d45",
  },
  deviceRowActive: { borderColor: "#166534", backgroundColor: "#0a1f12" },
  deviceName: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  deviceAddr: { fontSize: 11, color: "#475569", marginTop: 2, fontFamily: "monospace" },

  doneBtn: {
    marginTop: 20, backgroundColor: "#111827", borderRadius: 14, padding: 16,
    alignItems: "center", borderWidth: 1, borderColor: "#1e2d45",
  },
  doneBtnText: { color: "#94a3b8", fontWeight: "700", fontSize: 15 },
});

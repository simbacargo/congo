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
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

export default function PrinterSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

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
      setError(e?.message ?? t("printer.list.error"));
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
    Alert.alert(t("printer.set"), `${printer.name} ${t("printer.set.body")}`);
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
      Alert.alert(t("printer.print.failed"), e?.message ?? t("printer.print.failed.body"));
    } finally {
      setTesting(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{t("printer.intro")}</Text>

      {saved && (
        <View style={styles.savedCard}>
          <View style={styles.savedIcon}>
            <FontAwesome name="print" size={18} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.savedLabel}>{t("printer.active")}</Text>
            <Text style={styles.savedName}>{saved.name}</Text>
            <Text style={styles.savedAddr}>{saved.address}</Text>
          </View>
        </View>
      )}

      {saved && (
        <View style={styles.actionRow}>
          <Pressable style={styles.testBtn} onPress={testPrint} disabled={testing}>
            {testing ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <FontAwesome name="print" size={14} color={colors.onPrimary} />
                <Text style={styles.testBtnText}>{t("printer.test")}</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.forgetBtn} onPress={forget}>
            <Text style={styles.forgetBtnText}>{t("printer.forget")}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>{t("printer.paired.devices")}</Text>
        <Pressable onPress={load} hitSlop={10}>
          <FontAwesome name="refresh" size={15} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <FontAwesome name="exclamation-triangle" size={16} color={colors.warning} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>{t("printer.retry")}</Text>
          </Pressable>
        </View>
      ) : devices.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>{t("printer.no.devices")}</Text>
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
                color={isActive ? colors.success : colors.textSecondary}
                style={{ width: 22 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{d.name || t("printer.unknown.device")}</Text>
                <Text style={styles.deviceAddr}>{d.address}</Text>
              </View>
              {isActive && <FontAwesome name="check" size={15} color={colors.success} />}
            </Pressable>
          );
        })
      )}

      <Pressable style={styles.doneBtn} onPress={() => router.back()}>
        <Text style={styles.doneBtnText}>{t("printer.done")}</Text>
      </Pressable>
    </ScrollView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },

    intro: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 },

    savedCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.successBg, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.successBorder, marginBottom: 12,
    },
    savedIcon: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.successBg,
      justifyContent: "center", alignItems: "center",
    },
    savedLabel: { fontSize: 10, color: colors.success, letterSpacing: 1.5 },
    savedName: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 2 },
    savedAddr: { fontSize: 11, color: colors.success, marginTop: 2, fontFamily: "monospace" },

    actionRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    testBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, backgroundColor: colors.primary, borderRadius: 12, padding: 14,
    },
    testBtnText: { color: colors.onPrimary, fontWeight: "700", fontSize: 14 },
    forgetBtn: {
      borderRadius: 12, padding: 14, paddingHorizontal: 20,
      backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder,
    },
    forgetBtnText: { color: colors.error, fontWeight: "600", fontSize: 14 },

    listHeaderRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 11, fontWeight: "700", color: colors.textSecondary,
      letterSpacing: 1, textTransform: "uppercase",
    },

    centerBox: { padding: 24, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20 },

    errorBox: {
      backgroundColor: colors.warningBg, borderRadius: 12, padding: 16, alignItems: "center",
      borderWidth: 1, borderColor: colors.warningBorder, gap: 8,
    },
    errorText: { color: colors.warning, fontSize: 13, textAlign: "center", lineHeight: 19 },
    retryBtn: {
      marginTop: 4, backgroundColor: colors.warningBorder, borderRadius: 8,
      paddingVertical: 8, paddingHorizontal: 20,
    },
    retryText: { color: colors.text, fontWeight: "600" },

    deviceRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    deviceRowActive: { borderColor: colors.successBorder, backgroundColor: colors.successBg },
    deviceName: { fontSize: 14, fontWeight: "600", color: colors.text },
    deviceAddr: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontFamily: "monospace" },

    doneBtn: {
      marginTop: 20, backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      alignItems: "center", borderWidth: 1, borderColor: colors.border,
    },
    doneBtnText: { color: colors.textSecondary, fontWeight: "700", fontSize: 15 },
  });
}

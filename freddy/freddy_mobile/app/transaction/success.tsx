import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NoPrinterError, printReceipt } from "../../lib/print";
import ReceiptPreview from "../../lib/ReceiptPreview";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

export default function SuccessScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
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
  const [agentName, setAgentName] = useState("Agent");

  useEffect(() => {
    AsyncStorage.getItem("agent_username").then((name) => {
      if (name) setAgentName(name);
    });
  }, []);

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

  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      {/* Status */}
      <View style={[styles.iconCircle, isOffline && styles.iconCircleOffline]}>
        <FontAwesome
          name={isOffline ? "cloud-upload" : "check"}
          size={36}
          color={isOffline ? colors.warning : colors.success}
        />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {isOffline ? t("transaction.offline") : t("transaction.success")}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isOffline ? t("transaction.offline.msg") : t("transaction.posted")}
      </Text>

      {/* Receipt code */}
      <View style={[styles.receiptBox, isOffline && styles.receiptBoxOffline, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
          {isOffline ? t("receipt.local") : t("receipt.code")}
        </Text>
        <Text style={[styles.receiptCode, isOffline && { color: colors.warning, fontSize: 15 }, { color: colors.primary }]}>
          {params.receiptCode}
        </Text>
        {!isOffline && <Text style={[styles.receiptHint, { color: colors.textSecondary }]}>{t("receipt.verify")}</Text>}
        {isOffline && <Text style={[styles.receiptHint, { color: colors.textSecondary }]}>{t("receipt.sync.msg")}</Text>}
      </View>

      {/* Receipt Preview */}
      <View style={styles.previewSection}>
        <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>{t("receipt.preview")}</Text>
        <ReceiptPreview
          receiptCode={params.receiptCode}
          companyName={params.companyName}
          stationName={params.stationName}
          churchName={params.churchName}
          fuelType={params.fuelType}
          currencyUsed={params.currency}
          amountUsd={params.amountUsd}
          amountCdf={params.amountCdf}
          levyUsd={params.levyUsd}
          levyCdf={params.levyCdf}
          agentName={agentName}
        />
      </View>

      {/* Details card */}
      <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.detailsCardTitle, { color: colors.textSecondary }]}>
          {t("transaction.summary")}
        </Text>
        {params.companyName ? <DetailRow label={t("company")} value={params.companyName} colors={colors} /> : null}
        {params.stationName ? <DetailRow label={t("station")} value={params.stationName} colors={colors} /> : null}
        <DetailRow label={t("church")} value={params.churchName} colors={colors} />
        <DetailRow label={t("fuel.type")} value={params.fuelType} colors={colors} />
        <DetailRow label={t("amount.usd")} value={`$${parseFloat(params.amountUsd).toFixed(2)}`} colors={colors} />
        <DetailRow label={t("amount.cdf")} value={`${parseFloat(params.amountCdf).toFixed(0)} FC`} colors={colors} />
        <View style={[styles.levyRow, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.levyLabel, { color: colors.success }]}>{t("levy")}</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.levyValue, { color: colors.success }]}>${parseFloat(params.levyUsd).toFixed(4)}</Text>
            <Text style={[styles.levyCdf, { color: colors.success }]}>{parseFloat(params.levyCdf).toFixed(2)} FC</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <Pressable style={[styles.printBtn, printing && { opacity: 0.6 }, { backgroundColor: colors.primary }]} onPress={handlePrint} disabled={printing}>
        {printing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome name="print" size={16} color="#fff" />
            <Text style={styles.printBtnText}>{t("receipt.print")}</Text>
          </>
        )}
      </Pressable>

      <Pressable style={[styles.doneBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.replace("/(tabs)")}>
        <Text style={[styles.doneBtnText, { color: colors.textSecondary }]}>{t("back")}</Text>
      </Pressable>
    </ScrollView>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  const styles = getDetailRowStyles(colors);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getDetailRowStyles(colors: any) {
  return StyleSheet.create({
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: { color: colors.textSecondary, fontSize: 13 },
    detailValue: { color: colors.text, fontWeight: "600", fontSize: 13 },
  });
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, alignItems: "center", paddingBottom: 40 },

    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 2,
      borderColor: colors.success,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
    iconCircleOffline: { borderColor: colors.warning },

    title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
    subtitle: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
      maxWidth: 300,
      marginBottom: 24,
    },

    receiptBox: {
      borderRadius: 14,
      padding: 18,
      width: "100%",
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 1,
    },
    receiptBoxOffline: {},
    receiptLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
    receiptCode: { fontSize: 18, fontWeight: "700", letterSpacing: 2, fontFamily: "monospace" },
    receiptHint: { fontSize: 11, marginTop: 6 },

    previewSection: { width: "100%", marginBottom: 20 },
    previewTitle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 12,
    },

    detailsCard: {
      borderRadius: 14,
      padding: 18,
      width: "100%",
      marginBottom: 20,
      borderWidth: 1,
    },
    detailsCardTitle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 12,
    },

    levyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    levyLabel: { fontWeight: "700", fontSize: 13 },
    levyValue: { fontWeight: "700", fontSize: 16 },
    levyCdf: { fontSize: 11 },

    printBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 14,
      padding: 16,
      width: "100%",
      marginBottom: 10,
    },
    printBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    doneBtn: {
      borderRadius: 14,
      padding: 16,
      width: "100%",
      alignItems: "center",
      borderWidth: 1,
    },
    doneBtnText: { fontWeight: "600", fontSize: 15 },
  });
}

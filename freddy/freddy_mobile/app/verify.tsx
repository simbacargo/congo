import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { verifyReceipt } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import { useLanguage } from "../lib/LanguageContext";

interface VerifyResult {
  receipt_code: string;
  station: string;
  company: string;
  church: string;
  amount_usd: string;
  levy_usd: string;
  status: string;
  created_at: string;
  valid: boolean;
}

export default function VerifyScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  async function handleVerify() {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const data = (await verifyReceipt(code.trim().toUpperCase())) as VerifyResult;
      setResult(data);
    } catch {
      setError(t("verify.not.found"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.iconWrap}>
          <FontAwesome name="check-circle-o" size={32} color={colors.accent} />
        </View>
        <Text style={styles.title}>{t("verify.title")}</Text>
        <Text style={styles.subtitle}>{t("verify.subtitle")}</Text>

        {/* Input */}
        <View style={styles.inputWrap}>
          <FontAwesome name="barcode" size={16} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. LCI-A3F2-B1C4-D5E6"
            placeholderTextColor={colors.textSecondary}
            value={code}
            onChangeText={(txt) => { setCode(txt); setError(""); setResult(null); }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleVerify}
          />
          {code.length > 0 && (
            <Pressable onPress={() => { setCode(""); setError(""); setResult(null); }}>
              <FontAwesome name="times-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.btn, (!code.trim() || loading) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={!code.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <View style={styles.btnInner}>
              <FontAwesome name="search" size={14} color={colors.onPrimary} />
              <Text style={styles.btnText}>{t("verify.title")}</Text>
            </View>
          )}
        </Pressable>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <FontAwesome name="exclamation-circle" size={14} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.validHeader}>
              <View style={styles.validIconWrap}>
                <FontAwesome name="check" size={18} color={colors.success} />
              </View>
              <View>
                <Text style={styles.validTitle}>{t("verify.valid")}</Text>
                <Text style={styles.validSub}>{t("verify.valid.sub")}</Text>
              </View>
            </View>

            <View style={styles.receiptCodeBox}>
              <Text style={styles.receiptCodeLabel}>{t("receipt.code")}</Text>
              <Text style={styles.receiptCodeValue}>{result.receipt_code}</Text>
            </View>

            <Row label={t("company")} value={result.company} styles={styles} />
            <Row label={t("station")} value={result.station} styles={styles} />
            <Row label={t("church")} value={result.church} styles={styles} />
            <Row label={t("verify.amount")} value={`$${parseFloat(result.amount_usd).toFixed(2)}`} styles={styles} />
            <Row label={t("levy")} value={`$${parseFloat(result.levy_usd).toFixed(4)}`} highlight styles={styles} colors={colors} />
            <Row label={t("verify.status")} value={result.status} styles={styles} />
            <Row label={t("detail.date")} value={new Date(result.created_at).toLocaleString()} styles={styles} last />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({
  label,
  value,
  highlight,
  last,
  styles,
  colors,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
  styles: any;
  colors?: any;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color: colors?.success }]}>{value}</Text>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 40 },

    iconWrap: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
      justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16,
    },
    title: { fontSize: 22, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 6 },
    subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 28 },

    inputWrap: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1, color: colors.text, fontSize: 15, paddingVertical: 13,
      letterSpacing: 1,
    },

    btn: {
      backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 16,
    },
    btnDisabled: { opacity: 0.4 },
    btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
    btnText: { color: colors.onPrimary, fontWeight: "700", fontSize: 16 },

    errorBox: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.dangerBg, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: colors.dangerBorder,
    },
    errorText: { color: colors.error, fontSize: 13 },

    resultCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: colors.successBorder, marginTop: 8,
    },
    validHeader: {
      flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16,
    },
    validIconWrap: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.successBg, justifyContent: "center", alignItems: "center",
    },
    validTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    validSub: { fontSize: 12, color: colors.success, marginTop: 2 },

    receiptCodeBox: {
      backgroundColor: colors.background, borderRadius: 10, padding: 12,
      alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    receiptCodeLabel: { fontSize: 10, color: colors.textSecondary, letterSpacing: 1.5, marginBottom: 6 },
    receiptCodeValue: {
      fontSize: 16, fontWeight: "700", color: colors.primary,
      letterSpacing: 2, fontFamily: "monospace",
    },

    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.background },
    rowLabel: { color: colors.textSecondary, fontSize: 13 },
    rowValue: { color: colors.text, fontWeight: "600", fontSize: 13, textAlign: "right", flex: 1, marginLeft: 12 },
  });
}

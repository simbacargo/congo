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
      setError("Receipt not found. Check the code and try again.");
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
          <FontAwesome name="check-circle-o" size={32} color="#818cf8" />
        </View>
        <Text style={styles.title}>Verify Receipt</Text>
        <Text style={styles.subtitle}>Enter the LCI receipt code to confirm a transaction is authentic</Text>

        {/* Input */}
        <View style={styles.inputWrap}>
          <FontAwesome name="barcode" size={16} color="#475569" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. LCI-A3F2-B1C4-D5E6"
            placeholderTextColor="#334155"
            value={code}
            onChangeText={(t) => { setCode(t); setError(""); setResult(null); }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleVerify}
          />
          {code.length > 0 && (
            <Pressable onPress={() => { setCode(""); setError(""); setResult(null); }}>
              <FontAwesome name="times-circle" size={16} color="#475569" />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.btn, (!code.trim() || loading) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={!code.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.btnInner}>
              <FontAwesome name="search" size={14} color="#fff" />
              <Text style={styles.btnText}>Verify Receipt</Text>
            </View>
          )}
        </Pressable>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <FontAwesome name="exclamation-circle" size={14} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.validHeader}>
              <View style={styles.validIconWrap}>
                <FontAwesome name="check" size={18} color="#4ade80" />
              </View>
              <View>
                <Text style={styles.validTitle}>Valid Receipt</Text>
                <Text style={styles.validSub}>This transaction is authentic</Text>
              </View>
            </View>

            <View style={styles.receiptCodeBox}>
              <Text style={styles.receiptCodeLabel}>RECEIPT CODE</Text>
              <Text style={styles.receiptCodeValue}>{result.receipt_code}</Text>
            </View>

            <Row label="Company" value={result.company} />
            <Row label="Station" value={result.station} />
            <Row label="Church" value={result.church} />
            <Row label="Amount" value={`$${parseFloat(result.amount_usd).toFixed(2)}`} />
            <Row label="2% Levy" value={`$${parseFloat(result.levy_usd).toFixed(4)}`} highlight />
            <Row label="Status" value={result.status} />
            <Row label="Date" value={new Date(result.created_at).toLocaleString()} last />
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
}: {
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color: "#34d399" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 24, paddingBottom: 40 },

  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#1e1a3a", borderWidth: 1, borderColor: "#312e81",
    justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#f8fafc", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#475569", textAlign: "center", lineHeight: 20, marginBottom: 28 },

  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#111827", borderWidth: 1, borderColor: "#1e2d45",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, color: "#f8fafc", fontSize: 15, paddingVertical: 13,
    letterSpacing: 1,
  },

  btn: {
    backgroundColor: "#4f46e5", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#450a0a", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#7f1d1d",
  },
  errorText: { color: "#fca5a5", fontSize: 13 },

  resultCard: {
    backgroundColor: "#111827", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#166534", marginTop: 8,
  },
  validHeader: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16,
  },
  validIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#14532d", justifyContent: "center", alignItems: "center",
  },
  validTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
  validSub: { fontSize: 12, color: "#4ade80", marginTop: 2 },

  receiptCodeBox: {
    backgroundColor: "#0a0f1e", borderRadius: 10, padding: 12,
    alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#1e2d45",
  },
  receiptCodeLabel: { fontSize: 10, color: "#334155", letterSpacing: 1.5, marginBottom: 6 },
  receiptCodeValue: {
    fontSize: 16, fontWeight: "700", color: "#60a5fa",
    letterSpacing: 2, fontFamily: "monospace",
  },

  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#0a0f1e" },
  rowLabel: { color: "#64748b", fontSize: 13 },
  rowValue: { color: "#f8fafc", fontWeight: "600", fontSize: 13, textAlign: "right", flex: 1, marginLeft: 12 },
});

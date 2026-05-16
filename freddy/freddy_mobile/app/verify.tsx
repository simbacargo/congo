import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
      const data = await verifyReceipt(code.trim().toUpperCase()) as VerifyResult;
      setResult(data);
    } catch {
      setError("Receipt not found. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Verify Receipt</Text>
      <Text style={styles.subtitle}>Enter the receipt code to check its authenticity</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. LCI-A3F2-B1C4-D5E6"
        placeholderTextColor="#475569"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <Pressable
        style={[styles.btn, (!code.trim() || loading) && styles.btnDisabled]}
        onPress={handleVerify}
        disabled={!code.trim() || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify</Text>}
      </Pressable>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {result && (
        <View style={styles.resultCard}>
          <View style={styles.validBadge}>
            <Text style={styles.validText}>✓ VALID RECEIPT</Text>
          </View>

          <Row label="Receipt Code" value={result.receipt_code} mono />
          <Row label="Company" value={result.company} />
          <Row label="Station" value={result.station} />
          <Row label="Church" value={result.church} />
          <Row label="Amount" value={`$${parseFloat(result.amount_usd).toFixed(2)}`} />
          <Row label="2% Levy" value={`$${parseFloat(result.levy_usd).toFixed(4)}`} highlight />
          <Row label="Status" value={result.status} />
          <Row label="Date" value={new Date(result.created_at).toLocaleString()} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && { fontFamily: "monospace" }, highlight && { color: "#34d399" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#f1f5f9", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 20 },
  input: {
    backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155",
    borderRadius: 12, padding: 14, color: "#f1f5f9", fontSize: 16,
    marginBottom: 14, letterSpacing: 1,
  },
  btn: { backgroundColor: "#2563eb", borderRadius: 12, padding: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorBox: { backgroundColor: "#450a0a", borderRadius: 10, padding: 14, marginTop: 16 },
  errorText: { color: "#fca5a5" },
  resultCard: {
    backgroundColor: "#1e293b", borderRadius: 14, padding: 18,
    marginTop: 20, borderWidth: 1, borderColor: "#166534",
  },
  validBadge: {
    backgroundColor: "#14532d", borderRadius: 8, padding: 8,
    alignItems: "center", marginBottom: 14,
  },
  validText: { color: "#4ade80", fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#0f172a",
  },
  rowLabel: { color: "#64748b", fontSize: 13 },
  rowValue: { color: "#f1f5f9", fontWeight: "600", fontSize: 13, textAlign: "right", flex: 1, marginLeft: 12 },
});

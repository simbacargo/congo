import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Church, FuelType, fetchChurches, fetchCurrencyRate, fetchFuelTypes, postTransaction } from "../../lib/api";
import { saveOfflineTx } from "../../lib/db";

type Step = 1 | 2 | 3;
type Currency = "USD" | "CDF";

const LEVY_RATE = 0.02;

export default function NewTransactionScreen() {
  const [step, setStep] = useState<Step>(1);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [rate, setRate] = useState<number>(2800);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amountInput, setAmountInput] = useState("");
  const [notes, setNotes] = useState("");

  // Derived amounts
  const amount = parseFloat(amountInput) || 0;
  const amountUsd = currency === "USD" ? amount : amount / rate;
  const amountCdf = currency === "CDF" ? amount : amount * rate;
  const levyUsd = amountUsd * LEVY_RATE;
  const levyCdf = amountCdf * LEVY_RATE;

  useEffect(() => {
    (async () => {
      try {
        const [ft, ch, r] = await Promise.all([fetchFuelTypes(), fetchChurches(), fetchCurrencyRate()]);
        setFuelTypes(ft);
        setChurches(ch);
        setRate(r);
      } catch {
        // use defaults / cached
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submit() {
    if (!selectedFuel || !selectedChurch) return;
    setSubmitting(true);

    const syncId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    const payload = {
      church: selectedChurch.id,
      fuel_type: selectedFuel.id,
      currency_used: currency,
      amount_usd: amountUsd.toFixed(2),
      amount_cdf: amountCdf.toFixed(2),
      notes,
      sync_id: syncId,
      created_at: createdAt,
    };

    // Always save locally first
    await saveOfflineTx({
      sync_id: syncId,
      church_id: selectedChurch.id,
      church_name: selectedChurch.name,
      fuel_type_id: selectedFuel.id,
      fuel_type_name: selectedFuel.name,
      currency_used: currency,
      amount_usd: amountUsd.toFixed(2),
      amount_cdf: amountCdf.toFixed(2),
      levy_preview: levyUsd.toFixed(4),
      notes,
      created_at: createdAt,
      synced: 0,
    });

    try {
      const result = await postTransaction(payload);
      setSubmitting(false);
      router.replace({
        pathname: "/transaction/success",
        params: {
          receiptCode: result.receipt_code,
          levyUsd: result.levy_amount_usd,
          levyCdf: result.levy_amount_cdf,
          churchName: result.church_name,
          stationName: result.station_name,
          companyName: result.company_name,
          fuelType: selectedFuel.name,
          currency,
          amountUsd: amountUsd.toFixed(2),
          amountCdf: amountCdf.toFixed(2),
        },
      });
    } catch {
      // Saved offline — will sync later
      setSubmitting(false);
      router.replace({
        pathname: "/transaction/success",
        params: {
          receiptCode: "OFFLINE-" + syncId.slice(0, 8).toUpperCase(),
          levyUsd: levyUsd.toFixed(4),
          levyCdf: levyCdf.toFixed(2),
          churchName: selectedChurch.name,
          stationName: "",
          companyName: selectedChurch.company_name,
          fuelType: selectedFuel.name,
          currency,
          amountUsd: amountUsd.toFixed(2),
          amountCdf: amountCdf.toFixed(2),
          offline: "true",
        },
      });
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Step Indicator */}
      <View style={styles.stepBar}>
        {([1, 2, 3] as Step[]).map((s) => (
          <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, step >= s && { color: "#fff" }]}>{s}</Text>
          </View>
        ))}
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Fuel Type</Text>
        <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Amount</Text>
        <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>Preview</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Step 1: Select Fuel Type & Church ── */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Select Fuel Type</Text>
            <View style={styles.chipGroup}>
              {fuelTypes.map((ft) => (
                <Pressable
                  key={ft.id}
                  style={[styles.chip, selectedFuel?.id === ft.id && styles.chipActive]}
                  onPress={() => setSelectedFuel(ft)}
                >
                  <Text style={[styles.chipText, selectedFuel?.id === ft.id && styles.chipTextActive]}>
                    {ft.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Select Church</Text>
            {churches.map((ch) => (
              <Pressable
                key={ch.id}
                style={[styles.churchRow, selectedChurch?.id === ch.id && styles.churchRowActive]}
                onPress={() => setSelectedChurch(ch)}
              >
                <View>
                  <Text style={styles.churchName}>{ch.name}</Text>
                  <Text style={styles.churchSub}>{ch.station_name} · {ch.company_name}</Text>
                </View>
                {selectedChurch?.id === ch.id && (
                  <Text style={{ color: "#3b82f6", fontWeight: "700" }}>✓</Text>
                )}
              </Pressable>
            ))}

            <Pressable
              style={[styles.nextBtn, (!selectedFuel || !selectedChurch) && styles.nextBtnDisabled]}
              onPress={() => setStep(2)}
              disabled={!selectedFuel || !selectedChurch}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </Pressable>
          </View>
        )}

        {/* ── Step 2: Enter Amount ── */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Enter Amount</Text>

            {/* Currency Toggle */}
            <View style={styles.currencyToggle}>
              <Pressable
                style={[styles.currencyBtn, currency === "USD" && styles.currencyBtnActive]}
                onPress={() => setCurrency("USD")}
              >
                <Text style={[styles.currencyBtnText, currency === "USD" && { color: "#fff" }]}>USD $</Text>
              </Pressable>
              <Pressable
                style={[styles.currencyBtn, currency === "CDF" && styles.currencyBtnActive]}
                onPress={() => setCurrency("CDF")}
              >
                <Text style={[styles.currencyBtnText, currency === "CDF" && { color: "#fff" }]}>CDF FC</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.amountInput}
              placeholder={`Amount in ${currency}`}
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
              autoFocus
            />

            {/* Live Preview */}
            {amount > 0 && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Live Breakdown</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Amount (USD)</Text>
                  <Text style={styles.previewValue}>${amountUsd.toFixed(2)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Amount (CDF)</Text>
                  <Text style={styles.previewValue}>{amountCdf.toFixed(0)} FC</Text>
                </View>
                <View style={[styles.previewRow, styles.previewHighlight]}>
                  <Text style={[styles.previewLabel, { color: "#34d399", fontWeight: "700" }]}>
                    2% Charity Levy
                  </Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.previewValue, { color: "#34d399" }]}>${levyUsd.toFixed(4)}</Text>
                    <Text style={{ color: "#4ade80", fontSize: 11 }}>{levyCdf.toFixed(2)} FC</Text>
                  </View>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>For: {selectedChurch?.name}</Text>
                </View>
              </View>
            )}

            <TextInput
              style={[styles.amountInput, { fontSize: 14, marginTop: 16 }]}
              placeholder="Notes (optional)"
              placeholderTextColor="#475569"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.navRow}>
              <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </Pressable>
              <Pressable
                style={[styles.nextBtn, { flex: 1 }, (!amount || amount <= 0) && styles.nextBtnDisabled]}
                onPress={() => setStep(3)}
                disabled={!amount || amount <= 0}
              >
                <Text style={styles.nextBtnText}>Review →</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>Confirm Transaction</Text>

            <View style={styles.confirmCard}>
              <Row label="Company" value={selectedChurch?.company_name ?? ""} />
              <Row label="Church" value={selectedChurch?.name ?? ""} />
              <Row label="Fuel Type" value={selectedFuel?.name ?? ""} />
              <Row label="Currency" value={currency} />
              <Row label="Amount (USD)" value={`$${amountUsd.toFixed(2)}`} />
              <Row label="Amount (CDF)" value={`${amountCdf.toFixed(0)} FC`} />
              <View style={styles.levyHighlight}>
                <Text style={styles.levyLabel}>2% Charity Levy (USD)</Text>
                <Text style={styles.levyValue}>${levyUsd.toFixed(4)}</Text>
              </View>
              <View style={styles.levyHighlight}>
                <Text style={styles.levyLabel}>2% Charity Levy (CDF)</Text>
                <Text style={styles.levyValue}>{levyCdf.toFixed(2)} FC</Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <Pressable style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>← Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.nextBtn, { flex: 1, backgroundColor: "#16a34a" }, submitting && { opacity: 0.6 }]}
                onPress={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextBtnText}>Submit & Print</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={styles.confirmValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#64748b", marginTop: 12 },

  // Step bar
  stepBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 32, paddingTop: 20 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: "#334155", backgroundColor: "#1e293b",
    justifyContent: "center", alignItems: "center",
  },
  stepDotActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  stepDotText: { color: "#475569", fontWeight: "700", fontSize: 12 },
  stepLine: { flex: 1, height: 2, backgroundColor: "#334155", marginHorizontal: -14, zIndex: -1 },
  stepLineActive: { backgroundColor: "#2563eb" },
  stepLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 6, marginBottom: 20 },
  stepLabel: { fontSize: 11, color: "#475569", flex: 1, textAlign: "center" },
  stepLabelActive: { color: "#93c5fd", fontWeight: "600" },

  body: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#cbd5e1", marginBottom: 12 },

  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: "#334155", backgroundColor: "#1e293b",
  },
  chipActive: { backgroundColor: "#1d4ed8", borderColor: "#2563eb" },
  chipText: { color: "#94a3b8", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  churchRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#334155",
  },
  churchRowActive: { borderColor: "#2563eb", backgroundColor: "#172554" },
  churchName: { fontWeight: "600", color: "#f1f5f9", fontSize: 14 },
  churchSub: { color: "#64748b", fontSize: 12, marginTop: 2 },

  currencyToggle: {
    flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 10,
    borderWidth: 1, borderColor: "#334155", marginBottom: 16, overflow: "hidden",
  },
  currencyBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  currencyBtnActive: { backgroundColor: "#2563eb" },
  currencyBtnText: { fontWeight: "700", color: "#64748b" },

  amountInput: {
    backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155",
    borderRadius: 12, padding: 16, color: "#f1f5f9", fontSize: 28, fontWeight: "700",
  },
  previewBox: {
    backgroundColor: "#0d2137", borderRadius: 12, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: "#1e3a5f",
  },
  previewTitle: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  previewHighlight: {
    backgroundColor: "#052e16", borderRadius: 8, padding: 10,
    marginTop: 4, marginBottom: 4,
  },
  previewLabel: { color: "#94a3b8", fontSize: 13 },
  previewValue: { color: "#f1f5f9", fontWeight: "600", fontSize: 13 },

  confirmCard: {
    backgroundColor: "#1e293b", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#334155", marginBottom: 20,
  },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#0f172a" },
  confirmLabel: { color: "#64748b", fontSize: 13 },
  confirmValue: { color: "#f1f5f9", fontWeight: "600", fontSize: 13 },
  levyHighlight: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#052e16", borderRadius: 8, padding: 10, marginTop: 8,
  },
  levyLabel: { color: "#4ade80", fontSize: 13 },
  levyValue: { color: "#34d399", fontWeight: "700", fontSize: 13 },

  navRow: { flexDirection: "row", gap: 12 },
  nextBtn: {
    backgroundColor: "#2563eb", borderRadius: 12, padding: 16,
    alignItems: "center", marginTop: 20,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backBtn: {
    backgroundColor: "#1e293b", borderRadius: 12, padding: 16,
    alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: "#334155",
    paddingHorizontal: 20,
  },
  backBtnText: { color: "#94a3b8", fontWeight: "600" },
});

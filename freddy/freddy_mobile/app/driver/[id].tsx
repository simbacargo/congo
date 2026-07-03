import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import {
  Church,
  DriverLookup,
  FuelType,
  fetchChurches,
  fetchCurrencyRate,
  fetchDriver,
  fetchFuelTypes,
  postTransaction,
} from "../../lib/api";
import { saveOfflineTx } from "../../lib/db";

const LEVY_RATE = 0.02;
type Currency = "USD" | "CDF";

export default function DriverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<DriverLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Record-purchase form ──
  const [formOpen, setFormOpen] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [rate, setRate] = useState(2800);
  const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amount = parseFloat(amountInput) || 0;
  const amountUsd = currency === "USD" ? amount : amount / rate;
  const amountCdf = currency === "CDF" ? amount : amount * rate;
  const levyUsd = amountUsd * LEVY_RATE;
  const levyCdf = amountCdf * LEVY_RATE;

  const load = useCallback(async () => {
    try {
      const result = await fetchDriver(String(id));
      setData(result);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Driver not found.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function openForm() {
    setFormOpen(true);
    if (fuelTypes.length === 0 || churches.length === 0) {
      setMetaLoading(true);
      const [ft, ch, r] = await Promise.all([
        fetchFuelTypes(),
        fetchChurches(),
        fetchCurrencyRate(),
      ]);
      setFuelTypes(ft);
      setChurches(ch);
      setRate(r);
      // Pre-select when there's only one sensible choice.
      if (ft.length === 1) setSelectedFuel(ft[0]);
      if (ch.length === 1) setSelectedChurch(ch[0]);
      setMetaLoading(false);
    }
  }

  async function submit() {
    if (!data || !selectedFuel || !selectedChurch || amount <= 0) return;
    setSubmitting(true);

    const syncId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    const driverPhone = data.driver.phone ?? undefined;

    // Offline-first: persist locally, then try to push to the server.
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
      driver_phone: driverPhone,
      created_at: createdAt,
      synced: 0,
    });

    try {
      await postTransaction({
        church: selectedChurch.id,
        fuel_type: selectedFuel.id,
        currency_used: currency,
        amount_usd: amountUsd.toFixed(2),
        amount_cdf: amountCdf.toFixed(2),
        driver_phone: driverPhone,
        sync_id: syncId,
        created_at: createdAt,
      });
      resetForm();
      Alert.alert("Recorded", "Purchase and 2% contribution saved.");
      await load();
    } catch {
      resetForm();
      Alert.alert(
        "Saved offline",
        "No connection right now — it will sync automatically and appear in this driver's history once synced.",
      );
    }
  }

  function resetForm() {
    setSubmitting(false);
    setFormOpen(false);
    setAmountInput("");
    setSelectedFuel(fuelTypes.length === 1 ? fuelTypes[0] : null);
    setSelectedChurch(churches.length === 1 ? churches[0] : null);
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.root, styles.center]}>
        <FontAwesome name="exclamation-circle" size={28} color="#fca5a5" />
        <Text style={styles.errTitle}>Couldn&apos;t load driver</Text>
        <Text style={styles.errText}>{error || "Unknown error."}</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Back to scan</Text>
        </Pressable>
      </View>
    );
  }

  const { driver, transactions, summary } = data;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Driver header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={26} color="#818cf8" />
        </View>
        <Text style={styles.name}>{driver.full_name || "Unknown driver"}</Text>
        {driver.phone ? <Text style={styles.phone}>{driver.phone}</Text> : null}

        <View style={styles.tags}>
          {driver.vehicle_type ? <Tag text={driver.vehicle_type} /> : null}
          {driver.vehicle_color ? <Tag text={driver.vehicle_color} /> : null}
          {driver.commune ? <Tag text={driver.commune} /> : null}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Stat label="Transactions" value={String(summary.count)} />
        <Stat label="Total levy" value={`$${parseFloat(summary.total_levy_usd).toFixed(2)}`} highlight />
        <Stat label="Total fuel" value={`$${parseFloat(summary.total_amount_usd).toFixed(0)}`} />
      </View>

      {/* Record purchase */}
      {!formOpen ? (
        <Pressable style={styles.recordBtn} onPress={openForm}>
          <FontAwesome name="plus-circle" size={16} color="#fff" />
          <Text style={styles.recordBtnText}>Record a purchase</Text>
        </Pressable>
      ) : (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>New purchase</Text>
            {!driver.phone && (
              <Text style={styles.warn}>No phone on file — won&apos;t link to history.</Text>
            )}
          </View>

          {metaLoading ? (
            <ActivityIndicator color="#818cf8" style={{ marginVertical: 20 }} />
          ) : (
            <>
              {/* Currency */}
              <View style={styles.currencyToggle}>
                {(["USD", "CDF"] as Currency[]).map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text style={[styles.currencyText, currency === c && { color: "#fff" }]}>
                      {c === "USD" ? "USD $" : "CDF FC"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Amount */}
              <Text style={styles.fieldLabel}>Amount purchased</Text>
              <TextInput
                style={styles.input}
                placeholder={`Amount in ${currency}`}
                placeholderTextColor="#475569"
                keyboardType="decimal-pad"
                value={amountInput}
                onChangeText={setAmountInput}
              />

              {/* Contribution (locked at 2%) */}
              <View style={styles.levyBox}>
                <View>
                  <Text style={styles.levyLabel}>Contribution (2%)</Text>
                  <Text style={styles.levyHint}>Auto-calculated</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.levyValue}>${levyUsd.toFixed(4)}</Text>
                  <Text style={styles.levySub}>{levyCdf.toFixed(2)} FC</Text>
                </View>
              </View>

              {/* Fuel type */}
              <Text style={styles.fieldLabel}>Fuel type</Text>
              <View style={styles.chipGroup}>
                {fuelTypes.map((ft) => (
                  <Pressable
                    key={ft.id}
                    style={[styles.chip, selectedFuel?.id === ft.id && styles.chipActive]}
                    onPress={() => setSelectedFuel(ft)}
                  >
                    <Text style={[styles.chipText, selectedFuel?.id === ft.id && { color: "#fff" }]}>
                      {ft.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Church */}
              <Text style={styles.fieldLabel}>Receiving church</Text>
              {churches.length === 0 ? (
                <Text style={styles.warn}>No church available for your station.</Text>
              ) : (
                churches.map((ch) => (
                  <Pressable
                    key={ch.id}
                    style={[styles.churchRow, selectedChurch?.id === ch.id && styles.churchRowActive]}
                    onPress={() => setSelectedChurch(ch)}
                  >
                    <Text style={styles.churchName}>{ch.name}</Text>
                    {selectedChurch?.id === ch.id && (
                      <FontAwesome name="check" size={14} color="#3b82f6" />
                    )}
                  </Pressable>
                ))
              )}

              {/* Actions */}
              <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={resetForm} disabled={submitting}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.submitBtn,
                    (!selectedFuel || !selectedChurch || amount <= 0 || submitting) && styles.submitDisabled,
                  ]}
                  onPress={submit}
                  disabled={!selectedFuel || !selectedChurch || amount <= 0 || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Save purchase</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* History */}
      <Text style={styles.sectionTitle}>Previous transactions</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <FontAwesome name="inbox" size={22} color="#334155" />
          <Text style={styles.emptyText}>
            No levy transactions recorded for this driver yet.
          </Text>
        </View>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txTop}>
              <Text style={styles.txCode}>{tx.receipt_code}</Text>
              <Text style={styles.txLevy}>+${parseFloat(tx.levy_amount_usd).toFixed(2)}</Text>
            </View>
            <Text style={styles.txMeta}>
              {tx.church_name} · {tx.fuel_type_name}
            </Text>
            <View style={styles.txBottom}>
              <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
              <Text style={styles.txAmount}>
                ${parseFloat(tx.amount_usd).toFixed(2)} fuel
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && { color: "#34d399" }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  center: { justifyContent: "center", alignItems: "center", padding: 28, gap: 10 },
  content: { padding: 20, paddingBottom: 40 },

  profileCard: {
    backgroundColor: "#111827", borderRadius: 18, padding: 22,
    alignItems: "center", borderWidth: 1, borderColor: "#1e2d45", marginBottom: 16,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: "#1e1a3a",
    borderWidth: 1, borderColor: "#312e81",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  name: { fontSize: 19, fontWeight: "700", color: "#f8fafc", textAlign: "center" },
  phone: { fontSize: 14, color: "#60a5fa", marginTop: 4, fontFamily: "monospace" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 14 },
  tag: {
    backgroundColor: "#0a0f1e", borderColor: "#1e2d45", borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  tagText: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },

  summaryRow: {
    flexDirection: "row", backgroundColor: "#111827", borderRadius: 16,
    borderWidth: 1, borderColor: "#1e2d45", paddingVertical: 16, marginBottom: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#f8fafc" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 4 },

  recordBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#4f46e5", borderRadius: 14, paddingVertical: 15, marginBottom: 24,
  },
  recordBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  formCard: {
    backgroundColor: "#111827", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#312e81", marginBottom: 24,
  },
  formHeader: { marginBottom: 12 },
  formTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
  warn: { color: "#fbbf24", fontSize: 12, marginTop: 4 },

  currencyToggle: {
    flexDirection: "row", backgroundColor: "#0a0f1e", borderRadius: 12,
    padding: 4, marginBottom: 16, borderWidth: 1, borderColor: "#1e2d45",
  },
  currencyBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9 },
  currencyBtnActive: { backgroundColor: "#4f46e5" },
  currencyText: { color: "#94a3b8", fontWeight: "700", fontSize: 13 },

  fieldLabel: { color: "#cbd5e1", fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: "#0a0f1e", borderWidth: 1, borderColor: "#1e2d45",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: "#f8fafc", fontSize: 16, marginBottom: 14,
  },

  levyBox: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#0a1f17", borderWidth: 1, borderColor: "#166534",
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  levyLabel: { color: "#34d399", fontWeight: "700", fontSize: 14 },
  levyHint: { color: "#4ade80", fontSize: 11, marginTop: 2 },
  levyValue: { color: "#34d399", fontWeight: "700", fontSize: 16 },
  levySub: { color: "#4ade80", fontSize: 11, marginTop: 2 },

  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    backgroundColor: "#0a0f1e", borderWidth: 1, borderColor: "#1e2d45",
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9,
  },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { color: "#94a3b8", fontWeight: "600", fontSize: 13 },

  churchRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#0a0f1e", borderWidth: 1, borderColor: "#1e2d45",
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  churchRowActive: { borderColor: "#3b82f6" },
  churchName: { color: "#f8fafc", fontSize: 14, fontWeight: "600" },

  formActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12,
    borderWidth: 1, borderColor: "#1e2d45",
  },
  cancelText: { color: "#94a3b8", fontWeight: "700" },
  submitBtn: {
    flex: 1, backgroundColor: "#16a34a", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#cbd5e1", marginBottom: 12 },

  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 36 },
  emptyText: { color: "#475569", fontSize: 13, textAlign: "center", paddingHorizontal: 24 },

  txCard: {
    backgroundColor: "#111827", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#1e2d45", marginBottom: 10,
  },
  txTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txCode: { color: "#60a5fa", fontWeight: "700", fontSize: 13, fontFamily: "monospace" },
  txLevy: { color: "#34d399", fontWeight: "700", fontSize: 14 },
  txMeta: { color: "#94a3b8", fontSize: 13, marginTop: 6 },
  txBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  txDate: { color: "#64748b", fontSize: 12 },
  txAmount: { color: "#64748b", fontSize: 12 },

  errTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  errText: { color: "#64748b", fontSize: 13, textAlign: "center" },
  btn: { backgroundColor: "#4f46e5", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
});

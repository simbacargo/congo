import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

const LEVY_RATE = 0.02;
type Currency = "USD" | "CDF";

export default function DriverScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

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
      setError(e instanceof Error ? e.message : t("driver.not.found"));
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
      Alert.alert(t("driver.recorded"), t("driver.recorded.body"));
      await load();
    } catch {
      resetForm();
      Alert.alert(t("driver.saved.offline"), t("driver.saved.offline.body"));
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
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.root, styles.center]}>
        <FontAwesome name="exclamation-circle" size={28} color={colors.error} />
        <Text style={styles.errTitle}>{t("driver.couldnt.load")}</Text>
        <Text style={styles.errText}>{error || t("driver.unknown.error")}</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>{t("driver.back.scan")}</Text>
        </Pressable>
      </View>
    );
  }

  const { driver, transactions, summary } = data;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Driver header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={26} color={colors.accent} />
        </View>
        <Text style={styles.name}>{driver.full_name || t("driver.unknown")}</Text>
        {driver.phone ? <Text style={styles.phone}>{driver.phone}</Text> : null}

        <View style={styles.tags}>
          {driver.vehicle_type ? <Tag text={driver.vehicle_type} styles={styles} /> : null}
          {driver.vehicle_color ? <Tag text={driver.vehicle_color} styles={styles} /> : null}
          {driver.commune ? <Tag text={driver.commune} styles={styles} /> : null}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Stat label={t("analytics.transactions")} value={String(summary.count)} styles={styles} />
        <Stat label={t("driver.total.levy")} value={`$${parseFloat(summary.total_levy_usd).toFixed(2)}`} highlight styles={styles} colors={colors} />
        <Stat label={t("driver.total.fuel")} value={`$${parseFloat(summary.total_amount_usd).toFixed(0)}`} styles={styles} />
      </View>

      {/* Record purchase */}
      {!formOpen ? (
        <Pressable style={styles.recordBtn} onPress={openForm}>
          <FontAwesome name="plus-circle" size={16} color={colors.onPrimary} />
          <Text style={styles.recordBtnText}>{t("driver.record.purchase")}</Text>
        </Pressable>
      ) : (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{t("driver.new.purchase")}</Text>
            {!driver.phone && (
              <Text style={styles.warn}>{t("driver.no.phone.warn")}</Text>
            )}
          </View>

          {metaLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
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
                    <Text style={[styles.currencyText, currency === c && { color: colors.onPrimary }]}>
                      {c === "USD" ? "USD $" : "CDF FC"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Amount */}
              <Text style={styles.fieldLabel}>{t("driver.amount.purchased")}</Text>
              <TextInput
                style={styles.input}
                placeholder={`${t("newtx.amount.in")} ${currency}`}
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={amountInput}
                onChangeText={setAmountInput}
              />

              {/* Contribution (locked at 2%) */}
              <View style={styles.levyBox}>
                <View>
                  <Text style={styles.levyLabel}>{t("driver.contribution")}</Text>
                  <Text style={styles.levyHint}>{t("driver.auto.calculated")}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.levyValue}>${levyUsd.toFixed(4)}</Text>
                  <Text style={styles.levySub}>{levyCdf.toFixed(2)} FC</Text>
                </View>
              </View>

              {/* Fuel type */}
              <Text style={styles.fieldLabel}>{t("fuel.type")}</Text>
              <View style={styles.chipGroup}>
                {fuelTypes.map((ft) => (
                  <Pressable
                    key={ft.id}
                    style={[styles.chip, selectedFuel?.id === ft.id && styles.chipActive]}
                    onPress={() => setSelectedFuel(ft)}
                  >
                    <Text style={[styles.chipText, selectedFuel?.id === ft.id && { color: colors.onPrimary }]}>
                      {ft.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Church */}
              <Text style={styles.fieldLabel}>{t("driver.receiving.church")}</Text>
              {churches.length === 0 ? (
                <Text style={styles.warn}>{t("driver.no.church")}</Text>
              ) : (
                churches.map((ch) => (
                  <Pressable
                    key={ch.id}
                    style={[styles.churchRow, selectedChurch?.id === ch.id && styles.churchRowActive]}
                    onPress={() => setSelectedChurch(ch)}
                  >
                    <Text style={styles.churchName}>{ch.name}</Text>
                    {selectedChurch?.id === ch.id && (
                      <FontAwesome name="check" size={14} color={colors.primary} />
                    )}
                  </Pressable>
                ))
              )}

              {/* Actions */}
              <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={resetForm} disabled={submitting}>
                  <Text style={styles.cancelText}>{t("cancel")}</Text>
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
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={styles.submitText}>{t("driver.save.purchase")}</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* History */}
      <Text style={styles.sectionTitle}>{t("driver.previous.tx")}</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <FontAwesome name="inbox" size={22} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{t("driver.no.tx")}</Text>
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
                ${parseFloat(tx.amount_usd).toFixed(2)} {t("driver.fuel")}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Tag({ text, styles }: { text: string; styles: any }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

function Stat({ label, value, highlight, styles, colors }: { label: string; value: string; highlight?: boolean; styles: any; colors?: any }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && { color: colors?.success }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: "center", alignItems: "center", padding: 28, gap: 10 },
    content: { padding: 20, paddingBottom: 40 },

    profileCard: {
      backgroundColor: colors.surface, borderRadius: 18, padding: 22,
      alignItems: "center", borderWidth: 1, borderColor: colors.border, marginBottom: 16,
    },
    avatar: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceAlt,
      borderWidth: 1, borderColor: colors.border,
      justifyContent: "center", alignItems: "center", marginBottom: 12,
    },
    name: { fontSize: 19, fontWeight: "700", color: colors.text, textAlign: "center" },
    phone: { fontSize: 14, color: colors.primary, marginTop: 4, fontFamily: "monospace" },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 14 },
    tag: {
      backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1,
      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
    },
    tagText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },

    summaryRow: {
      flexDirection: "row", backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, paddingVertical: 16, marginBottom: 16,
    },
    stat: { flex: 1, alignItems: "center" },
    statValue: { fontSize: 18, fontWeight: "700", color: colors.text },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

    recordBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
      backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, marginBottom: 24,
    },
    recordBtnText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },

    formCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: colors.accent, marginBottom: 24,
    },
    formHeader: { marginBottom: 12 },
    formTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    warn: { color: colors.warning, fontSize: 12, marginTop: 4 },

    currencyToggle: {
      flexDirection: "row", backgroundColor: colors.background, borderRadius: 12,
      padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    currencyBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9 },
    currencyBtnActive: { backgroundColor: colors.accent },
    currencyText: { color: colors.textSecondary, fontWeight: "700", fontSize: 13 },

    fieldLabel: { color: colors.text, fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
    input: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
      color: colors.text, fontSize: 16, marginBottom: 14,
    },

    levyBox: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder,
      borderRadius: 12, padding: 14, marginBottom: 16,
    },
    levyLabel: { color: colors.success, fontWeight: "700", fontSize: 14 },
    levyHint: { color: colors.success, fontSize: 11, marginTop: 2 },
    levyValue: { color: colors.success, fontWeight: "700", fontSize: 16 },
    levySub: { color: colors.success, fontSize: 11, marginTop: 2 },

    chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    chip: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { color: colors.textSecondary, fontWeight: "600", fontSize: 13 },

    churchRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, marginBottom: 8,
    },
    churchRowActive: { borderColor: colors.primary },
    churchName: { color: colors.text, fontSize: 14, fontWeight: "600" },

    formActions: { flexDirection: "row", gap: 10, marginTop: 8 },
    cancelBtn: {
      paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    cancelText: { color: colors.textSecondary, fontWeight: "700" },
    submitBtn: {
      flex: 1, backgroundColor: colors.success, borderRadius: 12,
      paddingVertical: 14, alignItems: "center",
    },
    submitDisabled: { opacity: 0.4 },
    submitText: { color: colors.onPrimary, fontWeight: "700", fontSize: 15 },

    sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 },

    emptyBox: { alignItems: "center", gap: 10, paddingVertical: 36 },
    emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: "center", paddingHorizontal: 24 },

    txCard: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 10,
    },
    txTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    txCode: { color: colors.primary, fontWeight: "700", fontSize: 13, fontFamily: "monospace" },
    txLevy: { color: colors.success, fontWeight: "700", fontSize: 14 },
    txMeta: { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
    txBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    txDate: { color: colors.textSecondary, fontSize: 12 },
    txAmount: { color: colors.textSecondary, fontSize: 12 },

    errTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    errText: { color: colors.textSecondary, fontSize: 13, textAlign: "center" },
    btn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
    btnText: { color: colors.onPrimary, fontWeight: "700" },
  });
}

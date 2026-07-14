import { useEffect, useState } from "react";
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
import { Church, FuelType, fetchChurches, fetchCurrencyRate, fetchFuelTypes, postTransaction } from "../../lib/api";
import { saveOfflineTx } from "../../lib/db";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

type Step = 1 | 2 | 3;
type Currency = "USD" | "CDF";

const LEVY_RATE = 0.02;

export default function NewTransactionScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

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
  const [driverPhone, setDriverPhone] = useState("");

  // Derived amounts
  const amount = parseFloat(amountInput) || 0;
  const amountUsd = currency === "USD" ? amount : amount / rate;
  const amountCdf = currency === "CDF" ? amount : amount * rate;
  const levyUsd = amountUsd * LEVY_RATE;
  const levyCdf = amountCdf * LEVY_RATE;

  useEffect(() => {
    (async () => {
      // Seed rate from cache immediately so CDF preview is accurate even if
      // the network call below fails.
      const cachedRate = await AsyncStorage.getItem("cached_rate");
      if (cachedRate) setRate(parseFloat(cachedRate));

      const [ft, ch, r] = await Promise.all([
        fetchFuelTypes(),
        fetchChurches(),
        fetchCurrencyRate(),
      ]);
      setFuelTypes(ft);
      setChurches(ch);
      setRate(r);
      setLoading(false);
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
      driver_phone: driverPhone.trim() || undefined,
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
      driver_phone: driverPhone.trim() || undefined,
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("loading")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Step Indicator */}
      <View style={styles.stepBar}>
        {([1, 2, 3] as Step[]).map((s) => (
          <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, step >= s && { color: colors.onPrimary }]}>{s}</Text>
          </View>
        ))}
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>{t("newtx.step.fueltype")}</Text>
        <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>{t("newtx.step.amount")}</Text>
        <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>{t("newtx.step.preview")}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Step 1: Select Fuel Type & Church ── */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>{t("newtx.select.fueltype")}</Text>
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

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t("newtx.select.church")}</Text>
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
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>✓</Text>
                )}
              </Pressable>
            ))}

            <Pressable
              style={[styles.nextBtn, (!selectedFuel || !selectedChurch) && styles.nextBtnDisabled]}
              onPress={() => setStep(2)}
              disabled={!selectedFuel || !selectedChurch}
            >
              <Text style={styles.nextBtnText}>{t("newtx.next")}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Step 2: Enter Amount ── */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>{t("newtx.enter.amount")}</Text>

            {/* Currency Toggle */}
            <View style={styles.currencyToggle}>
              <Pressable
                style={[styles.currencyBtn, currency === "USD" && styles.currencyBtnActive]}
                onPress={() => setCurrency("USD")}
              >
                <Text style={[styles.currencyBtnText, currency === "USD" && { color: colors.onPrimary }]}>USD $</Text>
              </Pressable>
              <Pressable
                style={[styles.currencyBtn, currency === "CDF" && styles.currencyBtnActive]}
                onPress={() => setCurrency("CDF")}
              >
                <Text style={[styles.currencyBtnText, currency === "CDF" && { color: colors.onPrimary }]}>CDF FC</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.amountInput}
              placeholder={`${t("newtx.amount.in")} ${currency}`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
              autoFocus
            />

            {/* Live Preview */}
            {amount > 0 && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>{t("newtx.live.breakdown")}</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{t("amount.usd")}</Text>
                  <Text style={styles.previewValue}>${amountUsd.toFixed(2)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{t("amount.cdf")}</Text>
                  <Text style={styles.previewValue}>{amountCdf.toFixed(0)} FC</Text>
                </View>
                <View style={[styles.previewRow, styles.previewHighlight]}>
                  <Text style={[styles.previewLabel, { color: colors.success, fontWeight: "700" }]}>
                    {t("levy")}
                  </Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.previewValue, { color: colors.success }]}>${levyUsd.toFixed(4)}</Text>
                    <Text style={{ color: colors.success, fontSize: 11 }}>{levyCdf.toFixed(2)} FC</Text>
                  </View>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{t("newtx.for")}: {selectedChurch?.name}</Text>
                </View>
              </View>
            )}

            <TextInput
              style={[styles.amountInput, { fontSize: 14, marginTop: 16 }]}
              placeholder={t("newtx.driver.phone")}
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={driverPhone}
              onChangeText={setDriverPhone}
            />
            <Text style={styles.fieldHint}>{t("newtx.driver.phone.hint")}</Text>

            <TextInput
              style={[styles.amountInput, { fontSize: 14, marginTop: 16 }]}
              placeholder={t("newtx.notes")}
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.navRow}>
              <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>{t("newtx.back")}</Text>
              </Pressable>
              <Pressable
                style={[styles.nextBtn, { flex: 1 }, (!amount || amount <= 0) && styles.nextBtnDisabled]}
                onPress={() => setStep(3)}
                disabled={!amount || amount <= 0}
              >
                <Text style={styles.nextBtnText}>{t("newtx.review")}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>{t("newtx.confirm")}</Text>

            <View style={styles.confirmCard}>
              <Row label={t("company")} value={selectedChurch?.company_name ?? ""} styles={styles} />
              <Row label={t("church")} value={selectedChurch?.name ?? ""} styles={styles} />
              <Row label={t("fuel.type")} value={selectedFuel?.name ?? ""} styles={styles} />
              <Row label={t("newtx.currency")} value={currency} styles={styles} />
              <Row label={t("amount.usd")} value={`$${amountUsd.toFixed(2)}`} styles={styles} />
              <Row label={t("amount.cdf")} value={`${amountCdf.toFixed(0)} FC`} styles={styles} />
              <View style={styles.levyHighlight}>
                <Text style={styles.levyLabel}>{t("levy")} (USD)</Text>
                <Text style={styles.levyValue}>${levyUsd.toFixed(4)}</Text>
              </View>
              <View style={styles.levyHighlight}>
                <Text style={styles.levyLabel}>{t("levy")} (CDF)</Text>
                <Text style={styles.levyValue}>{levyCdf.toFixed(2)} FC</Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <Pressable style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>{t("newtx.edit")}</Text>
              </Pressable>
              <Pressable
                style={[styles.nextBtn, { flex: 1, backgroundColor: colors.success }, submitting && { opacity: 0.6 }]}
                onPress={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.nextBtnText}>{t("newtx.submit")}</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, styles }: { label: string; value: string; styles: any }) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={styles.confirmValue}>{value}</Text>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    center: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
    loadingText: { color: colors.textSecondary, marginTop: 12 },

    // Step bar
    stepBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 32, paddingTop: 20 },
    stepDot: {
      width: 28, height: 28, borderRadius: 14, borderWidth: 2,
      borderColor: colors.border, backgroundColor: colors.surface,
      justifyContent: "center", alignItems: "center",
    },
    stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepDotText: { color: colors.textSecondary, fontWeight: "700", fontSize: 12 },
    stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: -14, zIndex: -1 },
    stepLineActive: { backgroundColor: colors.primary },
    stepLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 6, marginBottom: 20 },
    stepLabel: { fontSize: 11, color: colors.textSecondary, flex: 1, textAlign: "center" },
    stepLabelActive: { color: colors.primary, fontWeight: "600" },

    body: { flex: 1, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 },
    fieldHint: { fontSize: 11, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },

    chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
      paddingHorizontal: 16, paddingVertical: 10,
      borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textSecondary, fontWeight: "600" },
    chipTextActive: { color: colors.onPrimary },

    churchRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    churchRowActive: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
    churchName: { fontWeight: "600", color: colors.text, fontSize: 14 },
    churchSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

    currencyToggle: {
      flexDirection: "row", backgroundColor: colors.surface, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: "hidden",
    },
    currencyBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
    currencyBtnActive: { backgroundColor: colors.primary },
    currencyBtnText: { fontWeight: "700", color: colors.textSecondary },

    amountInput: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 16, color: colors.text, fontSize: 28, fontWeight: "700",
    },
    previewBox: {
      backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 16, marginTop: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    previewTitle: { fontSize: 11, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
    previewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    previewHighlight: {
      backgroundColor: colors.successBg, borderRadius: 8, padding: 10,
      marginTop: 4, marginBottom: 4,
    },
    previewLabel: { color: colors.textSecondary, fontSize: 13 },
    previewValue: { color: colors.text, fontWeight: "600", fontSize: 13 },

    confirmCard: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 18,
      borderWidth: 1, borderColor: colors.border, marginBottom: 20,
    },
    confirmRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.background },
    confirmLabel: { color: colors.textSecondary, fontSize: 13 },
    confirmValue: { color: colors.text, fontWeight: "600", fontSize: 13 },
    levyHighlight: {
      flexDirection: "row", justifyContent: "space-between",
      backgroundColor: colors.successBg, borderRadius: 8, padding: 10, marginTop: 8,
    },
    levyLabel: { color: colors.success, fontSize: 13 },
    levyValue: { color: colors.success, fontWeight: "700", fontSize: 13 },

    navRow: { flexDirection: "row", gap: 12 },
    nextBtn: {
      backgroundColor: colors.primary, borderRadius: 12, padding: 16,
      alignItems: "center", marginTop: 20,
    },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { color: colors.onPrimary, fontWeight: "700", fontSize: 16 },
    backBtn: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 16,
      alignItems: "center", marginTop: 20, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 20,
    },
    backBtnText: { color: colors.textSecondary, fontWeight: "600" },
  });
}

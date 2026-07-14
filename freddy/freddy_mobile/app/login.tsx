import { useState } from "react";
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
import { FontAwesome } from "@expo/vector-icons";
import { login } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import { useLanguage } from "../lib/LanguageContext";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t("login.missing.fields"), t("login.missing.fields.body"));
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace("/(tabs)");
    } catch {
      Alert.alert(t("login.failed"), t("login.failed.body"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <FontAwesome name="tint" size={32} color={colors.primary} />
          </View>
          <Text style={styles.appName}>LCI Agent</Text>
          <Text style={styles.appSub}>Lubumbashi Charity Fuel Initiative</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("login.welcome")}</Text>
          <Text style={styles.cardSub}>{t("login.welcome.sub")}</Text>

          {/* Username */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t("username")}</Text>
            <View style={[styles.inputRow, focusedField === "user" && styles.inputRowFocused]}>
              <FontAwesome name="user-o" size={15} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t("login.username.placeholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField("user")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t("password")}</Text>
            <View style={[styles.inputRow, focusedField === "pass" && styles.inputRowFocused]}>
              <FontAwesome name="lock" size={15} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t("login.password.placeholder")}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("pass")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPass((p) => !p)} style={styles.eyeBtn}>
                <FontAwesome name={showPass ? "eye-slash" : "eye"} size={15} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.btn, loading && styles.btnLoading]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <View style={styles.btnInner}>
                <Text style={styles.btnText}>{t("login.signin")}</Text>
                <FontAwesome name="arrow-right" size={14} color={colors.onPrimary} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>{t("login.footer")}</Text>
          <View style={styles.footerDot} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },

    logoWrap: { alignItems: "center", marginBottom: 36 },
    logoCircle: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1.5, borderColor: colors.border,
      justifyContent: "center", alignItems: "center",
      marginBottom: 16,
    },
    appName: { fontSize: 26, fontWeight: "800", color: colors.text, letterSpacing: 0.5 },
    appSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4, letterSpacing: 0.3 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 20, padding: 24,
      borderWidth: 1, borderColor: colors.border,
    },
    cardTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 },
    cardSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 28 },

    fieldWrap: { marginBottom: 18 },
    label: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.4 },
    inputRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    },
    inputRowFocused: { borderColor: colors.primary },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: colors.text, fontSize: 15 },
    eyeBtn: { padding: 4 },

    btn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 16, alignItems: "center", marginTop: 8,
    },
    btnLoading: { opacity: 0.7 },
    btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
    btnText: { color: colors.onPrimary, fontWeight: "700", fontSize: 16 },

    footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 36, gap: 8 },
    footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border },
    footerText: { fontSize: 11, color: colors.textSecondary },
  });
}

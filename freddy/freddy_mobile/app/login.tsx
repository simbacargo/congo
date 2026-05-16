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

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Login failed", "Invalid credentials. Please try again.");
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
            <FontAwesome name="tint" size={32} color="#3b82f6" />
          </View>
          <Text style={styles.appName}>LCI Agent</Text>
          <Text style={styles.appSub}>Lubumbashi Charity Fuel Initiative</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your agent account</Text>

          {/* Username */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Username</Text>
            <View style={[styles.inputRow, focusedField === "user" && styles.inputRowFocused]}>
              <FontAwesome name="user-o" size={15} color="#475569" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#334155"
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
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, focusedField === "pass" && styles.inputRowFocused]}>
              <FontAwesome name="lock" size={15} color="#475569" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor="#334155"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("pass")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPass((p) => !p)} style={styles.eyeBtn}>
                <FontAwesome name={showPass ? "eye-slash" : "eye"} size={15} color="#475569" />
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
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnInner}>
                <Text style={styles.btnText}>Sign In</Text>
                <FontAwesome name="arrow-right" size={14} color="#fff" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Secure · Offline-capable · 2% Charity Levy</Text>
          <View style={styles.footerDot} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },

  logoWrap: { alignItems: "center", marginBottom: 36 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#0f2040",
    borderWidth: 1.5, borderColor: "#1e3a5f",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
  },
  appName: { fontSize: 26, fontWeight: "800", color: "#f8fafc", letterSpacing: 0.5 },
  appSub: { fontSize: 12, color: "#475569", marginTop: 4, letterSpacing: 0.3 },

  card: {
    backgroundColor: "#111827",
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: "#1e2d45",
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#f8fafc", marginBottom: 4 },
  cardSub: { fontSize: 13, color: "#475569", marginBottom: 28 },

  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 8, letterSpacing: 0.4 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0a0f1e", borderWidth: 1, borderColor: "#1e2d45",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  inputRowFocused: { borderColor: "#3b82f6" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#f8fafc", fontSize: 15 },
  eyeBtn: { padding: 4 },

  btn: {
    backgroundColor: "#2563eb", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  btnLoading: { opacity: 0.7 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 36, gap: 8 },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#1e2d45" },
  footerText: { fontSize: 11, color: "#334155" },
});

import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage, type Language } from "../../lib/LanguageContext";

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      {/* Theme Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="sun-o" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("theme")}</Text>
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {theme === "dark" ? t("theme.dark") : t("theme.light")}
            </Text>
            <Text style={[styles.settingHint, { color: colors.textSecondary }]}>
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </Text>
          </View>
          <Pressable
            style={[styles.toggleButton, { backgroundColor: theme === "dark" ? colors.primary : colors.surfaceAlt }]}
            onPress={toggleTheme}
          >
            <FontAwesome name={theme === "dark" ? "moon-o" : "sun-o"} size={16} color={theme === "dark" ? "#fff" : colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Language Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="language" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("language")}</Text>
        </View>

        {["en", "fr", "sw"].map((lang, idx) => (
          <Pressable
            key={lang}
            style={[
              styles.languageOption,
              language === lang && [styles.languageOptionActive, { backgroundColor: colors.primary }],
              idx < 2 && [styles.languageOptionBorder, { borderBottomColor: colors.border }],
            ]}
            onPress={() => setLanguage(lang as Language)}
          >
            <Text
              style={[
                styles.languageLabel,
                { color: language === lang ? (colors.text === "#f8fafc" ? "#fff" : "#0f172a") : colors.text },
              ]}
            >
              {lang === "en" && t("language.english")}
              {lang === "fr" && t("language.french")}
              {lang === "sw" && t("language.swahili")}
            </Text>
            {language === lang && <FontAwesome name="check" size={16} color={colors.text === "#f8fafc" ? "#fff" : "#0f172a"} />}
          </Pressable>
        ))}
      </View>

      {/* Printer Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="print" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Printer</Text>
        </View>

        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push("/settings/printer")}
        >
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Thermal Printer</Text>
            <Text style={[styles.settingHint, { color: colors.textSecondary }]}>Configure Bluetooth printer</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },

    section: {
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 20,
      borderWidth: 1,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
    },

    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    settingHint: {
      fontSize: 12,
    },

    toggleButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },

    languageOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    languageOptionBorder: {},
    languageOptionActive: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    languageLabel: {
      fontSize: 15,
      fontWeight: "500",
    },
  });
}

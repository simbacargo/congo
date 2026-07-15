import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider as NavThemeProvider } from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ThemeProvider } from "../lib/ThemeContext";
import { LanguageProvider } from "../lib/LanguageContext";
import { useTheme } from "../lib/ThemeContext";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = { initialRouteName: "(tabs)" };

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { colors } = useTheme();
  const [loaded, error] = useFonts({ ...FontAwesome.font });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/new"
          options={{ title: "New Transaction", headerBackTitle: "Home" }}
        />
        <Stack.Screen
          name="transaction/success"
          options={{ title: "Receipt", headerBackVisible: false }}
        />
        <Stack.Screen
          name="transaction/detail"
          options={{ title: "Transaction Detail", headerBackTitle: "History" }}
        />
        <Stack.Screen name="verify" options={{ title: "Verify Receipt" }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="driver/[id]"
          options={{ title: "Driver", headerBackTitle: "Scan" }}
        />
      </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NavThemeProvider value={DarkTheme}>
          <RootLayoutContent />
        </NavThemeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = { initialRouteName: "(tabs)" };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...FontAwesome.font });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0f1e" },
          headerTintColor: "#f8fafc",
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#0a0f1e" },
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
        <Stack.Screen name="settings/printer" options={{ title: "Thermal Printer" }} />
        <Stack.Screen
          name="driver/[id]"
          options={{ title: "Driver", headerBackTitle: "Scan" }}
        />
      </Stack>
    </ThemeProvider>
  );
}

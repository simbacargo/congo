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
      <Stack screenOptions={{ headerStyle: { backgroundColor: "#0f172a" }, headerTintColor: "#f1f5f9" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="transaction/new" options={{ title: "New Transaction", headerBackTitle: "Home" }} />
        <Stack.Screen name="transaction/success" options={{ title: "Receipt", headerBackVisible: false }} />
        <Stack.Screen name="verify" options={{ title: "Verify Receipt" }} />
      </Stack>
    </ThemeProvider>
  );
}

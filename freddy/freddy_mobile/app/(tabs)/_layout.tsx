import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";

function TabIcon({ name, color }: { name: React.ComponentProps<typeof FontAwesome>["name"]; color: string }) {
  return <FontAwesome name={name} size={20} color={color} />;
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("nav.history"),
          headerTitle: t("nav.history.title"),
          tabBarIcon: ({ color }) => <TabIcon name="list-ul" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t("nav.scan"),
          headerTitle: t("nav.scan.title"),
          tabBarIcon: ({ color }) => <TabIcon name="qrcode" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t("nav.analytics"),
          headerTitle: t("nav.analytics.title"),
          tabBarIcon: ({ color }) => <TabIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.profile"),
          headerTitle: t("nav.profile.title"),
          tabBarIcon: ({ color }) => <TabIcon name="user-circle-o" color={color} />,
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}

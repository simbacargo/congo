import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme = "light" | "dark";

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  primary: string;
  surfaceAlt: string;
  accent: string;
  onPrimary: string;
  successBg: string;
  successBorder: string;
  warningBg: string;
  warningBorder: string;
  dangerBg: string;
  dangerBorder: string;
}

export const themes: Record<Theme, ThemeColors> = {
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    textSecondary: "#475569",
    border: "#e2e8f0",
    success: "#16a34a",
    warning: "#ca8a04",
    error: "#dc2626",
    primary: "#1e40af",
    surfaceAlt: "#f1f5f9",
    accent: "#4f46e5",
    onPrimary: "#ffffff",
    successBg: "#dcfce7",
    successBorder: "#86efac",
    warningBg: "#fef3c7",
    warningBorder: "#fde68a",
    dangerBg: "#fee2e2",
    dangerBorder: "#fecaca",
  },
  dark: {
    background: "#0a0f1e",
    surface: "#111827",
    text: "#f8fafc",
    textSecondary: "#64748b",
    border: "#1e2d45",
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#ef4444",
    primary: "#60a5fa",
    surfaceAlt: "#1e3a5f",
    accent: "#818cf8",
    onPrimary: "#ffffff",
    successBg: "#052e16",
    successBorder: "#166534",
    warningBg: "#451a03",
    warningBorder: "#78350f",
    dangerBg: "#450a0a",
    dangerBorder: "#7f1d1d",
  },
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("theme").then((savedTheme) => {
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
      setLoaded(true);
    });
  }, []);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, colors: themes[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

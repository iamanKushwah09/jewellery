import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

// Curated Enterprise Color Presets
export const COLOR_PRESETS = [
  { id: "purple", name: "Ynex Purple (Default)", primary: "#845adf", hover: "#7344d4" },
  { id: "blue", name: "Royal Blue", primary: "#2563eb", hover: "#1d4ed8" },
  { id: "emerald", name: "Emerald Green", primary: "#10b981", hover: "#059669" },
  { id: "orange", name: "Sunset Orange", primary: "#f97316", hover: "#ea580c" },
  { id: "red", name: "Crimson Red", primary: "#ef4444", hover: "#dc2626" },
  { id: "indigo", name: "Modern Indigo", primary: "#6366f1", hover: "#4f46e5" },
  { id: "cyan", name: "Ocean Teal", primary: "#0ea5e9", hover: "#0284c7" },
  { id: "rose", name: "Rose Pink", primary: "#f43f5e", hover: "#e11d48" },
];

// Curated Google Font Presets
export const FONT_PRESETS = [
  { id: "plus-jakarta", name: "Plus Jakarta Sans (Default)", family: "'Plus Jakarta Sans', sans-serif", sample: "The quick brown fox jumps" },
  { id: "inter", name: "Inter", family: "'Inter', sans-serif", sample: "The quick brown fox jumps" },
  { id: "outfit", name: "Outfit", family: "'Outfit', sans-serif", sample: "The quick brown fox jumps" },
  { id: "poppins", name: "Poppins", family: "'Poppins', sans-serif", sample: "The quick brown fox jumps" },
  { id: "roboto", name: "Roboto", family: "'Roboto', sans-serif", sample: "The quick brown fox jumps" },
  { id: "public-sans", name: "Public Sans", family: "'Public Sans', sans-serif", sample: "The quick brown fox jumps" },
  { id: "dm-sans", name: "DM Sans", family: "'DM Sans', sans-serif", sample: "The quick brown fox jumps" },
];

export const DEFAULT_THEME_CONFIG = {
  primaryColor: "#845adf",
  primaryHover: "#7344d4",
  themeMode: "light", // 'light' | 'dark' | 'auto'
  sidebarTheme: "dark", // 'dark' | 'light'
  fontId: "plus-jakarta",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const STORAGE_KEY = "admin_theme_customization";

export const ThemeCustomizerContext = createContext();

// Helper: Convert Hex color to RGB string "r, g, b"
function hexToRgb(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

// Helper: Slightly darken a hex color for hover states
function darkenHex(hex, percent = 12) {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  let num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent / 100))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent / 100))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const ThemeCustomizerProvider = ({ children }) => {
  // Load initial settings from localStorage or fallback to defaults
  const [themeSettings, setThemeSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_THEME_CONFIG, ...parsed };
      }
    } catch (err) {
      console.warn("Failed to load theme settings from localStorage:", err);
    }
    return DEFAULT_THEME_CONFIG;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Apply CSS variables and class to DOM whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    const { primaryColor, primaryHover, themeMode, sidebarTheme, fontFamily } = themeSettings;

    const rgb = hexToRgb(primaryColor || "#845adf");
    const hoverColor = primaryHover || darkenHex(primaryColor);

    // Set dynamic CSS variables on :root
    root.style.setProperty("--primary-color", primaryColor);
    root.style.setProperty("--primary-hover", hoverColor);
    root.style.setProperty("--primary-rgb", rgb);
    root.style.setProperty("--primary-light", `rgba(${rgb}, 0.1)`);
    root.style.setProperty("--primary-ring", `rgba(${rgb}, 0.25)`);
    root.style.setProperty("--sidebar-theme", sidebarTheme);

    // Set dynamic Font Family
    const activeFontFamily = fontFamily || "'Plus Jakarta Sans', sans-serif";
    root.style.setProperty("--font-sans", activeFontFamily);
    document.body.style.fontFamily = activeFontFamily;

    // Handle Light / Dark / Auto Mode
    let isDark = false;
    if (themeMode === "dark") {
      isDark = true;
    } else if (themeMode === "auto") {
      isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = false;
    }

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(themeSettings));
    } catch (err) {
      console.warn("Failed to save theme settings to localStorage:", err);
    }
  }, [themeSettings]);

  // Set Primary Color (custom or preset)
  const setPrimaryColor = (hex, hoverHex = null) => {
    const hover = hoverHex || darkenHex(hex);
    setThemeSettings((prev) => ({
      ...prev,
      primaryColor: hex,
      primaryHover: hover,
    }));
  };

  // Set Theme Mode (light, dark, auto)
  const setThemeMode = (mode) => {
    setThemeSettings((prev) => ({
      ...prev,
      themeMode: mode,
    }));
  };

  // Toggle between light and dark mode
  const toggleThemeMode = () => {
    setThemeSettings((prev) => ({
      ...prev,
      themeMode: prev.themeMode === "dark" ? "light" : "dark",
    }));
  };

  // Set Sidebar Theme (dark, light)
  const setSidebarTheme = (sbTheme) => {
    setThemeSettings((prev) => ({
      ...prev,
      sidebarTheme: sbTheme,
    }));
  };

  // Set Font
  const setFont = (fontId) => {
    const preset = FONT_PRESETS.find((f) => f.id === fontId);
    if (preset) {
      setThemeSettings((prev) => ({
        ...prev,
        fontId: preset.id,
        fontFamily: preset.family,
      }));
    }
  };

  // Reset to Factory Defaults
  const resetToDefaults = () => {
    setThemeSettings(DEFAULT_THEME_CONFIG);
  };

  const contextValue = useMemo(
    () => ({
      ...themeSettings,
      setPrimaryColor,
      setThemeMode,
      toggleThemeMode,
      setSidebarTheme,
      setFont,
      resetToDefaults,
      isCustomizerOpen,
      setIsCustomizerOpen,
      openCustomizer: () => setIsCustomizerOpen(true),
      closeCustomizer: () => setIsCustomizerOpen(false),
      toggleCustomizer: () => setIsCustomizerOpen((prev) => !prev),
    }),
    [themeSettings, isCustomizerOpen]
  );

  return (
    <ThemeCustomizerContext.Provider value={contextValue}>
      {children}
    </ThemeCustomizerContext.Provider>
  );
};

export const useThemeCustomizer = () => {
  const context = useContext(ThemeCustomizerContext);
  if (!context) {
    throw new Error("useThemeCustomizer must be used within a ThemeCustomizerProvider");
  }
  return context;
};

export default ThemeCustomizerContext;

import React from "react";
import { Link } from "react-router-dom";
import {
  FiX,
  FiSun,
  FiMoon,
  FiCheck,
  FiRotateCcw,
  FiSliders,
  FiExternalLink,
} from "react-icons/fi";
import { useThemeCustomizer, COLOR_PRESETS, FONT_PRESETS } from "@/context/ThemeCustomizerContext";
import { notifySuccess } from "@/utils/toast";

const ThemeCustomizerDrawer = () => {
  const {
    primaryColor,
    setPrimaryColor,
    themeMode,
    setThemeMode,
    sidebarTheme,
    setSidebarTheme,
    fontId,
    setFont,
    resetToDefaults,
    isCustomizerOpen,
    closeCustomizer,
  } = useThemeCustomizer();

  if (!isCustomizerOpen) return null;

  const handleReset = () => {
    resetToDefaults();
    notifySuccess("Theme restored to default!");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCustomizer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white dark:bg-[#111c43] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col border-l border-[#e9edf4] dark:border-[#263168]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e9edf4] dark:border-[#263168] px-6 py-4.5 bg-[#f0f1f7]/40 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                <FiSliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2c3138] dark:text-white">
                  Theme Customizer
                </h3>
                <p className="text-[11px] text-[#8c9097]">
                  Customize colors, appearance & layout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                title="Reset to default"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] text-[#8c9097] hover:text-[#e6533c] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <FiRotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={closeCustomizer}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] text-[#8c9097] hover:text-[#2c3138] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
            {/* 1. Theme Mode - Hidden: light theme is default */}
            {/* <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#8c9097] block mb-3">
                Theme Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setThemeMode("light")}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    themeMode === "light"
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/20 text-[var(--primary-color)]"
                      : "border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#2c3138] dark:text-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                    <FiSun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Light Mode</span>
                    <span className="block text-[10px] text-[#8c9097]">Crisp canvas</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode("dark")}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    themeMode === "dark"
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/20 text-[var(--primary-color)]"
                      : "border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#2c3138] dark:text-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-900/30 text-indigo-400">
                    <FiMoon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Dark Mode</span>
                    <span className="block text-[10px] text-[#8c9097]">Midnight navy</span>
                  </div>
                </button>
              </div>
            </div> */}

            {/* 2. Theme Primary Colors */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8c9097]">
                  Theme Primary Color
                </label>
                <span className="font-mono text-xs font-semibold uppercase text-[var(--primary-color)] bg-[var(--primary-color)]/10 px-2 py-0.5 rounded">
                  {primaryColor}
                </span>
              </div>

              {/* Color Presets Grid */}
              <div className="grid grid-cols-4 gap-2.5 mb-4">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = primaryColor?.toLowerCase() === preset.primary.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPrimaryColor(preset.primary, preset.hover)}
                      title={preset.name}
                      className={`relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                        isSelected
                          ? "border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/30 scale-[1.03]"
                          : "border-[#e9edf4] dark:border-[#263168] hover:scale-[1.02] bg-gray-50/50 dark:bg-white/[0.02]"
                      }`}
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm text-white"
                        style={{ backgroundColor: preset.primary }}
                      >
                        {isSelected && <FiCheck className="w-3.5 h-3.5" />}
                      </span>
                      <span className="mt-1.5 text-[10px] font-medium text-[#536485] dark:text-[#a3aed1] truncate max-w-[64px]">
                        {preset.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-3 rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-[#f0f1f7]/40 dark:bg-white/[0.02] p-2.5">
                <div className="relative flex items-center justify-center">
                  <input
                    type="color"
                    id="theme-custom-color-picker"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="theme-custom-color-picker" className="block text-xs font-semibold text-[#2c3138] dark:text-white cursor-pointer">
                    Custom Hex Color
                  </label>
                  <span className="block text-[11px] text-[#8c9097]">
                    Click swatch to pick any color
                  </span>
                </div>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith("#") && (val.length === 4 || val.length === 7)) {
                      setPrimaryColor(val);
                    }
                  }}
                  className="w-20 rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] px-2 py-1 text-center font-mono text-xs text-[#2c3138] dark:text-white outline-none focus:border-[var(--primary-color)]"
                  placeholder="#845adf"
                />
              </div>
            </div>

            {/* 3. Typography & Font Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8c9097]">
                  Typography Font
                </label>
                <span className="text-[11px] font-bold text-[var(--primary-color)]">
                  {FONT_PRESETS.find((f) => f.id === fontId)?.name.split(" ")[0] || "Default"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FONT_PRESETS.map((font) => {
                  const isSelected = fontId === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setFont(font.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/25 text-[var(--primary-color)]"
                          : "border-[#e9edf4] dark:border-[#263168] bg-gray-50/50 dark:bg-white/[0.02] text-[#2c3138] dark:text-white hover:border-gray-300"
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      <div className="overflow-hidden">
                        <span className="block text-xs font-bold truncate max-w-[120px]">
                          {font.name.split(" ")[0]}
                        </span>
                        <span className="block text-[10px] text-[#8c9097]">
                          Aa Bb Gg 123
                        </span>
                      </div>
                      {isSelected && (
                        <FiCheck className="w-3.5 h-3.5 flex-shrink-0 text-[var(--primary-color)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Live Component Showcase */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#8c9097] block mb-2.5">
                Live Element Preview
              </label>
              <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--primary-color)] bg-[var(--primary-color)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary-color)] transition"
                  >
                    Light Button
                  </button>
                  <span className="rounded-full bg-[var(--primary-color)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--primary-color)]">
                    Active Badge
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="h-4 w-4 rounded text-[var(--primary-color)] focus:ring-[var(--primary-color)] accent-[var(--primary-color)] cursor-pointer"
                  />
                  <span className="text-xs text-[#536485] dark:text-[#a3aed1]">
                    Checkbox with accent color
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#e9edf4] dark:border-[#263168] p-4 bg-[#f0f1f7]/30 dark:bg-white/[0.02] flex items-center justify-between">
            <Link
              to="/theme-settings"
              onClick={closeCustomizer}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary-color)] hover:underline"
            >
              <span>Full Settings Page</span>
              <FiExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                notifySuccess("Theme preferences saved!");
                closeCustomizer();
              }}
              className="rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizerDrawer;

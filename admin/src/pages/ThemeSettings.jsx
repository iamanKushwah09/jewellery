import React, { useState } from "react";
import {
  FiSun,
  FiMoon,
  FiMonitor,
  FiCheck,
  FiRotateCcw,
  FiSave,
  FiSliders,
  FiEye,
  FiLayers,
  FiCheckCircle,
  FiType,
} from "react-icons/fi";
import PageTitle from "@/components/Typography/PageTitle";
import { useThemeCustomizer, COLOR_PRESETS, FONT_PRESETS } from "@/context/ThemeCustomizerContext";
import { notifySuccess } from "@/utils/toast";

const ThemeSettings = () => {
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
  } = useThemeCustomizer();

  const [saving, setSaving] = useState(false);
  const [customHexInput, setCustomHexInput] = useState(primaryColor);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      notifySuccess("Theme and color settings saved successfully!");
    }, 400);
  };

  const handleReset = () => {
    resetToDefaults();
    setCustomHexInput("#845adf");
    notifySuccess("Theme restored to default Ynex style!");
  };

  return (
    <div className="sm:container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e9edf4] dark:border-[#263168] pb-5">
        <div>
          <PageTitle>Theme & Color Settings</PageTitle>
          <p className="text-xs sm:text-sm text-[#536485] dark:text-[#a3aed1] mt-1">
            Customize the admin portal appearance, brand colors, and display preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] hover:text-[#e6533c] hover:border-red-300 dark:hover:border-red-900 transition-all shadow-xs"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">Saving...</span>
            ) : (
              <>
                <FiSave className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Theme Mode - Hidden: light theme is default */}
          {/* <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                <FiSun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2c3138] dark:text-white">
                  Appearance Mode
                </h3>
                <p className="text-xs text-[#8c9097]">
                  Choose between light, dark, or system preference
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  themeMode === "light"
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/25 text-[var(--primary-color)]"
                    : "border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/40 text-[#536485] dark:text-[#a3aed1] hover:border-gray-300"
                }`}
              >
                {themeMode === "light" && (
                  <span className="absolute top-2.5 right-2.5 text-[var(--primary-color)]">
                    <FiCheckCircle className="w-4 h-4" />
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-2">
                  <FiSun className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Light</span>
                <span className="text-[11px] text-[#8c9097] mt-0.5">Crisp & Clean</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  themeMode === "dark"
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/25 text-[var(--primary-color)]"
                    : "border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/40 text-[#536485] dark:text-[#a3aed1] hover:border-gray-300"
                }`}
              >
                {themeMode === "dark" && (
                  <span className="absolute top-2.5 right-2.5 text-[var(--primary-color)]">
                    <FiCheckCircle className="w-4 h-4" />
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 mb-2">
                  <FiMoon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Dark</span>
                <span className="text-[11px] text-[#8c9097] mt-0.5">Midnight Navy</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode("auto")}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  themeMode === "auto"
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/25 text-[var(--primary-color)]"
                    : "border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/40 text-[#536485] dark:text-[#a3aed1] hover:border-gray-300"
                }`}
              >
                {themeMode === "auto" && (
                  <span className="absolute top-2.5 right-2.5 text-[var(--primary-color)]">
                    <FiCheckCircle className="w-4 h-4" />
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-300 mb-2">
                  <FiMonitor className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">System</span>
                <span className="text-[11px] text-[#8c9097] mt-0.5">Follows OS</span>
              </button>
            </div>
          </div> */}

          {/* Card 2: Primary Brand Color Presets */}
          <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                  <FiSliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2c3138] dark:text-white">
                    Primary Brand Color
                  </h3>
                  <p className="text-xs text-[#8c9097]">
                    Select an enterprise preset or pick your custom brand color
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full shadow-xs ring-2 ring-white dark:ring-[#1a2352]"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="font-mono text-xs font-bold uppercase text-[#2c3138] dark:text-white">
                  {primaryColor}
                </span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = primaryColor?.toLowerCase() === preset.primary.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(preset.primary, preset.hover);
                      setCustomHexInput(preset.primary);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/25 shadow-xs"
                        : "border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/40 hover:border-gray-300"
                      }`}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-xs flex-shrink-0"
                      style={{ backgroundColor: preset.primary }}
                    >
                      {isSelected && <FiCheck className="w-4 h-4" />}
                    </span>
                    <div className="overflow-hidden">
                      <span className="block text-xs font-bold text-[#2c3138] dark:text-white truncate">
                        {preset.name.split(" ")[0]}
                      </span>
                      <span className="block font-mono text-[10px] text-[#8c9097] uppercase">
                        {preset.primary}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input Section */}
            <div className="border-t border-[#e9edf4] dark:border-[#263168] pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9097] mb-2.5">
                Custom Color Picker
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/50 p-2.5">
                  <input
                    type="color"
                    id="settings-color-picker"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setCustomHexInput(e.target.value);
                    }}
                    className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="settings-color-picker"
                      className="block text-xs font-bold text-[#2c3138] dark:text-white cursor-pointer"
                    >
                      Select Custom Hex Code
                    </label>
                    <span className="block text-[11px] text-[#8c9097]">
                      Click icon for interactive color wheel
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8c9097]">HEX:</span>
                  <input
                    type="text"
                    value={customHexInput}
                    onChange={(e) => {
                      setCustomHexInput(e.target.value);
                      if (
                        e.target.value.startsWith("#") &&
                        (e.target.value.length === 4 || e.target.value.length === 7)
                      ) {
                        setPrimaryColor(e.target.value);
                      }
                    }}
                    className="w-28 rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] px-3 py-2 text-center font-mono text-xs font-bold text-[#2c3138] dark:text-white outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/20"
                    placeholder="#845adf"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Typography & Font Family */}
          <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                  <FiType className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2c3138] dark:text-white">
                    Typography & Font Family
                  </h3>
                  <p className="text-xs text-[#8c9097]">
                    Choose the primary typeface across the admin dashboard
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-[var(--primary-color)] bg-[var(--primary-color)]/10 px-2.5 py-1 rounded-md">
                {FONT_PRESETS.find((f) => f.id === fontId)?.name || "Plus Jakarta Sans"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FONT_PRESETS.map((font) => {
                const isSelected = fontId === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setFont(font.id)}
                    className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${isSelected
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/25 shadow-xs"
                        : "border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/40 hover:border-gray-300"
                      }`}
                    style={{ fontFamily: font.family }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2c3138] dark:text-white">
                          {font.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#536485] dark:text-[#a3aed1]">
                        {font.sample}
                      </p>
                      <span className="inline-block text-[10px] text-[#8c9097] font-mono">
                        0123456789 • ABCDEF • abcdef
                      </span>
                    </div>

                    <div className="pt-0.5 pl-2">
                      {isSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary-color)] text-white text-xs shadow-xs">
                          <FiCheck className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Live Component Showcase Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-5 shadow-xs sticky top-24">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#e9edf4] dark:border-[#263168]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                <FiEye className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2c3138] dark:text-white">
                  Live Component Preview
                </h3>
                <p className="text-xs text-[#8c9097]">
                  Instant preview with your active color
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Preview 1: Buttons */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8c9097] mb-2">
                  Action Buttons
                </span>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)] px-4 py-2 text-xs font-bold transition-all"
                  >
                    Soft Button
                  </button>
                </div>
              </div>

              {/* Preview 2: Badges & Tags */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8c9097] mb-2">
                  Status Badges & Tags
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--primary-color)] text-white px-2.5 py-0.5 text-[11px] font-bold">
                    Primary
                  </span>
                  <span className="rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] px-2.5 py-0.5 text-[11px] font-bold">
                    Subtle Badge
                  </span>
                  <span className="rounded-md border border-[var(--primary-color)]/30 text-[var(--primary-color)] px-2 py-0.5 text-[10px] font-semibold">
                    Outline Tag
                  </span>
                </div>
              </div>

              {/* Preview 3: Active Menu Item */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8c9097] mb-2">
                  Sidebar Active Link
                </span>
                <div className="rounded-lg bg-[#111c43] p-2">
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-white bg-[var(--primary-color)] shadow-md">
                    <FiLayers className="w-4 h-4" />
                    <span>Active Navigation Menu</span>
                  </div>
                </div>
              </div>

              {/* Preview 4: Form Input with Dynamic Focus Ring */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8c9097] mb-2">
                  Form Input & Focus Ring
                </span>
                <input
                  type="text"
                  defaultValue="Active form field focus state"
                  className="w-full rounded-md border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43] px-3 py-1.5 text-xs text-[#2c3138] dark:text-white outline-none focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/20 transition-all"
                />
              </div>

              {/* Preview 5: Accent Card */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8c9097] mb-2">
                  Accent Card
                </span>
                <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/40 p-3.5 border-t-4 border-t-[var(--primary-color)] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2c3138] dark:text-white">
                      Metric Summary
                    </span>
                    <span className="text-xs font-bold text-[var(--primary-color)]">
                      +28.4%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8c9097] mt-1">
                    Card border accent adapts to your chosen brand color.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;

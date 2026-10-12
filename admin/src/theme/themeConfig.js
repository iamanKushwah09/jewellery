/**
 * ============================================================================
 * Central Theme & Typography Configuration (Ynex by Spruko)
 * ============================================================================
 * 
 * Saare theme tokens, typography, colors, dashboard card presets, aur visual
 * styles is ek file mein define hain.
 * 
 * Agar baad mein aapko:
 * 1. Font badalna ho -> `typography.fontFamily.primary` change karein.
 * 2. Primary brand color badalna ho -> `colors.primary` change karein.
 * 3. Card ke borders ya shadows change karne ho -> `cards.premium` change karein.
 * 4. Dashboard metrics ke colors/icons tweak karne ho -> `dashboard` object modify karein.
 * 
 * Sabhi components yahan se directly tokens inherit karte hain!
 * ============================================================================
 */

export const themeConfig = {
  // Brand & Metadata
  meta: {
    themeName: "Ynex Spruko Premium",
    version: "3.0.0",
    author: "Enterprise",
  },

  // Typography Settings
  typography: {
    fontFamily: {
      primary: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      secondary: "'Inter', sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    headingScale: {
      h1: "text-2xl sm:text-3xl font-extrabold tracking-tight",
      h2: "text-xl sm:text-2xl font-bold tracking-tight",
      h3: "text-lg sm:text-xl font-bold tracking-normal",
      h4: "text-base font-semibold",
    },
  },

  // Master Ynex Color Palette
  colors: {
    // Brand Primaries (Ynex Signature Violet-Indigo)
    primary: "#845adf",          // Ynex Signature Purple / Violet-Indigo
    primaryHover: "#7344d4",     // Deep Ynex Purple
    primaryLight: "rgba(132, 90, 223, 0.08)",
    primaryBorder: "rgba(132, 90, 223, 0.2)",

    // Surfaces & Layout (Ynex Canvas & Card Borders)
    canvas: "#f0f1f7",           // Clean soft light-slate canvas
    surface: "#ffffff",          // Pure white card background
    surfaceAlt: "#f9fafc",       // Subtle table header / secondary surface
    stroke: "#e9edf4",           // Ynex crisp card / input border
    strokeStrong: "#d5dbe5",     // Divider border

    // Ynex Midnight Dark Mode Elements
    dark: {
      bg: "#111c43",             // Deep Midnight Royal Navy
      card: "#1a2352",           // Elevated dark card
      sidebar: "#111c43",        // Midnight sidebar
      sidebarActive: "#845adf",   // Active purple highlight
      border: "#263168",         // Subtle dark border
      textMuted: "#a3aed1",      // Muted dark text
    },

    // Typography Colors
    text: {
      heading: "#2c3138",        // Deep crisp heading
      body: "#536485",           // Ynex slate body text
      muted: "#8c9097",          // Subtitle / Label
      inverse: "#ffffff",
    },

    // Semantic States (Ynex Accents)
    status: {
      success: "#26bf94",        // Mint Emerald
      successLight: "rgba(38, 191, 148, 0.1)",
      warning: "#f5b849",        // Amber Gold
      warningLight: "rgba(245, 184, 73, 0.1)",
      danger: "#e6533c",         // Coral Danger
      dangerLight: "rgba(230, 83, 60, 0.1)",
      info: "#23b7e5",           // Cyan Info
      infoLight: "rgba(35, 183, 229, 0.1)",
      purple: "#845adf",         // Signature Violet
      purpleLight: "rgba(132, 90, 223, 0.1)",
      teal: "#12b886",           // Teal
      tealLight: "rgba(18, 184, 134, 0.1)",
    },
  },

  // Card & Container Presets (Ynex Crisp Border Style)
  cards: {
    // Main Ynex card with minimal border, subtle shadow, and smooth hover
    premium:
      "rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 relative overflow-hidden",

    // Transparent glass card
    glass:
      "backdrop-blur-md bg-white/95 dark:bg-[#111c43]/90 border border-[#e9edf4] dark:border-[#263168] shadow-sm rounded-xl",

    // Interactive clickable card
    interactive:
      "rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
  },

  // Dashboard Specific Configuration & Presets (Ynex)
  dashboard: {
    // 5 Financial / Revenue Metric Cards
    salesCards: {
      today: {
        accent: "#845adf",
        topAccentClass: "from-[#845adf] to-[#ba9df9]",
        iconBg: "bg-[#845adf]/10 text-[#845adf]",
        badge: "Today's Pulse",
      },
      yesterday: {
        accent: "#f5b849",
        topAccentClass: "from-[#f5b849] to-[#fde199]",
        iconBg: "bg-[#f5b849]/10 text-[#f5b849]",
        badge: "Previous Day",
      },
      thisMonth: {
        accent: "#26bf94",
        topAccentClass: "from-[#26bf94] to-[#7be6c9]",
        iconBg: "bg-[#26bf94]/10 text-[#26bf94]",
        badge: "Current Month",
      },
      lastMonth: {
        accent: "#23b7e5",
        topAccentClass: "from-[#23b7e5] to-[#8fe1f9]",
        iconBg: "bg-[#23b7e5]/10 text-[#23b7e5]",
        badge: "Past Month",
      },
      allTime: {
        accent: "#845adf",
        topAccentClass: "from-[#845adf] to-[#5b3eb3]",
        iconBg: "bg-[#845adf]/15 text-[#845adf]",
        badge: "Lifetime Gross",
      },
    },

    // 4 Operational Order KPI Cards
    orderCards: {
      total: {
        label: "Total Orders",
        iconBg: "bg-[#f5b849]/10 text-[#f5b849]",
        dotColor: "bg-[#f5b849]",
        borderClass: "hover:border-[#f5b849]",
      },
      pending: {
        label: "Orders Pending",
        iconBg: "bg-[#845adf]/10 text-[#845adf]",
        dotColor: "bg-[#845adf]",
        borderClass: "hover:border-[#845adf]",
      },
      processing: {
        label: "Orders Processing",
        iconBg: "bg-[#23b7e5]/10 text-[#23b7e5]",
        dotColor: "bg-[#23b7e5]",
        borderClass: "hover:border-[#23b7e5]",
      },
      delivered: {
        label: "Orders Delivered",
        iconBg: "bg-[#26bf94]/10 text-[#26bf94]",
        dotColor: "bg-[#26bf94]",
        borderClass: "hover:border-[#26bf94]",
      },
    },

    // Chart Palette Tokens (Ynex)
    charts: {
      lineChartSales: "#845adf",
      lineChartOrders: "#26bf94",
      piePalette: [
        "#845adf", // Ynex Violet
        "#26bf94", // Mint Emerald
        "#f5b849", // Amber Gold
        "#23b7e5", // Cyan Info
        "#e6533c", // Coral Danger
        "#7344d4", // Deep Violet
      ],
    },
  },
};

export default themeConfig;

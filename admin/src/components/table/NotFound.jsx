import React, { useContext, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { SidebarContext } from "@/context/SidebarContext";

const PATH_ENTITY_MAP = {
  "/item": { singular: "Item", plural: "Items" },
  "/items": { singular: "Item", plural: "Items" },
  "/item-group": { singular: "Item Group", plural: "Item Groups" },
  "/salesman": { singular: "Salesman", plural: "Salesmen" },
  "/sales-man": { singular: "Salesman", plural: "Salesmen" },
  "/vendor-group": { singular: "Vendor Group", plural: "Vendor Groups" },
  "/category": { singular: "Category", plural: "Categories" },
  "/categories": { singular: "Category", plural: "Categories" },
  "/brand": { singular: "Brand", plural: "Brands" },
  "/unit": { singular: "Unit", plural: "Units" },
  "/attributes": { singular: "Attribute", plural: "Attributes" },
  "/attribute-group": { singular: "Attribute Group", plural: "Attribute Groups" },
  "/attribute-value": { singular: "Attribute Value", plural: "Attribute Values" },
  "/coupons": { singular: "Coupon", plural: "Coupons" },
  "/promocode": { singular: "Promo Code", plural: "Promo Codes" },
  "/promo-code": { singular: "Promo Code", plural: "Promo Codes" },
  "/shipping": { singular: "Shipping Rule", plural: "Shipping Rules" },
  "/banner": { singular: "Banner", plural: "Banners" },
  "/stock": { singular: "Stock", plural: "Stock" },
  "/role": { singular: "Role", plural: "Roles" },
  "/our-staff": { singular: "Staff", plural: "Staff Members" },
  "/customers": { singular: "Customer", plural: "Customers" },
  "/customer-order": { singular: "Order", plural: "Orders" },
  "/orders": { singular: "Order", plural: "Orders" },
  "/sale": { singular: "Sale", plural: "Sales" },
  "/sale-order": { singular: "Sale Order", plural: "Sale Orders" },
  "/dispatch": { singular: "Dispatch", plural: "Dispatches" },
  "/offer": { singular: "Offer", plural: "Offers" },
  "/languages": { singular: "Language", plural: "Languages" },
  "/currencies": { singular: "Currency", plural: "Currencies" },
};

const NotFound = ({
  title = "Records",
  subtitle,
  buttonTitle,
  btnText,
  onRefresh,
  showButton = true,
}) => {
  const { toggleDrawer } = useContext(SidebarContext) || {};
  const history = useHistory();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Normalize path without trailing slashes
  const currentPath = (location?.pathname || "").replace(/\/+$/, "") || "/";
  const pathEntity = PATH_ENTITY_MAP[currentPath];

  // Smart sanitization to clean up raw titles
  const getEntityTitle = () => {
    // If the page mistakenly passed "role" while not on /role, use the route entity
    const lowerTitle = (title || "").toLowerCase();
    const isMismatchedRole = lowerTitle.includes("role") && currentPath !== "/role";
    if (pathEntity && (isMismatchedRole || !title || lowerTitle.includes("records"))) {
      return `No ${pathEntity.plural} Found`;
    }

    if (!title) return pathEntity ? `No ${pathEntity.plural} Found` : "No Records Found";
    const lower = title.toLowerCase();
    if (lower.includes("no orders") || lower.includes("order")) return "No Orders Found";
    if (lower.includes("no role") || lower.includes("role")) {
      return currentPath === "/role" ? "No Roles Found" : (pathEntity ? `No ${pathEntity.plural} Found` : "No Records Found");
    }
    if (lower.includes("product")) return "No Products Found";
    if (lower.includes("customer")) return "No Customers Found";
    if (lower.includes("dispatch")) return "No Dispatches Found";
    if (lower.includes("staff")) return "No Staff Members Found";
    if (lower.includes("coupon")) return "No Coupons Found";
    if (lower.includes("category")) return "No Categories Found";
    if (lower.includes("item group")) return "No Item Groups Found";
    if (lower.includes("item")) return "No Items Found";
    if (lower.includes("salesman") || lower.includes("sales man")) return "No Salesmen Found";
    if (lower.includes("vendor group")) return "No Vendor Groups Found";
    if (lower.includes("attribute group")) return "No Attribute Groups Found";
    if (lower.includes("attribute value")) return "No Attribute Values Found";
    if (lower.includes("attribute")) return "No Attributes Found";
    if (lower.includes("brand")) return "No Brands Found";
    if (lower.includes("unit")) return "No Units Found";
    if (lower.includes("shipping")) return "No Shipping Rules Found";
    if (lower.includes("promo")) return "No Promo Codes Found";
    if (lower.includes("banner")) return "No Banners Found";
    if (lower.includes("offer")) return "No Offers Found";
    if (lower.includes("language")) return "No Languages Found";
    if (lower.includes("currency")) return "No Currencies Found";

    let clean = title
      .replace(/sorry,\s*we\s*can\s*not\s*find\s*this/gi, "")
      .replace(/sorry,\s*there\s*are\s*no/gi, "")
      .replace(/right\s*now\.?/gi, "")
      .trim();
    if (!clean) return pathEntity ? `No ${pathEntity.plural} Found` : "No Records Found";
    if (clean.toLowerCase().startsWith("no ")) return clean;
    return `No ${clean} Found`;
  };

  const getEntitySingular = () => {
    if (buttonTitle) return buttonTitle.replace(/^Add\s+/i, "").trim();
    if (btnText) return btnText.replace(/^Add\s+/i, "").trim();
    if (pathEntity) return pathEntity.singular;

    const t = getEntityTitle()
      .replace(/^No\s+/i, "")
      .replace(/\s+Found$/i, "")
      .trim();
    if (t.endsWith("ies")) return t.slice(0, -3) + "y";
    if (t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
    return t;
  };

  const handleAction = () => {
    if (location.pathname === "/dashboard") {
      history.push("/sale");
    } else if (toggleDrawer) {
      toggleDrawer();
    } else if (onRefresh) {
      onRefresh();
    } else {
      setIsRefreshing(true);
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  const entitySingular = getEntitySingular();

  return (
    <div className="w-full my-4 rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] px-6 py-12 sm:py-14 flex flex-col items-center justify-center text-center shadow-xs transition-all">
      {/* Creative Minimal Vector Graphic (Sleek, Compact ~112px) */}
      <div className="relative mb-4 flex items-center justify-center">
        {/* Soft Ambient Radial Glow */}
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-[#845adf]/20 via-[#23b7e5]/15 to-transparent blur-xl pointer-events-none" />

        {/* Minimal Animated SVG Graphic */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
          >
            {/* Background Soft Circle Base */}
            <circle cx="60" cy="60" r="48" fill="var(--primary-color)" fillOpacity="0.06" />

            {/* Isometric Drawer / Tray Base */}
            <path
              d="M32 72L60 84L88 72L60 60L32 72Z"
              fill="#ffffff"
              className="dark:fill-[#111c43]"
              stroke="var(--primary-color)"
              strokeWidth="2"
            />
            <path
              d="M32 72V80L60 92V84L32 72Z"
              fill="var(--primary-color)"
              fillOpacity="0.25"
              stroke="var(--primary-color)"
              strokeWidth="2"
            />
            <path
              d="M88 72V80L60 92V84L88 72Z"
              fill="var(--primary-color)"
              fillOpacity="0.4"
              stroke="var(--primary-color)"
              strokeWidth="2"
            />

            {/* Front Tray Cutout Accent */}
            <path
              d="M52 87.5L60 91L68 87.5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Floating Document Sheet (Elevated) */}
            <g className="animate-pulse">
              <rect
                x="44"
                y="30"
                width="32"
                height="40"
                rx="6"
                fill="#ffffff"
                className="dark:fill-[#1e2753]"
                stroke="#23b7e5"
                strokeWidth="2"
              />
              {/* Sheet lines */}
              <line
                x1="51"
                y1="40"
                x2="69"
                y2="40"
                stroke="var(--primary-color)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="51"
                y1="48"
                x2="65"
                y2="48"
                stroke="#23b7e5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.7"
              />
              <line
                x1="51"
                y1="56"
                x2="60"
                y2="56"
                stroke="#8c9097"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.5"
              />
            </g>

            {/* Sparkle Stars / Floating Elements */}
            <circle cx="86" cy="38" r="2.5" fill="#26bf94" />
            <path
              d="M34 42L36 38L40 36L36 34L34 30L32 34L28 36L32 38L34 42Z"
              fill="#f5b849"
              fillOpacity="0.8"
            />
            <path
              d="M84 62L85 59L88 58L85 57L84 54L83 57L80 58L83 59L84 62Z"
              fill="var(--primary-color)"
              fillOpacity="0.7"
            />
          </svg>
        </div>
      </div>

      {/* Clean Typography */}
      <h3 className="text-base sm:text-lg font-bold text-[#2c3138] dark:text-white tracking-tight">
        {getEntityTitle()}
      </h3>

      <p className="text-xs sm:text-sm text-[#8c9097] dark:text-[#a3aed1] mt-1 max-w-sm leading-relaxed">
        {subtitle ||
          `There are no ${entitySingular.toLowerCase()} entries available right now.`}
      </p>

      {/* Sleek Action Buttons */}
      {showButton && (
        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={handleAction}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white shadow-xs transition-all active:scale-95"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>{buttonTitle || btnText || `Add ${entitySingular}`}</span>
          </button>

          <button
            onClick={() => {
              setIsRefreshing(true);
              if (onRefresh) onRefresh();
              else {
                setTimeout(() => window.location.reload(), 200);
              }
            }}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43] text-[#536485] dark:text-[#a3aed1] hover:bg-gray-50 dark:hover:bg-[#1e2753] transition-all"
            title="Refresh"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? "animate-spin text-[var(--primary-color)]" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotFound;

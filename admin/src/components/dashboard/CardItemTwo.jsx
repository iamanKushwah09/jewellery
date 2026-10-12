import React from "react";
import Skeleton from "react-loading-skeleton";
import { useTranslation } from "react-i18next";
import useUtilsFunction from "@/hooks/useUtilsFunction";

const CardItemTwo = ({
  title,
  Icon,
  className = "",
  price = 0,
  cash = 0,
  card = 0,
  credit = 0,
  loading,
  title2,
  badgeText,
  subTitle = "",
  badgeColor = "",
  accentColor,
  topGradient,
}) => {
  const { t } = useTranslation();
  const { currency } = useUtilsFunction();

  if (loading) {
    return (
      <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <Skeleton count={3} height={24} baseColor="#f0f1f7" highlightColor="#e9edf4" />
      </div>
    );
  }

  const isTodayOrYesterday = title === "Today Order" || title === "Yesterday Order";
  const displayTitle = title2 ? t(`${title2}`) : title;

  // Format price using Indian currency numbering (en-IN)
  const formatMainPrice = (val) => {
    const num = Number(val) || 0;
    const hasDecimals = num % 1 !== 0;
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  // Compact badge for high value figures (e.g. Crores, Lakhs)
  const getCompactBadge = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return null;
  };

  // Dynamic font sizing so text never overflows or clips
  const getFontSize = (str) => {
    const len = str.length;
    if (len >= 13) return "text-lg sm:text-xl";
    if (len >= 10) return "text-xl sm:text-[22px]";
    if (len >= 8) return "text-2xl sm:text-[24px]";
    return "text-2xl sm:text-[26px]";
  };

  // Compact chip formatter to fit small boxes
  const formatChipAmount = (val) => {
    const num = Number(val) || 0;
    if (num === 0) return "0";
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
    return Number.isInteger(num) ? `${num}` : num.toFixed(1);
  };

  const formattedPrice = formatMainPrice(price);
  const compactBadge = getCompactBadge(price);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-4 sm:p-5 shadow-xs transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 group h-full flex flex-col justify-between">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5">
        <div className="min-w-0 flex-1">
          <span
            className="block text-[11px] font-bold uppercase tracking-wider text-[#8c9097] truncate"
            title={displayTitle}
          >
            {displayTitle}
          </span>
          {(subTitle || badgeText) && (
            <span
              className="block text-[11px] text-[#8c9097]/80 mt-0.5 truncate"
              title={subTitle || badgeText}
            >
              {subTitle || badgeText}
            </span>
          )}
        </div>

        {/* Crisp Monochrome / Soft Tint Icon Container */}
        {Icon && (
          <div
            className={`flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
              badgeColor || className || "bg-[#845adf]/10 text-[#845adf]"
            }`}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
      </div>

      {/* Main Metric Value Area */}
      <div className="my-auto py-1">
        <div
          className="flex items-baseline flex-wrap gap-1.5 min-w-0 max-w-full overflow-hidden"
          title={`${currency} ${Number(price || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        >
          <div className="flex items-baseline min-w-0 max-w-full truncate">
            <span className="text-base sm:text-lg font-bold text-[#8c9097] mr-1 flex-shrink-0">
              {currency}
            </span>
            <h3
              className={`font-extrabold text-[#2c3138] dark:text-white tracking-tight leading-tight tabular-nums truncate ${getFontSize(
                formattedPrice
              )}`}
            >
              {formattedPrice}
            </h3>
          </div>

          {compactBadge && (
            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#845adf]/10 text-[#845adf] flex-shrink-0">
              {compactBadge}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer Area */}
      {isTodayOrYesterday ? (
        <div className="mt-3 pt-2.5 border-t border-[#e9edf4] dark:border-[#263168]">
          <div className="grid grid-cols-3 gap-1">
            <div
              className="bg-[#f0f1f7]/70 dark:bg-[#111c43]/60 border border-[#e9edf4]/80 dark:border-[#263168]/80 rounded-lg p-1 text-center min-w-0 overflow-hidden"
              title={`Cash: ${currency}${Number(cash || 0).toLocaleString("en-IN")}`}
            >
              <span className="block text-[9px] font-bold uppercase tracking-tight text-[#8c9097] truncate leading-tight">
                Cash
              </span>
              <span className="block text-[11px] font-bold text-[#2c3138] dark:text-white tabular-nums tracking-tight mt-0.5 truncate leading-tight">
                {currency}{formatChipAmount(cash)}
              </span>
            </div>

            <div
              className="bg-[#f0f1f7]/70 dark:bg-[#111c43]/60 border border-[#e9edf4]/80 dark:border-[#263168]/80 rounded-lg p-1 text-center min-w-0 overflow-hidden"
              title={`Card: ${currency}${Number(card || 0).toLocaleString("en-IN")}`}
            >
              <span className="block text-[9px] font-bold uppercase tracking-tight text-[#8c9097] truncate leading-tight">
                Card
              </span>
              <span className="block text-[11px] font-bold text-[#2c3138] dark:text-white tabular-nums tracking-tight mt-0.5 truncate leading-tight">
                {currency}{formatChipAmount(card)}
              </span>
            </div>

            <div
              className="bg-[#f0f1f7]/70 dark:bg-[#111c43]/60 border border-[#e9edf4]/80 dark:border-[#263168]/80 rounded-lg p-1 text-center min-w-0 overflow-hidden"
              title={`Credit: ${currency}${Number(credit || 0).toLocaleString("en-IN")}`}
            >
              <span className="block text-[9px] font-bold uppercase tracking-tight text-[#8c9097] truncate leading-tight">
                Credit
              </span>
              <span className="block text-[11px] font-bold text-[#2c3138] dark:text-white tabular-nums tracking-tight mt-0.5 truncate leading-tight">
                {currency}{formatChipAmount(credit)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-2.5 border-t border-[#e9edf4] dark:border-[#263168] flex items-center justify-between text-[11px] text-[#8c9097]">
          <span className="truncate">
            {title2 === "ThisMonth"
              ? "Current Period"
              : title2 === "LastMonth"
              ? "Previous Period"
              : "Cumulative Gross"}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
              title2 === "ThisMonth"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : title2 === "LastMonth"
                ? "bg-[#23b7e5]/10 text-[#23b7e5]"
                : "bg-[#845adf]/10 text-[#845adf]"
            }`}
          >
            {title2 === "ThisMonth"
              ? "Active MTD"
              : title2 === "LastMonth"
              ? "Finalized"
              : "All Channels"}
          </span>
        </div>
      )}
    </div>
  );
};

export default CardItemTwo;

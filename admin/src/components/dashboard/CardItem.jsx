import React from "react";
import Skeleton from "react-loading-skeleton";
import useUtilsFunction from "@/hooks/useUtilsFunction";

const CardItem = ({
  title,
  Icon,
  quantity = 0,
  amount,
  className = "",
  loading,
  pending,
  todayPending,
  olderPending,
  dotColor = "bg-primary",
  badgeText,
}) => {
  const { getNumberTwo } = useUtilsFunction();

  if (loading) {
    return (
      <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <Skeleton count={2} height={28} baseColor="#f0f1f7" highlightColor="#e9edf4" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden h-full flex flex-col justify-between">
      {/* Top Header Row with full-width title */}
      <div className="flex items-start justify-between gap-2.5 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {dotColor && (
              <span className={`w-2 h-2 rounded-full ${dotColor} opacity-90 flex-shrink-0`} />
            )}
            <span
              className="text-xs font-bold uppercase tracking-wider text-[#8c9097] truncate"
              title={title}
            >
              {title}
            </span>
          </div>

          {amount && (
            <span className="text-[11px] font-bold text-[#e6533c] bg-[#e6533c]/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {getNumberTwo(amount)}
            </span>
          )}
        </div>

        {/* Themed Icon Box */}
        {Icon && (
          <div
            className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-lg shadow-xs flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
              className || "bg-[#845adf]/10 text-[#845adf]"
            }`}
          >
            <Icon />
          </div>
        )}
      </div>

      {/* Main Quantity & Badge */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mt-auto pt-1">
        <h4 className="text-2xl sm:text-[28px] font-extrabold text-[#2c3138] dark:text-white tracking-tight leading-none tabular-nums">
          {Number(quantity || 0).toLocaleString("en-IN")}
        </h4>
        {badgeText && (
          <span
            className="text-[11px] font-semibold text-[#8c9097] bg-[#f0f1f7] dark:bg-[#111c43] px-2 py-0.5 rounded-md truncate max-w-full"
            title={badgeText}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Pending Details Footer (if applicable) */}
      {pending && (
        <div className="mt-2.5 pt-2 border-t border-[#e9edf4] dark:border-[#263168] flex items-center justify-between text-xs text-[#8c9097]">
          <div>
            <span>Today: </span>
            <span className="font-semibold text-[#845adf]">
              {Number(todayPending || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span>Older: </span>
            <span className="font-semibold text-[#f5b849]">
              {Number(olderPending || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardItem;

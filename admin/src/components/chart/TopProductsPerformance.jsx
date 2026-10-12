import React from "react";
import { FiAward, FiPackage } from "react-icons/fi";

const TopProductsPerformance = ({ products = [] }) => {
  const items = Array.isArray(products)
    ? products.filter((p) => p && (Number(p.totalAmount) > 0 || Number(p.totalQuantity) > 0)).slice(0, 5)
    : [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center h-[280px]">
        <div className="w-14 h-14 rounded-2xl bg-[#f0f1f7] dark:bg-[#111c43] flex items-center justify-center text-[#8c9097] mb-3 border border-[#e9edf4] dark:border-[#263168]">
          <FiPackage className="w-6 h-6 text-[#845adf]" />
        </div>
        <h4 className="text-sm font-bold text-[#2c3138] dark:text-white">
          No Product Sales Yet
        </h4>
        <p className="text-xs text-[#8c9097] mt-1 max-w-[220px]">
          Best selling products and items will be ranked here in real time as orders are processed.
        </p>
      </div>
    );
  }

  const maxSales = Math.max(...items.map((i) => Number(i.totalAmount) || 1));

  const rankBadges = [
    { bg: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "1st" },
    { bg: "bg-slate-400/10 text-slate-400 border-slate-400/20", label: "2nd" },
    { bg: "bg-amber-700/10 text-amber-700 border-amber-700/20", label: "3rd" },
    { bg: "bg-[#845adf]/10 text-[#845adf] border-[#845adf]/20", label: "4th" },
    { bg: "bg-[#23b7e5]/10 text-[#23b7e5] border-[#23b7e5]/20", label: "5th" },
  ];

  return (
    <div className="flex flex-col h-full justify-between gap-3">
      <div className="space-y-3.5">
        {items.map((item, idx) => {
          const amount = Number(item.totalAmount) || 0;
          const qty = Number(item.totalQuantity) || 0;
          const pct = Math.round((amount / maxSales) * 100);
          const badge = rankBadges[idx] || rankBadges[3];

          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank Badge */}
                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-extrabold border ${badge.bg}`}
                  >
                    {idx === 0 ? <FiAward className="w-3.5 h-3.5" /> : `#${idx + 1}`}
                  </span>

                  {/* Product Title */}
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#2c3138] dark:text-white truncate group-hover:text-[#845adf] transition-colors">
                      {item.name || "Product Item"}
                    </h4>
                    <span className="text-[11px] text-[#8c9097] flex items-center gap-1 font-medium">
                      <FiPackage className="w-3 h-3 text-[#845adf]" />
                      {qty} units sold
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-[#2c3138] dark:text-white block">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] font-semibold text-[#8c9097]">
                    {pct}% of top
                  </span>
                </div>
              </div>

              {/* Progress Bar with Ynex Purple Gradient */}
              <div className="w-full bg-[#f0f1f7] dark:bg-[#111c43] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#845adf] to-[#23b7e5] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopProductsPerformance;

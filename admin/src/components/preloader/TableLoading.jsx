import React, { useContext } from "react";
import Skeleton from "react-loading-skeleton";
import { WindmillContext, TableContainer, TableFooter } from "@windmill/react-ui";
import { FiLoader } from "react-icons/fi";

const TableLoading = ({
  row = 8,
  col = 6,
  message = "Loading data, please wait...",
  height = 18,
}) => {
  const { mode } = useContext(WindmillContext);
  const isDark = mode === "dark";
  const base = isDark ? "#1a2352" : "#eaedf4";
  const highlight = isDark ? "#263168" : "#f5f7fc";

  const rows = Array.from({ length: row }, (_, i) => i);
  const cols = Array.from({ length: col }, (_, i) => i);

  // Natural varying widths for realistic table skeleton
  const getWidthPercentage = (colIndex, rowIndex) => {
    const widths = [60, 85, 45, 75, 90, 50, 70, 80, 65];
    const index = (colIndex + rowIndex) % widths.length;
    return `${widths[index]}%`;
  };

  return (
    <TableContainer className="mb-8 overflow-hidden rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] shadow-xs">
      {/* Top Loading Progress Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f0f1f7]/60 dark:bg-[#111c43]/50 border-b border-[#e9edf4] dark:border-[#263168]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <span className="text-xs font-semibold text-[#536485] dark:text-[#a3aed1]">
            {message}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <FiLoader className="w-3.5 h-3.5 animate-spin" />
          <span>Fetching...</span>
        </div>
      </div>

      {/* Simulated Table Header */}
      <div className="flex items-center px-4 py-3 bg-[#f9fafc] dark:bg-[#111c43]/80 border-b border-[#e9edf4] dark:border-[#263168] gap-3">
        {cols.map((c) => (
          <div key={`header-${c}`} className="flex-1 min-w-0">
            <Skeleton
              height={14}
              baseColor={base}
              highlightColor={highlight}
              borderRadius={4}
              width="70%"
            />
          </div>
        ))}
      </div>

      {/* Simulated Table Body Rows */}
      <div className="divide-y divide-[#e9edf4]/70 dark:divide-[#263168]/70">
        {rows.map((r) => (
          <div
            key={`row-${r}`}
            className="flex items-center px-4 py-3.5 gap-3 hover:bg-[#f0f1f7]/30 dark:hover:bg-[#111c43]/30 transition-colors"
          >
            {cols.map((c) => (
              <div key={`cell-${r}-${c}`} className="flex-1 min-w-0">
                <Skeleton
                  height={height}
                  baseColor={base}
                  highlightColor={highlight}
                  borderRadius={6}
                  width={getWidthPercentage(c, r)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Simulated Table Footer */}
      <TableFooter className="flex items-center justify-between px-4 py-3 border-t border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/60">
        <div className="w-36">
          <Skeleton
            height={16}
            baseColor={base}
            highlightColor={highlight}
            borderRadius={4}
          />
        </div>
        <div className="w-48">
          <Skeleton
            height={24}
            baseColor={base}
            highlightColor={highlight}
            borderRadius={6}
          />
        </div>
      </TableFooter>
    </TableContainer>
  );
};

export default TableLoading;

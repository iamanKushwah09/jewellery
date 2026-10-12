import React from "react";
import Skeleton from "react-loading-skeleton";

const ChartCard = ({ children, title, loading, mode, subtitle, actionButton }) => {
  return (
    <div className="rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#2c3138] dark:text-white tracking-tight">
            {loading ? (
              <Skeleton
                count={1}
                width={160}
                height={22}
                baseColor="#f0f1f7"
                highlightColor="#e9edf4"
              />
            ) : (
              title
            )}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#8c9097] mt-0.5">{subtitle}</p>
          )}
        </div>
        {actionButton}
      </div>

      <div>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Skeleton
              count={1}
              width={260}
              height={220}
              baseColor="#f0f1f7"
              highlightColor="#e9edf4"
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;

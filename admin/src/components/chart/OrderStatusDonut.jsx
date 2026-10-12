import React from "react";
import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";
import { FiShoppingBag } from "react-icons/fi";

const OrderStatusDonut = ({ statusData, totalOrders = 0 }) => {
  const items = Array.isArray(statusData) ? statusData : [];
  const total = items.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0) || totalOrders || 0;

  // If there are literally 0 orders in the database, do NOT show fake slices
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center h-[310px]">
        <div className="w-14 h-14 rounded-2xl bg-[#f0f1f7] dark:bg-[#111c43] flex items-center justify-center text-[#8c9097] mb-3 border border-[#e9edf4] dark:border-[#263168]">
          <FiShoppingBag className="w-6 h-6 text-[#845adf]" />
        </div>
        <h4 className="text-sm font-bold text-[#2c3138] dark:text-white">
          No Orders Placed Yet
        </h4>
        <p className="text-xs text-[#8c9097] mt-1 max-w-[220px]">
          Fulfillment breakdown by status will automatically render as real customer orders are created.
        </p>
      </div>
    );
  }

  const chartData = {
    labels: items.map((item) => item.label),
    datasets: [
      {
        data: items.map((item) => Number(item.count) || 0),
        backgroundColor: items.map((item) => item.color || "#845adf"),
        borderColor: "#ffffff",
        borderWidth: 2.5,
        hoverOffset: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "74%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#111c43",
        titleColor: "#ffffff",
        bodyColor: "#e9edf4",
        borderColor: "#263168",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            const val = context.parsed || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${val} orders (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Donut Chart with Center Counter */}
      <div className="relative w-full h-[200px] flex items-center justify-center my-1">
        <Doughnut data={chartData} options={chartOptions} />

        {/* Center Text Stats */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-[#2c3138] dark:text-white leading-tight">
            {total}
          </span>
          <span className="text-[10px] font-bold text-[#8c9097] uppercase tracking-wider">
            Total Orders
          </span>
        </div>
      </div>

      {/* Real Status Pill Cards */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#e9edf4] dark:border-[#263168]">
        {items.map((item, idx) => {
          const count = Number(item.count) || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-[#f0f1f7]/50 dark:bg-[#111c43]/40 border border-[#e9edf4] dark:border-[#263168]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="truncate">
                  <span className="text-[11px] font-semibold text-[#536485] dark:text-[#a3aed1] block leading-tight truncate">
                    {item.label}
                  </span>
                  <span className="text-xs font-bold text-[#2c3138] dark:text-white">
                    {count}
                  </span>
                </div>
              </div>
              <span
                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
                style={{
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusDonut;

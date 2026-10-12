import React, { useState } from "react";
import "chart.js/auto";
import { Line } from "react-chartjs-2";
import { FiTrendingUp, FiDollarSign, FiShoppingBag } from "react-icons/fi";

const AdvancedRevenueChart = ({ weeklyTrend = [], monthlyTrend = [] }) => {
  const [timeframe, setTimeframe] = useState("weekly"); // "weekly" | "monthly"
  const [metric, setMetric] = useState("revenue"); // "revenue" | "orders" | "both"

  // Use strictly the real data from backend
  const activeData = timeframe === "weekly" ? (weeklyTrend || []) : (monthlyTrend || []);

  const labels =
    timeframe === "weekly"
      ? activeData.map((d) => d.day || d.date || "")
      : activeData.map((d) => `${d.month || ""} ${d.year ? `'${String(d.year).slice(2)}` : ""}`.trim());

  const salesValues = activeData.map((d) => Number(d.sales) || 0);
  const ordersValues = activeData.map((d) => Number(d.orders) || 0);

  const totalRevenue = salesValues.reduce((a, b) => a + b, 0);
  const totalOrders = ordersValues.reduce((a, b) => a + b, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Datasets configuration with smooth gradient fill and Ynex theme
  const datasets = [];

  if (metric === "revenue" || metric === "both") {
    datasets.push({
      label: "Revenue (₹)",
      data: salesValues,
      borderColor: "#845adf",
      backgroundColor: (context) => {
        const ctx = context.chart?.ctx;
        if (!ctx) return "rgba(132, 90, 223, 0.1)";
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(132, 90, 223, 0.3)");
        gradient.addColorStop(0.7, "rgba(132, 90, 223, 0.05)");
        gradient.addColorStop(1, "rgba(132, 90, 223, 0.0)");
        return gradient;
      },
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 3.5,
      pointHoverRadius: 6,
      pointBackgroundColor: "#845adf",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      yAxisID: "y",
    });
  }

  if (metric === "orders" || metric === "both") {
    datasets.push({
      label: "Orders Count",
      data: ordersValues,
      borderColor: "#26bf94",
      backgroundColor: (context) => {
        const ctx = context.chart?.ctx;
        if (!ctx) return "rgba(38, 191, 148, 0.1)";
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(38, 191, 148, 0.25)");
        gradient.addColorStop(0.7, "rgba(38, 191, 148, 0.05)");
        gradient.addColorStop(1, "rgba(38, 191, 148, 0.0)");
        return gradient;
      },
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 3.5,
      pointHoverRadius: 6,
      pointBackgroundColor: "#26bf94",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      yAxisID: metric === "both" ? "y1" : "y",
    });
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: metric === "both",
        position: "top",
        align: "end",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
          color: "#8c9097",
          font: { family: "'Inter', sans-serif", size: 11, weight: 600 },
        },
      },
      tooltip: {
        backgroundColor: "#111c43",
        titleColor: "#ffffff",
        bodyColor: "#e9edf4",
        borderColor: "#263168",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              if (context.dataset.label?.includes("Revenue")) {
                label += "₹" + Number(context.parsed.y).toLocaleString("en-IN");
              } else {
                label += Number(context.parsed.y).toLocaleString("en-IN") + " orders";
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: "#8c9097",
          font: { family: "'Inter', sans-serif", size: 11, weight: 500 },
          padding: 6,
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        grid: {
          color: "rgba(140, 144, 151, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#8c9097",
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 6,
          callback: function (value) {
            if (metric === "orders") return value;
            if (value >= 100000) return "₹" + (value / 100000).toFixed(1) + "L";
            if (value >= 1000) return "₹" + (value / 1000).toFixed(0) + "k";
            return "₹" + value;
          },
        },
      },
      ...(metric === "both"
        ? {
            y1: {
              type: "linear",
              display: true,
              position: "right",
              beginAtZero: true,
              grid: { drawOnChartArea: false },
              ticks: {
                color: "#26bf94",
                font: { family: "'Inter', sans-serif", size: 11 },
                padding: 6,
              },
            },
          }
        : {}),
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Real Top Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[#e9edf4] dark:border-[#263168]">
        {/* Metric Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#845adf]/10 border border-[#845adf]/20">
            <FiDollarSign className="w-3.5 h-3.5 text-[#845adf]" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9097] block leading-none">
                Period Revenue
              </span>
              <span className="text-sm font-bold text-[#845adf] leading-tight">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#26bf94]/10 border border-[#26bf94]/20">
            <FiShoppingBag className="w-3.5 h-3.5 text-[#26bf94]" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9097] block leading-none">
                Total Orders
              </span>
              <span className="text-sm font-bold text-[#26bf94] leading-tight">
                {totalOrders}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#23b7e5]/10 border border-[#23b7e5]/20">
            <FiTrendingUp className="w-3.5 h-3.5 text-[#23b7e5]" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9097] block leading-none">
                Avg. Order (AOV)
              </span>
              <span className="text-sm font-bold text-[#23b7e5] leading-tight">
                ₹{avgOrderValue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          {/* Metric Selector */}
          <div className="inline-flex rounded-lg bg-[#f0f1f7] dark:bg-[#111c43] p-0.5 border border-[#e9edf4] dark:border-[#263168]">
            <button
              type="button"
              onClick={() => setMetric("revenue")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                metric === "revenue"
                  ? "bg-white dark:bg-[#1a2352] text-[#845adf] shadow-xs"
                  : "text-[#8c9097] hover:text-[#2c3138] dark:hover:text-white"
              }`}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => setMetric("orders")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                metric === "orders"
                  ? "bg-white dark:bg-[#1a2352] text-[#26bf94] shadow-xs"
                  : "text-[#8c9097] hover:text-[#2c3138] dark:hover:text-white"
              }`}
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => setMetric("both")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                metric === "both"
                  ? "bg-white dark:bg-[#1a2352] text-[#845adf] shadow-xs"
                  : "text-[#8c9097] hover:text-[#2c3138] dark:hover:text-white"
              }`}
            >
              Both
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="inline-flex rounded-lg bg-[#f0f1f7] dark:bg-[#111c43] p-0.5 border border-[#e9edf4] dark:border-[#263168]">
            <button
              type="button"
              onClick={() => setTimeframe("weekly")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                timeframe === "weekly"
                  ? "bg-[#845adf] text-white shadow-xs"
                  : "text-[#8c9097] hover:text-[#2c3138] dark:hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("monthly")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                timeframe === "monthly"
                  ? "bg-[#845adf] text-white shadow-xs"
                  : "text-[#8c9097] hover:text-[#2c3138] dark:hover:text-white"
              }`}
            >
              6 Months
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-[280px]">
        {labels.length > 0 ? (
          <Line data={{ labels, datasets }} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-[#8c9097]">
            No sales data available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedRevenueChart;

import React from "react";
import "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { FiArrowUpRight, FiBarChart2 } from "react-icons/fi";

const MonthlySalesBarChart = ({ monthlyTrend = [] }) => {
  const dataToUse = Array.isArray(monthlyTrend) ? monthlyTrend : [];

  const labels = dataToUse.map((d) => d.month || "");
  const sales = dataToUse.map((d) => Number(d.sales) || 0);

  const maxVal = Math.max(...sales, 0);
  const totalRevenue = sales.reduce((a, b) => a + b, 0);

  // Peak month
  const peakIdx = maxVal > 0 ? sales.indexOf(maxVal) : -1;
  const peakMonth = peakIdx !== -1 ? labels[peakIdx] : "—";

  // Calculate MoM growth for latest month compared to previous
  const currentMonthSales = sales[sales.length - 1] || 0;
  const prevMonthSales = sales[sales.length - 2] || 0;
  const growthRate =
    prevMonthSales > 0
      ? Math.round(((currentMonthSales - prevMonthSales) / prevMonthSales) * 100)
      : currentMonthSales > 0
      ? 100
      : 0;

  const chartData = {
    labels,
    datasets: [
      {
        label: "Sales (₹)",
        data: sales,
        backgroundColor: sales.map((val) =>
          val > 0 && val === maxVal ? "#845adf" : "rgba(132, 90, 223, 0.35)"
        ),
        hoverBackgroundColor: "#845adf",
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 22,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
            return ` Sales: ₹${Number(context.parsed.y).toLocaleString("en-IN")}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: "#8c9097",
          font: { family: "'Inter', sans-serif", size: 11, weight: 600 },
          padding: 6,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(140, 144, 151, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#8c9097",
          font: { family: "'Inter', sans-serif", size: 10 },
          padding: 6,
          callback: function (val) {
            if (val >= 100000) return "₹" + (val / 100000).toFixed(1) + "L";
            if (val >= 1000) return "₹" + (val / 1000).toFixed(0) + "k";
            return "₹" + val;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Mini Header Stats */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e9edf4] dark:border-[#263168]">
        <div>
          <span className="text-xs text-[#8c9097] font-semibold block">
            Peak Month
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base font-extrabold text-[#2c3138] dark:text-white">
              {peakMonth}
            </span>
            {growthRate !== 0 && (
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#26bf94]/10 text-[#26bf94]">
                <FiArrowUpRight className="w-3 h-3 mr-0.5" />
                {growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#8c9097] font-semibold block">
            Period Total
          </span>
          <span className="text-base font-extrabold text-[#845adf]">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-[220px]">
        {labels.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-[#8c9097]">
            No monthly data recorded
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySalesBarChart;

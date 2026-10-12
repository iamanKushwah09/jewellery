import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCheck,
  FiRefreshCw,
  FiShoppingCart,
  FiTruck,
  FiCalendar,
  FiActivity,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
} from "react-icons/fi";
import { ImCreditCard, ImStack } from "react-icons/im";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

// internal imports
import useAsync from "@/hooks/useAsync";
import AdvancedRevenueChart from "@/components/chart/AdvancedRevenueChart";
import OrderStatusDonut from "@/components/chart/OrderStatusDonut";
import MonthlySalesBarChart from "@/components/chart/MonthlySalesBarChart";
import TopProductsPerformance from "@/components/chart/TopProductsPerformance";
import CardItem from "@/components/dashboard/CardItem";
import CardItemTwo from "@/components/dashboard/CardItemTwo";
import ChartCard from "@/components/chart/ChartCard";
import OrderServices from "@/services/OrderServices";
import AnimatedContent from "@/components/common/AnimatedContent";
import { themeConfig } from "@/theme";

const Dashboard = () => {
  const { t } = useTranslation();

  dayjs.extend(isBetween);
  dayjs.extend(isToday);
  dayjs.extend(isYesterday);

  // react state
  const [todayOrderAmount, setTodayOrderAmount] = useState(0);
  const [yesterdayOrderAmount, setYesterdayOrderAmount] = useState(0);
  const [todayCashPayment, setTodayCashPayment] = useState(0);
  const [todayCardPayment, setTodayCardPayment] = useState(0);
  const [todayCreditPayment, setTodayCreditPayment] = useState(0);
  const [yesterdayCashPayment, setYesterdayCashPayment] = useState(0);
  const [yesterdayCardPayment, setYesterdayCardPayment] = useState(0);
  const [yesterdayCreditPayment, setYesterdayCreditPayment] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: saleOrderDashboardData,
    loading: loadingSaleOrderDashboard,
  } = useAsync(OrderServices.getSaleOrderDashboardData);

  useEffect(() => {
    if (saleOrderDashboardData) {
      setTodayOrderAmount(saleOrderDashboardData.sales?.today || 0);
      setYesterdayOrderAmount(saleOrderDashboardData.sales?.yesterday || 0);
    }
  }, [saleOrderDashboardData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const currentDateFormatted = dayjs().format("dddd, MMM D, YYYY");

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. Header Welcome Banner & Store Pulse                                   */}
      {/* ========================================================================= */}
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#8c9097] uppercase tracking-wider">
              Dashboard / Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2c3138] dark:text-white tracking-tight">
            Store Performance Overview
          </h1>
          <p className="text-sm text-[#536485] dark:text-[#a3aed1] mt-0.5">
            Real-time financial metrics, store sales, and inventory analytics.
          </p>
        </div>

        {/* Live Status & Quick Action Badges */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Live Date Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2352] border border-[#e9edf4] dark:border-[#263168] shadow-xs text-xs font-semibold text-[#536485] dark:text-[#a3aed1]">
            <FiCalendar className="w-3.5 h-3.5 text-[#845adf]" />
            <span>{currentDateFormatted}</span>
          </div>

          {/* Store Live / Syncing Indicator */}
          {loadingSaleOrderDashboard ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#845adf]/10 border border-[#845adf]/30 text-xs font-bold text-[#845adf] shadow-xs animate-pulse">
              <FiRefreshCw className="w-3.5 h-3.5 animate-spin text-[#845adf]" />
              <span>Loading Metrics...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#26bf94]/10 border border-[#26bf94]/30 text-xs font-bold text-[#26bf94] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#26bf94] animate-pulse" />
              <span>Store Live & Synced</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            title="Refresh Dashboard"
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-[#1a2352] hover:bg-[#f0f1f7] dark:hover:bg-[#232d60] border border-[#e9edf4] dark:border-[#263168] text-[#536485] dark:text-[#a3aed1] hover:text-[var(--primary-color)] shadow-xs transition-all active:scale-95"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[var(--primary-color)]" : ""}`}
            />
          </button>
        </div>
      </div>

      {loadingSaleOrderDashboard && (
        <div className="h-1 w-full bg-[#e9edf4] dark:bg-[#263168] overflow-hidden rounded-full mb-2">
          <div className="h-full bg-gradient-to-r from-[#845adf] via-[#23b7e5] to-[#26bf94] animate-pulse w-full" />
        </div>
      )}

      <AnimatedContent>
        {/* ========================================================================= */}
        {/* 2. Top Financial & Sales Metrics (5 Cards Grid)                          */}
        {/* ========================================================================= */}
        <div className="grid gap-2.5 sm:gap-3 mb-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <CardItemTwo
            title="Today Order"
            title2="TodayOrder"
            topGradient={themeConfig.dashboard.salesCards.today.topAccentClass}
            Icon={ImStack}
            badgeText={themeConfig.dashboard.salesCards.today.badge}
            cash={todayCashPayment || 0}
            card={todayCardPayment || 0}
            credit={todayCreditPayment || 0}
            price={todayOrderAmount || 0}
            className={themeConfig.dashboard.salesCards.today.iconBg}
            loading={loadingSaleOrderDashboard}
          />

          <CardItemTwo
            title="Yesterday Order"
            title2="YesterdayOrder"
            topGradient={themeConfig.dashboard.salesCards.yesterday.topAccentClass}
            Icon={ImStack}
            badgeText={themeConfig.dashboard.salesCards.yesterday.badge}
            cash={yesterdayCashPayment || 0}
            card={yesterdayCardPayment || 0}
            credit={yesterdayCreditPayment || 0}
            price={yesterdayOrderAmount || 0}
            className={themeConfig.dashboard.salesCards.yesterday.iconBg}
            loading={loadingSaleOrderDashboard}
          />

          <CardItemTwo
            title2="ThisMonth"
            topGradient={themeConfig.dashboard.salesCards.thisMonth.topAccentClass}
            Icon={FiShoppingCart}
            badgeText={themeConfig.dashboard.salesCards.thisMonth.badge}
            price={saleOrderDashboardData?.sales?.thisMonth || 0}
            className={themeConfig.dashboard.salesCards.thisMonth.iconBg}
            loading={loadingSaleOrderDashboard}
          />

          <CardItemTwo
            title2="LastMonth"
            topGradient={themeConfig.dashboard.salesCards.lastMonth.topAccentClass}
            Icon={ImCreditCard}
            badgeText={themeConfig.dashboard.salesCards.lastMonth.badge}
            price={saleOrderDashboardData?.sales?.lastMonth || 0}
            className={themeConfig.dashboard.salesCards.lastMonth.iconBg}
            loading={loadingSaleOrderDashboard}
          />

          <CardItemTwo
            title2="AllTimeSales"
            topGradient={themeConfig.dashboard.salesCards.allTime.topAccentClass}
            Icon={ImCreditCard}
            badgeText={themeConfig.dashboard.salesCards.allTime.badge}
            price={saleOrderDashboardData?.sales?.allTime || 0}
            className={themeConfig.dashboard.salesCards.allTime.iconBg}
            loading={loadingSaleOrderDashboard}
          />
        </div>

        {/* ========================================================================= */}
        {/* 3. Operational Orders Status Cards (4 Cards Grid)                        */}
        {/* ========================================================================= */}
        <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-3">
          <CardItem
            title={themeConfig.dashboard.orderCards.total.label}
            Icon={FiShoppingCart}
            loading={loadingSaleOrderDashboard}
            quantity={saleOrderDashboardData?.totalOrders || 0}
            badgeText="All orders"
            dotColor={themeConfig.dashboard.orderCards.total.dotColor}
            className={themeConfig.dashboard.orderCards.total.iconBg}
          />

          <CardItem
            title={t("OrderPending")}
            Icon={FiRefreshCw}
            loading={loadingSaleOrderDashboard}
            quantity={saleOrderDashboardData?.ordersPending || 0}
            badgeText="Need processing"
            amount={0}
            dotColor={themeConfig.dashboard.orderCards.pending.dotColor}
            className={themeConfig.dashboard.orderCards.pending.iconBg}
          />

          <CardItem
            title={t("OrderProcessing")}
            Icon={FiTruck}
            loading={loadingSaleOrderDashboard}
            quantity={saleOrderDashboardData?.ordersProcessing || 0}
            badgeText="In fulfillment"
            dotColor={themeConfig.dashboard.orderCards.processing.dotColor}
            className={themeConfig.dashboard.orderCards.processing.iconBg}
          />

          <CardItem
            title={t("OrderDelivered")}
            Icon={FiCheck}
            loading={loadingSaleOrderDashboard}
            quantity={saleOrderDashboardData?.ordersDelivered || 0}
            badgeText="Completed"
            dotColor={themeConfig.dashboard.orderCards.delivered.dotColor}
            className={themeConfig.dashboard.orderCards.delivered.iconBg}
          />
        </div>

        {/* ========================================================================= */}
        {/* 4. Analytics & Charts Section (Row 1: Revenue Analytics + Donut Status)  */}
        {/* ========================================================================= */}
        <div className="grid gap-3 sm:gap-3.5 grid-cols-1 xl:grid-cols-3 mb-3 sm:mb-3.5">
          <div className="xl:col-span-2">
            <ChartCard
              loading={loadingSaleOrderDashboard}
              title="Revenue & Order Volume Analytics"
              subtitle="Real-time sales trajectory, average order value & order volume distribution"
              actionButton={
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#845adf]/10 text-[#845adf]">
                  <FiActivity className="w-3.5 h-3.5" /> Live Insights
                </span>
              }
            >
              <AdvancedRevenueChart
                weeklyTrend={saleOrderDashboardData?.weeklySalesTrend}
                monthlyTrend={saleOrderDashboardData?.monthlySalesTrend}
              />
            </ChartCard>
          </div>

          <div className="xl:col-span-1">
            <ChartCard
              loading={loadingSaleOrderDashboard}
              title="Order Fulfillment Status"
              subtitle="Distribution across lifecycle states"
              actionButton={
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#26bf94]/10 text-[#26bf94]">
                  <FiCheck className="w-3.5 h-3.5" /> Realtime Sync
                </span>
              }
            >
              <OrderStatusDonut
                statusData={saleOrderDashboardData?.orderStatusBreakdown}
                totalOrders={saleOrderDashboardData?.totalOrders}
              />
            </ChartCard>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4B. Analytics & Charts Section (Row 2: Monthly Growth Bar + Top Sellers)   */}
        {/* ========================================================================= */}
        <div className="grid gap-3 sm:gap-3.5 grid-cols-1 lg:grid-cols-2 mb-4">
          <ChartCard
            loading={loadingSaleOrderDashboard}
            title="Monthly Sales & Growth Overview"
            subtitle="Multi-month revenue comparison with peak velocity indicators"
            actionButton={
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#23b7e5]/10 text-[#23b7e5]">
                <FiBarChart2 className="w-3.5 h-3.5" /> Performance
              </span>
            }
          >
            <MonthlySalesBarChart
              monthlyTrend={saleOrderDashboardData?.monthlySalesTrend}
            />
          </ChartCard>

          <ChartCard
            loading={loadingSaleOrderDashboard}
            title="Top Performing Products"
            subtitle="Highest grossing inventory by revenue and units dispatched"
            actionButton={
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600">
                <FiTrendingUp className="w-3.5 h-3.5" /> Best Sellers
              </span>
            }
          >
            <TopProductsPerformance
              products={saleOrderDashboardData?.bestSellingProducts}
            />
          </ChartCard>
        </div>
      </AnimatedContent>
    </>
  );
};

export default Dashboard;

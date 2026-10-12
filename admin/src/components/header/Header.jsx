import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { Scrollbars } from "react-custom-scrollbars-2";
import {
  FiTrash2,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiBell,
  FiSettings,
  FiChevronDown,
  FiGlobe,
  FiSearch,
  FiSun,
  FiMoon,
  FiSliders,
} from "react-icons/fi";
import { HiOutlineMenuAlt2 } from "react-icons/hi";

// internal import
import de from "@/assets/img/de.svg";
import en from "@/assets/img/us.svg";
import ellipse from "@/assets/img/icons/ellipse.svg";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import { useThemeCustomizer } from "@/context/ThemeCustomizerContext";
import ThemeCustomizerDrawer from "@/components/theme/ThemeCustomizerDrawer";
import useNotification from "@/hooks/useNotification";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import NotFoundTwo from "@/components/table/NotFoundTwo";
import NotificationServices from "@/services/NotificationServices";
import { notifyError } from "@/utils/toast";

const Header = () => {
  const { toggleSidebar, handleLanguageChange, setNavBar, navBar } =
    useContext(SidebarContext);
  const { state, dispatch } = useContext(AdminContext);
  const { primaryColor, themeMode, toggleThemeMode, openCustomizer } =
    useThemeCustomizer();
  const { adminInfo } = state;
  const pRef = useRef();
  const nRef = useRef();
  const lRef = useRef();

  const currentLanguageCode = Cookies.get("i18next") || "en";
  const { t } = useTranslation();
  const { updated, setUpdated } = useNotification();
  const { showDateTimeFormat } = useUtilsFunction();

  const [data, setData] = useState([]);
  const [totalDoc, setTotalDoc] = useState(0);
  const [totalUnreadDoc, setTotalUnreadDoc] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const getAdminDisplayName = () => {
    if (!adminInfo) return "Admin";
    if (typeof adminInfo.name === "string") return adminInfo.name;
    if (adminInfo.name && typeof adminInfo.name === "object") {
      return adminInfo.name.en || Object.values(adminInfo.name)[0] || "Admin";
    }
    return adminInfo.email ? adminInfo.email.split("@")[0] : "Admin";
  };

  const displayName = getAdminDisplayName();
  const displayRole = typeof adminInfo?.role === "string" ? adminInfo.role : "Administrator";
  const displayInitial = (typeof displayName === "string" && displayName.length > 0)
    ? displayName.charAt(0).toUpperCase()
    : "A";

  const handleLogOut = () => {
    try {
      dispatch({ type: "USER_LOGOUT" });
      Cookies.remove("adminInfo");
      Cookies.remove("globalSetting");
      const allCookies = Cookies.get();
      Object.keys(allCookies).forEach((cookieName) => {
        if (cookieName.includes("admin") || cookieName.includes("Admin")) {
          Cookies.remove(cookieName);
        }
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  const handleNotificationOpen = async () => {
    setNotificationOpen(!notificationOpen);
    setProfileOpen(false);
    setLangOpen(false);
    await handleGetAllNotifications();
  };

  const handleProfileOpen = () => {
    setProfileOpen(!profileOpen);
    setNotificationOpen(false);
    setLangOpen(false);
  };

  const handleLangToggle = () => {
    setLangOpen(!langOpen);
    setProfileOpen(false);
    setNotificationOpen(false);
  };

  // handle notification status change
  const handleNotificationStatusChange = async (id) => {
    try {
      await NotificationServices.updateStatusNotification(id, {
        status: "read",
      });
      const getAllRes = await NotificationServices.getAllNotification();
      setData(getAllRes?.notifications);
      setTotalUnreadDoc(getAllRes?.totalUnreadDoc);
      window.location.reload(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  // handle notification delete
  const handleNotificationDelete = async (id) => {
    try {
      await NotificationServices.deleteNotification(id);
      const getAllRes = await NotificationServices.getAllNotification();
      setData(getAllRes?.notifications);
      setTotalUnreadDoc(getAllRes?.totalUnreadDoc);
      setTotalDoc(getAllRes?.totalDoc);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  // handle get notifications
  const handleGetAllNotifications = async () => {
    try {
      const res = await NotificationServices.getAllNotification();
      setData(res?.notifications);
      setTotalUnreadDoc(res?.totalUnreadDoc);
      setTotalDoc(res?.totalDoc);
      setUpdated(false);
    } catch (err) {
      setUpdated(false);
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!pRef?.current?.contains(e.target)) {
        setProfileOpen(false);
      }
      if (!nRef?.current?.contains(e.target)) {
        setNotificationOpen(false);
      }
      if (!lRef?.current?.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    handleGetAllNotifications();
  }, [updated]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43] px-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] md:px-6 2xl:px-8 transition-colors duration-200">
      {/* Left controls & Quick Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          onClick={() => setNavBar(!navBar)}
          aria-label="Toggle Desktop Sidebar"
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-[#f0f1f7]/60 dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] transition-colors hover:bg-[#845adf]/10 hover:border-[#845adf]/30 hover:text-[#845adf] lg:flex"
        >
          <HiOutlineMenuAlt2 className="w-5 h-5" />
        </button>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open Mobile Menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-[#f0f1f7]/60 dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] transition-colors hover:bg-[#845adf]/10 hover:border-[#845adf]/30 hover:text-[#845adf] lg:hidden"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Quick Search Bar */}
        <div className="hidden md:flex items-center relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8c9097] z-10">
            <FiSearch className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            className="header-search-input w-full py-1.5 text-xs bg-[#f0f1f7]/60 dark:bg-[#1a2352] border border-[#e9edf4] dark:border-[#263168] rounded-lg text-[#2c3138] dark:text-white placeholder-[#8c9097] focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-ring)] transition-all"
            style={{ paddingLeft: "2.35rem", paddingRight: "3.5rem" }}
            readOnly
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center z-10">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#8c9097] bg-white dark:bg-[#111c43] border border-[#e9edf4] dark:border-[#263168] rounded shadow-xs">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* Language selector - Hidden as requested */}
        {/* <div className="relative" ref={lRef}>
          <button
            type="button"
            onClick={handleLangToggle}
            className="flex items-center gap-2 rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-[#f0f1f7]/60 dark:bg-[#1a2352] px-2.5 py-1.5 text-xs font-medium text-[#2c3138] dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-[#1a2352]/80"
          >
            <img
              src={currentLanguageCode === "de" ? de : en}
              alt="lang"
              className="h-3.5 w-5 rounded-sm object-cover"
            />
            <span className="uppercase font-semibold text-xs">
              {currentLanguageCode === "de" ? "DE" : "EN"}
            </span>
            <FiChevronDown
              className={`w-3 h-3 text-[#8c9097] transition-transform ${
                langOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] py-1 shadow-dropdown z-50 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  handleLanguageChange("en");
                  setLangOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#845adf] ${
                  currentLanguageCode === "en"
                    ? "text-[#845adf] font-semibold bg-[#845adf]/5"
                    : "text-[#536485] dark:text-[#a3aed1]"
                }`}
              >
                <img src={en} alt="EN" className="h-3.5 w-5 rounded-sm object-cover" />
                <span>English</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLanguageChange("de");
                  setLangOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#845adf] ${
                  currentLanguageCode === "de"
                    ? "text-[#845adf] font-semibold bg-[#845adf]/5"
                    : "text-[#536485] dark:text-[#a3aed1]"
                }`}
              >
                <img src={de} alt="DE" className="h-3.5 w-5 rounded-sm object-cover" />
                <span>German</span>
              </button>
            </div>
          )}
        </div> */}

        {/* Dark/Light Quick Mode Switcher - Hidden as requested */}
        {/* <button
          type="button"
          onClick={toggleThemeMode}
          aria-label="Toggle Theme Mode"
          title={themeMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-[#f0f1f7]/60 dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] transition-colors hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/30 hover:text-[var(--primary-color)]"
        >
          {themeMode === "dark" ? (
            <FiSun className="w-4 h-4 text-amber-400" />
          ) : (
            <FiMoon className="w-4 h-4" />
          )}
        </button> */}

        {/* Theme Customizer Palette Drawer Trigger - Hidden as requested */}
        {/* <button
          type="button"
          onClick={openCustomizer}
          aria-label="Customize Theme & Colors"
          title="Customize Theme & Colors"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-[#f0f1f7]/60 dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] transition-colors hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/30 hover:text-[var(--primary-color)] group"
        >
          <FiSliders className="w-4 h-4 transition-transform duration-200 group-hover:rotate-45" />
          <span
            className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-[#111c43]"
            style={{ backgroundColor: primaryColor }}
          />
        </button> */}

        {/* Notifications */}
        <div className="relative" ref={nRef}>
          <button
            type="button"
            onClick={handleNotificationOpen}
            aria-label="View notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-[#f0f1f7]/60 dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] transition-colors hover:bg-[#845adf]/10 hover:border-[#845adf]/30 hover:text-[#845adf]"
          >
            <FiBell className="w-4 h-4" />
            {totalUnreadDoc > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e6533c] px-1 text-[10px] font-bold text-white shadow-sm">
                {totalUnreadDoc}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] shadow-dropdown z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e9edf4] dark:border-[#263168] px-4 py-3 bg-[#f0f1f7]/40 dark:bg-white/[0.02]">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#2c3138] dark:text-white">
                  Notifications
                </h5>
                {totalUnreadDoc > 0 && (
                  <span className="rounded-full bg-[#845adf]/10 px-2 py-0.5 text-[11px] font-semibold text-[#845adf]">
                    {totalUnreadDoc} Unread
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {data?.length === 0 ? (
                  <div className="py-8">
                    <NotFoundTwo title="No new notifications" />
                  </div>
                ) : (
                  <ul className="divide-y divide-[#e9edf4] dark:divide-[#263168]">
                    {data?.map((value, index) => (
                      <li
                        key={index}
                        className={`flex items-start justify-between gap-3 p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                          value.status === "unread" ? "bg-[#845adf]/[0.03]" : ""
                        }`}
                      >
                        <Link
                          to={
                            value.productId
                              ? `/product/${value.productId}`
                              : value.orderId
                              ? `/order/${value.orderId}`
                              : "/our-staff"
                          }
                          onClick={() => handleNotificationStatusChange(value._id)}
                          className="flex flex-1 items-start gap-3"
                        >
                          <div className="relative mt-0.5 flex-shrink-0">
                            {value.image ? (
                              <img
                                src={value.image}
                                alt=""
                                className="h-9 w-9 rounded-full border border-[#e9edf4] dark:border-[#263168] object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#845adf]/10 text-[#845adf] font-bold text-xs">
                                {value.productId ? "P" : "O"}
                              </div>
                            )}
                            {value.status === "unread" && (
                              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#845adf] ring-2 ring-white dark:ring-[#1a2352]" />
                            )}
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-xs font-semibold text-[#2c3138] dark:text-white">
                              {value?.message}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {value.productId ? (
                                <span className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[#e6533c]/10 text-[#e6533c]">
                                  Stock Out
                                </span>
                              ) : (
                                <span className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[#26bf94]/10 text-[#26bf94]">
                                  New Order
                                </span>
                              )}
                              <span className="text-[11px] text-[#8c9097]">
                                {showDateTimeFormat(value.createdAt)}
                              </span>
                            </div>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleNotificationDelete(value._id)}
                          title="Delete"
                          className="mt-1 flex h-6 w-6 items-center justify-center rounded text-[#8c9097] transition-colors hover:bg-red-50 hover:text-[#e6533c]"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {totalDoc > 5 && (
                <div className="border-t border-[#e9edf4] dark:border-[#263168] p-2 text-center bg-[#f0f1f7]/40 dark:bg-white/[0.02]">
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationOpen(false)}
                    className="text-xs font-semibold text-[#845adf] hover:underline"
                  >
                    View all {totalDoc} notifications
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative" ref={pRef}>
          <button
            type="button"
            onClick={handleProfileOpen}
            className="flex items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <div className="relative flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#845adf] font-semibold text-white text-xs shadow-sm overflow-hidden">
                {adminInfo?.image && !imgError ? (
                  <img
                    src={`${import.meta.env.VITE_APP_SOCKET_URL}/${adminInfo.image}`}
                    alt="avatar"
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span>{displayInitial}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#26bf94] ring-2 ring-white dark:ring-[#111c43]" />
            </div>
            <div className="hidden text-left md:block">
              <span className="block text-xs font-semibold text-[#2c3138] dark:text-white">
                {displayName}
              </span>
              <span className="block text-[11px] text-[#8c9097]">
                {displayRole}
              </span>
            </div>
            <FiChevronDown
              className={`hidden w-3.5 h-3.5 text-[#8c9097] transition-transform md:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] py-1.5 shadow-dropdown z-50">
              <div className="border-b border-[#e9edf4] dark:border-[#263168] px-4 py-2.5 md:hidden">
                <p className="text-xs font-bold text-[#2c3138] dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-[#8c9097] truncate">
                  {adminInfo?.email || ""}
                </p>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#536485] dark:text-[#a3aed1] transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#845adf]"
              >
                <FiGrid className="w-4 h-4 text-[#8c9097]" />
                <span>{t("Dashboard")}</span>
              </Link>

              <Link
                to="/edit-profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#536485] dark:text-[#a3aed1] transition-colors hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#845adf]"
              >
                <FiSettings className="w-4 h-4 text-[#8c9097]" />
                <span>{t("EditProfile")}</span>
              </Link>

              <div className="my-1 border-t border-[#e9edf4] dark:border-[#263168]" />

              <button
                type="button"
                onClick={handleLogOut}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs font-medium text-[#e6533c] transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <FiLogOut className="w-4 h-4" />
                <span>{t("LogOut")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Theme Customizer Drawer */}
      <ThemeCustomizerDrawer />
    </header>
  );
};

export default Header;

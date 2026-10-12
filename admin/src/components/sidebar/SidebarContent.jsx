import React, { useContext } from "react";
import { NavLink, Link } from "react-router-dom";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { IoLogOutOutline, IoCloseOutline } from "react-icons/io5";

// internal import
import getFilteredSidebar from "@/routes/sidebar";
import logoLight from "@/assets/img/logo/logo-light.svg";
import logoDark from "@/assets/img/logo/logo.png";
import { AdminContext } from "@/context/AdminContext";
import SidebarSubMenu from "@/components/sidebar/SidebarSubMenu";
import useUtilsFunction from "@/hooks/useUtilsFunction";

const SidebarContent = ({ onClose }) => {
  const { t } = useTranslation();
  const { dispatch, state } = useContext(AdminContext);
  const { adminInfo } = state;
  const { globalSetting } = useUtilsFunction();

  const sidebar = getFilteredSidebar(adminInfo?.permission, adminInfo);

  const handleLogOut = () => {
    dispatch({ type: "USER_LOGOUT" });
    Cookies.remove("adminInfo");
    window.location.href = "/login";
  };

  const getAdminDisplayName = () => {
    if (!adminInfo) return "Admin";
    if (typeof adminInfo.name === "string") return adminInfo.name;
    if (adminInfo.name && typeof adminInfo.name === "object") {
      return adminInfo.name.en || Object.values(adminInfo.name)[0] || "Admin";
    }
    return adminInfo.email ? adminInfo.email.split("@")[0] : "Admin";
  };

  const displayName = getAdminDisplayName();
  const displayInitial = (typeof displayName === "string" && displayName.length > 0)
    ? displayName.charAt(0).toUpperCase()
    : "A";

  const companyName = globalSetting?.company_name || globalSetting?.shop_name || "";
  const companySubtitle = globalSetting?.shop_name && globalSetting?.company_name && globalSetting.shop_name !== globalSetting.company_name
    ? globalSetting.shop_name
    : "";
  const companyLogo = globalSetting?.logo;

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman'))
  );

  return (
    <div className="flex h-full flex-col justify-between bg-[#111c43] text-[#a3aed1] overflow-hidden">
      {/* Fixed Header: Logo, Company Name & Mobile Close Button */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#263168]/80 bg-[#111c43] shrink-0 z-10">
        <Link
          to={isSalesman ? "/salesman-visits" : "/dashboard"}
          onClick={onClose}
          className="flex items-center gap-3 min-w-0 hover:opacity-95 transition-opacity"
        >
          {companyLogo ? (
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md ring-1 ring-white/20 bg-slate-800">
              <img
                src={companyLogo}
                alt={companyName || "Logo"}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = "flex";
                  }
                }}
              />
              <div
                className="hidden h-full w-full items-center justify-center rounded-xl text-white font-black text-sm tracking-wider"
                style={{
                  background: "linear-gradient(135deg, var(--primary-color), var(--primary-hover))",
                }}
              >
                {getInitials(companyName) || "A"}
              </div>
            </div>
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md text-white font-black text-sm tracking-wider transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, var(--primary-color), var(--primary-hover))",
                boxShadow: "0 4px 14px var(--primary-light)",
              }}
            >
              {getInitials(companyName) || "A"}
            </div>
          )}
          {(companyName || companySubtitle) ? (
            <div className="flex flex-col min-w-0">
              {companyName ? (
                <span className="text-sm font-bold tracking-tight text-white truncate max-w-[145px]" title={companyName}>
                  {companyName}
                </span>
              ) : null}
              {companySubtitle ? (
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#a3aed1]/80 truncate max-w-[145px]">
                  {companySubtitle}
                </span>
              ) : null}
            </div>
          ) : null}
        </Link>

        {/* Mobile close button inside header - never overlaps scrolling items */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3aed1] transition-colors hover:bg-white/10 hover:text-white focus:outline-none shrink-0 ml-2"
            aria-label="Close Sidebar"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
        {/* Navigation Section */}
        <div className="mb-2 px-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3aed1]/60">
            NAVIGATION
          </p>
        </div>

        <ul className="space-y-1 font-medium">
          {sidebar.map((route) =>
            route.routes ? (
              <SidebarSubMenu route={route} key={route.name} onClose={onClose} />
            ) : (
              <li className="relative" key={route.name}>
                <NavLink
                  exact
                  to={route.path}
                  onClick={onClose}
                  className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a3aed1] transition-all duration-200 ease-in-out hover:bg-white/[0.06] hover:text-white"
                  activeClassName="active-sidebar-link !text-white font-semibold shadow-md"
                >
                  <route.icon
                    className="w-4 h-4 flex-shrink-0 transition-colors group-hover:text-white"
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-xs sm:text-sm">{t(`${route.name}`)}</span>
                </NavLink>
              </li>
            )
          )}
        </ul>
      </div>

      {/* User Profile / Logout Footer */}
      <div className="shrink-0 border-t border-[#263168] bg-[#0c1433]/40 px-4 py-3 mx-2 my-2 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white text-xs shadow-sm transition-colors duration-200"
                style={{ backgroundColor: "var(--primary-color)" }}
              >
                {displayInitial}
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[#26bf94] ring-2 ring-[#111c43]" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-white">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-[#a3aed1]/70">
                {adminInfo?.email || "admin@example.com"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogOut}
            title={t("LogOut")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3aed1] transition-colors hover:bg-white/10 hover:text-[#e6533c]"
          >
            <IoLogOutOutline className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarContent;


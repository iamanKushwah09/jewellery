import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IoChevronDownOutline } from "react-icons/io5";

const SidebarSubMenu = ({ route, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();

  // Check if any child route is currently active
  const isChildActive = route.routes?.some(
    (child) => child.path && location.pathname.startsWith(child.path)
  );

  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) {
      setOpen(true);
    }
  }, [location.pathname, isChildActive]);

  return (
    <li className="relative px-1 py-0.5">
      <button
        type="button"
        className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
          isChildActive
            ? "bg-white/[0.08] text-white font-semibold"
            : "text-[#a3aed1] hover:bg-white/[0.05] hover:text-white"
        }`}
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <route.icon
            className="w-4 h-4 transition-colors"
            style={{ color: isChildActive ? "var(--primary-color)" : undefined }}
            aria-hidden="true"
          />
          <span className="font-medium tracking-wide text-xs sm:text-sm">
            {t(`${route.name}`)}
          </span>
        </span>
        <IoChevronDownOutline
          className={`w-3.5 h-3.5 text-[#a3aed1] transition-transform duration-200 ${
            open ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {open && (
        <ul className="mt-1 space-y-1 pl-6 pr-1 py-1 transition-all duration-300">
          {route.routes.map((child, i) => (
            <li key={i}>
              {child?.outside ? (
                <a
                  href={import.meta.env.VITE_APP_STORE_DOMAIN}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onClose}
                  className="group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium text-[#a3aed1]/80 transition-colors duration-150 hover:text-white"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#a3aed1]/50 transition-colors group-hover:bg-[var(--primary-color)]" />
                  <span>{t(`${child.name}`)}</span>
                </a>
              ) : (
                <NavLink
                  to={child.path}
                  exact
                  onClick={onClose}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#a3aed1]/80 transition-all duration-150 hover:bg-white/[0.06] hover:text-white"
                  activeClassName="active-subnav-link !text-white font-semibold shadow-md"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#a3aed1]/50 transition-colors group-hover:bg-white" />
                  <span>{t(`${child.name}`)}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default SidebarSubMenu;


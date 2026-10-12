import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";

const PageTitle = ({ children, breadcrumb, extra }) => {
  const location = useLocation();
  const currentPath = location.pathname.split("/")[1] || "Dashboard";
  const formattedPath = currentPath
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#e9edf4]/60 dark:border-[#263168]/60">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2c3138] dark:text-white tracking-tight flex items-center gap-2">
          <span>{children || formattedPath}</span>
        </h1>
        <nav className="mt-1">
          <ol className="flex items-center gap-1.5 text-xs text-[#8c9097] dark:text-[#a3aed1] font-medium">
            <li>
              <Link
                to="/dashboard"
                className="flex items-center gap-1 hover:text-[#845adf] transition-colors"
              >
                <FiHome className="w-3.5 h-3.5 text-[#8c9097]" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <FiChevronRight className="w-3 h-3 text-[#8c9097]/60" />
            </li>
            <li className="font-semibold text-[#845adf] truncate max-w-[240px]">
              {breadcrumb || (typeof children === "string" ? children : formattedPath)}
            </li>
          </ol>
        </nav>
      </div>

      {extra && <div className="flex items-center gap-2.5">{extra}</div>}
    </div>
  );
};

export default PageTitle;

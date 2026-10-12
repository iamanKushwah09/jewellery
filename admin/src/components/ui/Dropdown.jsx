import React, { forwardRef } from "react";

export const Dropdown = forwardRef(
  ({ isOpen = false, onClose = () => {}, align = "left", className = "", children, ...props }, ref) => {
    if (!isOpen) return null;
    const alignClass = align === "right" ? "right-0" : "left-0";
    return (
      <ul
        ref={ref}
        className={`absolute z-40 mt-2 w-56 rounded-xl border border-stroke bg-white p-1.5 shadow-dropdown ${alignClass} ${className}`}
        {...props}
      >
        {children}
      </ul>
    );
  }
);
Dropdown.displayName = "Dropdown";

export const DropdownItem = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={`flex items-center rounded-lg px-3 py-2 text-xs font-medium text-black hover:bg-gray-50 hover:text-primary cursor-pointer transition-colors ${className}`}
        {...props}
      >
        {children}
      </li>
    );
  }
);
DropdownItem.displayName = "DropdownItem";

export default { Dropdown, DropdownItem };

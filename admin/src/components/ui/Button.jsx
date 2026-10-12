import React, { forwardRef } from "react";

export const Button = forwardRef(
  (
    {
      children,
      className = "",
      size = "regular",
      layout = "primary",
      block = false,
      disabled = false,
      type = "button",
      icon,
      iconLeft: IconLeft,
      iconRight: IconRight,
      onClick,
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeClasses = {
      larger: "px-6 py-3.5 text-base rounded-xl",
      large: "px-5 py-2.5 text-sm rounded-lg",
      regular: "px-4 py-2 text-sm rounded-lg",
      small: "px-3 py-1.5 text-xs rounded-md",
      pagination: "px-3 py-1.5 text-xs rounded-md",
      icon: "p-2 rounded-lg",
    };

    // Layout / Variant styles
    const layoutClasses = {
      primary:
        "bg-[#845adf] hover:bg-[#7248cf] text-white font-semibold rounded-lg shadow-sm hover:shadow-md hover:shadow-[#845adf]/25 active:scale-[0.98] border border-transparent disabled:opacity-50 disabled:cursor-not-allowed",
      outline:
        "border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#2c3138] dark:text-white hover:bg-[#f0f1f7] dark:hover:bg-[#111c43] hover:border-[#845adf]/30 hover:text-[#845adf] shadow-xs rounded-lg font-medium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
      link:
        "text-[#845adf] hover:underline bg-transparent border-transparent disabled:opacity-50 disabled:cursor-not-allowed",
      delete:
        "bg-[#e6533c]/10 text-[#e6533c] hover:bg-[#e6533c] hover:text-white border border-[#e6533c]/25 rounded-lg font-medium shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
      danger:
        "bg-[#e6533c] hover:bg-[#d4432c] text-white border border-transparent rounded-lg font-semibold shadow-sm hover:shadow-md hover:shadow-[#e6533c]/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
      modern:
        "bg-[#111c43] hover:bg-[#1a2352] text-white border border-[#263168] shadow-sm rounded-lg font-medium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
    };

    const chosenSize = icon && !children ? sizeClasses.icon : sizeClasses[size] || sizeClasses.regular;
    const chosenLayout = layoutClasses[layout] || layoutClasses.primary;
    const blockClass = block ? "w-full" : "";

    const Icon = icon;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none ${chosenSize} ${chosenLayout} ${blockClass} ${className}`}
        {...props}
      >
        {IconLeft && <IconLeft className="mr-2 h-4 w-4" aria-hidden="true" />}
        {Icon && <Icon className={`${children ? "mr-2" : ""} h-4 w-4`} aria-hidden="true" />}
        {children}
        {IconRight && <IconRight className="ml-2 h-4 w-4" aria-hidden="true" />}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

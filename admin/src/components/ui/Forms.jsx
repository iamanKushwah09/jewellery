import React, { forwardRef } from "react";

export const Input = forwardRef(
  (
    {
      className = "",
      type = "text",
      disabled = false,
      valid,
      invalid,
      ...props
    },
    ref
  ) => {
    if (type === "checkbox") {
      return (
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className={`h-4 w-4 rounded border-[#ced4da] dark:border-[#263168] text-[#845adf] focus:ring-2 focus:ring-[#845adf]/20 disabled:opacity-50 accent-[#845adf] cursor-pointer ${className}`}
          {...props}
        />
      );
    }

    if (type === "radio") {
      return (
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          className={`h-4 w-4 border-[#ced4da] dark:border-[#263168] text-[#845adf] focus:ring-2 focus:ring-[#845adf]/20 disabled:opacity-50 accent-[#845adf] cursor-pointer ${className}`}
          {...props}
        />
      );
    }

    let validationClass = "border-[#e9edf4] dark:border-[#263168] focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15";
    if (valid) {
      validationClass = "border-[#26bf94] focus:border-[#26bf94] focus:ring-2 focus:ring-[#26bf94]/15";
    } else if (invalid) {
      validationClass = "border-[#e6533c] focus:border-[#e6533c] focus:ring-2 focus:ring-[#e6533c]/15";
    }

    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={`w-full rounded-md border bg-white dark:bg-[#1a2352] h-8 py-1 px-3 text-xs sm:text-sm text-[#2c3138] dark:text-white outline-none transition duration-150 shadow-none disabled:cursor-not-allowed disabled:bg-[#f0f1f7] dark:disabled:bg-[#111c43] disabled:opacity-60 placeholder:text-[#8c9097] placeholder:opacity-75 ${validationClass} ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Label = forwardRef(
  ({ className = "", check = false, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`${
          check
            ? "inline-flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-[#2c3138] dark:text-white"
            : "block text-xs sm:text-[13px] font-semibold text-[#2c3138] dark:text-white mb-1"
        } ${className}`}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = "Label";

export const Select = forwardRef(
  ({ className = "", disabled = false, valid, invalid, children, ...props }, ref) => {
    let validationClass = "border-[#e9edf4] dark:border-[#263168] focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15";
    if (valid) {
      validationClass = "border-[#26bf94] focus:border-[#26bf94] focus:ring-2 focus:ring-[#26bf94]/15";
    } else if (invalid) {
      validationClass = "border-[#e6533c] focus:border-[#e6533c] focus:ring-2 focus:ring-[#e6533c]/15";
    }

    return (
      <select
        ref={ref}
        disabled={disabled}
        className={`w-full rounded-md border bg-white dark:bg-[#1a2352] h-8 py-1 pl-3 pr-7 text-xs sm:text-sm text-[#2c3138] dark:text-white outline-none transition duration-150 shadow-none disabled:cursor-not-allowed disabled:bg-[#f0f1f7] dark:disabled:bg-[#111c43] disabled:opacity-60 cursor-pointer ${validationClass} ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export const Textarea = forwardRef(
  ({ className = "", disabled = false, valid, invalid, ...props }, ref) => {
    let validationClass = "border-[#e9edf4] dark:border-[#263168] focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15";
    if (valid) {
      validationClass = "border-[#26bf94] focus:border-[#26bf94] focus:ring-2 focus:ring-[#26bf94]/15";
    } else if (invalid) {
      validationClass = "border-[#e6533c] focus:border-[#e6533c] focus:ring-2 focus:ring-[#e6533c]/15";
    }

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={`w-full rounded-md border bg-white dark:bg-[#1a2352] p-3 text-xs sm:text-sm text-[#2c3138] dark:text-white outline-none transition duration-150 shadow-none disabled:cursor-not-allowed disabled:bg-[#f0f1f7] dark:disabled:bg-[#111c43] disabled:opacity-60 placeholder:text-[#8c9097] placeholder:opacity-75 ${validationClass} ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const HelperText = forwardRef(
  ({ className = "", valid, invalid, children, ...props }, ref) => {
    let textClass = "text-[#8c9097]";
    if (valid) textClass = "text-[#26bf94]";
    if (invalid) textClass = "text-[#e6533c]";

    return (
      <p ref={ref} className={`mt-1 text-xs ${textClass} ${className}`} {...props}>
        {children}
      </p>
    );
  }
);
HelperText.displayName = "HelperText";

export default { Input, Label, Select, Textarea, HelperText };

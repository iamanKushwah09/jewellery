import React from "react";

export const Badge = ({
  type = "primary",
  children,
  className = "",
  ...props
}) => {
  const typeClasses = {
    success: "bg-[#26bf94]/10 text-[#26bf94] border border-[#26bf94]/20",
    danger: "bg-[#e6533c]/10 text-[#e6533c] border border-[#e6533c]/20",
    warning: "bg-[#f5b849]/10 text-[#f5b849] border border-[#f5b849]/20",
    neutral: "bg-[#f0f1f7] text-[#536485] border border-stroke",
    primary: "bg-[#845adf]/10 text-[#845adf] border border-[#845adf]/20",
    info: "bg-[#23b7e5]/10 text-[#23b7e5] border border-[#23b7e5]/20",
  };

  const chosenType = typeClasses[type] || typeClasses.primary;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-normal ${chosenType} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

import React from "react";

const Label = ({ label }) => {
  return (
    <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs sm:text-[13px] font-semibold text-[#2c3138] dark:text-[#f3f4f6] mb-1.5">
      {label}
    </label>
  );
};

export default Label;

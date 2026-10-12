import React, { useContext } from "react";
import { HashLoader } from "react-spinners";
import { ThemeCustomizerContext } from "@/context/ThemeCustomizerContext";

const ThemeSuspense = () => {
  const themeContext = useContext(ThemeCustomizerContext);
  
  // Dynamically resolve theme color with fallbacks
  const activeColor =
    themeContext?.primaryColor ||
    (typeof window !== "undefined" &&
      getComputedStyle(document.documentElement).getPropertyValue("--primary-color")?.trim()) ||
    "#845adf";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f0f1f7] dark:bg-[#111c43] transition-all duration-500">
      <div className="flex flex-col items-center gap-4">
        <HashLoader color={activeColor} size={48} />
        <p className="text-[#536485] dark:text-[#a3aed1] font-medium tracking-wide mt-2 text-sm">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default ThemeSuspense;

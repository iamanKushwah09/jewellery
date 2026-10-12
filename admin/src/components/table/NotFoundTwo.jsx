import React from "react";
import { FiInbox } from "react-icons/fi";

const NotFoundTwo = ({ title = "No items found" }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#845adf]/15 to-[#23b7e5]/10 border border-[#845adf]/20 flex items-center justify-center text-[#845adf] mb-2.5 shadow-xs">
        <FiInbox className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#26bf94]" />
      </div>
      <p className="text-xs font-semibold text-[#536485] dark:text-[#a3aed1] tracking-tight">
        {title}
      </p>
    </div>
  );
};

export default NotFoundTwo;

import React from "react";
import SidebarContent from "@/components/sidebar/SidebarContent";

const DesktopSidebar = () => {
  return (
    <aside className="z-30 flex-shrink-0 hidden w-72 overflow-y-auto bg-[#111c43] text-[#a3aed1] border-r border-[#263168] lg:block sidebar-scroll select-none transition-all duration-300">
      <SidebarContent />
    </aside>
  );
};

export default DesktopSidebar;


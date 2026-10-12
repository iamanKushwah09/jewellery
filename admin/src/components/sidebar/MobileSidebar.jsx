import React, { useContext } from "react";
import { IoCloseOutline } from "react-icons/io5";

// internal import
import SidebarContent from "@/components/sidebar/SidebarContent";
import { SidebarContext } from "@/context/SidebarContext";

function MobileSidebar() {
  const { isSidebarOpen, closeSidebar } = useContext(SidebarContext);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeSidebar}
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 lg:hidden ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-72 flex-col bg-[#111c43] text-[#a3aed1] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden isolate transform-gpu overflow-hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <SidebarContent onClose={closeSidebar} />
      </aside>
    </>
  );
}

export default MobileSidebar;


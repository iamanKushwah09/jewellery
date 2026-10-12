import Drawer from "rc-drawer";
import React, { useContext, useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useLocation } from "react-router-dom";
//internal import
import { SidebarContext } from "@/context/SidebarContext";


const MainDrawer = ({ children, product }) => {
  const { toggleDrawer, isDrawerOpen, closeDrawer, windowDimension, navBar } =
    useContext(SidebarContext);
  const location = useLocation();

  const largeDrawerRoutes = [
    "/products",
    "/item",
    "/orders",
    "/customer-order",
    "/customers",
    "/sale",
    "/sale-order",
    "/pos",
    "/dispatch",
    "/stock",
    "/catalog",
  ];

  const isLargeForm =
    Boolean(product) ||
    largeDrawerRoutes.some((route) => location.pathname.startsWith(route));

  // If sidebar is closed (!navBar) or on mobile/tablet (windowDimension < 1024),
  // open in 100% pure screen as requested.
  // When sidebar is open on desktop (w-72 = 288px sidebar):
  // - Large forms take the full remaining screen width (calc(100% - 288px))
  // - Standard forms take 50% (or 60% on smaller viewports)
  const isSidebarClosed = !navBar || windowDimension < 1024;

  const drawerWidth = isSidebarClosed
    ? "100%"
    : isLargeForm
    ? "calc(100% - 288px)"
    : windowDimension < 1280
    ? "60%"
    : "50%";

  return (
    <Drawer
      open={isDrawerOpen}
      onClose={closeDrawer}
      parent={null}
      level={null}
      placement={"right"}
      width={drawerWidth}
    >
      <button
        onClick={toggleDrawer}
        className="absolute focus:outline-none z-20 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors bg-white border border-stroke shadow-sm mr-5 mt-5 right-0 left-auto w-9 h-9 rounded-full flex items-center justify-center"
      >
        <FiX className="w-5 h-5" />
      </button>
      <div className="flex flex-col w-full h-full justify-between">
        {children}
      </div>
    </Drawer>
  );
};

export default React.memo(MainDrawer);

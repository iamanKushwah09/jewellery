import React, { useContext, useState } from "react";
import { NavLink, Route } from "react-router-dom";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { Button, WindmillContext } from "@windmill/react-ui";
import { IoLogOutOutline } from "react-icons/io5";
//internal import
import getFilteredSidebar from "@/routes/sidebar";
// import SidebarSubMenu from "SidebarSubMenu";
import logoDark from "@/assets/img/logo/logo.png";
import { AdminContext } from "@/context/AdminContext";
import SidebarSubMenu from "@/components/sidebar/SidebarSubMenu";

const SidebarContent = () => {
  const { t } = useTranslation();
  const { mode } = useContext(WindmillContext);
  const { dispatch, state } = useContext(AdminContext);
  const { adminInfo } = state;

  const sidebar = getFilteredSidebar(adminInfo.permission); // Call the function with the user's permissions


  const handleLogOut = () => {
    dispatch({ type: "USER_LOGOUT" });
    Cookies.remove("adminInfo");
  };

  return (
    <div className="py-4 text-gray-500 dark:text-gray-400">
      <a className="text-gray-900 dark:text-gray-200 block px-6 pb-4" href="/dashboard">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B6508, #C9920A)', borderRadius: '2px' }}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 6h6.6l-5.3 3.9 2 6.1L12 14l-5.7 4 2-6.1L3 8h6.6z"/>
            </svg>
          </div>
          <div>
            <div
              className="text-base font-bold text-gray-900 dark:text-white leading-none"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '0.12em' }}
            >
              Vellora
            </div>
            <div className="text-[9px] tracking-[0.35em] uppercase mt-0.5" style={{ color: '#C9920A' }}>
              JEWELS
            </div>
          </div>
        </div>
        <div
          className="mt-3 h-px"
          style={{ background: 'linear-gradient(90deg, #C9920A, #E8B84B, transparent)' }}
        />
      </a>
      <ul className="mt-8">
        {sidebar.map((route) =>
          route.routes ? (
            <SidebarSubMenu route={route} key={route.name} />
          ) : (
            <li className="relative" key={route.name}>
              <NavLink
                exact
                to={route.path}
                target={`${route?.outside ? "_blank" : "_self"}`}
                className="px-6 py-4 inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-amber-700 dark:hover:text-gray-200"
                activeStyle={{
                  color: "#C9920A",
                }}
                rel="noreferrer"
              >
                <Route path={route.path} exact={route.exact}>
                  <span
                    className="absolute inset-y-0 left-0 w-1 rounded-tr-lg rounded-br-lg"
                    style={{ background: '#C9920A' }}
                    aria-hidden="true"
                  ></span>
                </Route>
                <route.icon className="w-5 h-5" aria-hidden="true" />
                <span className="ml-4">{t(`${route.name}`)}</span>
              </NavLink>
            </li>
          )
        )}
      </ul>
      {/* <span className="lg:fixed bottom-0 px-6 py-6 w-64 mx-auto relative mt-3 block">
        <Button onClick={handleLogOut} size="large" className="w-full">
          <span className="flex items-center">
            <IoLogOutOutline className="mr-3 text-lg" />
            <span className="text-sm">{t("LogOut")}</span>
          </span>
        </Button>
      </span> */}
    </div>
  );
};

export default SidebarContent;

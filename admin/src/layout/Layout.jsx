import React, { useContext, Suspense, useEffect, lazy } from "react";
import { Switch, Route, Redirect, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

//internal import
import Main from "@/layout/Main";
import getRoutes from "@/routes/index";
import Header from "@/components/header/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import { SidebarContext } from "@/context/SidebarContext";
import ThemeSuspense from "@/components/theme/ThemeSuspense";
import SettingServices from "@/services/SettingServices";
import { addSetting } from "@/reduxStore/slice/settingSlice";
const Page404 = lazy(() => import("@/pages/404"));
// import { useSelector } from "react-redux";
import { AdminContext } from "@/context/AdminContext";
// import AuthDebug from "@/components/debug/AuthDebug";
import SalesmanPresenceTracker from "@/components/common/SalesmanPresenceTracker";

const Layout = () => {
  const dispatch = useDispatch();
  const { isSidebarOpen, closeSidebar, closeDrawer, navBar } = useContext(SidebarContext);
  let location = useLocation();
  const isOnline = navigator.onLine;

  const { state } = useContext(AdminContext);
  const { adminInfo } = state;
  const routes = getRoutes(adminInfo?.permission || [], adminInfo); // Call the function with user permissions and adminInfo

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await SettingServices.getGlobalSetting();
        dispatch(addSetting({ ...res, name: "globalSetting" }));
      } catch (err) {
        console.error("Error updating settings from background fetch", err);
      }
    };
    fetchSettings();
  }, [dispatch]);

  useEffect(() => {
    closeSidebar();
    if (closeDrawer) closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <>
      {!isOnline && (
        <div className="flex justify-center bg-red-600 text-white">
          You are in offline mode!{" "}
        </div>
      )}
      <SalesmanPresenceTracker />
      {/* Debug component - remove in production */}
      {/* <AuthDebug /> */}
      <div
        className={`flex h-screen overflow-hidden bg-[#f0f1f7] dark:bg-[#111c43] ${isSidebarOpen ? "overflow-hidden" : ""
          }`}
      >
        {navBar && <Sidebar />}

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header />
          <Main>
            <Suspense fallback={<ThemeSuspense />}>
              <Switch>
                {routes.map((route, i) => {
                  return route.component ? (
                    <Route
                      key={i}
                      exact={true}
                      path={`${route.path}`}
                      render={(props) => <route.component {...props} />}
                    />
                  ) : null;
                })}
                <Redirect exact from="/" to="/dashboard" />
                <Route component={Page404} />
              </Switch>
            </Suspense>
          </Main>
        </div>
      </div>
    </>
  );
};

export default Layout;

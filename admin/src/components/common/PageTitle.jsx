import React from "react";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";

const PageTitle = ({ title, description }) => {
  const settings = useSelector((state) => state.setting?.settingItem || []);
  const globalSetting = settings.find((value) => value.name === "globalSetting");
  const companyName = globalSetting?.company_name || globalSetting?.shop_name || "";

  const pageTitle = title
    ? (companyName ? `${title} | ${companyName} Admin Dashboard` : `${title} | Admin Dashboard`)
    : (companyName ? `${companyName} Admin Dashboard` : "Admin Dashboard");

  const pageDesc = description
    ? description
    : (companyName ? `${companyName} Admin Panel` : "Admin Dashboard");

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
    </Helmet>
  );
};

export default PageTitle;

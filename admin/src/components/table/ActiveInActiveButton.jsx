import React, { useContext } from "react";
import Switch from "react-switch";

//internal import

import AdminServices from "@/services/AdminServices";
import { SidebarContext } from "@/context/SidebarContext";
import { notifyError, notifySuccess } from "@/utils/toast";

const ActiveInActiveButton = ({ id, status, option, staff }) => {
  const { setIsUpdate } = useContext(SidebarContext);
  const handleChangeStatus = async (id, staff) => {
    // return notifyError("This option disabled for this option!");
    try {
      let newStatus;
      if (status === "Active") {
        newStatus = "Inactive";
      } else {
        newStatus = "Active";
      }
      const res = await AdminServices.updateStaffStatus(id, {
        status: newStatus,
      });
      setIsUpdate(true);
      notifySuccess(res.message);
      return;
    } catch (err) {
      notifyError(err ? err?.response?.data?.message : err?.message);
    }
  };

  return (
    <>
      <Switch
        onChange={() => handleChangeStatus(id, staff)}
        checked={status === "Active" ? true : false}
        className="react-switch md:ml-0"
        uncheckedIcon={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              width: 120,
              fontSize: 14,
              color: "white",
              paddingRight: 22,
              paddingTop: 1,
            }}
          ></div>
        }
        width={36}
        height={18}
        handleDiameter={14}
        offColor="#CBD5E1"
        onColor="#845adf"
        checkedIcon={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 73,
              height: "100%",
              fontSize: 14,
              color: "white",
              paddingLeft: 20,
              paddingTop: 1,
            }}
          ></div>
        }
      />
    </>
  );
};

export default ActiveInActiveButton;

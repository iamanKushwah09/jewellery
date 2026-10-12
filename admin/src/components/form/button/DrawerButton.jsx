import React, { useContext } from "react";
import { Button } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";

//internal import
import { SidebarContext } from "@/context/SidebarContext";
import spinnerLoadingImage from "@/assets/img/spinner.gif";

const DrawerButton = ({ id, title, isSubmitting, nextBtn, flag = true, setTapValue, setNextBtn, tapValue = "" }) => {
  const { t } = useTranslation();
  const { toggleDrawer, isDrawerOpen } = useContext(SidebarContext);

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <>
      <div
        className="sticky bottom-0 z-20 w-full py-3.5 px-6 flex items-center justify-end gap-3 bg-white dark:bg-[#1a2352] border-t border-[#e9edf4] dark:border-[#263168] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] mt-auto"
      >
        <div className="w-full sm:w-auto">
          <Button
            onClick={() => {
              toggleDrawer();
              if (setNextBtn) setNextBtn(false);
              if (setTapValue) setTapValue("Item Info");
            }}
            className="h-10 px-5 w-full sm:w-auto border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43] text-[#4b5563] dark:text-[#a3aed1] hover:bg-gray-50 dark:hover:bg-[#1e2753] font-medium rounded-lg transition-colors"
            layout="outline"
          >
            {t("CancelBtn")}
          </Button>
        </div>
        <div className="w-full sm:w-auto">
          {nextBtn ? (
            <Button type="submit" className="h-10 px-6 w-full sm:w-auto rounded-lg font-medium bg-[#845adf] hover:bg-[#7248cf] text-white shadow-sm transition-colors">
              Next
            </Button>
          ) : isSubmitting ? (
            <Button disabled={true} type="button" className="h-10 px-6 w-full sm:w-auto rounded-lg font-medium flex items-center justify-center bg-[#845adf]/70 text-white cursor-not-allowed">
              <img
                src={spinnerLoadingImage}
                alt="Loading"
                width={18}
                height={18}
                className="animate-spin mr-2"
              />
              <span>Processing</span>
            </Button>
          ) : tapValue === "Item Attribute" || flag ? (
            <Button type={"submit"} className="h-10 px-6 w-full sm:w-auto rounded-lg font-medium bg-[#845adf] hover:bg-[#7248cf] text-white shadow-sm transition-colors">
              {id ? (
                <span>{t("UpdateBtn")} {title}</span>
              ) : (
                <span>Add {title}</span>
              )}
            </Button>
          ) : (
            <Button onClick={() => setTapValue && setTapValue("Item Attribute")} className="h-10 px-6 w-full sm:w-auto rounded-lg font-medium bg-[#845adf] hover:bg-[#7248cf] text-white shadow-sm transition-colors">
              Next
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default DrawerButton;

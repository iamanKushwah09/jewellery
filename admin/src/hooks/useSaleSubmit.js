import dayjs from "dayjs";
import Cookies from "js-cookie";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import { notifyError, notifySuccess } from "@/utils/toast";
import SaleServices from "@/services/SaleServices";

const useSaleSubmit = (id) => {
    const { state } = useContext(AdminContext);
    const { adminInfo } = state;
    const { isDrawerOpen, closeDrawer, setIsUpdate, lang } = useContext(SidebarContext);
    const [selectedDate, setSelectedDate] = useState(dayjs(new Date()).format("YYYY-MM-DD"));
    const [language, setLanguage] = useState(lang || "en");
    const [resData, setResData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkedState, setCheckedState] = useState([]);
    const location = useLocation();

    const {
        register,
        handleSubmit,
        setValue,
        clearErrors,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            setIsSubmitting(true);
            let res;
            if (id) {
                res = await SaleServices.updateSale(id, data);
            } else {
                res = await SaleServices.createSale(data);
            }
            setIsUpdate(true);
            setIsSubmitting(false);

            let successMsg = res.message || "Sale saved successfully";
            const redeemed = Number(res.pointsRedeemed ?? data.loyaltyPointsRedeemed ?? 0);
            const earned = Number(res.pointsEarned ?? res.data?.loyaltyPointsEarned ?? 0);
            if (redeemed > 0 || earned > 0) {
                const parts = [];
                if (redeemed > 0) parts.push(`−${redeemed} pts redeemed`);
                if (earned > 0) parts.push(`+${earned} pts earned`);
                successMsg += ` (${parts.join(", ")})`;
            }

            notifySuccess(successMsg);
            closeDrawer();
        } catch (err) {
            notifyError(err?.response?.data?.message || err?.message);
            setIsSubmitting(false);
        }
    };

    const getSaleData = async () => {
        try {
            const res = await SaleServices.getSaleById(id);
            if (res) {
                setResData(res);
                setValue("name", res.name);
                setValue("description", res.description);
            }
        } catch (err) {
            notifyError(err?.response?.data?.message || err?.message);
        }
    };

    const handleSelectLanguage = (lang) => {
        setLanguage(lang);
        if (Object.keys(resData).length > 0) {
            setValue("name", resData.name[lang || "en"]);
        }
    };

    useEffect(() => {
        if (!isDrawerOpen) {
            setResData({});
            setValue("name", "");
            setValue("description", "");
            clearErrors("name");
            clearErrors("description");
            return;
        }
        if (id) {
            getSaleData();
        }
    }, [id, setValue, isDrawerOpen, adminInfo?.email, clearErrors]);

    useEffect(() => {
        if (location.pathname === "/edit-profile" && Cookies.get("adminInfo")) {
            getSaleData();
        }
    }, [location.pathname, setValue]);

    return {
        register,
        handleSubmit,
        onSubmit,
        language,
        errors,
        selectedDate,
        setSelectedDate,
        isSubmitting,
        handleSelectLanguage,
        setCheckedState,
        checkedState
    };
};

export default useSaleSubmit;

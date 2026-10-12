import React, { useEffect, useState } from "react";
import WhatsappSettingServices from "@/services/WhatsappSettingServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import { useTranslation } from "react-i18next";
import { FiPlus, FiMinus } from "react-icons/fi";
import AnimatedContent from "@/components/common/AnimatedContent";
import PageTitle from "@/components/Typography/PageTitle";

const WhatsappSetting = () => {
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [header, setHeader] = useState([{ id: "", value: "" }]);
  const [params, setParams] = useState([{ id: "", value: "" }]);
  const [requestMethod, setRequestMethod] = useState("GET");

  const { t } = useTranslation();

  const handleHeaderChange = (index, field, value) => {
    const newHeader = [...header];
    newHeader[index][field] = value;
    setHeader(newHeader);
  };

  const handleParamChange = (index, field, value) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };

  const handleAddHeader = () => setHeader([...header, { id: "", value: "" }]);
  const handleAddParam = () => setParams([...params, { id: "", value: "" }]);

  const handleRemoveHeader = (index) => {
    if (header.length > 1) {
      setHeader(header.filter((_, i) => i !== index));
    }
  };

  const handleRemoveParam = (index) => {
    if (params.length > 1) {
      setParams(params.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    const payload = { whatsappUrl, requestMethod, header, params };
    try {
      await WhatsappSettingServices.createWhatsappSetting(payload);
      notifySuccess("WhatsApp setting saved successfully!");
    } catch (error) {
      notifyError("Failed to save WhatsApp setting.");
    }
  };

  const handleReset = () => {
    setWhatsappUrl("");
    setRequestMethod("GET");
    setHeader([{ id: "", value: "" }]);
    setParams([{ id: "", value: "" }]);
  };

  useEffect(() => {
    const fetchWhatsappSetting = async () => {
      try {
        const response = await WhatsappSettingServices.getWhatsappSettings();
        if (response) {
          response.forEach((item) => {
            setWhatsappUrl(item.whatsappUrl || "");
            setRequestMethod(item.requestMethod || "GET");
            setHeader(item.header || [{ id: "", value: "" }]);
            setParams(item.params || [{ id: "", value: "" }]);
          });
        }
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    };
    fetchWhatsappSetting();
  }, []);

  return (
    <div className="sm:container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <PageTitle>{t("WhatsApp Setting") || "WhatsApp Setting"}</PageTitle>
      
      <AnimatedContent>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 p-4 sm:p-8 transition-colors">
          <div className="max-w-3xl space-y-6">
            
            {/* Request Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Request Method
              </label>
              <select
                value={requestMethod}
                onChange={(e) => setRequestMethod(e.target.value)}
                className="w-full h-11 px-4 text-sm border border-gray-300 dark:border-[#263168] rounded-lg bg-gray-50 dark:bg-[#1a2352] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>

            {/* WhatsApp URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp URL
              </label>
              <input
                type="text"
                placeholder="Enter WhatsApp URL"
                className="w-full h-11 px-4 text-sm border border-gray-300 dark:border-[#263168] rounded-lg bg-gray-50 dark:bg-[#1a2352] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-400 dark:placeholder-gray-500"
                value={whatsappUrl}
                onChange={(e) => setWhatsappUrl(e.target.value)}
              />
            </div>

            {/* Headers */}
            <div className="pt-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Headers
              </h2>
              <div className="space-y-3">
                {header.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input
                      type="text"
                      placeholder="Enter Header Id"
                      className="flex-1 h-11 px-4 text-sm border border-gray-300 dark:border-[#263168] rounded-lg bg-gray-50 dark:bg-[#1a2352] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-400 dark:placeholder-gray-500"
                      value={item.id}
                      onChange={(e) => handleHeaderChange(index, "id", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Enter Value"
                      className="flex-1 h-11 px-4 text-sm border border-gray-300 dark:border-[#263168] rounded-lg bg-gray-50 dark:bg-[#1a2352] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-400 dark:placeholder-gray-500"
                      value={item.value}
                      onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(index)}
                      className="h-11 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg flex items-center justify-center transition-colors shrink-0"
                      title="Remove Header"
                    >
                      <FiMinus />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="h-10 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium inline-flex items-center transition-colors"
                >
                  <FiPlus className="mr-2" /> Add Header
                </button>
              </div>
            </div>

            {/* Params */}
            <div className="pt-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Params
              </h2>
              <div className="space-y-3">
                {params.map((param, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input
                      type="text"
                      placeholder="Enter Parameter Id"
                      className="flex-1 h-11 px-4 text-sm border border-gray-300 dark:border-[#263168] rounded-lg bg-gray-50 dark:bg-[#1a2352] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-400 dark:placeholder-gray-500"
                      value={param.id}
                      onChange={(e) => handleParamChange(index, "id", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Enter Value"
                      className="flex-1 h-11 px-4 text-sm border border-gray-300 dark:border-[#263168] rounded-lg bg-gray-50 dark:bg-[#1a2352] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-400 dark:placeholder-gray-500"
                      value={param.value}
                      onChange={(e) => handleParamChange(index, "value", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(index)}
                      className="h-11 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg flex items-center justify-center transition-colors shrink-0"
                      title="Remove Parameter"
                    >
                      <FiMinus />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleAddParam}
                  className="h-10 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium inline-flex items-center transition-colors"
                >
                  <FiPlus className="mr-2" /> Add Parameter
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-sm transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="h-10 px-6 bg-primary hover:opacity-90 text-white rounded-lg font-medium text-sm transition-opacity shadow-sm"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      </AnimatedContent>
    </div>
  );
};

export default WhatsappSetting;

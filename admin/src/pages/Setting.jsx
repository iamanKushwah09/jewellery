import { useTranslation } from "react-i18next";
import { Button, Select, Textarea } from "@windmill/react-ui";
import { FiUploadCloud, FiTrash2, FiImage } from "react-icons/fi";
//internal import

import Error from "@/components/form/others/Error";
import PageTitle from "@/components/Typography/PageTitle";
import useSettingSubmit from "@/hooks/useSettingSubmit";
import spinnerLoadingImage from "@/assets/img/spinner.gif";
import InputAreaTwo from "@/components/form/input/InputAreaTwo";
import SelectTimeZone from "@/components/form/selectOption/SelectTimeZone";
import SelectReceiptSize from "@/components/form/selectOption/SelectPrintSize";

const Setting = () => {
  const {
    errors,
    register,
    isSave,
    isSubmitting,
    onSubmit,
    handleSubmit,
    setValue,
    watch,
  } = useSettingSubmit();

  const { t } = useTranslation();
  const logoValue = watch("logo");

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo size should be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("logo", reader.result, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="sm:container md:p-6 p-4 w-full mx-auto bg-white  dark:bg-gray-800 dark:text-gray-200 rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 font-sans">
            <div className="col-span-12 md:col-span-12 lg:col-span-12 mr-3">
              <div className="lg:px-6 pt-4 lg:pl-40 lg:pr-40 md:pl-5 md:pr-5 flex-grow scrollbar-hide w-full max-h-full pb-0">
                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("NumberOfImagesPerProduct")}
                  </label>
                  <div className="sm:col-span-3">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label={t("NumberOfImagesPerProduct")}
                      name="number_of_image_per_product"
                      type="number"
                      placeholder={t("NumberOfImagesPerProduct")}
                    />
                    <Error errorName={errors.number_of_image_per_product} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("TimeZone")}
                  </label>

                  <div className="sm:col-span-3">
                    <SelectTimeZone
                      register={register}
                      name="default_time_zone"
                      label="Time Zone"
                    />
                    <Error errorName={errors.default_time_zone} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("DefaultDateFormat")}
                  </label>

                  <div className="sm:col-span-3">
                    <Select
                      {...register(`default_date_format`, {
                        required: "Default date formate is required",
                      })}
                    >
                      <option value="" defaultValue hidden>
                        {t("DefaultDateFormat")}
                      </option>
                      <option value="MMM D, YYYY">MM/DD/YYYY</option>
                      <option value="D MMM, YYYY">DD/MM/YYYY</option>
                      <option value="YYYY,MMM D">YYYY/MM/DD</option>
                    </Select>
                    <Error errorName={errors.default_date_format} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6 relative">
                  <label className="block text-sm text-gray-600 font-semibold dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("ReceiptSize")}
                  </label>
                  <div className="sm:col-span-3">
                    <SelectReceiptSize
                      label="Role"
                      register={register}
                      name="receipt_size"
                      required={true}
                    />
                    <Error errorName={errors.receipt_size} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("ShopName")}
                  </label>
                  <div className="sm:col-span-3">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label={t("ShopName")}
                      name="shop_name"
                      type="text"
                      placeholder={t("ShopName")}
                    />
                    <Error errorName={errors.shop_name} />
                  </div>
                </div>
                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("InvoiceCompanyName")}
                  </label>
                  <div className="sm:col-span-3">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label={t("InvoiceCompanyName")}
                      name="company_name"
                      type="text"
                      placeholder={t("InvoiceCompanyName")}
                    />
                    <Error errorName={errors.company_name} />
                  </div>
                </div>

                {/* Company Logo Setting */}
                <div className="grid md:grid-cols-5 items-start sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Company Logo
                    </label>
                    <p className="text-xs text-gray-400">
                      Displayed on Admin Sidebar, Invoices & PDF downloads
                    </p>
                  </div>
                  <div className="sm:col-span-3 space-y-3">
                    <div className="flex items-center gap-4">
                      {logoValue ? (
                        <div className="relative group p-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center w-28 h-20 overflow-hidden">
                          <img
                            src={logoValue}
                            alt="Company Logo Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setValue("logo", "", { shouldDirty: true })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity shadow"
                            title="Remove Logo"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800">
                          <FiImage size={24} className="mb-1" />
                          <span className="text-[10px] font-medium">No Logo</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg cursor-pointer transition-colors border border-emerald-200 dark:border-emerald-800">
                          <FiUploadCloud size={16} />
                          <span>Upload Logo File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-gray-400">
                          PNG, JPG, SVG, WebP up to 2MB
                        </p>
                      </div>
                    </div>

                    <div>
                      <InputAreaTwo
                        register={register}
                        label="Logo URL"
                        name="logo"
                        type="text"
                        placeholder="Or enter image URL (https://...)"
                      />
                      <Error errorName={errors.logo} />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {/* {t("FooterAddress")} */}
                    {t("VatNumber")}
                  </label>
                  <div className="sm:col-span-3">
                    <InputAreaTwo
                      register={register}
                      label="Address"
                      name="vat_number"
                      type="text"
                      placeholder="Vat Number"
                    />
                    <Error errorName={errors.vat_number} />
                  </div>
                </div>
                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("AddressLine")}
                  </label>
                  <div className="sm:col-span-3">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label="Address"
                      name="address"
                      type="text"
                      placeholder="Address"
                    />
                    <Error errorName={errors.address} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("PostCode")}
                  </label>
                  <div className="sm:col-span-3">
                    <InputAreaTwo
                      register={register}
                      label="Address"
                      name="post_code"
                      type="text"
                      placeholder="Post Code"
                    />
                    <Error errorName={errors.post_code} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("GlobalContactNumber")}
                  </label>
                  <div className=" sm:col-span-3">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label="Phone"
                      name="contact"
                      type="text"
                      placeholder="Contact Number"
                    />
                    <Error errorName={errors.contact} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("FooterEmail")}
                  </label>
                  <div className=" sm:col-span-3">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label="Email"
                      name="email"
                      type="text"
                      placeholder="Email"
                    />
                    <Error errorName={errors.email} />
                  </div>
                </div>
                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:col-span-2">
                    {t("WebSite")}
                  </label>
                  <div className=" sm:col-span-3">
                    <InputAreaTwo
                      register={register}
                      label="Email"
                      name="website"
                      type="text"
                      placeholder="Web Site"
                    />
                    <Error errorName={errors.website} />
                  </div>
                </div>

                {/* Company Policy / Bill Terms & Conditions */}
                <div className="grid md:grid-cols-5 items-start sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Company Policy / Bill Terms
                    </label>
                    <p className="text-xs text-gray-400">
                      Printed on all sale bills, invoices & PDF downloads. Write terms and conditions (one condition per line).
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <Textarea
                      className="border text-sm focus:outline-none block w-full bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-md focus:bg-white p-3 leading-relaxed"
                      rows={5}
                      name="company_policy"
                      placeholder={"1. Payment is due within 30 days of invoice date.\n2. Goods once sold will not be returned without original invoice.\n3. Damaged goods must be reported within 48 hours.\n4. All disputes are subject to local jurisdiction."}
                      {...register("company_policy")}
                    />
                    <Error errorName={errors.company_policy} />
                  </div>
                </div>
                <div className="flex flex-row-reverse pb-6">
                  {isSubmitting ? (
                    <Button disabled={true} type="button" className="h-12">
                      <img
                        src={spinnerLoadingImage}
                        alt="Loading"
                        width={20}
                        height={10}
                      />{" "}
                      <span className="font-serif ml-2 font-light">
                        Processing
                      </span>
                    </Button>
                  ) : (
                    <Button type="submit" className="h-12 px-8">
                      {" "}
                      {isSave ? "Save" : "Update"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
export default Setting;

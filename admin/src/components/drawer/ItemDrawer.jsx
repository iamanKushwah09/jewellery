import React, { Fragment, useEffect, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import {
  Card,
  CardBody,
  Input,
  Textarea,
  Button,
  Select,
} from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
// Internal imports
import Error from "@/components/form/others/Error";
import useAsync from "@/hooks/useAsync";
import Title from "@/components/form/others/Title";
import InputArea from "@/components/form/input/InputArea";
import DrawerButton from "@/components/form/button/DrawerButton";
import LabelArea from "@/components/form/selectOption/LabelArea";
import SelectUnit from "../form/selectOption/SelectUnit";
import SelectBrand from "../form/selectOption/SelectBrand";
import SelectItemGroup from "../form/selectOption/SelectItemGroup";
import SelectCategory from "../form/selectOption/SelectCategory";
import useItemSubmit from "@/hooks/useItemSubmit";
import AttributeGroupServices from "@/services/AttributeGroupServices";
import AttributeValueServices from "@/services/AttributeValueServices";
import CategoryUploader from "@/components/image-uploader/CategoryUploader";
import { FiTrash, FiPlusCircle } from "react-icons/fi";
import AttributeUploader from "../image-uploader/AttributeUploader";

const ItemDrawer = ({ id }) => {
  const {
    register,
    handleSubmit,
    handleItemSubmit,
    errors,
    imageUrl,
    setImageUrl,
    setNewImage,
    isSubmitting,
    selectedDate,
    setSelectedDate,
    handleSelectLanguage,
    setCheckedState,
    watch,
    setValue,
    setGSTData,
    gstData,
    setCheckedItems,
    checkedItems,
    newImage,
    resData,
  } = useItemSubmit(id);
  const { t } = useTranslation();

  const { data } = useAsync(() =>
    AttributeGroupServices.getAllAttributeGroup()
  );
  const { data: attributeData } = useAsync(() =>
    AttributeValueServices.getByAttributeValueByValue()
  );

  const [showAttributes, setShowAttributes] = useState(false);

  // Watch required fields in Item Info
  const nameValue = watch("name");
  const unitValue = watch("unit_id");
  const isItemInfoComplete = Boolean(
    nameValue && typeof nameValue === "string" && nameValue.trim().length > 0 && unitValue
  );

  // If editing an item that already has attributes or variants, auto-expand
  useEffect(() => {
    if (id && resData?.item_attribute) {
      const hasAttr =
        (resData.item_attribute?.variant &&
          resData.item_attribute.variant.length > 0 &&
          resData.item_attribute.variant.some((v) => v.price || v.stock)) ||
        (resData.item_attribute?.checkedItems &&
          Object.values(resData.item_attribute.checkedItems).some(Boolean));
      if (hasAttr) {
        setShowAttributes(true);
      }
    }
  }, [id, resData]);

  const rawVariant = watch("variant");
  const variant = Array.isArray(rawVariant) && rawVariant.length > 0
    ? rawVariant
    : [
        {
          attribute_image: [],
          price: "",
          selling_price: "",
          stock: "",
          groupArrSelections: {},
        },
      ];

  const handleToggleAttributes = () => {
    if (!isItemInfoComplete) return;
    const nextVal = !showAttributes;
    setShowAttributes(nextVal);
    if (nextVal) {
      if (!Array.isArray(rawVariant) || rawVariant.length === 0) {
        setValue("variant", [
          {
            attribute_image: [],
            price: "",
            selling_price: "",
            stock: "",
            groupArrSelections: {},
          },
        ]);
      }
    }
  };

  const handleCheckboxChange = (e, _id) => {
    setCheckedItems((prev = {}) => {
      const updatedCheckedItems = {
        ...prev,
        [_id]: !prev[_id],
      };
      return updatedCheckedItems;
    });
  };

  const handleAddField = () => {
    setValue("variant", [
      ...variant,
      {
        attribute_image: [],
        price: "",
        selling_price: "",
        stock: "",
        groupArrSelections: {},
      },
    ]);
  };

  const handleRemoveField = (index) => {
    const updatedAddresses = variant.filter((_, idx) => idx !== index);
    setValue("variant", updatedAddresses);
  };

  const handleChange = (e, index, _id) => {
    const { name, value } = e.target;
    const updatedVariant = [...variant];
    updatedVariant[index] = {
      ...updatedVariant[index],
      [name]: value,
      _id,
    };
    setValue("variant", updatedVariant);
  };

  const handleAttributeImage = (index, image) => {
    const updatedVariant = [...variant];
    updatedVariant[index] = {
      ...updatedVariant[index],
      attribute_image: image,
    };
    setValue("variant", updatedVariant);
  };

  useEffect(() => {
    if (id && Array.isArray(attributeData) && Array.isArray(variant) && variant.length > 0) {
      let variantUpdated = false;
      const newCheckedItems = { ...(checkedItems || {}) };
      let checkedUpdated = false;

      const newVariants = variant.map((v) => {
        let newGroupArrSelections = { ...(v.groupArrSelections || {}) };
        let selectionsUpdated = false;

        attributeData.forEach((group) => {
          if (!group || !group.name || !Array.isArray(group.groupArr)) return;
          const groupNameLower = group.name.toLowerCase();
          const attrKey =
            groupNameLower === "color" || groupNameLower === "colour"
              ? "color"
              : groupNameLower === "size"
                ? "size"
                : null;

          if (attrKey && v[attrKey] && !newGroupArrSelections[group.id]) {
            const matchingAttr = group.groupArr.find(
              (a) =>
                a && a.name && a.name.toLowerCase() === v[attrKey].toString().toLowerCase()
            );
            if (matchingAttr) {
              newGroupArrSelections[group.id] = matchingAttr.attribute_id;
              selectionsUpdated = true;
              if (!newCheckedItems[group.id]) {
                newCheckedItems[group.id] = true;
                checkedUpdated = true;
              }
            }
          }
        });

        if (selectionsUpdated) {
          variantUpdated = true;
          return { ...v, groupArrSelections: newGroupArrSelections };
        }
        return v;
      });

      if (variantUpdated) {
        setValue("variant", newVariants);
      }
      if (checkedUpdated) {
        setCheckedItems(newCheckedItems);
      }
    }
  }, [id, attributeData, variant, setValue, checkedItems, setCheckedItems]);

  const handleGroupChange = (e, index, groupName) => {
    const { value } = e.target;
    const updatedVariant = [...variant];
    updatedVariant[index] = {
      ...updatedVariant[index],
      groupArrSelections: {
        ...updatedVariant[index].groupArrSelections,
        [groupName]: value,
      },
    };
    setValue("variant", updatedVariant);
  };

  return (
    <>
      <div className="w-full relative px-6 py-3 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Title
          register={register}
          title={id ? t("Update Item") : t("Add Item")}
        />
      </div>

      <Scrollbars className="w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative dark:bg-gray-700 dark:text-gray-200">
        <Card className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-full">
          <CardBody className="p-2 sm:p-2.5">
            <form onSubmit={handleSubmit((data) => handleItemSubmit(data, showAttributes))}>
              <div className="px-1 flex-grow scrollbar-hide w-full max-h-full pb-20">
                {/* Ultra-compact Unified Form Grid */}
                <div className="grid grid-cols-12 gap-x-1.5 gap-y-1 sm:gap-x-2 sm:gap-y-1">
                  {/* Row 1: Name, Alias, Category, Item group */}
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <InputArea
                      required
                      register={register}
                      label="Name"
                      name="name"
                      type="text"
                      autoComplete="username"
                      placeholder="Name"
                    />
                    <Error errorName={errors?.name} />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Alias
                    </label>
                    <InputArea
                      register={register}
                      label="Alias"
                      name="alias"
                      type="text"
                      autoComplete="alias"
                      placeholder="Alias"
                    />
                    <Error errorName={errors?.alias} />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Category
                    </label>
                    <SelectCategory
                      register={register}
                      setValue={setValue}
                      label="Category"
                      name="category_id"
                      value={watch("category_id")}
                      required={false}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Item group
                    </label>
                    <SelectItemGroup
                      register={register}
                      label="Item group"
                      setValue={setValue}
                      name="item_group_id"
                      value={watch("item_group_id")}
                    />
                  </div>

                  {/* Row 2: Brand, Unit, Alternate unit, Conversion factor */}
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Brand
                    </label>
                    <SelectBrand
                      register={register}
                      setValue={setValue}
                      label="Brand"
                      name="brand_id"
                      value={watch("brand_id")}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <SelectUnit
                      register={register}
                      setValue={setValue}
                      label="Unit"
                      name="unit_id"
                      value={watch("unit_id")}
                    />
                    <Error errorName={errors?.unit_id} />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Alternate unit
                    </label>
                    <InputArea
                      register={register}
                      label="Alternate unit"
                      name="alternate_unit"
                      type="text"
                      placeholder="Alternate unit"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Conversion factor
                    </label>
                    <InputArea
                      register={register}
                      label="Conversion factor"
                      name="conversion_factor"
                      type="number"
                      placeholder="Conversion factor"
                    />
                  </div>

                  {/* Row 3: Tax GST, HSN Code, Sale Price, MRP */}
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Tax GST
                    </label>
                    <InputArea
                      register={register}
                      label="Tax GST"
                      name="tax_gst"
                      type="text"
                      placeholder="Tax GST"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      HSN Code
                    </label>
                    <InputArea
                      register={register}
                      label="HSN Code"
                      name="hsn_code"
                      type="text"
                      placeholder="HSN Code"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Sale Price
                    </label>
                    <InputArea
                      register={register}
                      label="Sale Price"
                      name="sale_price"
                      type="number"
                      placeholder="Sale Price"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      MRP
                    </label>
                    <InputArea
                      register={register}
                      label="MRP"
                      name="mrp"
                      type="number"
                      placeholder="MRP"
                    />
                  </div>

                  {/* Row 4: Discount, Vendor Discount, Short description, Specification */}
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Discount
                    </label>
                    <InputArea
                      register={register}
                      label="Discount"
                      name="discount"
                      type="number"
                      placeholder="Discount"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Vendor Discount
                    </label>
                    <InputArea
                      register={register}
                      label="Vendor Discount"
                      name="vendor_discount"
                      type="number"
                      placeholder="Vendor Discount"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Short description
                    </label>
                    <Textarea
                      className="h-8 py-1 px-2.5 text-xs sm:text-sm block w-full rounded-md border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#2c3138] dark:text-white placeholder:text-[#8c9097] outline-none transition focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15 resize-none"
                      {...register("short_description", {
                        required: false,
                      })}
                      name="short_description"
                      placeholder="Short description"
                      rows="1"
                      spellCheck="false"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Specification
                    </label>
                    <InputArea
                      register={register}
                      label="Specification"
                      name="specification"
                      type="text"
                      placeholder="Specification"
                    />
                  </div>

                  {/* Row 5: Long description (col 5) & Image (col 7) */}
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Long description
                    </label>
                    <Textarea
                      {...register("long_description")}
                      className="border text-xs block w-full rounded-md bg-white dark:bg-[#1a2352] border-[#e9edf4] dark:border-[#263168] p-1.5 text-[#2c3138] dark:text-white resize-none"
                      name="long_description"
                      placeholder="Long description"
                      rows="3"
                      spellCheck="false"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-7">
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                      Image
                    </label>
                    <CategoryUploader
                      folder="admin"
                      setNewImage={setNewImage}
                      initialImages={newImage}
                    />
                  </div>
                </div>

                {/* Simple Item Attributes ON/OFF Button */}
                <div className="my-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!isItemInfoComplete}
                    onClick={handleToggleAttributes}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      !isItemInfoComplete
                        ? "opacity-40 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed"
                        : showAttributes
                        ? "bg-[#845adf] text-white shadow-sm hover:bg-[#7248cf] cursor-pointer"
                        : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    }`}
                  >
                    <span>Item Attributes</span>
                    <span
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                        showAttributes ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          showAttributes ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                      />
                    </span>
                    <span className="font-bold text-[11px]">
                      {showAttributes ? "ON" : "OFF"}
                    </span>
                  </button>
                  {!isItemInfoComplete && (
                    <span className="text-[11px] text-gray-400 italic">
                      (Fill Name* & Unit* to enable)
                    </span>
                  )}
                </div>

                {/* Item Attributes Section (Opens Below when showAttributes is true) */}
                {showAttributes && (
                  <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
                    <div className="grid grid-cols-12 gap-x-1.5 gap-y-1 sm:gap-x-2 sm:gap-y-1 mb-1.5">
                      <div className="col-span-12 md:col-span-6">
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                          Including GST ?
                        </label>
                        <div className="flex items-center space-x-4 mt-1">
                          <label className="flex items-center cursor-pointer">
                            <Input
                              {...register("gst_check")}
                              type="radio"
                              value="Yes"
                              className="mr-2"
                              onChange={(e) => setGSTData(e.target?.value)}
                            />
                            <span className="text-xs sm:text-sm font-medium">Yes</span>
                          </label>
                          <label className="flex items-center ml-4 cursor-pointer">
                            <Input
                              {...register("gst_check")}
                              type="radio"
                              value="No"
                              className="mr-2"
                              onChange={(e) => setGSTData(e.target?.value)}
                            />
                            <span className="text-xs sm:text-sm font-medium">No</span>
                          </label>
                        </div>
                      </div>

                      {gstData === "No" && (
                        <div className="col-span-12 md:col-span-3">
                          <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                            GST <span className="text-red-500">*</span>
                          </label>
                          <InputArea
                            required={showAttributes}
                            register={register}
                            label="GST"
                            name="gst"
                            type="text"
                            placeholder="GST"
                          />
                          <Error errorName={errors?.gst} />
                        </div>
                      )}

                      <div className="col-span-12 md:col-span-3">
                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                          Offer
                        </label>
                        <InputArea
                          register={register}
                          label="Offer"
                          name="offer"
                          type="text"
                          placeholder="Offer"
                        />
                        <Error errorName={errors?.offer} />
                      </div>
                    </div>

                    {/* Attribute Checkboxes */}
                    <div className="mb-3">
                      <LabelArea label="Attribute" />
                      <div className="flex flex-wrap items-center gap-4 mt-1 p-2.5 rounded-lg bg-gray-50 dark:bg-[#1a2352]/40 border border-[#e9edf4] dark:border-[#263168]">
                        {Array.isArray(attributeData) && attributeData.map((group, i) => {
                          const attrId = group?.id;
                          return (
                            <label
                              key={i}
                              className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-medium"
                            >
                              <Input
                                type="checkbox"
                                checked={
                                  !!checkedItems &&
                                  !!attrId &&
                                  !!checkedItems[attrId]
                                }
                                onChange={(ev) =>
                                  handleCheckboxChange(ev, attrId)
                                }
                              />
                              <span>{group.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Variant Cards */}
                    <div className="space-y-3">
                      {variant?.map((x, index) => (
                        <div
                          key={index}
                          className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2352]/60 shadow-xs"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold uppercase text-[#845adf]">
                              Variant #{index + 1}
                            </span>
                            {variant.length > 1 && (
                              <Button
                                layout="outline"
                                size="small"
                                className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 px-2"
                                onClick={() => handleRemoveField(index)}
                              >
                                <FiTrash className="w-3.5 h-3.5 mr-1" />
                                <span className="text-xs">Remove</span>
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-12 gap-2 sm:gap-2.5">
                            <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Price <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  className="h-8 py-1 px-2.5 text-xs sm:text-sm block w-full rounded-md border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43]"
                                  {...register(`variant.${index}.price`, {
                                    required: showAttributes
                                      ? "Price is required!"
                                      : false,
                                  })}
                                  placeholder="Price"
                                />
                                {errors?.variant?.[index]?.price && (
                                  <p className="text-red-500 text-xs mt-0.5">
                                    {errors.variant[index].price.message}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Selling Price <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  className="h-8 py-1 px-2.5 text-xs sm:text-sm block w-full rounded-md border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43]"
                                  {...register(`variant.${index}.selling_price`, {
                                    required: showAttributes
                                      ? "Selling Price is required!"
                                      : false,
                                  })}
                                  placeholder="Selling Price"
                                />
                                {errors?.variant?.[index]?.selling_price && (
                                  <p className="text-red-500 text-xs mt-0.5">
                                    {errors.variant[index].selling_price.message}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Stock <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  className="h-8 py-1 px-2.5 text-xs sm:text-sm block w-full rounded-md border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#111c43]"
                                  {...register(`variant.${index}.stock`, {
                                    required: showAttributes
                                      ? "Stock is required!"
                                      : false,
                                  })}
                                  placeholder="Stock"
                                />
                                {errors?.variant?.[index]?.stock && (
                                  <p className="text-red-500 text-xs mt-0.5">
                                    {errors.variant[index].stock.message}
                                  </p>
                                )}
                              </div>

                              {/* Attribute dropdowns */}
                              {Array.isArray(attributeData) && attributeData.map((item) => {
                                return (
                                  checkedItems &&
                                  checkedItems[item.id] && (
                                    <div key={item.id} className="sm:col-span-3">
                                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Attribute for {item.name}
                                      </label>
                                      <Select
                                        className="h-8 py-1 px-2 text-xs sm:text-sm"
                                        value={
                                          x.groupArrSelections?.[item.id] || ""
                                        }
                                        onChange={(e) =>
                                          handleGroupChange(e, index, item.id)
                                        }
                                      >
                                        <option value="">
                                          Select {item.name}
                                        </option>
                                        {Array.isArray(item.groupArr) && item.groupArr.map(
                                          (groupItem, idx) => (
                                            <option
                                              key={idx}
                                              value={groupItem.attribute_id}
                                            >
                                              {groupItem.name}
                                            </option>
                                          )
                                        )}
                                      </Select>
                                    </div>
                                  )
                                );
                              })}
                            </div>

                            <div className="col-span-12 md:col-span-4">
                              <LabelArea label="Variant Image" />
                              <AttributeUploader
                                folder="admin"
                                initialImages={x.attribute_image || []}
                                index={index}
                                handleAttributeImage={handleAttributeImage}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {variant.length < 5 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            type="button"
                            layout="outline"
                            onClick={handleAddField}
                            className="flex items-center text-[#845adf] border-[#845adf] hover:bg-[#845adf]/10 h-8 px-3 text-xs"
                          >
                            <FiPlusCircle className="mr-1 w-3.5 h-3.5" />
                            <span>Add Another Variant</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DrawerButton
                id={id}
                title="Item"
                isSubmitting={isSubmitting}
                nextBtn={false}
              />
            </form>
          </CardBody>
        </Card>
      </Scrollbars>
    </>
  );
};

export default ItemDrawer;

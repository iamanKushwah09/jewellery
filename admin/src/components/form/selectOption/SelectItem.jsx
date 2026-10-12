import React, { useState, useEffect } from "react";
import ItemServices from "@/services/ItemServices";
import SearchableDropdown from "@/pages/SearchableDropdown";

const SelectItem = ({ register, name, label, setValue }) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const getItems = async () => {
      try {
        const res = await ItemServices.getActiveItem();
        if (res && Array.isArray(res)) {
          const formatted = res.map((item) => ({
            value: item._id,
            label: item.name,
          }));
          setOptions(formatted);
        }
      } catch (err) {
        console.error("Error fetching items: ", err);
      }
    };

    getItems();
  }, []);

  const handleSelect = (value) => {
    if (setValue) {
      setValue(name, value);
    }
  };

  return (
    <>
      <SearchableDropdown
        options={options}
        onChange={handleSelect}
        placeholder="Select Item"
      />

      {register && (
        <input
          type="hidden"
          {...register(name, {
            required: label ? `${label} is required!` : false,
          })}
        />
      )}
    </>
  );
};

export default SelectItem;

import { Textarea } from "@windmill/react-ui";
import React from "react";

const TextAreaCom = ({
  register,
  name,
  label,
  placeholder,
  required,
  type,
  value,
}) => {
  return (
    <>
      <Textarea
        className="block w-full rounded-md border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] p-3 text-sm text-[#2c3138] dark:text-white placeholder:text-[#8c9097] placeholder:opacity-75 focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15 outline-none transition duration-150"
        {...register(`${name}`, {
          required: required ? `${label} is required!` : false,
        })}
        type={type}
        placeholder={placeholder}
        name={name}
        value={value}
        rows="4"
        spellCheck="false"
      />
    </>
  );
};

export default TextAreaCom;

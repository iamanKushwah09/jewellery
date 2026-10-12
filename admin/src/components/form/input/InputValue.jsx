import { Input } from "@windmill/react-ui";

const InputValue = ({
  name,
  label,
  type,
  disabled,
  register,
  required,
  maxValue,
  minValue,
  currency,
  product,
  defaultValue,
  placeholder,
}) => {
  const value = {
    valueAsNumber: true,
    required: required ? `${label} is required!` : false,
    max: {
      value: maxValue,
      message: `Maximum value ${maxValue}!`,
    },
    min: {
      value: minValue,
      message: `Minimum value ${minValue}!`,
    },
    pattern: {
      value: /^[0-9]*$/,
      message: `Invalid ${label}!`,
    },
  };

  return (
    <>
      <div className={`flex flex-row`}>
        {product && (
          <span className="inline-flex items-center px-2.5 rounded-l-md border border-r-0 border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43] text-[#8c9097] dark:text-[#a3aed1] text-xs sm:text-sm h-8">
            {currency}
          </span>
        )}
        <Input
          {...register(`${name}`, value)}
          type={type}
          name={name}
          step={0.01}
          disabled={disabled}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={`h-8 text-xs sm:text-sm ${product ? "rounded-l-none" : ""}`}
        />
      </div>
    </>
  );
};

export default InputValue;

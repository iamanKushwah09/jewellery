import React from "react";

export const Avatar = ({
  size = "regular",
  src,
  alt = "avatar",
  className = "",
  children,
  ...props
}) => {
  const sizeClasses = {
    large: "h-12 w-12 text-base",
    regular: "h-9 w-9 text-sm",
    small: "h-6 w-6 text-xs",
  };

  const chosenSize = sizeClasses[size] || sizeClasses.regular;

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full border border-stroke bg-gray-100 flex-shrink-0 ${chosenSize} ${className}`}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="font-semibold text-body">{children || "A"}</span>
      )}
    </div>
  );
};

export default Avatar;

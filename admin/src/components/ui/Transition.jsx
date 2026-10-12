import React from "react";

export const Backdrop = ({ onClick, className = "", ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity ${className}`}
      {...props}
    />
  );
};

export const Transition = ({
  show = true,
  children,
  enter = "",
  enterFrom = "",
  enterTo = "",
  leave = "",
  leaveFrom = "",
  leaveTo = "",
  className = "",
  ...props
}) => {
  if (!show) return null;
  return (
    <div className={`transition-all duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default { Backdrop, Transition };

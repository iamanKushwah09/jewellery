import React, { forwardRef } from "react";

export const Card = forwardRef(({ className = "", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = "Card";

export const CardBody = forwardRef(({ className = "", children, ...props }, ref) => {
  return (
    <div ref={ref} className={`p-4 sm:p-5 text-[#536485] dark:text-[#a3aed1] ${className}`} {...props}>
      {children}
    </div>
  );
});
CardBody.displayName = "CardBody";

export default Card;

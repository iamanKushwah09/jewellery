import React from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from "react-icons/fi";

export const Alert = ({
  type = "info",
  onClose,
  children,
  className = "",
  ...props
}) => {
  const typeConfig = {
    success: {
      bg: "bg-[#26bf94]/10 border-[#26bf94]/30 text-[#156e55]",
      icon: <FiCheckCircle className="h-5 w-5 text-[#26bf94] flex-shrink-0" />,
    },
    danger: {
      bg: "bg-[#e6533c]/10 border-[#e6533c]/30 text-[#991B1B]",
      icon: <FiAlertCircle className="h-5 w-5 text-[#e6533c] flex-shrink-0" />,
    },
    warning: {
      bg: "bg-[#f5b849]/10 border-[#f5b849]/30 text-[#92400E]",
      icon: <FiAlertTriangle className="h-5 w-5 text-[#f5b849] flex-shrink-0" />,
    },
    info: {
      bg: "bg-[#845adf]/10 border-[#845adf]/30 text-[#5a36aa]",
      icon: <FiInfo className="h-5 w-5 text-[#845adf] flex-shrink-0" />,
    },
    neutral: {
      bg: "bg-[#f0f1f7] dark:bg-[#1a2352] border-stroke text-body",
      icon: <FiInfo className="h-5 w-5 text-body flex-shrink-0" />,
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="alert"
      className={`relative flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium ${config.bg} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:bg-black/5 transition-colors"
          aria-label="Dismiss"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;

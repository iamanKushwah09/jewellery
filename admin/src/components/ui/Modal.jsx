import React, { useEffect, forwardRef } from "react";
import { IoCloseOutline } from "react-icons/io5";

export const Modal = forwardRef(
  ({ isOpen = false, onClose = () => {}, children, className = "", ...props }, ref) => {
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };
      if (isOpen) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto modal-backdrop-high-z">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={`relative z-10 w-full max-w-xl rounded-2xl border border-stroke bg-white shadow-2xl transition-all duration-200 max-h-[90vh] flex flex-col ${className}`}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);
Modal.displayName = "Modal";

export const ModalHeader = forwardRef(
  ({ children, className = "", onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between border-b border-stroke px-6 py-4 text-base font-bold text-black ${className}`}
        {...props}
      >
        <div>{children}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-gray-100 hover:text-black transition-colors"
          >
            <IoCloseOutline className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
);
ModalHeader.displayName = "ModalHeader";

export const ModalBody = forwardRef(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex-1 overflow-y-auto px-6 py-4 text-sm text-body ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalBody.displayName = "ModalBody";

export const ModalFooter = forwardRef(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-wrap items-center justify-end gap-3 border-t border-stroke bg-gray-50/70 px-6 py-3.5 rounded-b-2xl ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModalFooter.displayName = "ModalFooter";

export default { Modal, ModalHeader, ModalBody, ModalFooter };

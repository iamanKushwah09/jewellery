// components/common/DeleteConfirmationModal.js
import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FiTrash2 } from "react-icons/fi";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEEAEA] text-[#DC2626] shadow-sm">
                    <FiTrash2 className="h-7 w-7" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-black"
                  >
                    Are you sure you want to delete?
                  </Dialog.Title>
                  <p className="text-sm mt-2 text-body leading-relaxed">
                    Do you really want to delete these records? You can't view this in your list anymore if you delete!
                  </p>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-stroke bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-50"
                    onClick={onClose}
                  >
                    No, Keep It
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-danger px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600"
                    onClick={onConfirm}
                  >
                    Yes, Delete It
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteConfirmationModal;

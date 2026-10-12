const myTheme = {
  // Alert
  alert: {
    base: "p-4 pl-12 relative rounded-xl border leading-5 shadow-xs",
    withClose: "pr-12",
    success:
      "bg-[#26bf94]/10 text-[#26bf94] border-[#26bf94]/30",
    danger: "bg-[#e6533c]/10 text-[#e6533c] border-[#e6533c]/30",
    warning: "bg-[#f5b849]/10 text-[#f5b849] border-[#f5b849]/30",
    neutral: "bg-[#f0f1f7] text-[#536485] border-stroke",
    info: "bg-[#845adf]/10 text-[#845adf] border-[#845adf]/30",
    icon: {
      base: "h-5 w-5",
      success: "text-[#26bf94]",
      danger: "text-[#e6533c]",
      warning: "text-[#f5b849]",
      neutral: "text-[#536485]",
      info: "text-[#845adf]",
    },
  },
  // Pagination
  pagination: {
    base: "flex flex-col justify-between text-xs sm:flex-row text-[#8c9097] dark:text-[#a3aed1] font-medium",
  },
  // TableFooter
  tableFooter: {
    base: "px-4 sm:px-6 py-3.5 border-t border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc]/90 dark:bg-[#111c43]/60 text-[#8c9097] dark:text-[#a3aed1]",
  },
  // TableRow
  tableRow: {
    base: "transition-colors duration-150 hover:bg-[#845adf]/[0.035] dark:hover:bg-white/[0.02] border-b border-[#e9edf4]/70 dark:border-[#263168]/70",
  },
  // TableHeader
  tableHeader: {
    base: "text-[11px] sm:text-xs font-bold tracking-wider text-left text-[#8c9097] dark:text-[#a3aed1] uppercase border-b border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc] dark:bg-[#111c43]/70",
  },
  // TableContainer
  tableContainer: {
    base: "w-full overflow-hidden border border-[#e9edf4] dark:border-[#263168] rounded-xl bg-white dark:bg-[#1a2352] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
  },
  // TableCell
  tableCell: {
    base: "px-4 py-3 sm:py-3.5 md:px-5 text-xs sm:text-sm font-medium text-[#2c3138] dark:text-white border-b border-[#e9edf4]/60 dark:border-[#263168]/60 align-middle whitespace-nowrap",
  },
  // TableBody
  tableBody: {
    base: "bg-white dark:bg-[#1a2352] divide-y divide-[#e9edf4] dark:divide-[#263168] text-[#2c3138] dark:text-[#a3aed1]",
  },
  // DropdownItem
  dropdownItem: {
    base: "mb-1 last:mb-0",
  },
  // Dropdown
  dropdown: {
    base: "absolute w-56 p-2 mt-2 text-[#2c3138] dark:text-white bg-white dark:bg-[#1a2352] border border-[#e9edf4] dark:border-[#263168] rounded-xl shadow-dropdown z-50 min-w-max-content",
    align: {
      left: "left-0",
      right: "right-0",
    },
  },
  // Avatar
  avatar: {
    base: "relative rounded-full inline-block overflow-hidden border border-[#e9edf4] dark:border-[#263168]",
    size: {
      large: "w-11 h-11",
      regular: "w-9 h-9",
      small: "w-7 h-7",
    },
  },
  // Modal
  modal: {
    base: "w-full px-6 py-5 overflow-hidden bg-white dark:bg-[#1a2352] rounded-2xl border border-[#e9edf4] dark:border-[#263168] shadow-dropdown sm:m-4 sm:max-w-xl custom-modal",
  },
  // ModalBody
  modalBody: {
    base: "mb-6 text-sm text-[#536485] dark:text-[#a3aed1]",
  },
  // ModalFooter
  modalFooter: {
    base: "flex flex-col items-center justify-end px-6 py-4 -mx-6 -mb-5 space-y-3 sm:space-y-0 sm:space-x-3 sm:flex-row bg-[#f9fafc] dark:bg-[#111c43]/60 border-t border-[#e9edf4] dark:border-[#263168]",
  },
  // ModalHeader
  modalHeader: {
    base: "mt-2 mb-3 text-lg font-bold text-[#2c3138] dark:text-white",
  },
  // Badge
  badge: {
    base: "inline-flex px-2.5 py-0.5 text-xs font-semibold leading-5 rounded-full",
    success:
      "text-[#26bf94] bg-[#26bf94]/10 border border-[#26bf94]/20",
    danger: "text-[#e6533c] bg-[#e6533c]/10 border border-[#e6533c]/20",
    warning: "text-[#f5b849] bg-[#f5b849]/10 border border-[#f5b849]/20",
    neutral: "text-[#536485] dark:text-[#a3aed1] bg-[#f0f1f7] dark:bg-[#111c43] border border-[#e9edf4] dark:border-[#263168]",
    primary: "text-[#845adf] bg-[#845adf]/10 border border-[#845adf]/20",
  },
  // Backdrop
  backdrop: {
    base: "fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center transition-all",
  },
  // Textarea
  textarea: {
    base: "block w-full border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] focus:bg-white text-sm text-[#2c3138] dark:text-white rounded-md focus:outline-none focus:border-[#845adf] p-3 shadow-none transition placeholder:text-[#8c9097] placeholder:opacity-75",
    active:
      "border-[#e9edf4] dark:border-[#263168] focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15",
    disabled: "cursor-not-allowed opacity-60 bg-[#f0f1f7] dark:bg-[#111c43]",
    valid:
      "border-[#26bf94] focus:border-[#26bf94] focus:ring-2 focus:ring-[#26bf94]/15",
    invalid:
      "border-[#e6533c] focus:border-[#e6533c] focus:ring-2 focus:ring-[#e6533c]/15",
  },
  // Select
  select: {
    base: "block w-full h-8 border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] px-3 py-1 text-sm text-[#2c3138] dark:text-white focus:outline-none rounded-md focus:border-[#845adf] shadow-none transition",
    active:
      "border-[#e9edf4] dark:border-[#263168] focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15",
    select: "leading-5",
    disabled: "cursor-not-allowed opacity-60 bg-[#f0f1f7] dark:bg-[#111c43]",
    valid:
      "border-[#26bf94] focus:border-[#26bf94]",
    invalid:
      "border-[#e6533c] focus:border-[#e6533c]",
  },
  // Label
  label: {
    base: "block text-xs sm:text-[13px] font-semibold text-[#2c3138] dark:text-white mb-1.5",
    check: "inline-flex items-center gap-2 cursor-pointer font-medium text-xs sm:text-sm text-[#2c3138] dark:text-white",
    disabled: "opacity-60 cursor-not-allowed",
  },
  // Input
  input: {
    base: "block w-full h-8 border border-[#e9edf4] dark:border-[#263168] px-3 py-1 text-xs sm:text-sm text-[#2c3138] dark:text-white focus:outline-none leading-5 rounded-md bg-white dark:bg-[#1a2352] focus:border-[#845adf] shadow-none transition placeholder:text-[#8c9097] placeholder:opacity-75",
    active:
      "border-[#e9edf4] dark:border-[#263168] focus:border-[#845adf] focus:ring-2 focus:ring-[#845adf]/15",
    disabled:
      "border-[#e9edf4] dark:border-[#263168] cursor-not-allowed opacity-60 bg-[#f0f1f7] dark:bg-[#111c43]",
    valid:
      "border-[#26bf94] focus:border-[#26bf94] focus:ring-2 focus:ring-[#26bf94]/15",
    invalid:
      "border-[#e6533c] focus:border-[#e6533c] focus:ring-2 focus:ring-[#e6533c]/15",
    radio:
      "text-[#845adf] border-[#ced4da] dark:border-[#263168] focus:ring-[#845adf] accent-[#845adf] cursor-pointer",
    checkbox:
      "text-[#845adf] border-[#ced4da] dark:border-[#263168] focus:ring-[#845adf] rounded accent-[#845adf] cursor-pointer",
  },
  // HelperText
  helperText: {
    base: "text-xs mt-1",
    valid: "text-[#26bf94]",
    invalid: "text-[#e6533c]",
  },
  // Card
  card: {
    base: "min-w-0 rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all",
    default: "bg-white dark:bg-[#1a2352]",
  },
  cardBody: {
    base: "p-5 sm:p-6 text-[#536485] dark:text-[#a3aed1]",
  },
  // Button
  button: {
    base: "align-bottom inline-flex items-center justify-center cursor-pointer leading-5 transition-all duration-200 font-semibold focus:outline-none rounded-lg",
    block: "w-full",
    size: {
      larger: "px-6 py-3.5 text-base rounded-xl",
      large: "px-5 py-2.5 text-sm rounded-lg",
      regular: "px-4 py-2.5 text-sm rounded-lg",
      small: "px-3 py-1.5 text-xs rounded-md",
      icon: {
        larger: "p-3 rounded-xl",
        large: "p-2.5 rounded-lg",
        regular: "p-2 rounded-lg",
        small: "p-1.5 rounded-md",
      },
      pagination: "px-3 py-1.5 text-xs rounded-md",
    },
    icon: {
      larger: "h-5 w-5",
      large: "h-5 w-5",
      regular: "h-4 w-4",
      small: "h-3.5 w-3.5",
      left: "mr-2",
      right: "ml-2",
    },
    primary: {
      base: "text-white bg-[#845adf] hover:bg-[#7248cf] font-semibold border border-transparent shadow-sm hover:shadow-md hover:shadow-[#845adf]/25 active:scale-[0.98]",
      active: "active:bg-[#7248cf]",
      disabled: "opacity-50 cursor-not-allowed",
    },
    modern: {
      base: "text-white bg-[#111c43] hover:bg-[#1a2352] border border-[#263168] shadow-sm active:scale-[0.98]",
      active: "active:bg-[#0c1433]",
      disabled: "opacity-50 cursor-not-allowed",
    },
    outline: {
      base: "text-[#2c3138] dark:text-white border-[#e9edf4] dark:border-[#263168] border bg-white dark:bg-[#1a2352] hover:bg-[#f0f1f7] dark:hover:bg-[#111c43] hover:border-[#845adf]/30 hover:text-[#845adf] shadow-xs active:scale-[0.98]",
      active:
        "active:bg-gray-50 focus:border-[#845adf]",
      disabled: "opacity-50 cursor-not-allowed bg-gray-100",
    },
    delete: {
      base: "text-[#e6533c] bg-[#e6533c]/10 hover:bg-[#e6533c] hover:text-white border border-[#e6533c]/25 shadow-xs active:scale-[0.98]",
      active:
        "active:bg-[#d4432c]",
      disabled: "opacity-50 cursor-not-allowed bg-gray-300",
    },
    link: {
      base: "text-[#845adf] focus:outline-none border border-transparent hover:underline",
      active:
        "active:text-[#7248cf]",
      disabled: "opacity-50 cursor-not-allowed",
    },
    dropdownItem: {
      base: "inline-flex items-center cursor-pointer w-full px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#845adf]",
    },
  },
};
export default myTheme;

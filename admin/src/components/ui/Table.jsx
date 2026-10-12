import React, { createContext, useContext, forwardRef } from "react";

const TableHeaderContext = createContext(false);

export const TableContainer = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`w-full overflow-hidden rounded-xl border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TableContainer.displayName = "TableContainer";

export const Table = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          className={`w-full min-w-full table-auto text-left border-separate border-spacing-0 whitespace-nowrap ${className}`}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = "Table";

export const TableHeader = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    return (
      <TableHeaderContext.Provider value={true}>
        <thead
          ref={ref}
          className={`bg-[#f9fafc] dark:bg-[#111c43]/70 border-b border-[#e9edf4] dark:border-[#263168] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8c9097] dark:text-[#a3aed1] ${className}`}
          {...props}
        >
          {children}
        </thead>
      </TableHeaderContext.Provider>
    );
  }
);
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    return (
      <TableHeaderContext.Provider value={false}>
        <tbody
          ref={ref}
          className={`divide-y divide-[#e9edf4] dark:divide-[#263168] bg-white dark:bg-[#1a2352] text-xs sm:text-sm text-[#2c3138] dark:text-[#a3aed1] ${className}`}
          {...props}
        >
          {children}
        </tbody>
      </TableHeaderContext.Provider>
    );
  }
);
TableBody.displayName = "TableBody";

export const TableRow = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={`group transition-colors duration-150 hover:bg-[#845adf]/[0.035] dark:hover:bg-white/[0.02] border-b border-[#e9edf4]/70 dark:border-[#263168]/70 ${className}`}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
TableRow.displayName = "TableRow";

export const TableCell = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    const isHeader = useContext(TableHeaderContext);

    if (isHeader) {
      return (
        <th
          ref={ref}
          scope="col"
          className={`px-4 py-3 sm:px-5 sm:py-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8c9097] dark:text-[#a3aed1] bg-[#f9fafc] dark:bg-[#111c43]/70 border-b border-[#e9edf4] dark:border-[#263168] align-middle whitespace-nowrap text-left ${className}`}
          {...props}
        >
          {children}
        </th>
      );
    }

    return (
      <td
        ref={ref}
        className={`px-4 py-3 sm:py-3.5 md:px-5 text-xs sm:text-sm font-medium text-[#2c3138] dark:text-white border-b border-[#e9edf4]/60 dark:border-[#263168]/60 align-middle whitespace-nowrap ${className}`}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = "TableCell";

export const TableFooter = forwardRef(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col sm:flex-row items-center justify-between border-t border-[#e9edf4] dark:border-[#263168] bg-[#f9fafc]/90 dark:bg-[#111c43]/60 px-4 sm:px-6 py-3.5 text-xs text-[#8c9097] dark:text-[#a3aed1] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TableFooter.displayName = "TableFooter";

export default Table;

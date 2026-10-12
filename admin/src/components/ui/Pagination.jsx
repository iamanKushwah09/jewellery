import React, { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export const Pagination = ({
  totalResults = 0,
  resultsPerPage = 10,
  onChange = () => {},
  label = "Table navigation",
  className = "",
  ...props
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalResults / resultsPerPage) || 1;

  useEffect(() => {
    // If total results change and current page is out of bounds, reset
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalResults, totalPages, currentPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    onChange(page);
  };

  const startResult = totalResults === 0 ? 0 : (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  // Generate page numbers window (up to 5 pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      aria-label={label}
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 w-full py-1 text-xs text-body font-medium ${className}`}
      {...props}
    >
      <div>
        Showing <span className="font-semibold text-black">{startResult}</span> -{" "}
        <span className="font-semibold text-black">{endResult}</span> of{" "}
        <span className="font-semibold text-black">{totalResults}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] hover:bg-[#845adf]/10 hover:text-[#845adf] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#536485] transition-all shadow-xs"
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => handlePageChange(page)}
            className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
              currentPage === page
                ? "bg-[#845adf] text-white shadow-sm shadow-[#845adf]/30"
                : "border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] hover:bg-[#845adf]/10 hover:text-[#845adf] shadow-xs"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9edf4] dark:border-[#263168] bg-white dark:bg-[#1a2352] text-[#536485] dark:text-[#a3aed1] hover:bg-[#845adf]/10 hover:text-[#845adf] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#536485] transition-all shadow-xs"
          aria-label="Next page"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

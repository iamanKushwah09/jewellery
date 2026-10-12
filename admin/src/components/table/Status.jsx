import { Badge } from "@windmill/react-ui";

const Status = ({ status }) => {
  if (status === "Pending" || status === "Inactive" || status === "Waiting for Password Reset") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5b849]/10 border border-[#f5b849]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#f5b849]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f5b849]" />
        {status}
      </span>
    );
  }

  if (status === "Processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#845adf]/10 border border-[#845adf]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#845adf]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#845adf] animate-pulse" />
        {status}
      </span>
    );
  }

  if (status === "Delivered" || status === "Active" || status === "POS-Completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#26bf94]/10 border border-[#26bf94]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#26bf94]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#26bf94]" />
        {status}
      </span>
    );
  }

  if (status === "Cancel" || status === "Cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6533c]/10 border border-[#e6533c]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#e6533c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#e6533c]" />
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f1f7] dark:bg-[#1a2352] border border-[#e9edf4] dark:border-[#263168] px-2.5 py-0.5 text-[11px] font-semibold text-[#536485] dark:text-[#a3aed1]">
      {status}
    </span>
  );
};

export default Status;

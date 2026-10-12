import React from "react";
import { Label } from "@windmill/react-ui";

const LabelArea = ({ label, status = false, className }) => {
  return (
    <Label className={className || "col-span-4 sm:col-span-2 font-medium text-sm"}>
      {label}{status && <span style={{ color: 'red' }}>*</span>}
    </Label>
  );
};

export default LabelArea;

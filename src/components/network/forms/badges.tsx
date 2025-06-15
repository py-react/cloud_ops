import React from "react";
export const RequiredBadge = () => (
  <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
    Required
  </span>
);

export const OptionalBadge = () => (
  <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-gray-50 px-1 py-0.5 text-xs font-medium text-gray-600">
    Optional
  </span>
); 
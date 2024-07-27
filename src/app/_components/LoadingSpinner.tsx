import React from "react";

const LoadingSpinner = () => (
  <div className="flex h-full items-center justify-center">
    <div className="mt-10 h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-red-800 sm:h-48 sm:w-48 md:h-64 md:w-64" />
  </div>
);

export default LoadingSpinner;

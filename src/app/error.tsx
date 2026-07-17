"use client";

import { useEffect } from "react";
import { ErrorTracker } from "@/lib/observability/errorTracker";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    ErrorTracker.captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-md shadow-sm border-2 border-red-100">
        <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
        <p className="text-sm opacity-80 mb-6">
          We've logged this error and our team will look into it.
        </p>
        <button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-sm active:translate-y-1"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

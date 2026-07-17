"use client";

import { ErrorTracker } from "@/lib/observability/errorTracker";
import { useEffect } from "react";
import "./globals.css"; // Ensure tokens are loaded

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    ErrorTracker.captureException(error, { digest: error.digest, scope: 'GlobalError' });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-4 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md border-2 border-slate-200">
            <h2 className="text-2xl font-bold mb-4 text-red-500">A critical error occurred</h2>
            <p className="text-gray-500 mb-6">The application encountered a fatal error and could not recover. Our team has been notified.</p>
            <button
              onClick={() => reset()}
              className="bg-blue-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

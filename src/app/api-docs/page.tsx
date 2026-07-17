"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "./spec";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="bg-white min-h-screen p-8 rounded-3xl m-4 shadow-sm border-2 border-slate-200">
      <h1 className="text-3xl font-bold mb-4 text-slate-800 px-4">LearnOS Developer API</h1>
      <p className="text-slate-500 mb-8 px-4">Explore and interact with the LearnOS endpoints below.</p>
      <div className="swagger-container">
        <SwaggerUI spec={openApiSpec} />
      </div>
    </div>
  );
}

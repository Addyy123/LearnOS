import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "../observability/logger";

/**
 * Validates the Origin or Referer header against the Host header.
 * This provides basic CSRF protection for state-mutating API routes
 * that rely on cookie-based authentication.
 */
export async function validateCSRF(): Promise<NextResponse | null> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const host = headersList.get("host");

  // Bypass CSRF checks in local development for easier IP testing
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  if (!host) {
    logger.warn("Missing Host header");
    return NextResponse.json({ error: "Missing Host header" }, { status: 400 });
  }

  // If there's an Origin, it must match the Host
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        logger.warn("CSRF check failed: Origin mismatch", { origin: originUrl.host, host });
        return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Malformed Origin" }, { status: 400 });
    }
  } 
  // If no Origin but Referer exists, check Referer
  else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        logger.warn("CSRF check failed: Referer mismatch", { referer: refererUrl.host, host });
        return NextResponse.json({ error: "Invalid Referer" }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Malformed Referer" }, { status: 400 });
    }
  }
  // If neither Origin nor Referer is present on a mutating request, it's highly suspicious
  // Modern browsers send Origin on cross-origin POST requests.
  else {
    // For strict security, we can block requests missing both.
    // However, some API clients or extensions strip them. We'll allow it but log a warning.
    logger.warn("Request missing both Origin and Referer headers", { host });
  }

  // Null means validation passed
  return null;
}

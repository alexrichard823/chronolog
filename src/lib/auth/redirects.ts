const DEFAULT_AUTHENTICATED_PATH = "/families";

export function safeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTHENTICATED_PATH,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (
    decodedValue.includes("\\") ||
    decodedValue.startsWith("//")
  ) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://chronolog.local");
    if (url.origin !== "http://chronolog.local") {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  throw new Error("NEXT_PUBLIC_SITE_URL must be set outside local development.");
}

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";

export const SSE_ORIGIN =
  import.meta.env.VITE_SSE_ORIGIN || API_ORIGIN;

export function joinOrigin(origin, path) {
  const o = String(origin || "").replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${o}${p}`;
}


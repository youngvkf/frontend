export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";

export const SSE_ORIGIN =
  import.meta.env.VITE_SSE_ORIGIN || API_ORIGIN;

function normalizeOrigin(input) {
  let o = String(input || "").trim().replace(/\/+$/, "");
  if (!o) return o;

  // 스킴이 없으면 환경에 맞게 보정
  if (!/^https?:\/\//i.test(o)) {
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o)) {
      o = `http://${o}`;
    } else {
      o = `https://${o}`;
    }
  }
  return o;
}

export function joinOrigin(origin, path) {
  const o = normalizeOrigin(origin);
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${o}${p}`;
}


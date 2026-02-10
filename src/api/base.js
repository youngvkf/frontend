// 배포/로컬 모두에서 API 주소를 한 곳에서 관리
// Vite는 VITE_로 시작하는 환경변수만 import.meta.env로 노출합니다.

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";

export const SSE_ORIGIN =
  import.meta.env.VITE_SSE_ORIGIN || API_ORIGIN;

export function joinOrigin(origin, path) {
  const o = String(origin || "").replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${o}${p}`;
}


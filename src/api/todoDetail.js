import { API_ORIGIN, joinOrigin } from "./base";

const API_BASE = joinOrigin(API_ORIGIN, "/api/todos");

async function parseJsonOrThrow(res, prefix) {
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const msg = (json && json.error) ? json.error : text;
    throw new Error(`${prefix}: ${res.status} ${res.statusText} ${msg || ""}`);
  }
  return json ?? {};
}

export const getTodoDetail = async ({ todoId }) => {
  const res = await fetch(`${API_BASE}/${todoId}/detail`, { credentials: "include" });
  return parseJsonOrThrow(res, "getTodoDetail 실패");
};

export const saveMenteeNote = async ({ todoId, menteeNote }) => {
  const res = await fetch(`${API_BASE}/${todoId}/detail/mentee-note`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ menteeNote }),
  });
  return parseJsonOrThrow(res, "saveMenteeNote 실패");
};

export const saveMentorFeedback = async ({ todoId, mentorFeedback }) => {
  const res = await fetch(`${API_BASE}/${todoId}/detail/mentor-feedback`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mentorFeedback }),
  });
  return parseJsonOrThrow(res, "saveMentorFeedback 실패");
};

export const uploadMenteeFiles = async ({ todoId, files }) => {
  const fd = new FormData();
  for (const f of Array.from(files || [])) fd.append("files", f);
  const res = await fetch(`${API_BASE}/${todoId}/detail/mentee-files`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  return parseJsonOrThrow(res, "uploadMenteeFiles 실패");
};

export const uploadMentorFiles = async ({ todoId, files }) => {
  const fd = new FormData();
  for (const f of Array.from(files || [])) fd.append("files", f);
  const res = await fetch(`${API_BASE}/${todoId}/detail/mentor-files`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  return parseJsonOrThrow(res, "uploadMentorFiles 실패");
};

export const deleteMenteeFile = async ({ todoId, fileId }) => {
  const res = await fetch(`${API_BASE}/${todoId}/detail/mentee-files/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJsonOrThrow(res, "deleteMenteeFile 실패");
};

export const deleteMentorFile = async ({ todoId, fileId }) => {
  const res = await fetch(`${API_BASE}/${todoId}/detail/mentor-files/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJsonOrThrow(res, "deleteMentorFile 실패");
};


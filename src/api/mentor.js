const API_BASE = "http://localhost:4000/api/mentormentee/mentor";

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

export const getMyMentees = async () => {
  const res = await fetch(`${API_BASE}/mentees`, { credentials: "include" });
  return parseJsonOrThrow(res, "getMyMentees 실패");
};

export const getMenteeOverview = async ({ menteeId, start, end }) => {
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  const res = await fetch(`${API_BASE}/mentees/${menteeId}/overview?${qs.toString()}`, {
    credentials: "include",
  });
  return parseJsonOrThrow(res, "getMenteeOverview 실패");
};

export const assignTodoToMentee = async ({ menteeId, title, date, subject, mentorDesc }) => {
  const res = await fetch(`${API_BASE}/mentees/${menteeId}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, date, subject, mentorDesc }),
  });
  return parseJsonOrThrow(res, "assignTodoToMentee 실패");
};

export const addFeedback = async ({ menteeId, date, title, body }) => {
  const res = await fetch(`${API_BASE}/mentees/${menteeId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ date, title, body }),
  });
  return parseJsonOrThrow(res, "addFeedback 실패");
};

export const updateFeedback = async ({ feedbackId, title, body }) => {
  const res = await fetch(`${API_BASE}/feedback/${feedbackId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, body }),
  });
  return parseJsonOrThrow(res, "updateFeedback 실패");
};

export const deleteFeedback = async ({ feedbackId }) => {
  const res = await fetch(`${API_BASE}/feedback/${feedbackId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJsonOrThrow(res, "deleteFeedback 실패");
};


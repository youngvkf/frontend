const API_BASE = "http://localhost:4000/api/mentormentee";

export const getMenteeDashboard = async () => {
  const res = await fetch(`${API_BASE}/dashboard`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("멘티 대시보드 불러오기 실패");
  }

  return res.json();
};

export const addTodo = async ({ title, date, subject }) => {
  const res = await fetch(`${API_BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, date, subject }), // ✅ subject 포함
  });

  if (!res.ok) {
    throw new Error("todo 추가 실패");
  }

  return res.json();
};

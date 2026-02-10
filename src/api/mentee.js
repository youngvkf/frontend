import { API_ORIGIN, joinOrigin } from "./base";

const API_BASE = joinOrigin(API_ORIGIN, "/api/mentormentee");

export const getMenteeDashboard = async () => {
  const res = await fetch(`${API_BASE}/dashboard`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("멘티 대시보드 불러오기 실패");
  }

  return res.json();
};

export const saveComment = async({date, content}) => {
    const res = await fetch(`${API_BASE}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            date,
            content
        })
    })

    const text = await res.text().catch(() => '');
    let json = null;
    try {json=text? JSON.parse(text) : null} catch{}

    if(!res.ok){
        const msg = (json && json.error) ? json.error : text;
        throw new Error(`saveComment 실패: ${res.status} ${res.statusText} ${msg || ''}`);
    }

    return json ?? {};
}

export const addTodo = async({title, date, subject, isDone}) => {
    const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({title, date, subject, isDone})
    })

    const text = await res.text().catch(() => '');
    let json = null;
    try {json=text? JSON.parse(text) : null} catch{}

    if(!res.ok){
        const msg = (json && json.error) ? json.error : text;
        throw new Error(`addTodo 실패: ${res.status} ${res.statusText} ${msg || ''}`);
    }

    return json ?? {};
}

export const updateTodo = async({todoId, isDone}) => {
    const res = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isDone })
    })

    const text = await res.text().catch(() => '');
    let json = null;
    try {json=text? JSON.parse(text) : null} catch{}

    if(!res.ok){
        const msg = (json && json.error) ? json.error : text;
        throw new Error(`updateTodo 실패: ${res.status} ${res.statusText} ${msg || ''}`);
    }

    return json ?? {};
}

export const deleteTodo = async(todoId) => {
    const res = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'DELETE',
        credentials: 'include',
    })
    const data = await res.json().catch(() => {});

    if(!res.ok){
        throw new Error(data.error || 'todo 삭제 실패');
    }
    return data;
}

export const saveStudyTime = async({date, minutesBySubject}) => {
    const res = await fetch(`${API_BASE}/studytime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            date,
            minutesBySubject
        })
    })

    const text = await res.text().catch(() => '');
    let json = null;
    try {json=text? JSON.parse(text) : null} catch{}

    if(!res.ok){
        const msg = (json && json.error) ? json.error : text;
        throw new Error(`saveStudyTime 실패: ${res.status} ${res.statusText} ${msg || ''}`);
    }

    return json ?? {};
}

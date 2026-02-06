const API_BASE = 'http://localhost:4000/api/auth';

export const login = async (loginId, password) => {
    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // 세션 쿠키(Set-Cookie) 수신 및 이후 요청에 쿠키 전송
        body: JSON.stringify({
            loginId,
            password
        })
    });
    try {
        const data = await response.json();
        return data;
    } catch {
        return { ok: false, error: '서버 응답을 처리할 수 없습니다.' };
    }
};

/** 세션 여부 확인 (쿠키로 자동 전송) */
export const getSession = async () => {
    try {
        const res = await fetch(`${API_BASE}/login`, { credentials: 'include' });
        const data = await res.json();
        return data;
    } catch {
        return { ok: false, error: '서버 연결 실패' };
    }
};

/** 로그아웃 (세션 삭제 + 쿠키 제거) */
export const logout = async () => {
    try {
        const res = await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
        const data = await res.json();
        return data;
    } catch {
        return { ok: false, error: '서버 연결 실패' };
    }
};
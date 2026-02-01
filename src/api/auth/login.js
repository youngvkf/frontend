export const login = async (loginId, password) => {
    const response = await fetch("http://localhost:4000/api/auth/login", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
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
}
import { useEffect, useState } from "react";
import { login } from "./api";
import { useNavigate } from 'react-router-dom';
import { getSession } from './api/login';

export default function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const res = await getSession();
      if(res.ok){
        navigate('/planner', {replace: true});
        return;
      }
      setChecking(false);
    })()
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginId || !password) {
      setErrorMsg("로그인ID와 비밀번호를 입력해줘!");
      return;
    }

    setLoading(true);
    try {
      const result = await login(loginId, password);

      if (!result.ok) {
        setErrorMsg(result.error || "로그인 실패");
        return;
      }

      // 해커톤용: 로컬스토리지에 저장 (나중에 context로 바꿔도 됨)
      localStorage.setItem("user", JSON.stringify(result.data));

      // role 분기 (멘토/멘티)
      if (result.data.role === "mentor") {
        navigate('/planner', {replace: true});
      } else {
        navigate('/planner', {replace: true});
      }
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

if (checking) return <div>로딩 중</div>

return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Study Mate</h1>
        <p style={styles.subtitle}>멘토 · 멘티 학습관리 로그인</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            로그인 ID
            <input
              style={styles.input}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="예) mentee01"
              autoComplete="username"
            />
          </label>

          <label style={styles.label}>
            비밀번호
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {errorMsg && <div style={styles.error}>{errorMsg}</div>}

          <button style={styles.button} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div style={styles.hint}>
          * 해커톤용: 회원가입 없이 미리 등록된 계정으로 로그인
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "#f6f7fb",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 16,
    background: "white",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: { margin: 0, fontSize: 28, fontWeight: 800 },
  subtitle: { marginTop: 8, marginBottom: 20, color: "#555" },
  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 14, fontWeight: 600 },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  },
  button: {
    marginTop: 6,
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    background: "#111",
    color: "white",
  },
  error: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#fff2f2",
    border: "1px solid #ffd0d0",
    color: "#b00020",
    fontSize: 13,
  },
  hint: { marginTop: 14, color: "#777", fontSize: 12 },
};
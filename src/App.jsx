import { Routes, Route, Navigate } from 'react-router-dom';
import MentorMenteePlannerApp from "./MentorMenteePlannerApp";
import Login from './login';

export default function App() {
  return (
    <Routes>
      {/* ✅ 추가: 루트('/') 처리 */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/planner" element={<MentorMenteePlannerApp />} />
    </Routes>
  )
}


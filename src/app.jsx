import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mentor" element={<div>멘토 페이지 (추후 구현)</div>} />
        <Route path="/mentee" element={<div>멘티 페이지 (추후 구현)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

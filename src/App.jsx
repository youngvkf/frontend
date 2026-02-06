import { Routes, Route } from 'react-router-dom';
import MentorMenteePlannerApp from "./MentorMenteePlannerApp";
import Login from './login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/planner" element={<MentorMenteePlannerApp />} />
    </Routes>
  )
}


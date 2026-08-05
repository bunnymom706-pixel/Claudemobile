import { Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Trends from "./pages/Trends";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/library", label: "Food Library" },
  { to: "/trends", label: "Trends" },
  { to: "/settings", label: "Settings" },
];

export default function NavBar() {
  return (
    <nav className="flex gap-1 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
      <span className="mr-4 self-center text-lg font-bold text-amber-400">🍽 Food Log</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/"}
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

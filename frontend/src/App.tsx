import { NavLink, Route, Routes } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./components/Brand";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { BookingPage } from "./pages/BookingPage";

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <NavLink to="/" aria-label="Ir para o início"><Brand /></NavLink>
          <nav className="flex items-center gap-1 rounded-xl border border-line bg-white p-1 text-sm font-bold" aria-label="Navegação principal">
            <NavLink to="/" className={({ isActive }) => `rounded-lg px-3 py-2 transition ${isActive ? "bg-sage-soft text-sage-dark" : "text-muted hover:text-ink"}`}>Agendar</NavLink>
            <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-1 rounded-lg px-3 py-2 transition ${isActive ? "bg-sage-soft text-sage-dark" : "text-muted hover:text-ink"}`}>Gestão <ArrowUpRight size={14} /></NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/admin" element={<AppointmentsPage />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-8 text-xs text-muted sm:px-8">CliniAgenda <span className="mx-1">•</span> Cuidado organizado para todos.</footer>
    </div>
  );
}

export default App;

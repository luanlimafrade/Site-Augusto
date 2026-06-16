import { CalendarHeart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { navItems, siteConfig } from "../data/siteConfig";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const close = () => setIsOpen(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/50 bg-ivory/86 shadow-sm backdrop-blur-xl">
      <nav className="page-shell flex h-20 items-center justify-between gap-4">
        <Link
          to="/"
          onClick={close}
          className="focus-ring flex items-center gap-3 rounded-full"
          aria-label="Ir para início"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-moss text-ivory">
            <CalendarHeart size={19} />
          </span>
          <span className="font-display text-2xl font-semibold text-moss">
            {siteConfig.couple}
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "focus-ring rounded-full px-4 py-2 text-sm font-medium transition",
                  item.highlight
                    ? "bg-moss text-ivory hover:bg-ink"
                    : "text-ink/76 hover:bg-white/70 hover:text-moss",
                  isActive && !item.highlight ? "bg-white text-moss shadow-sm" : ""
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-moss/15 bg-white/70 text-moss lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-moss/10 bg-ivory/98 px-4 pb-5 lg:hidden">
          <div className="mx-auto grid max-w-sm gap-2 pt-3">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={close}
                  className={[
                    "focus-ring rounded-full px-5 py-3 text-center text-sm font-semibold transition",
                    item.highlight
                      ? "bg-moss text-ivory"
                      : active
                        ? "bg-white text-moss"
                        : "text-ink/80 hover:bg-white"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}

import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div className="min-h-screen text-ink">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

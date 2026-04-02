import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18rem,minmax(0,1fr)]">
      <div className="hidden border-r border-border bg-surface/70 lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start lg:overflow-hidden">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] lg:hidden" onClick={closeMobileMenu}>
          <div
            className="h-full w-80 max-w-[88vw] overflow-hidden border-r border-border bg-app shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar mobile onNavigate={closeMobileMenu} onAction={closeMobileMenu} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="mx-auto flex max-w-[1600px] min-w-0 flex-col gap-6 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

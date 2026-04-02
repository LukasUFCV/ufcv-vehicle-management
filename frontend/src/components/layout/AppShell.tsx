import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18rem,1fr]">
      <div className="hidden border-r border-border bg-surface/70 lg:block">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="h-full w-80 max-w-[85vw] bg-app"
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar mobile />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

const MOBILE_MENU_TRANSITION_MS = 220;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMenuMounted, setMobileMenuMounted] = useState(false);
  const location = useLocation();
  const closeTimeoutRef = useRef<number | undefined>(undefined);
  const openFrameRef = useRef<number | undefined>(undefined);

  const clearMobileMenuTimers = () => {
    if (closeTimeoutRef.current !== undefined) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = undefined;
    }

    if (openFrameRef.current !== undefined) {
      window.cancelAnimationFrame(openFrameRef.current);
      openFrameRef.current = undefined;
    }
  };

  const openMobileMenu = () => {
    clearMobileMenuTimers();
    setMobileMenuMounted(true);
    openFrameRef.current = window.requestAnimationFrame(() => {
      setMobileOpen(true);
      openFrameRef.current = undefined;
    });
  };

  const closeMobileMenu = () => {
    clearMobileMenuTimers();
    setMobileOpen(false);

    if (!mobileMenuMounted) {
      return;
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setMobileMenuMounted(false);
      closeTimeoutRef.current = undefined;
    }, MOBILE_MENU_TRANSITION_MS);
  };

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuMounted]);

  useEffect(
    () => () => {
      clearMobileMenuTimers();
    },
    []
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18rem,minmax(0,1fr)]">
      <div className="glass-sidebar-shell hidden border-r border-border lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start lg:overflow-hidden">
        <Sidebar />
      </div>

      {mobileMenuMounted ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className={cn(
              "absolute inset-0 bg-black/35 transition-opacity duration-200 ease-out motion-reduce:transition-none",
              mobileOpen ? "opacity-100 backdrop-blur-[1px]" : "opacity-0"
            )}
            onClick={closeMobileMenu}
          />
          <div
            className={cn(
              "glass-floating relative h-full w-80 max-w-[88vw] overflow-hidden border-r border-border shadow-2xl transition-all duration-200 ease-out motion-reduce:transition-none",
              mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar mobile onNavigate={closeMobileMenu} onAction={closeMobileMenu} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <Header onOpenMobileMenu={openMobileMenu} />
        <main className="mx-auto flex max-w-[1600px] min-w-0 flex-col gap-6 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

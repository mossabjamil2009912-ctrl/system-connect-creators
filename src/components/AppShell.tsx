import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/arsh-logo-official.png";

const NAV = [
  { to: "/", label: "نشر" },
  { to: "/history", label: "السجل" },
  { to: "/settings", label: "الربط" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center">
            <img src={logo} alt="عرش الهندسة للحلول التقنية الذكية" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
          </Link>
          <nav className="flex shrink-0 gap-1 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-accent !text-accent-foreground font-semibold" }}
                activeOptions={{ exact: true }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PlatformDot({ hue }: { hue: string }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `oklch(0.7 0.17 ${hue})` }} />;
}

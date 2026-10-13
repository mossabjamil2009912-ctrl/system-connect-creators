import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/arsh-logo-official.jpg";

const NAV = [
  { to: "/", label: "نشر منشور" },
  { to: "/history", label: "السجل" },
  { to: "/settings", label: "ربط المنصات" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="عرش الهندسة" className="h-10 w-10 rounded-lg bg-card object-contain p-1" />
            <div className="leading-tight">
              <div className="text-lg font-extrabold text-primary">عرش الهندسة</div>
              <div className="text-xs text-muted-foreground">منصة النشر الموحّد</div>
            </div>
          </Link>
          <nav className="flex gap-1 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
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

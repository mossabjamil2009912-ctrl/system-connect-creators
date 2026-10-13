import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { History, Link2, Send } from "lucide-react";
import logo from "@/assets/arsh-logo-official.png";

const NAV = [
  { to: "/", label: "نشر", icon: Send },
  { to: "/history", label: "السجل", icon: History },
  { to: "/settings", label: "الربط", icon: Link2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-3 py-1.5 sm:px-4">
          <Link to="/" className="shrink-0" aria-label="الرئيسية">
            <img src={logo} alt="عرش الهندسة للحلول التقنية الذكية" className="h-[72px] w-[72px] object-contain sm:h-24 sm:w-24" />
          </Link>
          <nav className="flex min-w-0 justify-end">
            <div className="flex gap-1 rounded-full border border-border bg-secondary p-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "bg-gold !text-primary-foreground font-bold shadow-sm" }}
                  activeOptions={{ exact: true }}
                >
                  <n.icon className="h-4 w-4 shrink-0" />
                  {n.label}
                </Link>
              ))}
            </div>
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

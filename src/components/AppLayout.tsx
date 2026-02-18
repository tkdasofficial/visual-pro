import { useState } from "react";
import logoSvg from "@/assets/logo.svg";
import { Link, useLocation } from "react-router-dom";
import {
  Wand2,
  Users,
  LayoutGrid,
  Palette,
  PenTool,
  Layers,
  Film,
  Package,
  FlaskConical,
  Repeat,
  Menu,
  X,
  LogOut,
  Shield,
  Coins,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/create", label: "Create", icon: Wand2 },
  { path: "/character", label: "Character", icon: Users },
  { path: "/structured", label: "Structured", icon: LayoutGrid },
  { path: "/advanced", label: "Design Studio", icon: Palette },
  { path: "/edit", label: "Editor", icon: PenTool },
  { path: "/style", label: "Style Transfer", icon: Layers },
  { path: "/motion", label: "Motion", icon: Film },
  { path: "/assets", label: "Assets", icon: Package },
  { path: "/prompt-lab", label: "Prompt Lab", icon: FlaskConical },
  { path: "/batch", label: "Batch", icon: Repeat },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { credits, isAdmin } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-background transition-transform duration-150 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link to="/create" className="flex items-center gap-2">
            <img src={logoSvg} alt="Visual Pro" className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Visual Pro
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-accent-foreground" : ""}`} />
                  {item.label}
                </Link>
              );
            })}

            {/* Admin Panel link for staff */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  location.pathname === "/admin"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          {/* Credits display */}
          {credits !== null && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Coins className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{credits?.balance ?? 0}</span> credits
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          <p className="mt-2 px-3 text-[10px] text-muted-foreground">
            © 2026 Avzio. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center border-b border-border px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">By Avzio</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

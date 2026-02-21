import { useState } from "react";
import logoSvg from "@/assets/logo.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wand2, Users, LayoutGrid, Palette, PenTool, Layers, Film,
  Package, FlaskConical, Repeat, Menu, X, Bell, User,
} from "lucide-react";
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

const profileMenuItems = [
  { path: "/account", label: "Account Settings" },
  { path: "/referral", label: "Referral Program" },
  { path: "/plans", label: "Plans & Upgrade" },
  { path: "/history", label: "Generation History" },
  { path: "/feedback", label: "Feedback" },
  { path: "/privacy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms of Service" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { profile, credits, isAdmin } = useAuth();
  const { user } = useAuth();

  const handleLogout = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Sidebar - Feature nav only */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-background transition-transform duration-150 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link to="/create" className="flex items-center gap-2">
            <img src={logoSvg} alt="Visual Pro" className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight text-foreground">Visual Pro</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden">
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
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <p className="px-3 text-[10px] text-muted-foreground">© 2026 Avzio. All rights reserved.</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center border-b border-border px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <button className="relative rounded-md p-1.5 text-muted-foreground hover:text-foreground">
              <Bell className="h-4.5 w-4.5" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold hover:opacity-90"
              >
                {(profile?.full_name || "U").charAt(0).toUpperCase()}
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-border bg-popover p-2 shadow-lg">
                    {/* User info */}
                    <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Credits</span>
                        <span className="font-bold text-foreground">{credits?.balance ?? 0}</span>
                      </div>
                    </div>

                    {/* Menu links */}
                    {profileMenuItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => { setProfileOpen(false); navigate(item.path); }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                          location.pathname === item.path
                            ? "bg-accent/10 text-accent"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}

                    <div className="my-1 border-t border-border" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * AdminRoute: Only allows users with admin roles (owner, ceo, super_admin, director, manager, support, analyst).
 * Redirects regular users to /create. Redirects unauthenticated users to /login.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      setAuthenticated(true);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const adminRoles = ["owner", "ceo", "super_admin", "director", "manager", "support", "analyst"];
      const hasAdmin = roles?.some((r) => adminRoles.includes(r.role)) ?? false;
      setIsAdmin(hasAdmin);
      setLoading(false);
    };
    check();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  if (!authenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/create" replace />;

  return <>{children}</>;
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * AuthRedirect: wraps login/signup pages.
 * If user is already logged in, redirect them to /create (or /admin for admins).
 */
export default function AuthRedirect({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const adminRoles = ["owner", "ceo", "super_admin", "director", "manager"];
      const isAdmin = roles?.some((r) => adminRoles.includes(r.role)) ?? false;

      setRedirectTo(isAdmin ? "/admin" : "/create");
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
}

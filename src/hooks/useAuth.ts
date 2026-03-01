import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  whatsapp_number: string | null;
  subscription_plan: "explorer" | "starter" | "pro";
  subscription_status: "active" | "expired" | "cancelled";
  subscription_expiry: string | null;
  generation_limit: number;
  generation_used: number;
  billing_cycle_start: string | null;
  plan: "explorer" | "starter" | "pro"; // alias
}

export interface UserCredits {
  balance: number;
  limit: number;
  used: number;
}

export interface UserRole {
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    if (profileRes.data) {
      const p = profileRes.data;
      const prof: UserProfile = {
        user_id: p.user_id,
        full_name: p.full_name,
        whatsapp_number: p.whatsapp_number,
        subscription_plan: p.subscription_plan,
        subscription_status: p.subscription_status,
        subscription_expiry: p.subscription_expiry,
        generation_limit: p.generation_limit,
        generation_used: p.generation_used,
        billing_cycle_start: p.billing_cycle_start,
        plan: p.subscription_plan,
      };
      setProfile(prof);
      setCredits({
        balance: p.generation_limit - p.generation_used,
        limit: p.generation_limit,
        used: p.generation_used,
      });
    }
    if (rolesRes.data) setRoles(rolesRes.data.map((r) => r.role));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.id);
      } else {
        setProfile(null);
        setCredits(null);
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const isSeniorAdmin = roles.includes("admin");
  const isOwner = roles.includes("admin");

  const refreshCredits = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("generation_limit, generation_used").eq("user_id", user.id).maybeSingle();
    if (data) {
      setCredits({
        balance: data.generation_limit - data.generation_used,
        limit: data.generation_limit,
        used: data.generation_used,
      });
    }
  };

  return {
    user,
    profile,
    credits,
    roles,
    loading,
    isAdmin,
    isSeniorAdmin,
    isOwner,
    refreshCredits,
    refetch: () => user && fetchUserData(user.id),
  };
}

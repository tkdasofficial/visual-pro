import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "business";
  credits_daily_limit: number;
  is_suspended: boolean;
  is_employee: boolean;
  department: string | null;
  referral_code: string | null;
}

export interface UserCredits {
  balance: number;
  total_earned: number;
  total_used: number;
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
    const [profileRes, creditsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("credits").select("*").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    if (profileRes.data) setProfile(profileRes.data as UserProfile);
    if (creditsRes.data) setCredits(creditsRes.data as UserCredits);
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

  const isAdmin = roles.some((r) =>
    ["owner", "ceo", "super_admin", "director", "manager", "support", "analyst", "viewer"].includes(r)
  );

  const isSeniorAdmin = roles.some((r) =>
    ["owner", "ceo", "super_admin", "director", "manager"].includes(r)
  );

  const isOwner = roles.includes("owner");

  const refreshCredits = async () => {
    if (!user) return;
    const { data } = await supabase.from("credits").select("*").eq("user_id", user.id).single();
    if (data) setCredits(data as UserCredits);
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

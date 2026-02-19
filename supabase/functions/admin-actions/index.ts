import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_ROLES = ["owner", "ceo", "super_admin", "director", "manager", "support", "analyst", "viewer"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify actor has admin role
    const { data: actorRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id);

    const actorRoleList = actorRoles?.map((r: any) => r.role) || [];
    const isAdmin = actorRoleList.some((r: string) => ADMIN_ROLES.includes(r));

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Insufficient permissions" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, targetUserId, data } = body;

    // Get actor priority
    const { data: priorityResult } = await supabase.rpc("get_user_priority", { _user_id: user.id });
    const actorPriority = priorityResult || 1;

    const logAudit = async (actionName: string, details: object) => {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        target_id: targetUserId || null,
        action: actionName,
        details,
      });
    };

    switch (action) {
      case "get_users": {
        // Fetch profiles separately to avoid broken FK join
        const { data: profiles, error: profilesErr } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, plan, is_suspended, is_employee, department, referral_code, created_at")
          .order("created_at", { ascending: false })
          .limit(data?.limit || 200);

        if (profilesErr) throw profilesErr;

        const userIds = profiles?.map((p: any) => p.user_id) || [];

        // Fetch credits and roles separately
        const [creditsResult, rolesResult] = await Promise.all([
          supabase.from("credits").select("user_id, balance, total_earned, total_used").in("user_id", userIds),
          supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        ]);

        const creditsMap: Record<string, any> = {};
        creditsResult.data?.forEach((c: any) => { creditsMap[c.user_id] = c; });

        const rolesMap: Record<string, string[]> = {};
        rolesResult.data?.forEach((r: any) => {
          if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
          rolesMap[r.user_id].push(r.role);
        });

        const enriched = profiles?.map((p: any) => ({
          ...p,
          credits: creditsMap[p.user_id] || null,
          user_roles: (rolesMap[p.user_id] || ["user"]).map((r) => ({ role: r })),
        }));

        return new Response(JSON.stringify({ users: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "suspend_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        const { data: targetPriority } = await supabase.rpc("get_user_priority", { _user_id: targetUserId });
        if ((targetPriority || 1) >= actorPriority) {
          return new Response(JSON.stringify({ error: "Cannot suspend a user with equal or higher priority" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await supabase.from("profiles").update({ is_suspended: true }).eq("user_id", targetUserId);
        await logAudit("suspend_user", { reason: data?.reason || "" });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "unsuspend_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        await supabase.from("profiles").update({ is_suspended: false }).eq("user_id", targetUserId);
        await logAudit("unsuspend_user", {});
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "assign_role": {
        if (!targetUserId || !data?.role) throw new Error("targetUserId and role required");
        if (data.role === "owner") {
          return new Response(JSON.stringify({ error: "Owner role cannot be assigned via this panel" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Remove existing non-user roles first
        await supabase.from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .neq("role", "user")
          .neq("role", "owner");

        // Insert new role
        await supabase.from("user_roles").insert({
          user_id: targetUserId,
          role: data.role,
          assigned_by: user.id,
        });

        if (data.role !== "user") {
          await supabase.from("profiles").update({
            is_employee: true,
            department: data.department || null,
          }).eq("user_id", targetUserId);
        } else {
          await supabase.from("profiles").update({ is_employee: false }).eq("user_id", targetUserId);
        }

        await logAudit("assign_role", { role: data.role });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_plan": {
        if (!targetUserId || !data?.plan) throw new Error("targetUserId and plan required");
        const planLimits: Record<string, number> = { free: 5, pro: 100, business: 200 };
        const dailyLimit = planLimits[data.plan] || 5;
        await supabase.from("profiles").update({
          plan: data.plan, credits_daily_limit: dailyLimit,
        }).eq("user_id", targetUserId);
        await logAudit("update_plan", { plan: data.plan });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "adjust_credits": {
        if (!targetUserId || data?.amount === undefined) throw new Error("targetUserId and amount required");
        const { data: currentCredits } = await supabase
          .from("credits").select("balance, total_earned").eq("user_id", targetUserId).single();
        const newBalance = Math.max(0, (currentCredits?.balance || 0) + data.amount);
        const newEarned = data.amount > 0
          ? (currentCredits?.total_earned || 0) + data.amount
          : currentCredits?.total_earned || 0;
        await supabase.from("credits").update({ balance: newBalance, total_earned: newEarned }).eq("user_id", targetUserId);
        await logAudit("adjust_credits", { amount: data.amount, reason: data.reason || "" });
        return new Response(JSON.stringify({ success: true, newBalance }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_stats": {
        const [usersResult, logsResult, referralsResult, creditsResult] = await Promise.all([
          supabase.from("profiles").select("plan, is_suspended, is_employee, created_at").limit(500),
          supabase.from("generation_logs").select("status, credits_used, created_at, page, model").limit(1000),
          supabase.from("referrals").select("credits_awarded, created_at").limit(500),
          supabase.from("credits").select("balance, total_used, total_earned").limit(500),
        ]);
        return new Response(JSON.stringify({
          users: usersResult.data || [],
          logs: logsResult.data || [],
          referrals: referralsResult.data || [],
          credits: creditsResult.data || [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "add_employee": {
        if (!data?.email) throw new Error("Email required");
        const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const targetUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === data.email.toLowerCase());
        if (!targetUser) {
          return new Response(JSON.stringify({ error: "User not found. They must sign up first." }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Remove existing non-user/owner roles
        await supabase.from("user_roles")
          .delete().eq("user_id", targetUser.id).neq("role", "user").neq("role", "owner");

        await supabase.from("user_roles").insert({
          user_id: targetUser.id, role: data.role || "viewer", assigned_by: user.id,
        });
        await supabase.from("profiles").update({
          is_employee: true, department: data.department || null,
        }).eq("user_id", targetUser.id);

        await logAudit("add_employee", { email: data.email, role: data.role, department: data.department });
        return new Response(JSON.stringify({ success: true, userId: targetUser.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_audit_logs": {
        const { data: logs } = await supabase
          .from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
        return new Response(JSON.stringify({ logs: logs || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        const { data: targetPriority } = await supabase.rpc("get_user_priority", { _user_id: targetUserId });
        if ((targetPriority || 1) >= actorPriority) {
          return new Response(JSON.stringify({ error: "Cannot delete a user with equal or higher priority" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await logAudit("delete_user", {});
        await supabase.auth.admin.deleteUser(targetUserId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("admin-actions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

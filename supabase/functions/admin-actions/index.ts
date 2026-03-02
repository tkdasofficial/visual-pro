import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Verify admin role via has_role function
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, targetUserId, data: actionData } = body;

    const logAction = async (actionName: string, details: object) => {
      await supabase.from("admin_logs").insert({
        admin_user_id: user.id,
        target_user_id: targetUserId || null,
        action: actionName,
        details,
      });
    };

    const json = (d: any, status = 200) =>
      new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    switch (action) {
      // ── GET ALL USERS ──
      case "get_users": {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, whatsapp_number, subscription_plan, subscription_status, subscription_expiry, generation_limit, generation_used, billing_cycle_start, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(500);

        const userIds = profiles?.map((p: any) => p.user_id) || [];

        const { data: roles } = await supabase
          .from("user_roles").select("user_id, role").in("user_id", userIds);

        const rolesMap: Record<string, string[]> = {};
        roles?.forEach((r: any) => {
          if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
          rolesMap[r.user_id].push(r.role);
        });

        // Get auth user emails
        const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const emailMap: Record<string, string> = {};
        authData?.users?.forEach((u: any) => { emailMap[u.id] = u.email || ""; });

        const enriched = profiles?.map((p: any) => ({
          ...p,
          email: emailMap[p.user_id] || "",
          roles: rolesMap[p.user_id] || ["user"],
        }));

        return json({ users: enriched });
      }

      // ── GET DASHBOARD STATS ──
      case "get_stats": {
        const [profilesRes, logsRes, paymentsRes] = await Promise.all([
          supabase.from("profiles").select("subscription_plan, subscription_status, generation_limit, generation_used").limit(1000),
          supabase.from("generation_logs").select("status, page, created_at").limit(1000),
          supabase.from("payment_requests").select("status, selected_plan, requested_at").limit(500),
        ]);

        const profiles = profilesRes.data || [];
        const logs = logsRes.data || [];
        const payments = paymentsRes.data || [];

        const planCounts: Record<string, number> = {};
        let totalCreditsUsed = 0;
        let totalCreditsLimit = 0;
        profiles.forEach((p: any) => {
          planCounts[p.subscription_plan] = (planCounts[p.subscription_plan] || 0) + 1;
          totalCreditsUsed += p.generation_used || 0;
          totalCreditsLimit += p.generation_limit || 0;
        });

        const statusCounts: Record<string, number> = {};
        const pageCounts: Record<string, number> = {};
        logs.forEach((l: any) => {
          statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
          pageCounts[l.page] = (pageCounts[l.page] || 0) + 1;
        });

        const paymentStatusCounts: Record<string, number> = {};
        payments.forEach((p: any) => {
          paymentStatusCounts[p.status] = (paymentStatusCounts[p.status] || 0) + 1;
        });

        return json({
          totalUsers: profiles.length,
          totalGenerations: logs.length,
          totalCreditsUsed,
          totalCreditsLimit,
          planCounts,
          statusCounts,
          pageCounts,
          paymentStatusCounts,
          pendingPayments: paymentStatusCounts["pending"] || 0,
        });
      }

      // ── GET PAYMENT REQUESTS ──
      case "get_payments": {
        const { data: payments } = await supabase
          .from("payment_requests")
          .select("*")
          .order("requested_at", { ascending: false })
          .limit(200);
        return json({ payments: payments || [] });
      }

      // ── APPROVE PAYMENT ──
      case "approve_payment": {
        if (!actionData?.paymentId) throw new Error("paymentId required");
        const { data: payment } = await supabase
          .from("payment_requests")
          .select("*")
          .eq("id", actionData.paymentId)
          .single();

        if (!payment) return json({ error: "Payment not found" }, 404);

        const planLimits: Record<string, number> = { explorer: 5, starter: 50, pro: 200 };
        const newLimit = planLimits[payment.selected_plan] || 5;

        await Promise.all([
          supabase.from("payment_requests").update({
            status: "approved",
            admin_notes: actionData.notes || "",
            processed_at: new Date().toISOString(),
          }).eq("id", actionData.paymentId),
          supabase.from("profiles").update({
            subscription_plan: payment.selected_plan,
            subscription_status: "active",
            generation_limit: newLimit,
            generation_used: 0,
            billing_cycle_start: new Date().toISOString(),
            subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq("user_id", payment.user_id),
        ]);

        await logAction("approve_payment", { paymentId: actionData.paymentId, plan: payment.selected_plan });
        return json({ success: true });
      }

      // ── REJECT PAYMENT ──
      case "reject_payment": {
        if (!actionData?.paymentId) throw new Error("paymentId required");
        await supabase.from("payment_requests").update({
          status: "rejected",
          admin_notes: actionData.notes || "",
          processed_at: new Date().toISOString(),
        }).eq("id", actionData.paymentId);

        await logAction("reject_payment", { paymentId: actionData.paymentId });
        return json({ success: true });
      }

      // ── UPDATE USER PROFILE ──
      case "update_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        const updates: any = {};
        if (actionData?.subscription_plan) updates.subscription_plan = actionData.subscription_plan;
        if (actionData?.subscription_status) updates.subscription_status = actionData.subscription_status;
        if (actionData?.generation_limit !== undefined) updates.generation_limit = actionData.generation_limit;
        if (actionData?.generation_used !== undefined) updates.generation_used = actionData.generation_used;

        if (Object.keys(updates).length > 0) {
          await supabase.from("profiles").update(updates).eq("user_id", targetUserId);
        }

        await logAction("update_user", updates);
        return json({ success: true });
      }

      // ── RESET USER CREDITS ──
      case "reset_credits": {
        if (!targetUserId) throw new Error("targetUserId required");
        await supabase.from("profiles").update({ generation_used: 0 }).eq("user_id", targetUserId);
        await logAction("reset_credits", {});
        return json({ success: true });
      }

      // ── BULK RESET ALL CREDITS ──
      case "bulk_reset_credits": {
        await supabase.from("profiles").update({ generation_used: 0 }).gte("generation_used", 0);
        await logAction("bulk_reset_credits", {});
        return json({ success: true });
      }

      // ── GET GENERATION LOGS ──
      case "get_generations": {
        const { data: logs } = await supabase
          .from("generation_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(actionData?.limit || 200);
        return json({ generations: logs || [] });
      }

      // ── GET AUDIT LOGS ──
      case "get_audit_logs": {
        const { data: logs } = await supabase
          .from("admin_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        return json({ logs: logs || [] });
      }

      // ── ASSIGN ADMIN ROLE ──
      case "assign_admin": {
        if (!targetUserId) throw new Error("targetUserId required");
        // Check if already admin
        const { data: existing } = await supabase
          .from("user_roles").select("id").eq("user_id", targetUserId).eq("role", "admin");
        if (!existing || existing.length === 0) {
          await supabase.from("user_roles").insert({ user_id: targetUserId, role: "admin" });
        }
        await logAction("assign_admin", {});
        return json({ success: true });
      }

      // ── REVOKE ADMIN ROLE ──
      case "revoke_admin": {
        if (!targetUserId) throw new Error("targetUserId required");
        // Don't allow revoking own admin
        if (targetUserId === user.id) return json({ error: "Cannot revoke own admin role" }, 400);
        await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "admin");
        await logAction("revoke_admin", {});
        return json({ success: true });
      }

      // ── DELETE USER ──
      case "delete_user": {
        if (!targetUserId) throw new Error("targetUserId required");
        if (targetUserId === user.id) return json({ error: "Cannot delete yourself" }, 400);
        await logAction("delete_user", {});
        await supabase.auth.admin.deleteUser(targetUserId);
        return json({ success: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("admin-actions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

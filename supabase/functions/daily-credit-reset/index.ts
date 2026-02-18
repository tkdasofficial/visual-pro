import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Reset credits based on plan
    // FREE: 5, PRO: 100, BUSINESS: 200
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, plan, credits_daily_limit");

    if (!profiles) throw new Error("No profiles found");

    let resetCount = 0;
    for (const profile of profiles) {
      const limit = profile.credits_daily_limit || 5;
      await supabase
        .from("credits")
        .update({
          balance: limit,
          last_reset_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);
      resetCount++;
    }

    // Also cleanup expired images from generation_logs
    await supabase
      .from("generation_logs")
      .update({ image_url: null })
      .lt("expires_at", new Date().toISOString());

    return new Response(
      JSON.stringify({ success: true, resetCount, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("daily-credit-reset error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

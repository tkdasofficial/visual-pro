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
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
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

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the official Visual Pro support assistant, a professional AI-powered image generation platform by Avzio.

Your role:
- Help users with account issues, billing, features, and technical problems
- Provide guidance on image generation best practices (prompts, styles, aspect ratios)
- Explain platform features: Create, Character Engine, Structured, Design Studio, Editor, Style Transfer, Motion, Assets, Prompt Lab, Batch
- Help with plan selection (Free: 5 daily credits, Pro: $25/100 credits, Business: $50/200 credits, Enterprise: custom)
- Troubleshoot generation failures and credit issues
- Be professional, friendly, and concise

Important rules:
- Never mention external AI model names (Gemini, OpenAI, etc.) - only say "Visual Pro AI" or "our AI engine"
- If issues require admin intervention, suggest the user submit feedback or contact support
- For billing/payment issues, direct users to the Plans page
- Keep responses concise and actionable
- If you detect a serious technical issue, mention that the support team will be notified`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", res.status, errText);
      return new Response(JSON.stringify({ reply: "I'm having trouble connecting to our support system. Please try again shortly." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Auto-alert admin for critical issues
    const lowerReply = reply.toLowerCase();
    const lowerMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    if (lowerMsg.includes("bug") || lowerMsg.includes("broken") || lowerMsg.includes("not working") || lowerMsg.includes("error")) {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "support_issue_detected",
        details: { userMessage: messages[messages.length - 1]?.content, aiReply: reply.slice(0, 200) },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("support-chat error:", error);
    return new Response(
      JSON.stringify({ reply: "Sorry, something went wrong. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credits
    const { data: credits } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!credits || credits.balance < 1) {
      return new Response(JSON.stringify({ error: "Insufficient credits. Please upgrade your plan." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is suspended
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("user_id", user.id)
      .single();

    if (profile?.is_suspended) {
      return new Response(JSON.stringify({ error: "Account suspended. Contact support." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { prompt, negativePrompt, page, style, aspectRatio, model: requestedModel, imageUrl: inputImageUrl } = body;

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the enhanced prompt
    const enhancedPrompt = [
      style ? `Style: ${style}.` : "",
      prompt,
      negativePrompt ? `Avoid: ${negativePrompt}.` : "",
      aspectRatio ? `Aspect ratio: ${aspectRatio}.` : "",
      "Ultra high resolution, professional quality.",
    ].filter(Boolean).join(" ");

    // Choose model: Nano banana (gemini-2.5-flash-image) for image-to-image, else gemini-2.5-flash-image for text-to-image
    const model = requestedModel || "google/gemini-2.5-flash-image";

    // Build messages
    const messages: any[] = [
      {
        role: "user",
        content: inputImageUrl
          ? [
              { type: "text", text: enhancedPrompt },
              { type: "image_url", image_url: { url: inputImageUrl } },
            ]
          : enhancedPrompt,
      },
    ];

    // Insert generation log (pending)
    const { data: logEntry } = await supabase
      .from("generation_logs")
      .insert({
        user_id: user.id,
        page: page || "create",
        prompt,
        model,
        status: "pending",
        credits_used: 1,
        metadata: { style, aspectRatio, negativePrompt },
      })
      .select()
      .single();

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, modalities: ["image", "text"] }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update log to failed
      if (logEntry) {
        await supabase.from("generation_logs").update({ status: "failed" }).eq("id", logEntry.id);
      }

      return new Response(JSON.stringify({ error: "Image generation failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      if (logEntry) {
        await supabase.from("generation_logs").update({ status: "failed" }).eq("id", logEntry.id);
      }
      return new Response(JSON.stringify({ error: "No image was generated. Please try a different prompt." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to Supabase Storage
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    const fileName = `${user.id}/visual-pro-${randomNum}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    let publicUrl = generatedImage; // fallback to base64
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
    }

    // Deduct credit and update log
    await Promise.all([
      supabase.from("credits").update({
        balance: credits.balance - 1,
        total_used: supabase.rpc ? undefined : undefined, // handled below
      }).eq("user_id", user.id),
      logEntry
        ? supabase.from("generation_logs").update({
            status: "completed",
            image_url: publicUrl,
          }).eq("id", logEntry.id)
        : Promise.resolve(),
    ]);

    // Separately update total_used
    await supabase.rpc("increment_credits_used", { p_user_id: user.id }).catch(() => {
      // If function doesn't exist, do direct update
      supabase.from("credits").update({ balance: credits.balance - 1 }).eq("user_id", user.id);
    });

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        fileName: `visual-pro-${randomNum}.png`,
        creditsRemaining: credits.balance - 1,
        logId: logEntry?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

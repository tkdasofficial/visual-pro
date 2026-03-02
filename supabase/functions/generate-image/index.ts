import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Aspect ratio maps ──
const freepikAspectMap: Record<string, string> = {
  "1:1": "square_1_1",
  "16:9": "widescreen_16_9",
  "9:16": "social_story_9_16",
  "4:5": "social_post_4_5",
  "4:3": "classic_4_3",
  "3:4": "traditional_3_4",
};

const lovableAspectInstruction: Record<string, string> = {
  "1:1": "square format (1024x1024)",
  "16:9": "wide landscape format (1792x1024), 16:9 widescreen",
  "9:16": "tall portrait format (1024x1792), 9:16 vertical",
  "4:5": "portrait format (1024x1280), 4:5 ratio",
  "4:3": "landscape format (1280x960), 4:3 ratio",
  "3:4": "portrait format (960x1280), 3:4 ratio",
};

// ── Freepik text-to-image (async polling) ──
async function generateViaFreepik(
  apiKey: string,
  prompt: string,
  aspectRatio?: string
): Promise<string | null> {
  const freepikAspect = aspectRatio ? freepikAspectMap[aspectRatio] || "square_1_1" : "square_1_1";

  // 1. Create task
  const createRes = await fetch("https://api.freepik.com/v1/ai/text-to-image/flux-dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": apiKey,
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: freepikAspect,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("Freepik create error:", createRes.status, errText.slice(0, 300));
    return null;
  }

  const createData = await createRes.json();
  const taskId = createData?.data?.task_id;
  if (!taskId) {
    console.error("Freepik: no task_id returned");
    return null;
  }

  // 2. Poll for completion (max 60s)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(
      `https://api.freepik.com/v1/ai/text-to-image/flux-dev/${taskId}`,
      {
        headers: { "x-freepik-api-key": apiKey },
      }
    );

    if (!statusRes.ok) {
      console.error("Freepik poll error:", statusRes.status);
      continue;
    }

    const statusData = await statusRes.json();
    const status = statusData?.data?.status;

    if (status === "COMPLETED") {
      // Extract image - Freepik returns images array with base64 or URLs
      const images = statusData?.data?.generated;
      if (images && images.length > 0) {
        // Could be base64 or URL
        const img = images[0];
        if (img.base64) {
          return `data:image/png;base64,${img.base64}`;
        }
        if (img.url) {
          return img.url;
        }
      }
      console.error("Freepik: completed but no image data");
      return null;
    }

    if (status === "FAILED" || status === "ERROR") {
      console.error("Freepik task failed:", JSON.stringify(statusData?.data));
      return null;
    }
    // else CREATED/IN_PROGRESS - keep polling
  }

  console.error("Freepik: polling timeout");
  return null;
}

// ── Lovable AI image-to-image (for character face consistency, style transfer) ──
async function generateViaLovableAI(
  apiKey: string,
  prompt: string,
  inputImageUrl: string,
  aspectRatio?: string
): Promise<string | null> {
  const aspectInstruction = aspectRatio && lovableAspectInstruction[aspectRatio]
    ? `Image dimensions: ${lovableAspectInstruction[aspectRatio]}.`
    : "";

  const fullPrompt = [prompt, aspectInstruction].filter(Boolean).join(" ");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: fullPrompt },
            { type: "image_url", image_url: { url: inputImageUrl } },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Lovable AI error:", res.status, errText.slice(0, 300));
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
}

// ── Lovable AI text-to-image fallback (if Freepik fails) ──
async function generateTextViaLovableAI(
  apiKey: string,
  prompt: string
): Promise<string | null> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Lovable AI text fallback error:", res.status, errText.slice(0, 300));
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
}

// ── Seed & expiry helpers ──
function generateSeed(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function getExpiryInterval(plan: string): string {
  switch (plan) {
    case "pro": return "3 days";
    case "business": return "7 days";
    case "enterprise": return "30 days";
    default: return "24 hours";
  }
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FREEPIK_API_KEY = Deno.env.get("FREEPIK_API_KEY");
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

    // Credits & profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, subscription_status, generation_limit, generation_used")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.generation_used >= profile.generation_limit) {
      return new Response(JSON.stringify({ error: "Insufficient credits. Please upgrade your plan." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.subscription_status !== "active") {
      return new Response(JSON.stringify({ error: "Subscription expired. Please renew." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { prompt, negativePrompt, page, style, aspectRatio, imageUrl: inputImageUrl } = body;

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const seed = generateSeed();
    const expiryInterval = getExpiryInterval(profile.subscription_plan || "explorer");
    const isImageToImage = !!inputImageUrl;

    // Build enhanced prompt
    const enhancedPrompt = [
      style ? `Style: ${style}.` : "",
      prompt,
      negativePrompt ? `Avoid: ${negativePrompt}.` : "",
      "Ultra high resolution, professional quality.",
    ].filter(Boolean).join(" ");

    // Insert generation log
    const { data: logEntry } = await supabase
      .from("generation_logs")
      .insert({
        user_id: user.id,
        page: page || "create",
        prompt,
        model: isImageToImage ? "lovable-ai" : "freepik-flux-dev",
        status: "pending",
        credits_used: 1,
        expires_at: `now() + interval '${expiryInterval}'`,
        metadata: { style, aspectRatio, negativePrompt, seed, isImageToImage },
      })
      .select().single();

    let generatedImage: string | null = null;

    if (isImageToImage) {
      // ── IMAGE-TO-IMAGE: Lovable AI (character face, style transfer) ──
      if (LOVABLE_API_KEY) {
        generatedImage = await generateViaLovableAI(LOVABLE_API_KEY, enhancedPrompt, inputImageUrl, aspectRatio);
      }
    } else {
      // ── TEXT-TO-IMAGE: Freepik first, Lovable AI fallback ──
      if (FREEPIK_API_KEY) {
        generatedImage = await generateViaFreepik(FREEPIK_API_KEY, enhancedPrompt, aspectRatio);
      }
      // Fallback to Lovable AI if Freepik fails or key missing
      if (!generatedImage && LOVABLE_API_KEY) {
        generatedImage = await generateTextViaLovableAI(LOVABLE_API_KEY, enhancedPrompt);
      }
    }

    if (!generatedImage) {
      if (logEntry) {
        await supabase.from("generation_logs").update({ status: "failed" }).eq("id", logEntry.id);
      }
      return new Response(JSON.stringify({ error: "Image generation failed. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage if base64
    let publicUrl = generatedImage;
    if (generatedImage.startsWith("data:")) {
      const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `${user.id}/visual-pro-${seed}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(fileName, imageBuffer, { contentType: "image/png", upsert: false });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }
    }

    // Deduct credit & update log
    const newUsed = profile.generation_used + 1;
    const remaining = profile.generation_limit - newUsed;

    await Promise.all([
      supabase.from("profiles").update({ generation_used: newUsed }).eq("user_id", user.id),
      logEntry
        ? supabase.from("generation_logs").update({ status: "completed", image_url: publicUrl }).eq("id", logEntry.id)
        : Promise.resolve(),
    ]);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        fileName: `visual-pro-${seed}.png`,
        seed,
        creditsRemaining: remaining,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

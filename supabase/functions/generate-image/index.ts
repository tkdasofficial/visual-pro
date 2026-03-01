import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Gemini fallback key cycling ──
function getGeminiKeys(): string[] {
  return [
    Deno.env.get("GEMINI_API_KEY_1"),
    Deno.env.get("GEMINI_API_KEY_2"),
    Deno.env.get("GEMINI_API_KEY_3"),
    Deno.env.get("GEMINI_API_KEY_4"),
    Deno.env.get("GEMINI_API_KEY_5"),
    Deno.env.get("GEMINI_API_KEY_6"),
    Deno.env.get("GEMINI_API_KEY_7"),
    Deno.env.get("GEMINI_API_KEY_8"),
  ].filter(Boolean) as string[];
}

async function generateViaGemini(prompt: string, geminiKeys: string[]): Promise<string | null> {
  const keys = [...geminiKeys].sort(() => Math.random() - 0.5);
  for (const key of keys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.error(`Key attempt failed (${res.status}): ${errText.slice(0, 200)}`);
        continue;
      }
      const data = await res.json();
      const part = data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("image/")
      );
      if (part?.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    } catch (err) {
      console.error("Key error:", err);
      continue;
    }
  }
  return null;
}

async function generateViaLovable(apiKey: string, prompt: string, inputImageUrl?: string): Promise<string | null> {
  const messages: any[] = [
    {
      role: "user",
      content: inputImageUrl
        ? [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: inputImageUrl } },
          ]
        : prompt,
    },
  ];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages,
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Primary error:", res.status, errText.slice(0, 200));
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
}

// ── Seed generator (8-digit) ──
function generateSeed(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

// ── Plan-based expiry ──
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

    // Credits & profile check
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

    // Generate unique seed
    const seed = generateSeed();
    const expiryInterval = getExpiryInterval(profile?.subscription_plan || "explorer");

    // Build enhanced prompt with explicit aspect ratio dimensions
    const aspectRatioMap: Record<string, string> = {
      "1:1": "square format (1024x1024)",
      "16:9": "wide landscape format (1792x1024), 16:9 widescreen",
      "9:16": "tall portrait format (1024x1792), 9:16 vertical",
      "4:5": "portrait format (1024x1280), 4:5 ratio",
      "4:3": "landscape format (1280x960), 4:3 ratio",
      "3:4": "portrait format (960x1280), 3:4 ratio",
    };
    const aspectInstruction = aspectRatio && aspectRatioMap[aspectRatio]
      ? `Image dimensions: ${aspectRatioMap[aspectRatio]}.`
      : aspectRatio ? `Aspect ratio: ${aspectRatio}.` : "";

    const enhancedPrompt = [
      style ? `Style: ${style}.` : "",
      prompt,
      negativePrompt ? `Avoid: ${negativePrompt}.` : "",
      aspectInstruction,
      "Ultra high resolution, professional quality.",
    ].filter(Boolean).join(" ");

    // Insert generation log
    const { data: logEntry } = await supabase
      .from("generation_logs")
      .insert({
        user_id: user.id,
        page: page || "create",
        prompt,
        model: "visual-pro-engine",
        status: "pending",
        credits_used: 1,
        expires_at: `now() + interval '${expiryInterval}'`,
        metadata: { style, aspectRatio, negativePrompt, seed, watermark: "Visual Pro | Avzio" },
      })
      .select().single();

    // Try primary AI, then fallback
    let generatedImage: string | null = null;

    if (LOVABLE_API_KEY) {
      generatedImage = await generateViaLovable(LOVABLE_API_KEY, enhancedPrompt, inputImageUrl);
    }

    if (!generatedImage) {
      const geminiKeys = getGeminiKeys();
      if (geminiKeys.length > 0) {
        generatedImage = await generateViaGemini(enhancedPrompt, geminiKeys);
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

    // Upload to storage with seed-based naming
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `${user.id}/visual-pro-${seed}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: false });

    let publicUrl = generatedImage;
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
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

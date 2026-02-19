import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Gemini fallback key cycling ──────────────────────────────────────────────
function getGeminiKeys(): string[] {
  return [
    Deno.env.get("GEMINI_API_KEY_1"),
    Deno.env.get("GEMINI_API_KEY_2"),
    Deno.env.get("GEMINI_API_KEY_3"),
    Deno.env.get("GEMINI_API_KEY_4"),
    Deno.env.get("GEMINI_API_KEY_5"),
    Deno.env.get("GEMINI_API_KEY_6"),
    Deno.env.get("GEMINI_API_KEY_7"),
  ].filter(Boolean) as string[];
}

async function generateViaGemini(prompt: string, geminiKeys: string[]): Promise<string | null> {
  // Shuffle to distribute load across keys
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
        console.error(`Gemini key attempt failed (${res.status}): ${errText.slice(0, 200)}`);
        continue; // try next key
      }

      const data = await res.json();
      const part = data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("image/")
      );
      if (part?.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    } catch (err) {
      console.error("Gemini key error:", err);
      continue;
    }
  }
  return null;
}

// ── Primary: Lovable AI gateway ──────────────────────────────────────────────
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
    console.error("Primary AI error:", res.status, errText.slice(0, 200));
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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

    // Credits check
    const { data: credits } = await supabase
      .from("credits").select("balance").eq("user_id", user.id).single();

    if (!credits || credits.balance < 1) {
      return new Response(JSON.stringify({ error: "Insufficient credits. Please upgrade your plan." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Suspension check
    const { data: profile } = await supabase
      .from("profiles").select("is_suspended").eq("user_id", user.id).single();

    if (profile?.is_suspended) {
      return new Response(JSON.stringify({ error: "Account suspended. Contact support." }), {
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

    // Build enhanced prompt (internal only, never returned to client)
    const enhancedPrompt = [
      style ? `Style: ${style}.` : "",
      prompt,
      negativePrompt ? `Avoid: ${negativePrompt}.` : "",
      aspectRatio ? `Aspect ratio: ${aspectRatio}.` : "",
      "Ultra high resolution, professional quality.",
    ].filter(Boolean).join(" ");

    // Insert generation log (pending)
    const { data: logEntry } = await supabase
      .from("generation_logs")
      .insert({
        user_id: user.id,
        page: page || "create",
        prompt,
        model: "visual-pro-engine", // internal label, never exposed
        status: "pending",
        credits_used: 1,
        metadata: { style, aspectRatio, negativePrompt },
      })
      .select().single();

    // ── Try primary AI first, then fallback ──────────────────────────────────
    let generatedImage: string | null = null;

    if (LOVABLE_API_KEY) {
      generatedImage = await generateViaLovable(LOVABLE_API_KEY, enhancedPrompt, inputImageUrl);
    }

    // Fallback: cycle Gemini keys
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

    // Upload to Supabase Storage
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    const fileName = `${user.id}/visual-pro-${randomNum}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: false });

    let publicUrl = generatedImage;
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
    }

    // Deduct credit & update log
    await Promise.all([
      supabase.from("credits").update({ balance: credits.balance - 1 }).eq("user_id", user.id),
      logEntry
        ? supabase.from("generation_logs").update({ status: "completed", image_url: publicUrl }).eq("id", logEntry.id)
        : Promise.resolve(),
    ]);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        fileName: `visual-pro-${randomNum}.png`,
        creditsRemaining: credits.balance - 1,
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

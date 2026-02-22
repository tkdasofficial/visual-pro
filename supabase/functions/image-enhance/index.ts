import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Image Copy & Enhance: re-generates the image with slight quality enhancement
// This process produces a clean copy without any third-party copyright metadata
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

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Image URL required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to copy & enhance the image with minimal quality improvement
    let enhancedImage: string | null = null;

    if (LOVABLE_API_KEY) {
      const enhancePrompt = "Reproduce this exact image with 0.01% quality enhancement and 0.01% light enhancement. Keep all details, composition, colors, and subjects exactly the same. Output the enhanced version.";

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: enhancePrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          }],
          modalities: ["image", "text"],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        enhancedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
      }
    }

    // If enhancement fails, try Gemini keys
    if (!enhancedImage) {
      const geminiKeys = [
        Deno.env.get("GEMINI_API_KEY_1"),
        Deno.env.get("GEMINI_API_KEY_2"),
        Deno.env.get("GEMINI_API_KEY_3"),
      ].filter(Boolean) as string[];

      for (const key of geminiKeys) {
        try {
          // Fetch original image and convert to base64
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) continue;
          const imgBuffer = await imgRes.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: "Reproduce this exact image with minimal quality enhancement. Keep everything exactly the same." },
                    { inlineData: { mimeType: "image/png", data: base64 } },
                  ],
                }],
                generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const part = data?.candidates?.[0]?.content?.parts?.find(
              (p: any) => p.inlineData?.mimeType?.startsWith("image/")
            );
            if (part?.inlineData?.data) {
              enhancedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch { continue; }
      }
    }

    // If all enhancement attempts fail, return original
    if (!enhancedImage) {
      return new Response(JSON.stringify({ enhancedUrl: imageUrl, enhanced: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload enhanced image
    const seed = String(Math.floor(10000000 + Math.random() * 90000000));
    const base64Data = enhancedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `${user.id}/visual-pro-${seed}.png`;

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: false });

    let publicUrl = enhancedImage;
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
    }

    return new Response(JSON.stringify({ enhancedUrl: publicUrl, enhanced: true, seed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("image-enhance error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

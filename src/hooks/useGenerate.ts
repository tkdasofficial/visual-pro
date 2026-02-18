import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenerateOptions {
  prompt: string;
  negativePrompt?: string;
  page: string;
  style?: string;
  aspectRatio?: string;
  model?: string;
  imageUrl?: string;
}

interface GenerateResult {
  imageUrl: string;
  fileName: string;
  creditsRemaining: number;
}

export function useGenerate() {
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = async (options: GenerateOptions): Promise<GenerateResult | null> => {
    if (!options.prompt.trim()) {
      toast({ title: "Prompt required", description: "Please enter a prompt before generating.", variant: "destructive" });
      return null;
    }

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Not authenticated", description: "Please sign in to generate images.", variant: "destructive" });
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(options),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast({
            title: "Insufficient Credits",
            description: data.error || "You don't have enough credits. Please upgrade your plan.",
            variant: "destructive",
          });
        } else if (response.status === 429) {
          toast({
            title: "Rate Limited",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Generation Failed",
            description: data.error || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        }
        return null;
      }

      setGeneratedImage(data.imageUrl);
      setGeneratedFileName(data.fileName);
      toast({
        title: "Image Generated",
        description: `Credits remaining: ${data.creditsRemaining}`,
      });

      return data as GenerateResult;
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = (imageUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName || `visual-pro-${Math.floor(10000000 + Math.random() * 90000000)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearImage = () => {
    setGeneratedImage(null);
    setGeneratedFileName(null);
  };

  return {
    generating,
    generatedImage,
    generatedFileName,
    generate,
    downloadImage,
    clearImage,
  };
}

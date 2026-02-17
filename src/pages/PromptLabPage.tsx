import { useState } from "react";
import { FlaskConical, Sparkles, Zap, ArrowLeftRight } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const modeOptions = [
  { value: "enhance", label: "Auto-Enhance" },
  { value: "analyze", label: "Analyze Prompt" },
  { value: "compare", label: "A/B Compare" },
];

const toneOptions = [
  { value: "descriptive", label: "Descriptive" },
  { value: "cinematic", label: "Cinematic" },
  { value: "technical", label: "Technical" },
  { value: "artistic", label: "Artistic" },
  { value: "minimal", label: "Minimal" },
];

const complexityOptions = [
  { value: "simple", label: "Simple" },
  { value: "moderate", label: "Moderate" },
  { value: "detailed", label: "Detailed" },
  { value: "expert", label: "Expert" },
];

export default function PromptLabPage() {
  const [mode, setMode] = useState("enhance");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [tone, setTone] = useState("descriptive");
  const [complexity, setComplexity] = useState("moderate");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [processing, setProcessing] = useState(false);

  const canProcess = promptA.trim() !== "";

  const handleProcess = () => {
    if (!canProcess) return;
    setProcessing(true);
    setTimeout(() => {
      if (mode === "enhance") {
        setEnhancedPrompt(
          `${promptA}, highly detailed, ${tone} style, professional quality, 8k resolution, sharp focus`
        );
      } else if (mode === "analyze") {
        setEnhancedPrompt(
          `Analysis:\n• Subject: detected\n• Style: ${tone}\n• Complexity: ${complexity}\n• Suggestion: Add lighting and camera details for better results.`
        );
      }
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <CustomSelect
            label="Mode"
            options={modeOptions}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setEnhancedPrompt("");
            }}
          />

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <FlaskConical className="h-3.5 w-3.5" />
              {mode === "compare" ? "Prompt A" : "Prompt"}
            </label>
            <textarea
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Enter your prompt..."
            />
          </div>

          {mode === "compare" && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Prompt B
              </label>
              <textarea
                value={promptB}
                onChange={(e) => setPromptB(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Enter comparison prompt..."
              />
            </div>
          )}

          {mode !== "compare" && (
            <>
              <CustomSelect label="Tone" options={toneOptions} value={tone} onChange={setTone} />
              <CustomSelect label="Complexity" options={complexityOptions} value={complexity} onChange={setComplexity} />
            </>
          )}

          <button
            onClick={handleProcess}
            disabled={!canProcess || processing}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {processing ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                {mode === "enhance" ? "Enhance" : mode === "analyze" ? "Analyze" : "Compare"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        {enhancedPrompt ? (
          <div className="w-full max-w-lg space-y-3">
            <p className="text-sm font-medium text-foreground">
              {mode === "enhance" ? "Enhanced Prompt" : "Analysis Result"}
            </p>
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
              {enhancedPrompt}
            </div>
            {mode === "enhance" && (
              <button
                onClick={() => navigator.clipboard.writeText(enhancedPrompt)}
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
              >
                Copy to Clipboard
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FlaskConical className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Prompt Lab</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Optimize, analyze, and compare prompts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

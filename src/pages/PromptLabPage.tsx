import { useState } from "react";
import { FlaskConical, Sparkles, Zap, ArrowLeftRight } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const modeOptions = [
  { value: "enhance", label: "Auto-Enhance" },
  { value: "compare", label: "A/B Compare" },
];
const toneOptions = [
  { value: "descriptive", label: "Descriptive" }, { value: "cinematic", label: "Cinematic" },
  { value: "technical", label: "Technical" }, { value: "artistic", label: "Artistic" },
];
const aspectRatios = ["1:1", "16:9", "9:16", "4:5"];

export default function PromptLabPage() {
  const [mode, setMode] = useState("enhance");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [tone, setTone] = useState("descriptive");
  const [ratio, setRatio] = useState("1:1");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");

  const genA = useGenerate();
  const genB = useGenerate();

  const handleEnhance = () => {
    if (!promptA.trim()) return;
    setEnhancedPrompt(
      `${promptA}, highly detailed, ${tone} style, professional quality, 8k resolution, sharp focus, masterful composition`
    );
  };

  const handleCompare = async () => {
    if (!promptA.trim()) return;
    const p2 = promptB.trim() || `${promptA}, enhanced with cinematic lighting`;
    await Promise.all([
      genA.generate({ prompt: promptA, page: "prompt-lab", aspectRatio: ratio }),
      genB.generate({ prompt: p2, page: "prompt-lab", aspectRatio: ratio }),
    ]);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <CustomSelect label="Mode" options={modeOptions} value={mode} onChange={(v) => { setMode(v); setEnhancedPrompt(""); }} />
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <FlaskConical className="h-3.5 w-3.5" /> {mode === "compare" ? "Prompt A" : "Prompt"}
            </label>
            <textarea value={promptA} onChange={(e) => setPromptA(e.target.value)} rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Enter your prompt..." />
          </div>
          {mode === "compare" && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"><ArrowLeftRight className="h-3.5 w-3.5" /> Prompt B</label>
              <textarea value={promptB} onChange={(e) => setPromptB(e.target.value)} rows={4}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Enter comparison prompt..." />
            </div>
          )}
          {mode === "enhance" && <CustomSelect label="Tone" options={toneOptions} value={tone} onChange={setTone} />}
          {mode === "compare" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Aspect Ratio</label>
              <div className="flex gap-1.5">
                {aspectRatios.map((r) => (
                  <button key={r} onClick={() => setRatio(r)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${ratio === r ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"}`}>{r}</button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={mode === "enhance" ? handleEnhance : handleCompare}
            disabled={!promptA.trim() || genA.generating || genB.generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {(genA.generating || genB.generating) ? (
              <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Processing...</>
            ) : (
              <><Zap className="h-3.5 w-3.5" /> {mode === "enhance" ? "Enhance" : "Compare"}</>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6">
        {mode === "enhance" && enhancedPrompt ? (
          <div className="w-full max-w-lg space-y-3">
            <p className="text-sm font-medium text-foreground">Enhanced Prompt</p>
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">{enhancedPrompt}</div>
            <button onClick={() => navigator.clipboard.writeText(enhancedPrompt)} className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted">Copy to Clipboard</button>
          </div>
        ) : mode === "compare" && (genA.generatedImage || genB.generatedImage) ? (
          <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {[genA, genB].map((g, i) => (
              <div key={i} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Prompt {i === 0 ? "A" : "B"}</p>
                {g.generatedImage ? (
                  <img src={g.generatedImage} alt="" className="w-full rounded-lg border border-border" />
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs">No image</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><FlaskConical className="h-7 w-7 text-muted-foreground" /></div>
            <div>
              <p className="text-sm font-medium text-foreground">Prompt Lab</p>
              <p className="mt-1 text-xs text-muted-foreground">Optimize, analyze, and compare prompts.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

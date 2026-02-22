import { useState } from "react";
import { Repeat, Sparkles, Upload } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const styleOptions = [
  { value: "cinematic", label: "Cinematic" }, { value: "realistic", label: "Realistic" },
  { value: "anime", label: "Anime" }, { value: "3d", label: "3D Render" },
  { value: "illustration", label: "Illustration" },
];
const ratioOptions = ["1:1", "16:9", "9:16", "4:5"];

export default function BatchPage() {
  const [prompts, setPrompts] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [ratio, setRatio] = useState("1:1");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<(string | null)[]>([]);
  const { generating, generate } = useGenerate();

  const lines = prompts.split("\n").filter((l) => l.trim());

  const handleGenerate = async () => {
    if (lines.length === 0) return;
    setResults([]);
    const newResults: (string | null)[] = [];
    for (let i = 0; i < lines.length; i++) {
      setCurrentIdx(i);
      const result = await generate({ prompt: lines[i], page: "batch", style, aspectRatio: ratio });
      newResults.push(result?.imageUrl ?? null);
    }
    setResults(newResults);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Repeat className="h-3.5 w-3.5" /> Prompts (one per line)
            </label>
            <textarea value={prompts} onChange={(e) => setPrompts(e.target.value)} rows={6}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder={"A sunset over mountains\nA forest in fog\nAn ocean at midnight"} />
            <p className="mt-1 text-xs text-muted-foreground">{lines.length} prompt(s)</p>
          </div>
          <CustomSelect label="Style" options={styleOptions} value={style} onChange={setStyle} />
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Aspect Ratio</label>
            <div className="flex gap-1.5">
              {ratioOptions.map((r) => (
                <button key={r} onClick={() => setRatio(r)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${ratio === r ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"}`}>{r}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={lines.length === 0 || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {generating ? (
              <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Generating {currentIdx + 1}/{lines.length}...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Generate Batch ({lines.length})</>
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((url, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border">
                {url ? (
                  <img src={url} alt="" className="w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">Failed</div>
                )}
                <p className="truncate border-t border-border bg-card px-3 py-1.5 text-[10px] text-muted-foreground">{lines[i]}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><Repeat className="h-7 w-7 text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Batch Generation</p>
                <p className="mt-1 text-xs text-muted-foreground">Generate multiple images at once with style-locked consistency.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

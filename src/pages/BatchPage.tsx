import { useState } from "react";
import { Repeat, Sparkles, Upload, Download, Image } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const modeOptions = [
  { value: "prompts", label: "Manual Prompts" },
  { value: "csv", label: "CSV Upload" },
];

const styleOptions = [
  { value: "cinematic", label: "Cinematic" },
  { value: "realistic", label: "Realistic" },
  { value: "anime", label: "Anime" },
  { value: "3d", label: "3D Render" },
  { value: "illustration", label: "Illustration" },
];

const ratioOptions = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:5", label: "4:5" },
];

const exportOptions = [
  { value: "zip", label: "ZIP Archive" },
  { value: "individual", label: "Individual Files" },
];

export default function BatchPage() {
  const [mode, setMode] = useState("prompts");
  const [prompts, setPrompts] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [ratio, setRatio] = useState("1:1");
  const [exportType, setExportType] = useState("zip");
  const [styleLock, setStyleLock] = useState(true);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const promptCount = mode === "prompts"
    ? prompts.split("\n").filter((l) => l.trim()).length
    : csvUploaded
    ? 12
    : 0;

  const canGenerate = promptCount > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 3000);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <CustomSelect label="Input Mode" options={modeOptions} value={mode} onChange={setMode} />

          {mode === "prompts" ? (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Repeat className="h-3.5 w-3.5" />
                Prompts (one per line)
              </label>
              <textarea
                value={prompts}
                onChange={(e) => setPrompts(e.target.value)}
                rows={6}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder={"A sunset over mountains\nA forest in fog\nAn ocean at midnight"}
              />
              <p className="mt-1 text-xs text-muted-foreground">{promptCount} prompt(s)</p>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">CSV File</label>
              <button
                onClick={() => setCsvUploaded(true)}
                className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-sm text-muted-foreground transition-colors duration-150 hover:border-accent hover:text-foreground"
              >
                <Upload className="h-4 w-4" />
                {csvUploaded ? "CSV Loaded (12 rows)" : "Upload CSV"}
              </button>
            </div>
          )}

          <CustomSelect label="Style (Locked)" options={styleOptions} value={style} onChange={setStyle} />
          <CustomSelect label="Aspect Ratio" options={ratioOptions} value={ratio} onChange={setRatio} />

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Style Lock</label>
            <button
              onClick={() => setStyleLock(!styleLock)}
              className={`relative h-5 w-9 rounded-full transition-colors duration-150 ${
                styleLock ? "bg-accent" : "bg-input"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform duration-150 ${
                  styleLock ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          <CustomSelect label="Export" options={exportOptions} value={exportType} onChange={setExportType} />

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Generating {promptCount} images...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate Batch ({promptCount})
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Image className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Batch Generation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate multiple images at once with style-locked consistency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

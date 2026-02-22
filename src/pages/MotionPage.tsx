import { useState } from "react";
import { Film, Sparkles } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const cameraMotionOptions = [
  { value: "static", label: "Static" }, { value: "pan-left", label: "Pan Left" },
  { value: "pan-right", label: "Pan Right" }, { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" }, { value: "orbit", label: "Orbit" },
];
const durationOptions = [
  { value: "2", label: "2 Seconds" }, { value: "4", label: "4 Seconds" },
  { value: "6", label: "6 Seconds" },
];
const aspectRatios = ["1:1", "16:9", "9:16", "4:5"];

export default function MotionPage() {
  const [prompt, setPrompt] = useState("");
  const [cameraMotion, setCameraMotion] = useState("static");
  const [duration, setDuration] = useState("4");
  const [ratio, setRatio] = useState("16:9");
  const [parallax, setParallax] = useState(50);
  const { generating, generatedImage, generatedFileName, generate, downloadImage, clearImage } = useGenerate();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const motionPrompt = [
      prompt,
      `Camera motion: ${cameraMotion}`,
      `Duration: ${duration}s`,
      `Parallax depth: ${parallax}%`,
      "Cinematic motion scene, high quality",
    ].join(". ");
    await generate({ prompt: motionPrompt, page: "motion", aspectRatio: ratio });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"><Film className="h-3.5 w-3.5" /> Scene Description</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Describe the motion scene..." />
          </div>
          <CustomSelect label="Camera Motion" options={cameraMotionOptions} value={cameraMotion} onChange={setCameraMotion} />
          <CustomSelect label="Duration" options={durationOptions} value={duration} onChange={setDuration} />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Parallax Depth</label>
              <span className="text-xs font-medium text-foreground">{parallax}%</span>
            </div>
            <input type="range" min={0} max={100} value={parallax} onChange={(e) => setParallax(parseInt(e.target.value))} className="w-full accent-accent" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Aspect Ratio</label>
            <div className="flex gap-1.5">
              {aspectRatios.map((r) => (
                <button key={r} onClick={() => setRatio(r)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${ratio === r ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"}`}>{r}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={!prompt.trim() || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {generating ? (<><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Rendering...</>) : (<><Sparkles className="h-3.5 w-3.5" /> Render Motion</>)}
          </button>
        </div>
      </div>
      <ImageCanvas imageUrl={generatedImage} fileName={generatedFileName} generating={generating}
        onDownload={() => generatedImage && generatedFileName && downloadImage(generatedImage, generatedFileName)} onClear={clearImage} emptyLabel="Create cinematic motion sequences and animations." />
    </div>
  );
}

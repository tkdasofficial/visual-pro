import { useState } from "react";
import { Film, Sparkles, Image } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const cameraMotionOptions = [
  { value: "static", label: "Static" },
  { value: "pan-left", label: "Pan Left" },
  { value: "pan-right", label: "Pan Right" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" },
  { value: "orbit", label: "Orbit" },
  { value: "dolly", label: "Dolly" },
];

const durationOptions = [
  { value: "2", label: "2 Seconds" },
  { value: "4", label: "4 Seconds" },
  { value: "6", label: "6 Seconds" },
  { value: "8", label: "8 Seconds" },
];

const loopOptions = [
  { value: "none", label: "No Loop" },
  { value: "forward", label: "Forward Loop" },
  { value: "pingpong", label: "Ping-Pong" },
  { value: "infinite", label: "Infinite" },
];

const exportOptions = [
  { value: "mp4", label: "MP4 Video" },
  { value: "gif", label: "GIF" },
  { value: "webm", label: "WebM" },
];

const fpsOptions = [
  { value: "24", label: "24 FPS" },
  { value: "30", label: "30 FPS" },
  { value: "60", label: "60 FPS" },
];

export default function MotionPage() {
  const [prompt, setPrompt] = useState("");
  const [cameraMotion, setCameraMotion] = useState("static");
  const [duration, setDuration] = useState("4");
  const [loop, setLoop] = useState("none");
  const [exportFormat, setExportFormat] = useState("mp4");
  const [fps, setFps] = useState("24");
  const [parallax, setParallax] = useState(50);
  const [generating, setGenerating] = useState(false);

  const canGenerate = prompt.trim() !== "";

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 3000);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Film className="h-3.5 w-3.5" />
              Scene Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe the motion scene..."
            />
          </div>

          <CustomSelect label="Camera Motion" options={cameraMotionOptions} value={cameraMotion} onChange={setCameraMotion} />
          <CustomSelect label="Duration" options={durationOptions} value={duration} onChange={setDuration} />
          <CustomSelect label="FPS" options={fpsOptions} value={fps} onChange={setFps} />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Parallax Depth</label>
              <span className="text-xs font-medium text-foreground">{parallax}%</span>
            </div>
            <input type="range" min={0} max={100} value={parallax} onChange={(e) => setParallax(parseInt(e.target.value))} className="w-full accent-accent" />
          </div>

          <CustomSelect label="Loop Mode" options={loopOptions} value={loop} onChange={setLoop} />
          <CustomSelect label="Export Format" options={exportOptions} value={exportFormat} onChange={setExportFormat} />

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Rendering...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Render Motion
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
            <p className="text-sm font-medium text-foreground">Motion Designer</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create cinematic motion sequences and animations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

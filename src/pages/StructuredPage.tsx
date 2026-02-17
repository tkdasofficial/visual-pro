import { useState } from "react";
import { LayoutGrid, Sparkles, Image } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const sceneOptions = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "abstract", label: "Abstract" },
  { value: "studio", label: "Studio" },
];

const lightingOptions = [
  { value: "natural", label: "Natural" },
  { value: "studio", label: "Studio" },
  { value: "dramatic", label: "Dramatic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "neon", label: "Neon" },
];

const cameraOptions = [
  { value: "wide", label: "Wide Angle" },
  { value: "normal", label: "Normal" },
  { value: "telephoto", label: "Telephoto" },
  { value: "macro", label: "Macro" },
  { value: "fisheye", label: "Fisheye" },
];

const moodOptions = [
  { value: "calm", label: "Calm" },
  { value: "energetic", label: "Energetic" },
  { value: "mysterious", label: "Mysterious" },
  { value: "romantic", label: "Romantic" },
  { value: "dark", label: "Dark" },
];

const priorityOptions = [
  { value: "subject", label: "Subject First" },
  { value: "background", label: "Background First" },
  { value: "lighting", label: "Lighting First" },
  { value: "balanced", label: "Balanced" },
];

export default function StructuredPage() {
  const [subject, setSubject] = useState("");
  const [background, setBackground] = useState("");
  const [scene, setScene] = useState("");
  const [lighting, setLighting] = useState("");
  const [camera, setCamera] = useState("");
  const [mood, setMood] = useState("");
  const [priority, setPriority] = useState("balanced");
  const [generating, setGenerating] = useState(false);

  const canGenerate = subject.trim() !== "";

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Main subject..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Background</label>
            <input
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe background..."
            />
          </div>

          <CustomSelect label="Scene Type" options={sceneOptions} value={scene} onChange={setScene} placeholder="Select scene" />
          <CustomSelect label="Lighting" options={lightingOptions} value={lighting} onChange={setLighting} placeholder="Select lighting" />
          <CustomSelect label="Camera Angle" options={cameraOptions} value={camera} onChange={setCamera} placeholder="Select camera" />
          <CustomSelect label="Mood" options={moodOptions} value={mood} onChange={setMood} placeholder="Select mood" />
          <CustomSelect label="Layer Priority" options={priorityOptions} value={priority} onChange={setPriority} placeholder="Select priority" />

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Composing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Compose
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
            <p className="text-sm font-medium text-foreground">Precision Composer</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Define scene fields and compose your image.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

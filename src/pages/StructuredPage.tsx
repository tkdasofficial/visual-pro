import { useState } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const sceneOptions = [
  { value: "indoor", label: "Indoor" }, { value: "outdoor", label: "Outdoor" },
  { value: "abstract", label: "Abstract" }, { value: "studio", label: "Studio" },
];
const lightingOptions = [
  { value: "natural", label: "Natural" }, { value: "studio", label: "Studio" },
  { value: "dramatic", label: "Dramatic" }, { value: "cinematic", label: "Cinematic" },
  { value: "neon", label: "Neon" },
];
const cameraOptions = [
  { value: "wide", label: "Wide Angle" }, { value: "normal", label: "Normal" },
  { value: "telephoto", label: "Telephoto" }, { value: "macro", label: "Macro" },
];
const moodOptions = [
  { value: "calm", label: "Calm" }, { value: "energetic", label: "Energetic" },
  { value: "mysterious", label: "Mysterious" }, { value: "romantic", label: "Romantic" },
  { value: "dark", label: "Dark" },
];
const aspectRatios = ["1:1", "16:9", "9:16", "4:5"];

export default function StructuredPage() {
  const [subject, setSubject] = useState("");
  const [background, setBackground] = useState("");
  const [scene, setScene] = useState("");
  const [lighting, setLighting] = useState("");
  const [camera, setCamera] = useState("");
  const [mood, setMood] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const { generating, generatedImage, generatedFileName, generate, downloadImage, clearImage } = useGenerate();

  const handleGenerate = async () => {
    if (!subject.trim()) return;
    const parts = [
      subject,
      background && `Background: ${background}`,
      scene && `Scene: ${scene}`,
      lighting && `Lighting: ${lighting}`,
      camera && `Camera: ${camera} angle`,
      mood && `Mood: ${mood}`,
    ].filter(Boolean).join(". ");

    await generate({ prompt: parts, page: "structured", aspectRatio: ratio });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <LayoutGrid className="h-3.5 w-3.5" /> Subject
            </label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Main subject..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Background</label>
            <input value={background} onChange={(e) => setBackground(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe background..." />
          </div>
          <CustomSelect label="Scene Type" options={sceneOptions} value={scene} onChange={setScene} placeholder="Select scene" />
          <CustomSelect label="Lighting" options={lightingOptions} value={lighting} onChange={setLighting} placeholder="Select lighting" />
          <CustomSelect label="Camera Angle" options={cameraOptions} value={camera} onChange={setCamera} placeholder="Select camera" />
          <CustomSelect label="Mood" options={moodOptions} value={mood} onChange={setMood} placeholder="Select mood" />
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Aspect Ratio</label>
            <div className="flex gap-1.5">
              {aspectRatios.map((r) => (
                <button key={r} onClick={() => setRatio(r)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${ratio === r ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"}`}
                >{r}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={!subject.trim() || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {generating ? (
              <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Composing...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Compose</>
            )}
          </button>
        </div>
      </div>
      <ImageCanvas imageUrl={generatedImage} fileName={generatedFileName} generating={generating}
        onDownload={() => generatedImage && generatedFileName && downloadImage(generatedImage, generatedFileName)} onClear={clearImage} emptyLabel="Define scene fields and compose your image." />
    </div>
  );
}

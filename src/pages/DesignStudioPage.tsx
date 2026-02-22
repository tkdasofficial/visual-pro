import { useState, useRef } from "react";
import { Palette, Sparkles } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const designTypeOptions = [
  { value: "logo", label: "Logo" }, { value: "thumbnail", label: "Thumbnail" },
  { value: "poster", label: "Poster" }, { value: "banner", label: "Banner" },
  { value: "social", label: "Social Media" },
];
const colorSchemeOptions = [
  { value: "monochrome", label: "Monochrome" }, { value: "warm", label: "Warm Tones" },
  { value: "cool", label: "Cool Tones" }, { value: "vibrant", label: "Vibrant" },
  { value: "pastel", label: "Pastel" },
];
const layoutOptions = [
  { value: "centered", label: "Centered" }, { value: "asymmetric", label: "Asymmetric" },
  { value: "grid", label: "Grid-Based" }, { value: "freeform", label: "Freeform" },
];
const aspectRatios = ["1:1", "16:9", "9:16", "4:5"];

export default function DesignStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("");
  const [designType, setDesignType] = useState("");
  const [colorScheme, setColorScheme] = useState("");
  const [layout, setLayout] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const { generating, generatedImage, generatedFileName, generate, downloadImage, clearImage } = useGenerate();

  const handleGenerate = async () => {
    if (!prompt.trim() || !designType) return;
    const parts = [
      `${designType} design: ${prompt}`,
      brandName && `Brand: ${brandName}`,
      colorScheme && `Color scheme: ${colorScheme}`,
      layout && `Layout: ${layout}`,
    ].filter(Boolean).join(". ");
    await generate({ prompt: parts, page: "design-studio", aspectRatio: ratio });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"><Palette className="h-3.5 w-3.5" /> Design Brief</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Describe your design..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Brand Name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Your brand name..." />
          </div>
          <CustomSelect label="Design Type" options={designTypeOptions} value={designType} onChange={setDesignType} placeholder="Select type" />
          <CustomSelect label="Color Scheme" options={colorSchemeOptions} value={colorScheme} onChange={setColorScheme} placeholder="Select scheme" />
          <CustomSelect label="Layout" options={layoutOptions} value={layout} onChange={setLayout} placeholder="Select layout" />
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Aspect Ratio</label>
            <div className="flex gap-1.5">
              {aspectRatios.map((r) => (
                <button key={r} onClick={() => setRatio(r)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${ratio === r ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"}`}>{r}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={!prompt.trim() || !designType || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {generating ? (<><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Designing...</>) : (<><Sparkles className="h-3.5 w-3.5" /> Design</>)}
          </button>
        </div>
      </div>
      <ImageCanvas imageUrl={generatedImage} fileName={generatedFileName} generating={generating}
        onDownload={() => generatedImage && generatedFileName && downloadImage(generatedImage, generatedFileName)} onClear={clearImage} emptyLabel="Create logos, thumbnails, posters, and brand assets." />
    </div>
  );
}

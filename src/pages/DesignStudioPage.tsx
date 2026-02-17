import { useState } from "react";
import { Palette, Sparkles, Image } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const designTypeOptions = [
  { value: "logo", label: "Logo" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "poster", label: "Poster" },
  { value: "banner", label: "Banner" },
  { value: "social", label: "Social Media" },
];

const colorSchemeOptions = [
  { value: "monochrome", label: "Monochrome" },
  { value: "warm", label: "Warm Tones" },
  { value: "cool", label: "Cool Tones" },
  { value: "vibrant", label: "Vibrant" },
  { value: "pastel", label: "Pastel" },
  { value: "brand", label: "Brand Colors" },
];

const layoutOptions = [
  { value: "centered", label: "Centered" },
  { value: "asymmetric", label: "Asymmetric" },
  { value: "grid", label: "Grid-Based" },
  { value: "freeform", label: "Freeform" },
];

const formatOptions = [
  { value: "png", label: "PNG" },
  { value: "svg", label: "SVG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

export default function DesignStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("");
  const [designType, setDesignType] = useState("");
  const [colorScheme, setColorScheme] = useState("");
  const [layout, setLayout] = useState("");
  const [format, setFormat] = useState("png");
  const [generating, setGenerating] = useState(false);

  const canGenerate = prompt.trim() && designType;

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
              <Palette className="h-3.5 w-3.5" />
              Design Brief
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe your design..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Brand Name</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Your brand name..."
            />
          </div>

          <CustomSelect label="Design Type" options={designTypeOptions} value={designType} onChange={setDesignType} placeholder="Select type" />
          <CustomSelect label="Color Scheme" options={colorSchemeOptions} value={colorScheme} onChange={setColorScheme} placeholder="Select scheme" />
          <CustomSelect label="Layout" options={layoutOptions} value={layout} onChange={setLayout} placeholder="Select layout" />
          <CustomSelect label="Export Format" options={formatOptions} value={format} onChange={setFormat} placeholder="Select format" />

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Designing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Design
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
            <p className="text-sm font-medium text-foreground">Design Studio</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create logos, thumbnails, posters, and brand assets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

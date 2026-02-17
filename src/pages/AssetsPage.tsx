import { useState } from "react";
import { Package, Sparkles, Image } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const assetTypeOptions = [
  { value: "icon", label: "Icon" },
  { value: "illustration", label: "UI Illustration" },
  { value: "sprite", label: "Sprite Sheet" },
  { value: "texture", label: "Texture" },
  { value: "pattern", label: "Pattern" },
];

const sizeOptions = [
  { value: "16", label: "16×16" },
  { value: "32", label: "32×32" },
  { value: "64", label: "64×64" },
  { value: "128", label: "128×128" },
  { value: "256", label: "256×256" },
  { value: "512", label: "512×512" },
];

const styleOptions = [
  { value: "flat", label: "Flat" },
  { value: "outlined", label: "Outlined" },
  { value: "filled", label: "Filled" },
  { value: "pixel", label: "Pixel Art" },
  { value: "3d", label: "3D Isometric" },
];

const countOptions = [
  { value: "1", label: "1 Asset" },
  { value: "4", label: "4 Assets" },
  { value: "8", label: "8 Assets" },
  { value: "16", label: "16 Assets" },
];

const formatOptions = [
  { value: "png", label: "PNG" },
  { value: "svg", label: "SVG" },
  { value: "webp", label: "WebP" },
];

export default function AssetsPage() {
  const [prompt, setPrompt] = useState("");
  const [assetType, setAssetType] = useState("");
  const [size, setSize] = useState("64");
  const [style, setStyle] = useState("flat");
  const [count, setCount] = useState("4");
  const [format, setFormat] = useState("png");
  const [consistent, setConsistent] = useState(true);
  const [generating, setGenerating] = useState(false);

  const canGenerate = prompt.trim() && assetType;

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
              <Package className="h-3.5 w-3.5" />
              Asset Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe the assets..."
            />
          </div>

          <CustomSelect label="Asset Type" options={assetTypeOptions} value={assetType} onChange={setAssetType} placeholder="Select type" />
          <CustomSelect label="Size" options={sizeOptions} value={size} onChange={setSize} />
          <CustomSelect label="Style" options={styleOptions} value={style} onChange={setStyle} />
          <CustomSelect label="Count" options={countOptions} value={count} onChange={setCount} />
          <CustomSelect label="Format" options={formatOptions} value={format} onChange={setFormat} />

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Consistent Pack</label>
            <button
              onClick={() => setConsistent(!consistent)}
              className={`relative h-5 w-9 rounded-full transition-colors duration-150 ${
                consistent ? "bg-accent" : "bg-input"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform duration-150 ${
                  consistent ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate Assets
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
            <p className="text-sm font-medium text-foreground">Asset Generator</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate game-ready icons, sprites, and UI assets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Package, Sparkles } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const assetTypeOptions = [
  { value: "icon", label: "Icon" }, { value: "illustration", label: "UI Illustration" },
  { value: "sprite", label: "Sprite Sheet" }, { value: "texture", label: "Texture" },
  { value: "pattern", label: "Pattern" },
];
const styleOptions = [
  { value: "flat", label: "Flat" }, { value: "outlined", label: "Outlined" },
  { value: "filled", label: "Filled" }, { value: "pixel", label: "Pixel Art" },
  { value: "3d", label: "3D Isometric" },
];

export default function AssetsPage() {
  const [prompt, setPrompt] = useState("");
  const [assetType, setAssetType] = useState("");
  const [style, setStyle] = useState("flat");
  const { generating, generatedImage, generatedFileName, generate, downloadImage, clearImage } = useGenerate();

  const handleGenerate = async () => {
    if (!prompt.trim() || !assetType) return;
    await generate({
      prompt: `${assetType} asset: ${prompt}. Style: ${style}. Clean, professional, transparent background if applicable.`,
      page: "assets", aspectRatio: "1:1", style,
    });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"><Package className="h-3.5 w-3.5" /> Asset Description</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Describe the assets..." />
          </div>
          <CustomSelect label="Asset Type" options={assetTypeOptions} value={assetType} onChange={setAssetType} placeholder="Select type" />
          <CustomSelect label="Style" options={styleOptions} value={style} onChange={setStyle} />
          <button onClick={handleGenerate} disabled={!prompt.trim() || !assetType || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {generating ? (<><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Generating...</>) : (<><Sparkles className="h-3.5 w-3.5" /> Generate Assets</>)}
          </button>
        </div>
      </div>
      <ImageCanvas imageUrl={generatedImage} fileName={generatedFileName} generating={generating}
        onDownload={() => generatedImage && generatedFileName && downloadImage(generatedImage, generatedFileName)} onClear={clearImage} emptyLabel="Generate icons, sprites, and UI assets." />
    </div>
  );
}

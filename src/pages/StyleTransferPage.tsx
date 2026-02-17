import { useState } from "react";
import { Layers, Sparkles, Image, Upload } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const styleOptions = [
  { value: "oil-painting", label: "Oil Painting" },
  { value: "watercolor", label: "Watercolor" },
  { value: "pencil-sketch", label: "Pencil Sketch" },
  { value: "pop-art", label: "Pop Art" },
  { value: "impressionist", label: "Impressionist" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "retro", label: "Retro Film" },
  { value: "noir", label: "Film Noir" },
];

const intensityOptions = [
  { value: "subtle", label: "Subtle" },
  { value: "moderate", label: "Moderate" },
  { value: "strong", label: "Strong" },
  { value: "maximum", label: "Maximum" },
];

const preserveOptions = [
  { value: "structure", label: "Preserve Structure" },
  { value: "color", label: "Preserve Colors" },
  { value: "both", label: "Preserve Both" },
  { value: "none", label: "Full Transfer" },
];

export default function StyleTransferPage() {
  const [style, setStyle] = useState("");
  const [intensity, setIntensity] = useState("moderate");
  const [preserve, setPreserve] = useState("structure");
  const [hasImage, setHasImage] = useState(false);
  const [generating, setGenerating] = useState(false);

  const canGenerate = hasImage && style;

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
              <Layers className="h-3.5 w-3.5" />
              Source Image
            </label>
            <button
              onClick={() => setHasImage(true)}
              className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-sm text-muted-foreground transition-colors duration-150 hover:border-accent hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              {hasImage ? "Image Loaded" : "Click to Upload"}
            </button>
          </div>

          <CustomSelect label="Art Style" options={styleOptions} value={style} onChange={setStyle} placeholder="Select style" />
          <CustomSelect label="Intensity" options={intensityOptions} value={intensity} onChange={setIntensity} />
          <CustomSelect label="Preservation" options={preserveOptions} value={preserve} onChange={setPreserve} />

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Transferring...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Apply Style
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
            <p className="text-sm font-medium text-foreground">Style Transfer</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload an image and select an art style to apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

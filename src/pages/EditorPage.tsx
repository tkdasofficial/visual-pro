import { useState } from "react";
import { PenTool, Sparkles, Image, Upload } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const editModeOptions = [
  { value: "inpaint", label: "Inpainting" },
  { value: "outpaint", label: "Outpainting" },
  { value: "remove", label: "Object Removal" },
  { value: "replace-bg", label: "Background Replace" },
  { value: "upscale", label: "AI Upscale" },
];

const upscaleOptions = [
  { value: "2x", label: "2× Upscale" },
  { value: "4x", label: "4× Upscale" },
  { value: "8x", label: "8× Upscale" },
];

const brushSizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xlarge", label: "Extra Large" },
];

const outputFormatOptions = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

export default function EditorPage() {
  const [editMode, setEditMode] = useState("inpaint");
  const [upscale, setUpscale] = useState("2x");
  const [brushSize, setBrushSize] = useState("medium");
  const [outputFormat, setOutputFormat] = useState("png");
  const [editPrompt, setEditPrompt] = useState("");
  const [strength, setStrength] = useState(75);
  const [generating, setGenerating] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  const handleGenerate = () => {
    if (!hasImage) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Upload area */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <PenTool className="h-3.5 w-3.5" />
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

          <CustomSelect label="Edit Mode" options={editModeOptions} value={editMode} onChange={setEditMode} />

          {editMode === "upscale" && (
            <CustomSelect label="Upscale Factor" options={upscaleOptions} value={upscale} onChange={setUpscale} />
          )}

          {(editMode === "inpaint" || editMode === "outpaint") && (
            <CustomSelect label="Brush Size" options={brushSizeOptions} value={brushSize} onChange={setBrushSize} />
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Edit Prompt</label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe the edit..."
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Edit Strength</label>
              <span className="text-xs font-medium text-foreground">{strength}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={strength}
              onChange={(e) => setStrength(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <CustomSelect label="Output Format" options={outputFormatOptions} value={outputFormat} onChange={setOutputFormat} />

          <button
            onClick={handleGenerate}
            disabled={!hasImage || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Apply Edit
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
            <p className="text-sm font-medium text-foreground">AI Editor</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload an image to start editing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

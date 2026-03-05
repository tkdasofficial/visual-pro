import { useState, useRef } from "react";
import { PenTool, Sparkles, Upload, X } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const editModeOptions = [
  { value: "inpaint", label: "Inpainting" }, { value: "outpaint", label: "Outpainting" },
  { value: "remove", label: "Object Removal" }, { value: "replace-bg", label: "Background Replace" },
  { value: "upscale", label: "AI Upscale" },
];

const aspectRatios = ["1:1", "16:9", "9:16", "4:5", "4:3"];

export default function EditorPage() {
  const [editMode, setEditMode] = useState("inpaint");
  const [editPrompt, setEditPrompt] = useState("");
  const [strength, setStrength] = useState(75);
  const [ratio, setRatio] = useState("1:1");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { generating, generatedImage, generatedFileName, generate, downloadImage, clearImage } = useGenerate();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    const prompt = [
      `${editMode} edit`,
      editPrompt && editPrompt,
      `Edit strength: ${strength}%`,
    ].filter(Boolean).join(". ");
    await generate({ prompt, page: "editor", imageUrl: uploadedImage, aspectRatio: ratio });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"><PenTool className="h-3.5 w-3.5" /> Source Image</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            {uploadedImage ? (
              <div className="relative">
                <img src={uploadedImage} alt="Upload" className="w-full rounded-lg border border-border object-cover" style={{ maxHeight: 160 }} />
                <button onClick={() => setUploadedImage(null)} className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-sm text-muted-foreground hover:border-accent hover:text-foreground">
                <Upload className="h-4 w-4" /> Click to Upload
              </button>
            )}
          </div>
          <CustomSelect label="Edit Mode" options={editModeOptions} value={editMode} onChange={setEditMode} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Edit Prompt</label>
            <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Describe the edit..." />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Edit Strength</label>
              <span className="text-xs font-medium text-foreground">{strength}%</span>
            </div>
            <input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(parseInt(e.target.value))} className="w-full accent-accent" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Aspect Ratio</label>
            <div className="flex flex-wrap gap-1.5">
              {aspectRatios.map((r) => (
                <button key={r} onClick={() => setRatio(r)} className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${ratio === r ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"}`}>{r}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={!uploadedImage || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {generating ? (<><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Processing...</>) : (<><Sparkles className="h-3.5 w-3.5" /> Apply Edit</>)}
          </button>
        </div>
      </div>
      <ImageCanvas imageUrl={generatedImage} fileName={generatedFileName} generating={generating}
        onDownload={() => generatedImage && generatedFileName && downloadImage(generatedImage, generatedFileName)} onClear={clearImage} emptyLabel="Upload an image to start editing." />
    </div>
  );
}

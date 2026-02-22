import { useState, useRef } from "react";
import { Layers, Sparkles, Upload, X } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const styleOptions = [
  { value: "oil-painting", label: "Oil Painting" }, { value: "watercolor", label: "Watercolor" },
  { value: "pencil-sketch", label: "Pencil Sketch" }, { value: "pop-art", label: "Pop Art" },
  { value: "impressionist", label: "Impressionist" }, { value: "cyberpunk", label: "Cyberpunk" },
  { value: "retro", label: "Retro Film" }, { value: "noir", label: "Film Noir" },
];
const intensityOptions = [
  { value: "subtle", label: "Subtle" }, { value: "moderate", label: "Moderate" },
  { value: "strong", label: "Strong" }, { value: "maximum", label: "Maximum" },
];

export default function StyleTransferPage() {
  const [style, setStyle] = useState("");
  const [intensity, setIntensity] = useState("moderate");
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
    if (!uploadedImage || !style) return;
    await generate({
      prompt: `Apply ${style} art style with ${intensity} intensity to this image. Preserve the original composition and subjects.`,
      page: "style-transfer", imageUrl: uploadedImage, style, aspectRatio: "1:1",
    });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"><Layers className="h-3.5 w-3.5" /> Source Image</label>
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
          <CustomSelect label="Art Style" options={styleOptions} value={style} onChange={setStyle} placeholder="Select style" />
          <CustomSelect label="Intensity" options={intensityOptions} value={intensity} onChange={setIntensity} />
          <button onClick={handleGenerate} disabled={!uploadedImage || !style || generating}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            {generating ? (<><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Transferring...</>) : (<><Sparkles className="h-3.5 w-3.5" /> Apply Style</>)}
          </button>
        </div>
      </div>
      <ImageCanvas imageUrl={generatedImage} fileName={generatedFileName} generating={generating}
        onDownload={() => generatedImage && generatedFileName && downloadImage(generatedImage, generatedFileName)} onClear={clearImage} emptyLabel="Upload an image and select an art style to apply." />
    </div>
  );
}

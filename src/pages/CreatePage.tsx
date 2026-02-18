import { useState } from "react";
import {
  Wand2,
  Settings2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";

const stylePresets = [
  "Cinematic", "Realistic", "Anime", "3D Render", "Illustration",
  "Fantasy", "Abstract", "Minimal", "Photography", "Concept Art",
];

const aspectRatios = ["1:1", "16:9", "9:16", "4:5", "Custom"];
const resolutions = ["HD", "2K", "4K"];

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedResolution, setSelectedResolution] = useState("HD");
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [creativity, setCreativity] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { generating, generatedImage, generatedFileName, generate, downloadImage, clearImage } = useGenerate();

  const handleGenerate = async () => {
    await generate({
      prompt,
      negativePrompt,
      page: "create",
      style: selectedStyle,
      aspectRatio: selectedRatio,
      model: "google/gemini-2.5-flash-image",
    });
  };

  const handleDownload = () => {
    if (generatedImage && generatedFileName) {
      downloadImage(generatedImage, generatedFileName);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Controls Panel */}
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Prompt */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Wand2 className="h-3.5 w-3.5" />
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe what you want to generate..."
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Negative Prompt
            </label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="What to avoid..."
            />
          </div>

          {/* Style Presets */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {stylePresets.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                    selectedStyle === style
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Aspect Ratio</label>
            <div className="flex gap-1.5">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setSelectedRatio(ratio)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors duration-150 ${
                    selectedRatio === ratio
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Resolution</label>
            <CustomSelect
              label="Resolution"
              value={selectedResolution}
              options={resolutions}
              onChange={setSelectedResolution}
            />
          </div>

          {/* Advanced Controls */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Advanced Controls
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Guidance Scale</label>
                  <span className="text-xs font-medium text-foreground">{guidanceScale}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Creativity</label>
                  <span className="text-xs font-medium text-foreground">{creativity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={creativity}
                  onChange={(e) => setCreativity(parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Seed</label>
                <input
                  type="number"
                  placeholder="Random"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
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
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <ImageCanvas
        imageUrl={generatedImage}
        fileName={generatedFileName}
        generating={generating}
        onDownload={handleDownload}
        onClear={clearImage}
      />
    </div>
  );
}

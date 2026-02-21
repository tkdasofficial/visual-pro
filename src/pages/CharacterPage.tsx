import { useState, useEffect } from "react";
import {
  Users, Sparkles, Image, Plus, Pencil, Trash2, Eye, ArrowLeft,
  ChevronDown, Upload, X, ToggleLeft, ToggleRight,
} from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import ImageCanvas from "@/components/ImageCanvas";
import { useGenerate } from "@/hooks/useGenerate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CharacterProfile {
  id: string;
  name: string;
  gender: string;
  age_range: string;
  ethnicity: string;
  hair_style: string;
  hair_color: string;
  skin_tone: string;
  body_type: string;
  distinct_features: string;
  personality: string;
  fashion_style: string;
  content_niche: string;
  default_expression: string;
  style_preset: string;
  face_image_url: string | null;
  auto_inject: boolean;
  created_at: string;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-Binary" },
  { value: "other", label: "Other" },
];

const ageOptions = [
  { value: "child", label: "Child (5-12)" },
  { value: "teen", label: "Teen (13-19)" },
  { value: "young-adult", label: "Young Adult (20-30)" },
  { value: "adult", label: "Adult (30-50)" },
  { value: "mature", label: "Mature (50+)" },
];

const bodyOptions = [
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "curvy", label: "Curvy" },
  { value: "muscular", label: "Muscular" },
];

const stylePresets = [
  { value: "realistic", label: "Realistic" },
  { value: "anime", label: "Anime" },
  { value: "3d", label: "3D Render" },
  { value: "illustration", label: "Illustration" },
  { value: "comic", label: "Comic" },
  { value: "cinematic", label: "Cinematic" },
];

const expressionOptions = [
  { value: "neutral", label: "Neutral" },
  { value: "happy", label: "Happy" },
  { value: "confident", label: "Confident" },
  { value: "serious", label: "Serious" },
  { value: "mysterious", label: "Mysterious" },
];

const nicheOptions = [
  { value: "fashion", label: "Fashion" },
  { value: "fitness", label: "Fitness" },
  { value: "travel", label: "Travel" },
  { value: "tech", label: "Technology" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "gaming", label: "Gaming" },
  { value: "beauty", label: "Beauty" },
  { value: "other", label: "Other" },
];

type PageView = "list" | "create" | "edit" | "generate";

export default function CharacterPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { generating, generatedImage, generatedFileName, generate, downloadImage, clearImage } = useGenerate();

  const [view, setView] = useState<PageView>("list");
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [editingChar, setEditingChar] = useState<CharacterProfile | null>(null);
  const [selectedChar, setSelectedChar] = useState<CharacterProfile | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formEthnicity, setFormEthnicity] = useState("");
  const [formHairStyle, setFormHairStyle] = useState("");
  const [formHairColor, setFormHairColor] = useState("");
  const [formSkinTone, setFormSkinTone] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formFeatures, setFormFeatures] = useState("");
  const [formPersonality, setFormPersonality] = useState("");
  const [formFashion, setFormFashion] = useState("");
  const [formNiche, setFormNiche] = useState("");
  const [formExpression, setFormExpression] = useState("neutral");
  const [formStyle, setFormStyle] = useState("realistic");
  const [formAutoInject, setFormAutoInject] = useState(true);
  const [formFaceUrl, setFormFaceUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Face generation
  const [facePrompt, setFacePrompt] = useState("");
  const [faceNegPrompt, setFaceNegPrompt] = useState("");
  const [generatingFace, setGeneratingFace] = useState(false);

  // Generation with character
  const [genPrompt, setGenPrompt] = useState("");
  const [genNegPrompt, setGenNegPrompt] = useState("");

  const maxChars = profile?.plan === "free" ? 5 : Infinity;

  const loadCharacters = async () => {
    if (!user) return;
    setLoadingChars(true);
    const { data } = await supabase
      .from("generation_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("page", "character_profile")
      .order("created_at", { ascending: false });

    if (data) {
      setCharacters(data.map((d: any) => ({
        id: d.id,
        name: d.metadata?.name || "Untitled",
        gender: d.metadata?.gender || "",
        age_range: d.metadata?.age_range || "",
        ethnicity: d.metadata?.ethnicity || "",
        hair_style: d.metadata?.hair_style || "",
        hair_color: d.metadata?.hair_color || "",
        skin_tone: d.metadata?.skin_tone || "",
        body_type: d.metadata?.body_type || "",
        distinct_features: d.metadata?.distinct_features || "",
        personality: d.metadata?.personality || "",
        fashion_style: d.metadata?.fashion_style || "",
        content_niche: d.metadata?.content_niche || "",
        default_expression: d.metadata?.default_expression || "neutral",
        style_preset: d.metadata?.style_preset || "realistic",
        face_image_url: d.image_url,
        auto_inject: d.metadata?.auto_inject ?? true,
        created_at: d.created_at,
      })));
    }
    setLoadingChars(false);
  };

  useEffect(() => { loadCharacters(); }, [user]);

  const resetForm = () => {
    setFormName(""); setFormGender(""); setFormAge(""); setFormEthnicity("");
    setFormHairStyle(""); setFormHairColor(""); setFormSkinTone(""); setFormBody("");
    setFormFeatures(""); setFormPersonality(""); setFormFashion(""); setFormNiche("");
    setFormExpression("neutral"); setFormStyle("realistic"); setFormAutoInject(true);
    setFormFaceUrl(null); setEditingChar(null);
  };

  const populateForm = (c: CharacterProfile) => {
    setFormName(c.name); setFormGender(c.gender); setFormAge(c.age_range);
    setFormEthnicity(c.ethnicity); setFormHairStyle(c.hair_style); setFormHairColor(c.hair_color);
    setFormSkinTone(c.skin_tone); setFormBody(c.body_type); setFormFeatures(c.distinct_features);
    setFormPersonality(c.personality); setFormFashion(c.fashion_style); setFormNiche(c.content_niche);
    setFormExpression(c.default_expression); setFormStyle(c.style_preset);
    setFormAutoInject(c.auto_inject); setFormFaceUrl(c.face_image_url);
    setEditingChar(c);
  };

  const handleSave = async () => {
    if (!user || !formName.trim() || !formGender || !formAge) {
      toast({ title: "Required fields", description: "Name, gender, and age are required.", variant: "destructive" });
      return;
    }
    if (!editingChar && characters.length >= maxChars) {
      toast({ title: "Character limit reached", description: "Upgrade your plan for unlimited characters.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const metadata = {
      name: formName.trim(),
      gender: formGender,
      age_range: formAge,
      ethnicity: formEthnicity,
      hair_style: formHairStyle,
      hair_color: formHairColor,
      skin_tone: formSkinTone,
      body_type: formBody,
      distinct_features: formFeatures,
      personality: formPersonality,
      fashion_style: formFashion,
      content_niche: formNiche,
      default_expression: formExpression,
      style_preset: formStyle,
      auto_inject: formAutoInject,
    };

    if (editingChar) {
      await supabase.from("generation_logs")
        .update({ metadata, image_url: formFaceUrl, prompt: `Character: ${formName.trim()}` })
        .eq("id", editingChar.id);
      toast({ title: "Character updated" });
    } else {
      await supabase.from("generation_logs").insert({
        user_id: user.id,
        page: "character_profile",
        prompt: `Character: ${formName.trim()}`,
        status: "completed",
        credits_used: 0,
        metadata,
        image_url: formFaceUrl,
      });
      toast({ title: "Character created" });
    }

    resetForm();
    setView("list");
    await loadCharacters();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("generation_logs").delete().eq("id", id);
    toast({ title: "Character deleted" });
    loadCharacters();
  };

  const handleGenerateFace = async () => {
    if (!facePrompt.trim()) return;
    setGeneratingFace(true);
    const result = await generate({
      prompt: `Portrait face photo, 1:1 aspect ratio, head and shoulders, ${facePrompt}`,
      negativePrompt: faceNegPrompt,
      page: "character",
      style: formStyle,
      aspectRatio: "1:1",
    });
    if (result?.imageUrl) {
      setFormFaceUrl(result.imageUrl);
    }
    setGeneratingFace(false);
  };

  const handleGenerateWithCharacter = async () => {
    if (!selectedChar || !genPrompt.trim()) return;
    const charDNA = [
      `Character: ${selectedChar.name}`,
      selectedChar.gender && `Gender: ${selectedChar.gender}`,
      selectedChar.age_range && `Age: ${selectedChar.age_range}`,
      selectedChar.ethnicity && `Ethnicity: ${selectedChar.ethnicity}`,
      selectedChar.hair_style && `Hair: ${selectedChar.hair_style} ${selectedChar.hair_color}`,
      selectedChar.skin_tone && `Skin: ${selectedChar.skin_tone}`,
      selectedChar.body_type && `Build: ${selectedChar.body_type}`,
      selectedChar.distinct_features && `Features: ${selectedChar.distinct_features}`,
      selectedChar.default_expression && `Expression: ${selectedChar.default_expression}`,
      selectedChar.fashion_style && `Style: ${selectedChar.fashion_style}`,
    ].filter(Boolean).join(". ");

    await generate({
      prompt: `${charDNA}. ${genPrompt}`,
      negativePrompt: genNegPrompt,
      page: "character",
      style: selectedChar.style_preset,
      aspectRatio: "1:1",
    });
  };

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-foreground">Character Engine</h1>
              <p className="text-xs text-muted-foreground">
                {characters.length}{maxChars < Infinity ? `/${maxChars}` : ""} characters
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setView("create"); }}
              disabled={characters.length >= maxChars}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> New Character
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loadingChars ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            </div>
          ) : characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No characters yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Create your first AI character to get started</p>
              <button
                onClick={() => { resetForm(); setView("create"); }}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Create Character
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {characters.map((c) => (
                <div key={c.id} className="group overflow-hidden rounded-xl border border-border bg-card">
                  {/* Face */}
                  <div className="relative aspect-square w-full overflow-hidden bg-muted">
                    {c.face_image_url ? (
                      <img src={c.face_image_url} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Users className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Overlay actions */}
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex w-full gap-1 p-3">
                        <button
                          onClick={() => { setSelectedChar(c); setView("generate"); }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-[10px] font-medium text-primary-foreground"
                        >
                          <Sparkles className="h-3 w-3" /> Generate
                        </button>
                        <button
                          onClick={() => { populateForm(c); setView("edit"); }}
                          className="rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-white/30"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm hover:bg-red-500/50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {[c.gender, c.age_range, c.style_preset].filter(Boolean).map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      {c.auto_inject ? <ToggleRight className="h-3 w-3 text-accent" /> : <ToggleLeft className="h-3 w-3" />}
                      Auto-inject {c.auto_inject ? "on" : "off"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── CREATE / EDIT VIEW ──
  if (view === "create" || view === "edit") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <button onClick={() => { resetForm(); setView("list"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Characters
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-base font-semibold text-foreground">
              {view === "edit" ? "Edit Character" : "Create Character"}
            </h2>

            {/* Face Image */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Face Image</h3>
              {formFaceUrl ? (
                <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-xl border border-border">
                  <img src={formFaceUrl} alt="Face" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setFormFaceUrl(null)}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={facePrompt}
                      onChange={(e) => setFacePrompt(e.target.value)}
                      placeholder="Describe the face to generate (1:1 portrait)..."
                      className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    value={faceNegPrompt}
                    onChange={(e) => setFaceNegPrompt(e.target.value)}
                    placeholder="Negative prompt (optional)..."
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                  />
                  <button
                    onClick={handleGenerateFace}
                    disabled={!facePrompt.trim() || generatingFace}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
                  >
                    {generatingFace ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {generatingFace ? "Generating…" : "Generate Face"}
                  </button>
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Identity</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name *</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="Character name"
                  />
                </div>
                <CustomSelect label="Gender *" options={genderOptions} value={formGender} onChange={setFormGender} placeholder="Select gender" />
                <CustomSelect label="Age Range *" options={ageOptions} value={formAge} onChange={setFormAge} placeholder="Select age" />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ethnicity</label>
                  <input
                    value={formEthnicity}
                    onChange={(e) => setFormEthnicity(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="e.g. East Asian, Caucasian..."
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Appearance</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Hair Style</label>
                  <input value={formHairStyle} onChange={(e) => setFormHairStyle(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="e.g. Long wavy, short buzz..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Hair Color</label>
                  <input value={formHairColor} onChange={(e) => setFormHairColor(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="e.g. Black, Blonde..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Skin Tone</label>
                  <input value={formSkinTone} onChange={(e) => setFormSkinTone(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="e.g. Fair, Olive, Dark..."
                  />
                </div>
                <CustomSelect label="Body Type" options={bodyOptions} value={formBody} onChange={setFormBody} placeholder="Select body type" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Distinct Features</label>
                <input value={formFeatures} onChange={(e) => setFormFeatures(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                  placeholder="Tattoos, scars, glasses, accessories..."
                />
              </div>
            </div>

            {/* Personality & Style DNA */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Personality & Style DNA</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Personality Traits</label>
                  <input value={formPersonality} onChange={(e) => setFormPersonality(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="Confident, playful, luxury..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fashion Style</label>
                  <input value={formFashion} onChange={(e) => setFormFashion(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                    placeholder="Streetwear, formal, boho..."
                  />
                </div>
                <CustomSelect label="Default Expression" options={expressionOptions} value={formExpression} onChange={setFormExpression} placeholder="Select expression" />
                <CustomSelect label="Content Niche" options={nicheOptions} value={formNiche} onChange={setFormNiche} placeholder="Select niche" />
              </div>
            </div>

            {/* Visual Style */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Visual Style</h3>
              <CustomSelect label="Style Preset" options={stylePresets} value={formStyle} onChange={setFormStyle} placeholder="Select style" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto Character Injection</p>
                  <p className="text-xs text-muted-foreground">Automatically apply DNA when name appears in prompts</p>
                </div>
                <button
                  onClick={() => setFormAutoInject(!formAutoInject)}
                  className={`relative h-5 w-9 rounded-full transition-colors duration-150 ${formAutoInject ? "bg-accent" : "bg-input"}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform duration-150 ${formAutoInject ? "translate-x-4" : ""}`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { resetForm(); setView("list"); }}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim() || !formGender || !formAge}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                {saving ? "Saving…" : (view === "edit" ? "Update Character" : "Create Character")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GENERATE VIEW ──
  if (view === "generate" && selectedChar) {
    return (
      <div className="flex h-full flex-col lg:flex-row">
        {/* Controls */}
        <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r overflow-y-auto">
          <div className="p-4 space-y-4">
            <button onClick={() => { setSelectedChar(null); clearImage(); setView("list"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Character info */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              {selectedChar.face_image_url ? (
                <img src={selectedChar.face_image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{selectedChar.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{selectedChar.style_preset} • {selectedChar.content_niche || "General"}</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Prompt</label>
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder={`Describe the scene for ${selectedChar.name}...`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Negative Prompt</label>
              <textarea
                value={genNegPrompt}
                onChange={(e) => setGenNegPrompt(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="What to avoid..."
              />
            </div>

            <button
              onClick={handleGenerateWithCharacter}
              disabled={!genPrompt.trim() || generating}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {generating ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate with {selectedChar.name}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <ImageCanvas
          imageUrl={generatedImage}
          fileName={generatedFileName}
          generating={generating}
          onDownload={() => generatedImage && generatedFileName && downloadImage(generatedImage, generatedFileName)}
          onClear={clearImage}
          emptyLabel={`Configure your prompt and generate an image using ${selectedChar.name}'s identity DNA.`}
        />
      </div>
    );
  }

  return null;
}

import { useState } from "react";
import { Users, Sparkles, Image } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-Binary" },
  { value: "other", label: "Other" },
];

const ageOptions = [
  { value: "child", label: "Child" },
  { value: "teen", label: "Teen" },
  { value: "young-adult", label: "Young Adult" },
  { value: "adult", label: "Adult" },
  { value: "elderly", label: "Elderly" },
];

const emotionOptions = [
  { value: "neutral", label: "Neutral" },
  { value: "happy", label: "Happy" },
  { value: "sad", label: "Sad" },
  { value: "angry", label: "Angry" },
  { value: "surprised", label: "Surprised" },
  { value: "confident", label: "Confident" },
];

const poseOptions = [
  { value: "standing", label: "Standing" },
  { value: "sitting", label: "Sitting" },
  { value: "walking", label: "Walking" },
  { value: "action", label: "Action Pose" },
  { value: "portrait", label: "Portrait" },
];

const styleOptions = [
  { value: "realistic", label: "Realistic" },
  { value: "anime", label: "Anime" },
  { value: "3d", label: "3D Render" },
  { value: "illustration", label: "Illustration" },
  { value: "comic", label: "Comic" },
];

export default function CharacterPage() {
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [emotion, setEmotion] = useState("");
  const [pose, setPose] = useState("");
  const [style, setStyle] = useState("realistic");
  const [identityLock, setIdentityLock] = useState(false);
  const [generating, setGenerating] = useState(false);

  const canGenerate = description.trim() && gender && age;

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
              <Users className="h-3.5 w-3.5" />
              Character Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Describe your character..."
            />
          </div>

          <CustomSelect label="Gender" options={genderOptions} value={gender} onChange={setGender} placeholder="Select gender" />
          <CustomSelect label="Age Group" options={ageOptions} value={age} onChange={setAge} placeholder="Select age" />
          <CustomSelect label="Emotion" options={emotionOptions} value={emotion} onChange={setEmotion} placeholder="Select emotion" />
          <CustomSelect label="Pose" options={poseOptions} value={pose} onChange={setPose} placeholder="Select pose" />
          <CustomSelect label="Style" options={styleOptions} value={style} onChange={setStyle} placeholder="Select style" />

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Face Identity Lock</label>
            <button
              onClick={() => setIdentityLock(!identityLock)}
              className={`relative h-5 w-9 rounded-full transition-colors duration-150 ${
                identityLock ? "bg-accent" : "bg-input"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform duration-150 ${
                  identityLock ? "translate-x-4" : ""
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
                Generate Character
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
            <p className="text-sm font-medium text-foreground">Character Engine</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Configure your character and click Generate to create.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface FeaturePlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export default function FeaturePlaceholder({ title, description, icon: Icon = Construction }: FeaturePlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

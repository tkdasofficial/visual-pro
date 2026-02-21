import { Download, RefreshCw, Image } from "lucide-react";

interface ImageCanvasProps {
  imageUrl: string | null;
  fileName: string | null;
  generating: boolean;
  onDownload: () => void;
  onClear: () => void;
  emptyLabel?: string;
}

export default function ImageCanvas({
  imageUrl,
  fileName,
  generating,
  onDownload,
  onClear,
  emptyLabel = "Enter a prompt and click Generate to create your image.",
}: ImageCanvasProps) {
  if (generating) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Creating your image…</p>
            <p className="mt-1 text-xs text-muted-foreground">AI is generating your visual</p>
          </div>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <div className="relative max-h-full max-w-full overflow-hidden rounded-xl border border-border shadow-sm">
          <img
            src={imageUrl}
            alt="Generated"
            className="max-h-[calc(100vh-16rem)] max-w-full object-contain"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors duration-150 hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New Generation
          </button>
        </div>
        {fileName && (
          <p className="text-[10px] text-muted-foreground">{fileName}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Image className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Ready to Generate</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">{emptyLabel}</p>
        </div>
      </div>
    </div>
  );
}

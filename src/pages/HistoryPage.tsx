import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Download, Share2, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HistoryItem {
  id: string;
  prompt: string;
  status: string;
  created_at: string;
  image_url: string | null;
  page: string;
  credits_used: number;
  metadata: any;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const loadHistory = async (pageNum: number) => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("generation_logs")
      .select("id, prompt, status, created_at, image_url, page, credits_used, metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
    if (data) {
      setItems((prev) => (pageNum === 0 ? data : [...prev, ...data]));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory(0);
  }, [user]);

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `visual-pro-${id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (url: string) => {
    if (navigator.share) {
      await navigator.share({ title: "Visual Pro Generation", url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Generation History</h1>
        <p className="text-sm text-muted-foreground">View your past creations</p>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No generations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Start creating to see your history here</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => item.image_url && setSelectedItem(item)}
                className="group relative overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-accent/30"
              >
                {item.image_url ? (
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                  <p className="line-clamp-2 text-xs text-white">{item.prompt}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                      item.status === "completed" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-white/60 capitalize">{item.page}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {items.length % PAGE_SIZE === 0 && (
            <div className="text-center">
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  loadHistory(next);
                }}
                className="rounded-lg border border-border px-6 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* Fullscreen Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] max-w-3xl w-full overflow-auto rounded-xl bg-background border border-border">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <p className="truncate text-sm font-medium text-foreground">{selectedItem.prompt}</p>
              <button onClick={() => setSelectedItem(null)} className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedItem.image_url && (
              <img src={selectedItem.image_url} alt="" className="w-full" />
            )}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <div className="text-xs text-muted-foreground">
                <span className="capitalize">{selectedItem.page}</span>
                <span className="mx-2">•</span>
                {new Date(selectedItem.created_at).toLocaleString()}
              </div>
              <div className="flex gap-2">
                {selectedItem.image_url && (
                  <>
                    <button
                      onClick={() => handleShare(selectedItem.image_url!)}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="h-3 w-3" /> Share
                    </button>
                    <button
                      onClick={() => handleDownload(selectedItem.image_url!, selectedItem.id)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      <Download className="h-3 w-3" /> Download
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

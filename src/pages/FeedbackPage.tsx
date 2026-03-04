import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FeedbackItem {
  id: string;
  message: string;
  category: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

const categories = ["general", "bug", "feature", "ui", "performance"];

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("general");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("feedback")
      .select("id, message, category, status, admin_response, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setHistory(data as FeedbackItem[]);
    setLoading(false);
  };

  useEffect(() => { loadHistory(); }, [user]);

  const handleSubmit = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      message: text.trim(),
      category,
    });
    if (error) {
      toast({ title: "Error", description: "Failed to send feedback.", variant: "destructive" });
    } else {
      toast({ title: "Thank you for your feedback!" });
      setText("");
      loadHistory();
    }
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-lg p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Feedback</h1>
        <p className="text-sm text-muted-foreground">Help us improve Visual Pro</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MessageSquare className="h-4 w-4" /> Share Your Thoughts
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder="What would you like to see improved? Any features you'd love?"
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button onClick={handleSubmit} disabled={!text.trim() || sending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {sending ? "Sending…" : <><Send className="h-3.5 w-3.5" /> Send Feedback</>}
        </button>
      </div>

      {/* Past Feedback */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Your Feedback History</h3>
          {history.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${item.status === "replied" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>{item.status}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{item.category}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-foreground">{item.message}</p>
              {item.admin_response && (
                <div className="rounded-lg bg-accent/5 border border-accent/20 p-2">
                  <p className="text-[10px] font-medium text-accent">Admin Response:</p>
                  <p className="text-xs text-foreground mt-0.5">{item.admin_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

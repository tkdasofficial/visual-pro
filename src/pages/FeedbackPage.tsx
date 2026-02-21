import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "user_feedback",
      details: { message: text.trim() },
    });
    toast({ title: "Thank you for your feedback!" });
    setText("");
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
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="What would you like to see improved? Any features you'd love?"
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || sending}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send Feedback"}
        </button>
      </div>
    </div>
  );
}

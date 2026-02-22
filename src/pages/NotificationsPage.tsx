import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Mark all as read on mount
  useEffect(() => {
    if (!user || items.length === 0) return;
    const unread = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length > 0) {
      supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unread)
        .then(() => {
          setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        });
    }
  }, [items.length, user]);

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "Notification deleted" });
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "warning": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "error": return "bg-destructive/10 text-destructive";
      default: return "bg-accent/10 text-accent";
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay updated with your account activity</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No notifications</p>
          <p className="mt-1 text-xs text-muted-foreground">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                n.is_read ? "border-border bg-card" : "border-accent/20 bg-accent/5"
              }`}
            >
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${typeColor(n.type)}`}>
                <Bell className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

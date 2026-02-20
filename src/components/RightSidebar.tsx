import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  X, User, Mail, Settings, KeyRound, Shield, MessageSquare,
  Gift, Crown, Coins, History, ChevronRight, LogOut, Copy, Check,
  ExternalLink, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
}

type SidebarView = "main" | "settings" | "referral" | "plans" | "history" | "feedback";

export default function RightSidebar({ open, onClose }: RightSidebarProps) {
  const navigate = useNavigate();
  const { user, profile, credits, roles } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<SidebarView>("main");
  const [copied, setCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);

  // Settings state
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (open) setView("main");
  }, [open]);

  useEffect(() => {
    if (profile) setEditName(profile.full_name || "");
  }, [profile]);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("generation_logs")
      .select("id, prompt, status, created_at, image_url, page, credits_used")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setHistoryItems(data || []);
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (view === "history" && user) loadHistory();
  }, [view, user]);

  const handleCopyReferral = () => {
    if (!profile?.referral_code) return;
    const link = `${window.location.origin}/invite/${profile.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    setSavingName(true);
    await supabase.from("profiles").update({ full_name: editName.trim() }).eq("user_id", user.id);
    toast({ title: "Name updated" });
    setSavingName(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate("/login");
  };

  const handleFeedback = async () => {
    if (!feedbackText.trim() || !user) return;
    setFeedbackSending(true);
    // Store feedback as audit log
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "user_feedback",
      details: { message: feedbackText.trim() },
    });
    toast({ title: "Thank you for your feedback!" });
    setFeedbackText("");
    setFeedbackSending(false);
    setView("main");
  };

  const planInfo: Record<string, { name: string; price: string; features: string[] }> = {
    free: { name: "Free", price: "$0", features: ["5 daily credits", "24h image storage", "Basic features"] },
    pro: { name: "Pro", price: "$25/mo", features: ["100 daily credits", "3-day image storage", "All features", "Priority processing"] },
    business: { name: "Business", price: "$50/mo", features: ["200 daily credits", "7-day image storage", "All features", "Priority support", "API access"] },
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[90vw] flex-col border-l border-border bg-background shadow-xl transition-transform duration-200">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <button
            onClick={() => (view === "main" ? onClose() : setView("main"))}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {view !== "main" && <ChevronRight className="h-3.5 w-3.5 rotate-180" />}
            {view === "main" ? "Profile" : "Back"}
          </button>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* ── MAIN VIEW ── */}
          {view === "main" && (
            <div className="space-y-1 p-3">
              {/* User info */}
              <div className="mb-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                    {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                {/* Credits */}
                <div className="mt-3 flex items-center justify-between rounded-md bg-background px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Credits</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{credits?.balance ?? 0}</span>
                </div>
                {/* Plan badge */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Plan</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-accent">
                    <Crown className="h-2.5 w-2.5" />
                    {profile?.plan || "free"}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              {[
                { icon: Settings, label: "Account Settings", view: "settings" as SidebarView },
                { icon: Gift, label: "Referral Program", view: "referral" as SidebarView },
                { icon: Crown, label: "Plans & Upgrade", view: "plans" as SidebarView },
                { icon: History, label: "Generation History", view: "history" as SidebarView },
                { icon: MessageSquare, label: "Feedback", view: "feedback" as SidebarView },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setView(item.view)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ))}

              {/* Links */}
              <div className="mt-2 border-t border-border pt-2 space-y-0.5">
                <Link
                  to="/privacy"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  Terms of Service
                </Link>
              </div>

              {/* Logout */}
              <div className="mt-2 border-t border-border pt-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* ── SETTINGS VIEW ── */}
          {view === "settings" && (
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Account Settings</h3>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full Name</label>
                <div className="flex gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {savingName ? "…" : "Save"}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                <p className="text-sm text-foreground">{user?.email}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
                <button
                  onClick={async () => {
                    if (!user?.email) return;
                    await supabase.auth.resetPasswordForEmail(user.email, {
                      redirectTo: `${window.location.origin}/forgot-password`,
                    });
                    toast({ title: "Password reset email sent" });
                  }}
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <KeyRound className="h-3 w-3" />
                  Reset Password
                </button>
              </div>
            </div>
          )}

          {/* ── REFERRAL VIEW ── */}
          {view === "referral" && (
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Referral Program</h3>
              <p className="text-xs text-muted-foreground">
                Share your referral link and earn <strong className="text-foreground">10 bonus credits</strong> for each friend who signs up.
              </p>

              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your Code</label>
                <p className="font-mono text-lg font-bold text-foreground">{profile?.referral_code || "—"}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Referral Link</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/invite/${profile?.referral_code || ""}`}
                    className="h-8 flex-1 rounded border border-input bg-background px-2 text-xs text-foreground outline-none"
                  />
                  <button
                    onClick={handleCopyReferral}
                    className="flex h-8 items-center gap-1 rounded bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <Gift className="mx-auto mb-2 h-6 w-6 text-accent" />
                <p className="text-xs font-medium text-foreground">Both you and your friend earn 10 credits!</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Credits are awarded after signup</p>
              </div>
            </div>
          )}

          {/* ── PLANS VIEW ── */}
          {view === "plans" && (
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Plans & Upgrade</h3>
              <p className="text-xs text-muted-foreground">Choose the plan that fits your needs.</p>

              {Object.entries(planInfo).map(([key, plan]) => {
                const isCurrent = (profile?.plan || "free") === key;
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-4 ${
                      isCurrent ? "border-accent bg-accent/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{plan.name}</h4>
                        <p className="text-lg font-bold text-foreground">{plan.price}</p>
                      </div>
                      {isCurrent && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                          Current
                        </span>
                      )}
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Star className="h-2.5 w-2.5 text-accent" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <button className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
                        Upgrade to {plan.name}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Enterprise */}
              <div className="rounded-lg border border-dashed border-accent/50 bg-accent/5 p-4 text-center">
                <Crown className="mx-auto mb-2 h-6 w-6 text-accent" />
                <h4 className="text-sm font-semibold text-foreground">Enterprise</h4>
                <p className="mt-1 text-xs text-muted-foreground">Custom credits, storage & support</p>
                <button className="mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:opacity-90">
                  Contact Us
                </button>
              </div>
            </div>
          )}

          {/* ── HISTORY VIEW ── */}
          {view === "history" && (
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Generation History</h3>
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-10 text-center">
                  <History className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No generations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">{item.prompt}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                              item.status === "completed" ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : item.status === "failed" ? "bg-destructive/10 text-destructive"
                              : "bg-accent/10 text-accent"
                            }`}>
                              {item.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground capitalize">{item.page}</span>
                          </div>
                        </div>
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FEEDBACK VIEW ── */}
          {view === "feedback" && (
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Feedback</h3>
              <p className="text-xs text-muted-foreground">We'd love to hear your thoughts on how to improve Visual Pro.</p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={5}
                placeholder="Share your feedback..."
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={handleFeedback}
                disabled={!feedbackText.trim() || feedbackSending}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {feedbackSending ? "Sending…" : "Send Feedback"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2">
          <p className="text-center text-[10px] text-muted-foreground">© 2026 Avzio. All rights reserved.</p>
        </div>
      </aside>
    </>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, BarChart3, FileText, CreditCard, Search, RefreshCw,
  AlertTriangle, ChevronDown, LogOut, Shield, Eye, Check, X,
  Settings, Zap, Image as ImageIcon, Clock, MessageSquare, Bell,
  Download, Copy, Trash2, Mail, Phone, Calendar, TrendingUp,
  UserCheck, UserX, Send, Menu, ShieldCheck,
} from "lucide-react";

type AdminTab = "dashboard" | "users" | "payments" | "generations" | "feedback" | "notifications" | "logs" | "admins";

interface UserRecord {
  user_id: string;
  full_name: string | null;
  email: string;
  whatsapp_number: string | null;
  subscription_plan: string;
  subscription_status: string;
  subscription_expiry: string | null;
  generation_limit: number;
  generation_used: number;
  billing_cycle_start: string | null;
  created_at: string;
  updated_at?: string;
  roles: string[];
}

interface PaymentRecord {
  id: string; user_id: string; full_name: string; email: string;
  whatsapp_number: string; selected_plan: string; payment_method: string;
  transaction_id: string; screenshot_url: string | null; status: string;
  admin_notes: string | null; requested_at: string; processed_at: string | null;
}

interface GenerationRecord {
  id: string; user_id: string; page: string; prompt: string;
  model: string | null; status: string; credits_used: number;
  image_url: string | null; created_at: string;
}

interface AuditRecord {
  id: string; admin_user_id: string; target_user_id: string | null;
  action: string; details: any; created_at: string;
}

interface FeedbackRecord {
  id: string; user_id: string; message: string; category: string;
  status: string; admin_response: string | null; created_at: string;
}

interface DashboardStats {
  totalUsers: number; totalGenerations: number; totalCreditsUsed: number;
  totalCreditsLimit: number; planCounts: Record<string, number>;
  statusCounts: Record<string, number>; pageCounts: Record<string, number>;
  pendingPayments: number;
}

async function callAdmin(action: string, targetUserId?: string, data?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, targetUserId, data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

const OWNER_EMAIL = "avzio@outlook.com";

export default function AdminPage() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserRecord | null>(null);
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({});
  const [feedbackReply, setFeedbackReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [genFilter, setGenFilter] = useState("all");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState<"all" | "specific">("all");
  const [notifUserId, setNotifUserId] = useState("");

  const isOwner = user?.email === OWNER_EMAIL;

  const load = useCallback(async (what: AdminTab) => {
    setFetching(true);
    try {
      switch (what) {
        case "dashboard": { const s = await callAdmin("get_stats"); setStats(s); break; }
        case "users": case "admins": { const r = await callAdmin("get_users"); setUsers(r.users || []); break; }
        case "payments": { const r = await callAdmin("get_payments"); setPayments(r.payments || []); break; }
        case "generations": { const r = await callAdmin("get_generations", undefined, { limit: 500 }); setGenerations(r.generations || []); break; }
        case "feedback": { const r = await callAdmin("get_feedback"); setFeedbacks(r.feedback || []); break; }
        case "logs": { const r = await callAdmin("get_audit_logs"); setAuditLogs(r.logs || []); break; }
        case "notifications": break;
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) { load("dashboard"); load("users"); load("payments"); }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAdmin && (tab === "generations" || tab === "logs" || tab === "feedback" || tab === "admins")) load(tab);
  }, [tab, authLoading, isAdmin]);

  const act = async (key: string, fn: () => Promise<any>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: msg });
      load("users"); load("dashboard");
      if (tab === "payments") load("payments");
      if (tab === "feedback") load("feedback");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setBusy("notif");
    try {
      await callAdmin("send_notification", undefined, { title: notifTitle.trim(), message: notifMessage.trim(), target: notifTarget, userId: notifTarget === "specific" ? notifUserId.trim() : undefined });
      toast({ title: "Notification sent" });
      setNotifTitle(""); setNotifMessage("");
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const handleReplyFeedback = async (feedbackId: string) => {
    const reply = feedbackReply[feedbackId]?.trim();
    if (!reply) return;
    await act("fb_" + feedbackId, () => callAdmin("reply_feedback", undefined, { feedbackId, reply }), "Reply sent");
    setFeedbackReply((prev) => ({ ...prev, [feedbackId]: "" }));
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied" }); };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `${filename}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-foreground">Access Denied</p>
        <p className="text-xs text-muted-foreground">Admin privileges required.</p>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users, badge: users.length },
    { id: "payments", label: "Payments", icon: CreditCard, badge: payments.filter((p) => p.status === "pending").length },
    { id: "generations", label: "Generations", icon: ImageIcon },
    { id: "feedback", label: "Feedback", icon: MessageSquare, badge: feedbacks.filter((f) => f.status === "new").length },
    { id: "notifications", label: "Broadcast", icon: Bell },
    { id: "logs", label: "Audit Logs", icon: FileText },
    ...(isOwner ? [{ id: "admins" as AdminTab, label: "Manage Admins", icon: ShieldCheck }] : []),
  ];

  const filtered = users.filter(
    (u) => (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPayments = paymentFilter === "all" ? payments : payments.filter((p) => p.status === paymentFilter);
  const filteredGens = genFilter === "all" ? generations : generations.filter((g) => g.status === genFilter);
  const adminUsers = users.filter((u) => u.roles.includes("admin"));
  const nonAdminUsers = users.filter((u) => !u.roles.includes("admin"));

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── LEFT SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-background transition-transform duration-150 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo/Header */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Shield className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">Admin Panel</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <t.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{t.label}</span>
                {!!t.badge && t.badge > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{t.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="border-t border-border p-3 space-y-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          <p className="px-1 text-[10px] text-muted-foreground">© 2026 Visual Pro Admin</p>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-4">
          <button onClick={() => setSidebarOpen(true)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-foreground capitalize">{tabs.find((t) => t.id === tab)?.label || tab}</h2>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => load(tab)} disabled={fetching} className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground hover:text-foreground">
              <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ─── DASHBOARD ─── */}
          {tab === "dashboard" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
                  { label: "Generations", value: stats.totalGenerations, icon: ImageIcon, color: "text-accent" },
                  { label: "Credits Used", value: stats.totalCreditsUsed, icon: Zap, color: "text-primary" },
                  { label: "Pending Payments", value: stats.pendingPayments, icon: Clock, color: "text-destructive" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${color}`} /><p className="text-xs text-muted-foreground">{label}</p></div>
                    <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-4 text-sm font-medium text-foreground">Plan Distribution</h3>
                  <div className="space-y-3">
                    {["explorer", "starter", "pro"].map((plan) => {
                      const count = stats.planCounts[plan] || 0;
                      const pct = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
                      return (
                        <div key={plan}>
                          <div className="mb-1 flex justify-between text-xs"><span className="capitalize text-muted-foreground">{plan}</span><span className="font-medium text-foreground">{count} ({pct}%)</span></div>
                          <div className="h-2 w-full rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-4 text-sm font-medium text-foreground">Generation Status</h3>
                  <div className="space-y-3">
                    {["completed", "pending", "failed"].map((status) => {
                      const count = stats.statusCounts[status] || 0;
                      const pct = stats.totalGenerations ? Math.round((count / stats.totalGenerations) * 100) : 0;
                      const color = status === "completed" ? "bg-green-500" : status === "failed" ? "bg-destructive" : "bg-accent";
                      return (
                        <div key={status}>
                          <div className="mb-1 flex justify-between text-xs"><span className="capitalize text-muted-foreground">{status}</span><span className="font-medium text-foreground">{count} ({pct}%)</span></div>
                          <div className="h-2 w-full rounded-full bg-muted"><div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-foreground">Generations by Page</h3>
                    <button onClick={() => exportCSV(Object.entries(stats.pageCounts).map(([p, c]) => ({ page: p, count: c })), "page-stats")} className="text-[10px] text-muted-foreground hover:text-foreground"><Download className="inline h-3 w-3 mr-1" />Export</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {Object.entries(stats.pageCounts).sort((a, b) => b[1] - a[1]).map(([page, count]) => (
                      <div key={page} className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-lg font-bold text-foreground">{count}</p>
                        <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{page.replace(/-/g, " ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── USERS ─── */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or ID…"
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <button onClick={() => exportCSV(filtered, "users-export")} className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /> Export</button>
                <button onClick={() => act("bulk_reset", () => callAdmin("bulk_reset_credits"), "All credits reset")} disabled={!!busy} className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:text-foreground"><Zap className="h-3.5 w-3.5" /> Reset All</button>
              </div>
              <p className="text-xs text-muted-foreground">{filtered.length} users found</p>
              <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-muted/50">
                    {["User", "Email", "Phone", "Plan", "Credits", "Status", "Joined", "Actions"].map((h) => <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3"><button onClick={() => setSelectedUserDetail(u)} className="text-left hover:underline"><p className="font-medium text-foreground">{u.full_name || "Anonymous"}</p><p className="text-[10px] text-muted-foreground font-mono">{u.user_id.slice(0, 8)}…</p></button></td>
                        <td className="px-3 py-3 text-muted-foreground"><span className="cursor-pointer hover:text-foreground" onClick={() => copyToClipboard(u.email)}>{u.email}</span></td>
                        <td className="px-3 py-3 text-muted-foreground">{u.whatsapp_number || "—"}</td>
                        <td className="px-3 py-3">
                          <select value={u.subscription_plan} onChange={(e) => act(u.user_id + "_plan", () => callAdmin("update_user", u.user_id, { subscription_plan: e.target.value }), "Plan updated")} disabled={busy?.startsWith(u.user_id)} className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary">
                            {["explorer", "starter", "pro"].map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-3"><span className="font-medium text-foreground">{u.generation_used}</span><span className="text-muted-foreground">/{u.generation_limit}</span></td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${u.subscription_status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>{u.subscription_status}</span>
                          {u.roles.includes("admin") && <span className="ml-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">admin</span>}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap text-[10px]">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedUserDetail(u)} className="rounded p-1 text-muted-foreground hover:text-foreground" title="View Details"><Eye className="h-3.5 w-3.5" /></button>
                            <button onClick={() => act(u.user_id + "_reset", () => callAdmin("reset_credits", u.user_id), "Credits reset")} disabled={!!busy} className="rounded px-2 py-1 text-[10px] font-medium bg-accent/10 text-accent hover:bg-accent/20">Reset</button>
                            <button onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)} className="rounded p-1 text-muted-foreground hover:text-foreground"><Settings className="h-3 w-3" /></button>
                          </div>
                          {expandedUser === u.user_id && (
                            <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                              <div className="flex gap-2">
                                <input type="number" defaultValue={u.generation_limit} placeholder="New limit" className="h-7 w-20 rounded border border-border bg-background px-2 text-xs text-foreground outline-none"
                                  onBlur={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val !== u.generation_limit) act(u.user_id + "_limit", () => callAdmin("update_user", u.user_id, { generation_limit: val }), "Limit updated"); }} />
                                <span className="self-center text-[10px] text-muted-foreground">credit limit</span>
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {isOwner && (
                                  !u.roles.includes("admin") ? (
                                    <button onClick={() => act(u.user_id + "_admin", () => callAdmin("assign_admin", u.user_id), "Admin granted")} className="rounded px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20">Grant Admin</button>
                                  ) : (
                                    <button onClick={() => act(u.user_id + "_revoke", () => callAdmin("revoke_admin", u.user_id), "Admin revoked")} className="rounded px-2 py-1 text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">Revoke Admin</button>
                                  )
                                )}
                                <button onClick={() => { if (confirm(`Delete ${u.full_name || "this user"}?`)) act(u.user_id + "_del", () => callAdmin("delete_user", u.user_id), "User deleted"); }}
                                  className="rounded px-2 py-1 text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">Delete User</button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">{fetching ? "Loading…" : "No users found"}</p>}
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 md:hidden">
                {filtered.map((u) => (
                  <div key={u.user_id} className="rounded-xl border border-border bg-card">
                    <button onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        <div className="mt-1 flex gap-1.5">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">{u.subscription_plan}</span>
                          <span className="text-[10px] text-muted-foreground">{u.generation_used}/{u.generation_limit}</span>
                        </div>
                      </div>
                      <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandedUser === u.user_id ? "rotate-180" : ""}`} />
                    </button>
                    {expandedUser === u.user_id && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                        <button onClick={() => setSelectedUserDetail(u)} className="w-full rounded-lg border border-border py-1.5 text-xs text-muted-foreground hover:text-foreground">View Full Details</button>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={u.subscription_plan} onChange={(e) => act(u.user_id + "_plan", () => callAdmin("update_user", u.user_id, { subscription_plan: e.target.value }), "Plan updated")}
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none">
                            {["explorer", "starter", "pro"].map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button onClick={() => act(u.user_id + "_reset", () => callAdmin("reset_credits", u.user_id), "Credits reset")} className="rounded-lg bg-accent/10 py-1.5 text-xs font-medium text-accent">Reset Credits</button>
                        </div>
                        <div className="flex gap-2">
                          {isOwner && (
                            !u.roles.includes("admin") ? (
                              <button onClick={() => act(u.user_id + "_admin", () => callAdmin("assign_admin", u.user_id), "Admin granted")} className="flex-1 rounded-lg bg-primary/10 py-1.5 text-xs font-medium text-primary">Grant Admin</button>
                            ) : (
                              <button onClick={() => act(u.user_id + "_revoke", () => callAdmin("revoke_admin", u.user_id), "Admin revoked")} className="flex-1 rounded-lg bg-destructive/10 py-1.5 text-xs font-medium text-destructive">Revoke Admin</button>
                            )
                          )}
                          <button onClick={() => { if (confirm(`Delete ${u.full_name || "this user"}?`)) act(u.user_id + "_del", () => callAdmin("delete_user", u.user_id), "User deleted"); }} className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── PAYMENTS ─── */}
          {tab === "payments" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">{payments.length} payment requests</p>
                <div className="flex gap-1.5 ml-auto">
                  {["all", "pending", "approved", "rejected"].map((s) => (
                    <button key={s} onClick={() => setPaymentFilter(s)} className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${paymentFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s} {s !== "all" ? `(${payments.filter((p) => p.status === s).length})` : ""}</button>
                  ))}
                </div>
                <button onClick={() => exportCSV(payments, "payments-export")} className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /></button>
              </div>
              <div className="space-y-3">
                {filteredPayments.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.email} • {p.whatsapp_number}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">{p.selected_plan}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{p.payment_method.replace("_", " ")}</span>
                          <span className="cursor-pointer text-[10px] text-muted-foreground font-mono hover:text-foreground" onClick={() => copyToClipboard(p.transaction_id)}>TXN: {p.transaction_id}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${p.status === "pending" ? "bg-accent/10 text-accent" : p.status === "approved" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>{p.status}</span>
                    </div>
                    {p.screenshot_url && <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"><Eye className="h-3 w-3" /> View Screenshot</a>}
                    {p.status === "pending" && (
                      <div className="mt-3 space-y-2">
                        <input value={paymentNotes[p.id] || ""} onChange={(e) => setPaymentNotes({ ...paymentNotes, [p.id]: e.target.value })} placeholder="Admin notes (optional)…" className="h-8 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary" />
                        <div className="flex gap-2">
                          <button onClick={() => act("approve_" + p.id, () => callAdmin("approve_payment", undefined, { paymentId: p.id, notes: paymentNotes[p.id] }), "Payment approved")} disabled={!!busy} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-500/10 py-2 text-xs font-medium text-green-600 hover:bg-green-500/20"><Check className="h-3 w-3" /> Approve</button>
                          <button onClick={() => act("reject_" + p.id, () => callAdmin("reject_payment", undefined, { paymentId: p.id, notes: paymentNotes[p.id] }), "Payment rejected")} disabled={!!busy} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-destructive/10 py-2 text-xs font-medium text-destructive hover:bg-destructive/20"><X className="h-3 w-3" /> Reject</button>
                        </div>
                      </div>
                    )}
                    {p.admin_notes && <p className="mt-2 text-[10px] text-muted-foreground">Notes: {p.admin_notes}</p>}
                    <p className="mt-2 text-[10px] text-muted-foreground">Requested: {new Date(p.requested_at).toLocaleString()}{p.processed_at && ` • Processed: ${new Date(p.processed_at).toLocaleString()}`}</p>
                  </div>
                ))}
                {filteredPayments.length === 0 && <div className="rounded-xl border border-dashed border-border py-14 text-center"><CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="text-sm font-medium text-foreground">No payment requests</p></div>}
              </div>
            </div>
          )}

          {/* ─── GENERATIONS ─── */}
          {tab === "generations" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">{generations.length} generation logs</p>
                <div className="flex gap-1.5 ml-auto">
                  {["all", "completed", "pending", "failed"].map((s) => (
                    <button key={s} onClick={() => setGenFilter(s)} className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${genFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s}</button>
                  ))}
                </div>
                <button onClick={() => exportCSV(generations, "generations-export")} className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /></button>
              </div>
              <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-muted/50">{["Prompt", "Page", "Model", "Status", "Credits", "Time"].map((h) => <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredGens.map((g) => (
                      <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 max-w-[250px]"><p className="truncate text-foreground">{g.prompt}</p>{g.image_url && <a href={g.image_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-accent hover:underline">View Image</a>}</td>
                        <td className="px-3 py-3 capitalize text-muted-foreground">{g.page}</td>
                        <td className="px-3 py-3 text-muted-foreground font-mono text-[10px]">{g.model || "—"}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${g.status === "completed" ? "bg-green-500/10 text-green-600" : g.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{g.status}</span></td>
                        <td className="px-3 py-3 text-muted-foreground">{g.credits_used}</td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{new Date(g.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredGens.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">No generations</p>}
              </div>
              <div className="space-y-2 md:hidden">
                {filteredGens.map((g) => (
                  <div key={g.id} className="rounded-xl border border-border bg-card p-3">
                    <p className="truncate text-xs font-medium text-foreground">{g.prompt}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] capitalize text-muted-foreground">{g.page}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${g.status === "completed" ? "bg-green-500/10 text-green-600" : g.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{g.status}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{new Date(g.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── FEEDBACK ─── */}
          {tab === "feedback" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{feedbacks.length} feedback entries</p>
                <button onClick={() => exportCSV(feedbacks, "feedback-export")} className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /> Export</button>
              </div>
              <div className="space-y-3">
                {feedbacks.map((f) => (
                  <div key={f.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${f.status === "new" ? "bg-accent/10 text-accent" : f.status === "replied" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>{f.status}</span>
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{f.category}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{f.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground font-mono">User: {f.user_id.slice(0, 8)}…</p>
                    {f.admin_response && <div className="mt-2 rounded-lg bg-muted/50 p-2"><p className="text-[10px] font-medium text-muted-foreground">Admin Reply:</p><p className="text-xs text-foreground">{f.admin_response}</p></div>}
                    {f.status === "new" && (
                      <div className="mt-2 flex gap-2">
                        <input value={feedbackReply[f.id] || ""} onChange={(e) => setFeedbackReply({ ...feedbackReply, [f.id]: e.target.value })} placeholder="Reply to feedback…" className="h-8 flex-1 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary" />
                        <button onClick={() => handleReplyFeedback(f.id)} disabled={!!busy || !feedbackReply[f.id]?.trim()} className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"><Send className="h-3 w-3" /> Reply</button>
                      </div>
                    )}
                  </div>
                ))}
                {feedbacks.length === 0 && <div className="rounded-xl border border-dashed border-border py-14 text-center"><MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="text-sm font-medium text-foreground">No feedback yet</p></div>}
              </div>
            </div>
          )}

          {/* ─── BROADCAST NOTIFICATIONS ─── */}
          {tab === "notifications" && (
            <div className="mx-auto max-w-lg space-y-6">
              <div><h2 className="text-sm font-semibold text-foreground">Send Notification</h2><p className="text-xs text-muted-foreground">Broadcast to all users or a specific user</p></div>
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                <div className="flex gap-2">
                  {(["all", "specific"] as const).map((t) => (
                    <button key={t} onClick={() => setNotifTarget(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${notifTarget === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>{t === "all" ? "All Users" : "Specific User"}</button>
                  ))}
                </div>
                {notifTarget === "specific" && <input value={notifUserId} onChange={(e) => setNotifUserId(e.target.value)} placeholder="User ID…" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary" />}
                <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Notification title…" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary" />
                <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={3} placeholder="Notification message…" className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
                <button onClick={handleSendNotification} disabled={!notifTitle.trim() || !notifMessage.trim() || busy === "notif"} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                  {busy === "notif" ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Send className="h-3.5 w-3.5" />}
                  {busy === "notif" ? "Sending…" : "Send Notification"}
                </button>
              </div>
            </div>
          )}

          {/* ─── AUDIT LOGS ─── */}
          {tab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{auditLogs.length} audit entries</p>
                <button onClick={() => exportCSV(auditLogs, "audit-logs-export")} className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /> Export</button>
              </div>
              <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-muted/50">{["Action", "Admin", "Target", "Details", "Time"].map((h) => <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 font-medium text-foreground capitalize whitespace-nowrap">{log.action.replace(/_/g, " ")}</td>
                        <td className="px-3 py-3 font-mono text-muted-foreground text-[10px]">{log.admin_user_id.slice(0, 8)}…</td>
                        <td className="px-3 py-3 font-mono text-muted-foreground text-[10px]">{log.target_user_id ? `${log.target_user_id.slice(0, 8)}…` : "—"}</td>
                        <td className="px-3 py-3 max-w-[200px] truncate text-muted-foreground">{log.details ? JSON.stringify(log.details) : "—"}</td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {auditLogs.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">No audit logs</p>}
              </div>
              <div className="space-y-2 md:hidden">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs font-medium text-foreground capitalize">{log.action.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── MANAGE ADMINS (Owner only) ─── */}
          {tab === "admins" && isOwner && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Admin Management</h2>
                <p className="text-xs text-muted-foreground">Only the platform owner ({OWNER_EMAIL}) can add or remove admins.</p>
              </div>

              {/* Current admins */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Admins ({adminUsers.length})</h3>
                {adminUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No admin users found.</p>
                ) : (
                  <div className="space-y-2">
                    {adminUsers.map((u) => (
                      <div key={u.user_id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {(u.full_name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">ID: {u.user_id.slice(0, 12)}…</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.email === OWNER_EMAIL ? (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">Owner</span>
                          ) : (
                            <button
                              onClick={() => { if (confirm(`Remove admin from ${u.full_name || u.email}?`)) act(u.user_id + "_revoke", () => callAdmin("revoke_admin", u.user_id), "Admin revoked"); }}
                              disabled={!!busy}
                              className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
                            >
                              <UserX className="h-3 w-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add admin from existing users */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add New Admin</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users to promote…"
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {nonAdminUsers.filter((u) => (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).slice(0, 20).map((u) => (
                    <div key={u.user_id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
                      <div>
                        <p className="text-xs font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </div>
                      <button
                        onClick={() => act(u.user_id + "_admin", () => callAdmin("assign_admin", u.user_id), "Admin granted")}
                        disabled={!!busy}
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        <UserCheck className="h-3 w-3" /> Promote
                      </button>
                    </div>
                  ))}
                  {nonAdminUsers.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No users available</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── USER DETAIL MODAL ── */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
            <button onClick={() => setSelectedUserDetail(null)} className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground text-lg font-bold">{(selectedUserDetail.full_name || "U").charAt(0).toUpperCase()}</div>
              <div><h2 className="text-lg font-semibold text-foreground">{selectedUserDetail.full_name || "Anonymous"}</h2><p className="text-xs text-muted-foreground">{selectedUserDetail.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Plan", value: selectedUserDetail.subscription_plan },
                { label: "Status", value: selectedUserDetail.subscription_status },
                { label: "Credits Used", value: `${selectedUserDetail.generation_used} / ${selectedUserDetail.generation_limit}` },
                { label: "Roles", value: selectedUserDetail.roles.join(", ") },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/50 p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-sm font-semibold capitalize text-foreground">{value}</p></div>
              ))}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span className="cursor-pointer hover:text-foreground" onClick={() => copyToClipboard(selectedUserDetail.email)}>{selectedUserDetail.email}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span>{selectedUserDetail.whatsapp_number || "Not provided"}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /><span>Joined: {new Date(selectedUserDetail.created_at).toLocaleDateString()}</span></div>
              {selectedUserDetail.subscription_expiry && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /><span>Expires: {new Date(selectedUserDetail.subscription_expiry).toLocaleDateString()}</span></div>}
              {selectedUserDetail.billing_cycle_start && <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /><span>Billing cycle: {new Date(selectedUserDetail.billing_cycle_start).toLocaleDateString()}</span></div>}
              <div className="flex items-center gap-2 text-muted-foreground"><Copy className="h-3.5 w-3.5" /><span className="cursor-pointer font-mono hover:text-foreground" onClick={() => copyToClipboard(selectedUserDetail.user_id)}>ID: {selectedUserDetail.user_id}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => { act(selectedUserDetail.user_id + "_reset", () => callAdmin("reset_credits", selectedUserDetail.user_id), "Credits reset"); setSelectedUserDetail(null); }} className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20">Reset Credits</button>
              {isOwner && (
                !selectedUserDetail.roles.includes("admin") ? (
                  <button onClick={() => { act(selectedUserDetail.user_id + "_admin", () => callAdmin("assign_admin", selectedUserDetail.user_id), "Admin granted"); setSelectedUserDetail(null); }} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">Grant Admin</button>
                ) : selectedUserDetail.email !== OWNER_EMAIL ? (
                  <button onClick={() => { act(selectedUserDetail.user_id + "_revoke", () => callAdmin("revoke_admin", selectedUserDetail.user_id), "Admin revoked"); setSelectedUserDetail(null); }} className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20">Revoke Admin</button>
                ) : null
              )}
              <button onClick={() => { if (confirm(`Delete ${selectedUserDetail.full_name || "this user"}?`)) { act(selectedUserDetail.user_id + "_del", () => callAdmin("delete_user", selectedUserDetail.user_id), "User deleted"); setSelectedUserDetail(null); } }} className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20">Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

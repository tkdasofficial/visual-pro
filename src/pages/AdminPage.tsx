import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, BarChart3, FileText, CreditCard, Search, RefreshCw,
  AlertTriangle, ChevronDown, LogOut, Shield, Eye, Check, X,
  Settings, Zap, Image as ImageIcon, Clock,
} from "lucide-react";

type AdminTab = "dashboard" | "users" | "payments" | "generations" | "logs";

interface UserRecord {
  user_id: string;
  full_name: string | null;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  generation_limit: number;
  generation_used: number;
  subscription_expiry: string | null;
  created_at: string;
  roles: string[];
}

interface PaymentRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
  selected_plan: string;
  payment_method: string;
  transaction_id: string;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
}

interface GenerationRecord {
  id: string;
  user_id: string;
  page: string;
  prompt: string;
  model: string | null;
  status: string;
  credits_used: number;
  image_url: string | null;
  created_at: string;
}

interface AuditRecord {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action: string;
  details: any;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  totalGenerations: number;
  totalCreditsUsed: number;
  totalCreditsLimit: number;
  planCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  pageCounts: Record<string, number>;
  pendingPayments: number;
}

async function callAdmin(action: string, targetUserId?: string, data?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, targetUserId, data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export default function AdminPage() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (what: AdminTab) => {
    setFetching(true);
    try {
      switch (what) {
        case "dashboard": {
          const s = await callAdmin("get_stats");
          setStats(s);
          break;
        }
        case "users": {
          const r = await callAdmin("get_users");
          setUsers(r.users || []);
          break;
        }
        case "payments": {
          const r = await callAdmin("get_payments");
          setPayments(r.payments || []);
          break;
        }
        case "generations": {
          const r = await callAdmin("get_generations");
          setGenerations(r.generations || []);
          break;
        }
        case "logs": {
          const r = await callAdmin("get_audit_logs");
          setAuditLogs(r.logs || []);
          break;
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      load("dashboard");
      load("users");
      load("payments");
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAdmin && (tab === "generations" || tab === "logs")) {
      load(tab);
    }
  }, [tab, authLoading, isAdmin]);

  const act = async (key: string, fn: () => Promise<any>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: msg });
      load("users");
      load("dashboard");
      if (tab === "payments") load("payments");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
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
    { id: "logs", label: "Audit Logs", icon: FileText },
  ];

  const filtered = users.filter(
    (u) =>
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">Admin Panel</h1>
            <p className="text-[10px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(tab)}
            disabled={fetching}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-destructive/10 px-3 text-xs font-medium text-destructive hover:bg-destructive/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div className="flex overflow-x-auto border-b border-border px-4 sm:px-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {!!t.badge && t.badge > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
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
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Plan Distribution */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-4 text-sm font-medium text-foreground">Plan Distribution</h3>
                <div className="space-y-3">
                  {["explorer", "starter", "pro"].map((plan) => {
                    const count = stats.planCounts[plan] || 0;
                    const pct = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
                    return (
                      <div key={plan}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{plan}</span>
                          <span className="font-medium text-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generation Status */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-4 text-sm font-medium text-foreground">Generation Status</h3>
                <div className="space-y-3">
                  {["completed", "pending", "failed"].map((status) => {
                    const count = stats.statusCounts[status] || 0;
                    const pct = stats.totalGenerations ? Math.round((count / stats.totalGenerations) * 100) : 0;
                    const color = status === "completed" ? "bg-green-500" : status === "failed" ? "bg-destructive" : "bg-accent";
                    return (
                      <div key={status}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{status}</span>
                          <span className="font-medium text-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generations by Page */}
              <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                <h3 className="mb-4 text-sm font-medium text-foreground">Generations by Page</h3>
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or ID…"
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => act("bulk_reset", () => callAdmin("bulk_reset_credits"), "All credits reset")}
                disabled={!!busy}
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:text-foreground sm:flex"
              >
                <Zap className="h-3.5 w-3.5" /> Reset All Credits
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["User", "Email", "Plan", "Credits", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{u.user_id.slice(0, 12)}…</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.subscription_plan}
                          onChange={(e) => act(u.user_id + "_plan", () => callAdmin("update_user", u.user_id, { subscription_plan: e.target.value }), "Plan updated")}
                          disabled={busy?.startsWith(u.user_id)}
                          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                        >
                          {["explorer", "starter", "pro"].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{u.generation_used}</span>
                        <span className="text-muted-foreground">/{u.generation_limit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          u.subscription_status === "active"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {u.subscription_status}
                        </span>
                        {u.roles.includes("admin") && (
                          <span className="ml-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">admin</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => act(u.user_id + "_reset", () => callAdmin("reset_credits", u.user_id), "Credits reset")}
                            disabled={!!busy}
                            className="rounded px-2 py-1 text-[10px] font-medium bg-accent/10 text-accent hover:bg-accent/20"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Settings className="h-3 w-3" />
                          </button>
                        </div>
                        {expandedUser === u.user_id && (
                          <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                defaultValue={u.generation_limit}
                                placeholder="New limit"
                                className="h-7 w-20 rounded border border-border bg-background px-2 text-xs text-foreground outline-none"
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val !== u.generation_limit) {
                                    act(u.user_id + "_limit", () => callAdmin("update_user", u.user_id, { generation_limit: val }), "Limit updated");
                                  }
                                }}
                              />
                              <span className="self-center text-[10px] text-muted-foreground">credit limit</span>
                            </div>
                            <div className="flex gap-1.5">
                              {!u.roles.includes("admin") ? (
                                <button
                                  onClick={() => act(u.user_id + "_admin", () => callAdmin("assign_admin", u.user_id), "Admin granted")}
                                  className="rounded px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                  Grant Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => act(u.user_id + "_revoke", () => callAdmin("revoke_admin", u.user_id), "Admin revoked")}
                                  className="rounded px-2 py-1 text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
                                >
                                  Revoke Admin
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${u.full_name || "this user"}? This cannot be undone.`)) {
                                    act(u.user_id + "_del", () => callAdmin("delete_user", u.user_id), "User deleted");
                                  }
                                }}
                                className="rounded px-2 py-1 text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
                              >
                                Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="py-10 text-center text-xs text-muted-foreground">{fetching ? "Loading…" : "No users found"}</p>
              )}
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {filtered.map((u) => (
                <div key={u.user_id} className="rounded-xl border border-border bg-card">
                  <button
                    onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
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
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={u.subscription_plan}
                          onChange={(e) => act(u.user_id + "_plan", () => callAdmin("update_user", u.user_id, { subscription_plan: e.target.value }), "Plan updated")}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
                        >
                          {["explorer", "starter", "pro"].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button
                          onClick={() => act(u.user_id + "_reset", () => callAdmin("reset_credits", u.user_id), "Credits reset")}
                          className="rounded-lg bg-accent/10 py-1.5 text-xs font-medium text-accent"
                        >
                          Reset Credits
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {!u.roles.includes("admin") ? (
                          <button
                            onClick={() => act(u.user_id + "_admin", () => callAdmin("assign_admin", u.user_id), "Admin granted")}
                            className="flex-1 rounded-lg bg-primary/10 py-1.5 text-xs font-medium text-primary"
                          >
                            Grant Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => act(u.user_id + "_revoke", () => callAdmin("revoke_admin", u.user_id), "Admin revoked")}
                            className="flex-1 rounded-lg bg-destructive/10 py-1.5 text-xs font-medium text-destructive"
                          >
                            Revoke Admin
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${u.full_name || "this user"}?`)) {
                              act(u.user_id + "_del", () => callAdmin("delete_user", u.user_id), "User deleted");
                            }
                          }}
                          className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
                        >
                          Delete
                        </button>
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{payments.length} payment requests</p>
              <div className="flex gap-1.5 ml-auto">
                {["pending", "approved", "rejected"].map((s) => {
                  const count = payments.filter((p) => p.status === s).length;
                  return (
                    <span key={s} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      s === "pending" ? "bg-accent/10 text-accent" :
                      s === "approved" ? "bg-green-500/10 text-green-600" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {s}: {count}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.email} • {p.whatsapp_number}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">{p.selected_plan}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{p.payment_method.replace("_", " ")}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">TXN: {p.transaction_id}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      p.status === "pending" ? "bg-accent/10 text-accent" :
                      p.status === "approved" ? "bg-green-500/10 text-green-600" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  {p.screenshot_url && (
                    <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                      <Eye className="h-3 w-3" /> View Screenshot
                    </a>
                  )}

                  {p.status === "pending" && (
                    <div className="mt-3 space-y-2">
                      <input
                        value={paymentNotes[p.id] || ""}
                        onChange={(e) => setPaymentNotes({ ...paymentNotes, [p.id]: e.target.value })}
                        placeholder="Admin notes (optional)…"
                        className="h-8 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => act("approve_" + p.id, () => callAdmin("approve_payment", undefined, { paymentId: p.id, notes: paymentNotes[p.id] }), "Payment approved")}
                          disabled={!!busy}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-500/10 py-2 text-xs font-medium text-green-600 hover:bg-green-500/20"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => act("reject_" + p.id, () => callAdmin("reject_payment", undefined, { paymentId: p.id, notes: paymentNotes[p.id] }), "Payment rejected")}
                          disabled={!!busy}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-destructive/10 py-2 text-xs font-medium text-destructive hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {p.admin_notes && (
                    <p className="mt-2 text-[10px] text-muted-foreground">Notes: {p.admin_notes}</p>
                  )}

                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Requested: {new Date(p.requested_at).toLocaleString()}
                    {p.processed_at && ` • Processed: ${new Date(p.processed_at).toLocaleString()}`}
                  </p>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-14 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">No payment requests</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── GENERATIONS ─── */}
        {tab === "generations" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{generations.length} generation logs</p>
            <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Prompt", "Page", "Model", "Status", "Time"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generations.map((g) => (
                    <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 max-w-[250px] truncate text-foreground">{g.prompt}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{g.page}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">{g.model || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          g.status === "completed" ? "bg-green-500/10 text-green-600" :
                          g.status === "failed" ? "bg-destructive/10 text-destructive" :
                          "bg-accent/10 text-accent"
                        }`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(g.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {generations.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">No generations yet</p>}
            </div>

            {/* Mobile */}
            <div className="space-y-2 md:hidden">
              {generations.map((g) => (
                <div key={g.id} className="rounded-xl border border-border bg-card p-3">
                  <p className="truncate text-xs font-medium text-foreground">{g.prompt}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] capitalize text-muted-foreground">{g.page}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      g.status === "completed" ? "bg-green-500/10 text-green-600" :
                      g.status === "failed" ? "bg-destructive/10 text-destructive" :
                      "bg-accent/10 text-accent"
                    }`}>{g.status}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(g.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── AUDIT LOGS ─── */}
        {tab === "logs" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{auditLogs.length} audit entries</p>
            <div className="hidden md:block rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Action", "Admin", "Target", "Details", "Time"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground capitalize whitespace-nowrap">
                        {log.action.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-[10px]">{log.admin_user_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-[10px]">{log.target_user_id ? `${log.target_user_id.slice(0, 8)}…` : "—"}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">No audit logs</p>}
            </div>

            {/* Mobile */}
            <div className="space-y-2 md:hidden">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground capitalize">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  {log.details && <p className="mt-1 truncate text-[10px] text-muted-foreground">{JSON.stringify(log.details)}</p>}
                </div>
              ))}
              {auditLogs.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">No audit logs</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

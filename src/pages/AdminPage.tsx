import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Shield, BarChart3, FileText, UserPlus, Search,
  X, RefreshCw, AlertTriangle, Edit2, Trash2, ChevronDown,
  Activity, CreditCard, TrendingUp, Eye,
} from "lucide-react";

type AdminTab = "users" | "employees" | "stats" | "logs";

interface UserRecord {
  user_id: string;
  full_name: string | null;
  plan: string;
  is_suspended: boolean;
  is_employee: boolean;
  department: string | null;
  referral_code: string | null;
  created_at: string;
  credits: { balance: number; total_earned: number; total_used: number } | null;
  user_roles: { role: string }[];
}

const ROLE_OPTIONS = ["user", "viewer", "analyst", "support", "manager", "director", "super_admin", "ceo"];
const PLAN_OPTIONS = ["free", "pro", "business"];
const DEPT_OPTIONS = ["Engineering", "Design", "Support", "Sales", "Marketing", "Operations", "Finance", "Legal"];

function planBadge(plan: string) {
  const styles: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-accent/10 text-accent",
    business: "bg-primary/10 text-primary",
  };
  return `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${styles[plan] ?? styles.free}`;
}

async function callAdmin(session: any, action: string, targetUserId?: string, data?: object) {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, targetUserId, data }),
  });
  return res.json();
}

export default function AdminPage() {
  const { roles, isAdmin, isSeniorAdmin, loading } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Add employee modal
  const [empModal, setEmpModal] = useState(false);
  const [empEmail, setEmpEmail] = useState("");
  const [empRole, setEmpRole] = useState("viewer");
  const [empDept, setEmpDept] = useState("");
  const [addingEmp, setAddingEmp] = useState(false);

  // Credit modal
  const [creditModal, setCreditModal] = useState<{ userId: string; name: string; balance: number } | null>(null);
  const [creditAmt, setCreditAmt] = useState("");
  const [creditReason, setCreditReason] = useState("");

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ userId: string; name: string } | null>(null);

  // User detail expand
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const loadUsers = useCallback(async () => {
    setFetching(true);
    try {
      const session = await getSession();
      if (!session) return;
      const result = await callAdmin(session, "get_users");
      if (result.users) setUsers(result.users);
      else toast({ title: "Failed to load users", description: result.error, variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Could not load users", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    const result = await callAdmin(session, "get_stats");
    if (result.users !== undefined) setStats(result);
  }, []);

  const loadLogs = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    const result = await callAdmin(session, "get_audit_logs");
    if (result.logs) setAuditLogs(result.logs);
  }, []);

  useEffect(() => {
    if (!loading && isAdmin) {
      loadUsers();
      loadStats();
      loadLogs();
    }
  }, [loading, isAdmin]);

  const act = async (key: string, fn: () => Promise<any>, successMsg?: string) => {
    setBusy(key);
    try {
      const result = await fn();
      if (result?.success) {
        if (successMsg) toast({ title: successMsg });
        await loadUsers();
      } else {
        toast({ title: "Error", description: result?.error || "Action failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleSuspend = async (userId: string, suspend: boolean) => {
    const session = await getSession();
    if (!session) return;
    act(userId + "_suspend", () => callAdmin(session, suspend ? "suspend_user" : "unsuspend_user", userId),
      suspend ? "User Suspended" : "User Unsuspended");
  };

  const handlePlan = async (userId: string, plan: string) => {
    const session = await getSession();
    if (!session) return;
    act(userId + "_plan", () => callAdmin(session, "update_plan", userId, { plan }), "Plan Updated");
  };

  const handleRole = async (userId: string, role: string) => {
    const session = await getSession();
    if (!session) return;
    act(userId + "_role", () => callAdmin(session, "assign_role", userId, { role }), "Role Updated");
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEmp(true);
    try {
      const session = await getSession();
      if (!session) return;
      const result = await callAdmin(session, "add_employee", undefined, {
        email: empEmail, role: empRole, department: empDept,
      });
      if (result.success) {
        toast({ title: "Employee Added", description: `${empEmail} → ${empRole}` });
        setEmpModal(false);
        setEmpEmail(""); setEmpRole("viewer"); setEmpDept("");
        loadUsers();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add employee", variant: "destructive" });
    } finally {
      setAddingEmp(false);
    }
  };

  const handleCredits = async () => {
    if (!creditModal || !creditAmt) return;
    const session = await getSession();
    if (!session) return;
    const result = await callAdmin(session, "adjust_credits", creditModal.userId, {
      amount: parseInt(creditAmt), reason: creditReason,
    });
    if (result.success) {
      toast({ title: "Credits Updated", description: `New balance: ${result.newBalance}` });
      setCreditModal(null); setCreditAmt(""); setCreditReason("");
      loadUsers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    const session = await getSession();
    if (!session) return;
    const result = await callAdmin(session, "delete_user", deleteModal.userId);
    if (result.success) {
      toast({ title: "User Deleted" });
      setDeleteModal(null);
      loadUsers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = users.filter(
    (u) =>
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const employees = filtered.filter((u) => u.is_employee);

  const totalUsers = stats?.users?.length ?? 0;
  const totalGens = stats?.logs?.length ?? 0;
  const totalRefs = stats?.referrals?.length ?? 0;
  const totalCreditsUsed = stats?.credits?.reduce((a: number, c: any) => a + (c.total_used ?? 0), 0) ?? 0;
  const planCounts = stats?.users?.reduce((acc: any, u: any) => {
    acc[u.plan] = (acc[u.plan] || 0) + 1; return acc;
  }, {}) ?? {};

  // ── Loading / Access guard ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-foreground">Access Denied</p>
        <p className="text-xs text-muted-foreground">You don't have permission to view the admin panel.</p>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "employees", label: "Team", icon: Shield },
    { id: "stats", label: "Analytics", icon: BarChart3 },
    { id: "logs", label: "Logs", icon: FileText },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {roles.filter((r) => r !== "user").join(", ") || "user"}
            </p>
          </div>
          {isSeniorAdmin && (
            <button
              onClick={() => setEmpModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Employee</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex overflow-x-auto border-b border-border px-4 sm:px-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={loadUsers}
                disabled={fetching}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Mobile: card list | Desktop: table */}
            <div className="hidden md:block rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["User", "Plan", "Credits", "Role", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const topRole = u.user_roles?.find((r) => r.role !== "user")?.role || "user";
                    const isOwner = u.user_roles?.some((r) => r.role === "owner");
                    const isBusy = (k: string) => busy === u.user_id + k;
                    return (
                      <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                          <p className="text-muted-foreground font-mono">{u.user_id.slice(0, 12)}…</p>
                        </td>
                        <td className="px-4 py-3">
                          {isSeniorAdmin && !isOwner ? (
                            <select
                              value={u.plan}
                              onChange={(e) => handlePlan(u.user_id, e.target.value)}
                              disabled={isBusy("_plan")}
                              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                            >
                              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : (
                            <span className={planBadge(u.plan)}>{u.plan}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{u.credits?.balance ?? "—"}</span>
                            {isSeniorAdmin && !isOwner && (
                              <button
                                onClick={() => setCreditModal({ userId: u.user_id, name: u.full_name || "User", balance: u.credits?.balance ?? 0 })}
                                className="text-accent hover:text-accent/80"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isSeniorAdmin && !isOwner ? (
                            <select
                              value={topRole}
                              onChange={(e) => handleRole(u.user_id, e.target.value)}
                              disabled={isBusy("_role")}
                              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                            >
                              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className="capitalize text-muted-foreground">{topRole}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            u.is_suspended ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}>
                            {u.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {isSeniorAdmin && !isOwner && (
                              <>
                                <button
                                  onClick={() => handleSuspend(u.user_id, !u.is_suspended)}
                                  disabled={!!busy?.startsWith(u.user_id)}
                                  className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                                    u.is_suspended
                                      ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                  }`}
                                >
                                  {u.is_suspended ? "Unsuspend" : "Suspend"}
                                </button>
                                <button
                                  onClick={() => setDeleteModal({ userId: u.user_id, name: u.full_name || "User" })}
                                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  {fetching ? "Loading users…" : "No users found"}
                </div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {filtered.map((u) => {
                const topRole = u.user_roles?.find((r) => r.role !== "user")?.role || "user";
                const isOwner = u.user_roles?.some((r) => r.role === "owner");
                const isExpanded = expandedUser === u.user_id;
                return (
                  <div key={u.user_id} className="rounded-lg border border-border bg-card">
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={planBadge(u.plan)}>{u.plan}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            u.is_suspended ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                          }`}>
                            {u.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Credits</p>
                            <p className="font-medium text-foreground">{u.credits?.balance ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Role</p>
                            <p className="font-medium text-foreground capitalize">{topRole}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Department</p>
                            <p className="font-medium text-foreground">{u.department || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Used</p>
                            <p className="font-medium text-foreground">{u.credits?.total_used ?? "—"}</p>
                          </div>
                        </div>

                        {isSeniorAdmin && !isOwner && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={u.plan}
                              onChange={(e) => handlePlan(u.user_id, e.target.value)}
                              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
                            >
                              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select
                              value={topRole}
                              onChange={(e) => handleRole(u.user_id, e.target.value)}
                              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
                            >
                              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        )}

                        {isSeniorAdmin && !isOwner && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCreditModal({ userId: u.user_id, name: u.full_name || "User", balance: u.credits?.balance ?? 0 })}
                              className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                            >
                              Adjust Credits
                            </button>
                            <button
                              onClick={() => handleSuspend(u.user_id, !u.is_suspended)}
                              className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                                u.is_suspended
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {u.is_suspended ? "Unsuspend" : "Suspend"}
                            </button>
                            <button
                              onClick={() => setDeleteModal({ userId: u.user_id, name: u.full_name || "User" })}
                              className="rounded-lg border border-border p-1.5 text-destructive/70 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  {fetching ? "Loading users…" : "No users found"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {tab === "employees" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{employees.length} team members</p>
              {isSeniorAdmin && (
                <button
                  onClick={() => setEmpModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Employee
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((u) => {
                const roleList = u.user_roles?.filter((r) => r.role !== "user").map((r) => r.role) || [];
                return (
                  <div key={u.user_id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">{u.department || "No department"}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {roleList.map((r) => (
                            <span key={r} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium capitalize text-accent">{r}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        u.is_suspended ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                      }`}>
                        {u.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {employees.length === 0 && (
              <div className="rounded-lg border border-dashed border-border py-14 text-center">
                <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No team members yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add employees to grant admin access</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Total Users", value: totalUsers, icon: Users },
                { label: "Generations", value: totalGens, icon: Activity },
                { label: "Referrals", value: totalRefs, icon: TrendingUp },
                { label: "Credits Used", value: totalCreditsUsed, icon: CreditCard },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 text-sm font-medium text-foreground">Plan Distribution</h3>
                <div className="space-y-3">
                  {PLAN_OPTIONS.map((plan) => {
                    const count = planCounts[plan] || 0;
                    const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
                    return (
                      <div key={plan}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{plan}</span>
                          <span className="text-foreground font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 text-sm font-medium text-foreground">Generation Status</h3>
                <div className="space-y-3">
                  {(["completed", "pending", "failed"] as const).map((status) => {
                    const count = stats?.logs?.filter((l: any) => l.status === status).length ?? 0;
                    const pct = totalGens ? Math.round((count / totalGens) * 100) : 0;
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

              <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
                <h3 className="mb-4 text-sm font-medium text-foreground">Generations by Page</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {["create", "character", "structured", "style", "motion", "edit", "prompt-lab", "batch", "advanced"].map((page) => {
                    const count = stats?.logs?.filter((l: any) => l.page === page).length ?? 0;
                    return (
                      <div key={page} className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-lg font-bold text-foreground">{count}</p>
                        <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{page.replace("-", " ")}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AUDIT LOGS TAB ── */}
        {tab === "logs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{auditLogs.length} entries</p>
              <button onClick={loadLogs} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Action", "Actor", "Target", "Details", "Time"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground capitalize whitespace-nowrap">
                        {log.action.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {log.actor_id?.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {log.target_id ? `${log.target_id.slice(0, 8)}…` : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                        {typeof log.details === "object" ? JSON.stringify(log.details) : log.details}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">No audit logs yet</div>
              )}
            </div>

            {/* Mobile log cards */}
            <div className="space-y-2 md:hidden">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground capitalize">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">No audit logs yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Employee Modal ── */}
      {empModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-background p-6 shadow-xl sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Add Team Member</h2>
              <button onClick={() => setEmpModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Email Address</label>
                <input
                  type="email" required value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">User must already have an account</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Role</label>
                  <select value={empRole} onChange={(e) => setEmpRole(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                  >
                    {ROLE_OPTIONS.filter((r) => r !== "owner").map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Department</label>
                  <select value={empDept} onChange={(e) => setEmpDept(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                  >
                    <option value="">Select…</option>
                    {DEPT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEmpModal(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button type="submit" disabled={addingEmp}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {addingEmp ? "Adding…" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Adjust Credits Modal ── */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl border border-border bg-background p-6 shadow-xl sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Adjust Credits</h2>
              <button onClick={() => setCreditModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-1 text-xs text-muted-foreground">
              User: <strong className="text-foreground">{creditModal.name}</strong>
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Current balance: <strong className="text-foreground">{creditModal.balance}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Amount (+add / −deduct)</label>
                <input
                  type="number" value={creditAmt}
                  onChange={(e) => setCreditAmt(e.target.value)}
                  placeholder="+10 or -5"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Reason (optional)</label>
                <input
                  value={creditReason} onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Reason…"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setCreditModal(null)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button onClick={handleCredits} disabled={!creditAmt}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl border border-border bg-background p-6 shadow-xl sm:rounded-xl">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground">Delete User</h2>
            </div>
            <p className="mb-1 text-sm text-foreground">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>?
            </p>
            <p className="mb-5 text-xs text-muted-foreground">
              This will permanently delete their account, profile, and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-medium text-destructive-foreground hover:opacity-90"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

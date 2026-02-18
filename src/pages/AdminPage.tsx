import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Shield, BarChart3, FileText, CreditCard,
  UserPlus, Search, ChevronDown, ChevronUp, X,
  RefreshCw, AlertTriangle, CheckCircle, Edit2,
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
  credits?: { balance: number; total_earned: number; total_used: number }[];
  user_roles?: { role: string }[];
}

const ROLE_OPTIONS = ["user", "viewer", "analyst", "support", "manager", "director", "super_admin", "ceo"];
const PLAN_OPTIONS = ["free", "pro", "business"];
const DEPARTMENT_OPTIONS = ["Engineering", "Design", "Support", "Sales", "Marketing", "Operations"];

function callAdminAction(session: any, action: string, targetUserId?: string, data?: object) {
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, targetUserId, data }),
  }).then((r) => r.json());
}

export default function AdminPage() {
  const { user, roles, isAdmin, isSeniorAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add employee modal
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empEmail, setEmpEmail] = useState("");
  const [empRole, setEmpRole] = useState("viewer");
  const [empDept, setEmpDept] = useState("");
  const [addingEmployee, setAddingEmployee] = useState(false);

  // Credit adjust modal
  const [creditModal, setCreditModal] = useState<{ userId: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const session = await getSession();
      if (!session) return;
      const result = await callAdminAction(session, "get_users");
      if (result.users) setUsers(result.users);
      else toast({ title: "Error", description: result.error, variant: "destructive" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const fetchStats = async () => {
    const session = await getSession();
    if (!session) return;
    const result = await callAdminAction(session, "get_stats");
    if (result.users) setStats(result);
  };

  const fetchAuditLogs = async () => {
    const session = await getSession();
    if (!session) return;
    const result = await callAdminAction(session, "get_audit_logs");
    if (result.logs) setAuditLogs(result.logs);
  };

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchUsers();
      fetchStats();
      fetchAuditLogs();
    }
  }, [loading, isAdmin]);

  const handleSuspend = async (userId: string, suspend: boolean) => {
    setActionLoading(userId + (suspend ? "_suspend" : "_unsuspend"));
    const session = await getSession();
    if (!session) return;
    const result = await callAdminAction(session, suspend ? "suspend_user" : "unsuspend_user", userId);
    if (result.success) {
      toast({ title: suspend ? "User Suspended" : "User Unsuspended" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleUpdatePlan = async (userId: string, plan: string) => {
    setActionLoading(userId + "_plan");
    const session = await getSession();
    if (!session) return;
    const result = await callAdminAction(session, "update_plan", userId, { plan });
    if (result.success) {
      toast({ title: "Plan Updated" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleAssignRole = async (userId: string, role: string) => {
    setActionLoading(userId + "_role");
    const session = await getSession();
    if (!session) return;
    const result = await callAdminAction(session, "assign_role", userId, { role });
    if (result.success) {
      toast({ title: "Role Assigned" });
      fetchUsers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEmployee(true);
    const session = await getSession();
    if (!session) return;
    const result = await callAdminAction(session, "add_employee", undefined, {
      email: empEmail,
      role: empRole,
      department: empDept,
    });
    if (result.success) {
      toast({ title: "Employee Added", description: `${empEmail} has been added as ${empRole}` });
      setShowAddEmployee(false);
      setEmpEmail("");
      setEmpRole("viewer");
      setEmpDept("");
      fetchUsers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setAddingEmployee(false);
  };

  const handleAdjustCredits = async () => {
    if (!creditModal || !creditAmount) return;
    const session = await getSession();
    if (!session) return;
    const result = await callAdminAction(session, "adjust_credits", creditModal.userId, {
      amount: parseInt(creditAmount),
      reason: creditReason,
    });
    if (result.success) {
      toast({ title: "Credits Adjusted", description: `New balance: ${result.newBalance}` });
      setCreditModal(null);
      setCreditAmount("");
      setCreditReason("");
      fetchUsers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.user_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const employeeUsers = filteredUsers.filter((u) => u.is_employee);
  const regularUsers = filteredUsers.filter((u) => !u.is_employee);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Access Denied</p>
          <p className="mt-1 text-xs text-muted-foreground">You don't have permission to view the admin panel.</p>
        </div>
      </div>
    );
  }

  const totalUsers = stats?.users?.length || 0;
  const totalGenerations = stats?.logs?.length || 0;
  const totalReferrals = stats?.referrals?.length || 0;
  const planCounts = stats?.users?.reduce((acc: any, u: any) => {
    acc[u.plan] = (acc[u.plan] || 0) + 1;
    return acc;
  }, {}) || {};

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "employees", label: "Employees", icon: Shield },
    { id: "stats", label: "Analytics", icon: BarChart3 },
    { id: "logs", label: "Audit Logs", icon: FileText },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              Your roles: {roles.filter((r) => r !== "user").join(", ") || "user"}
            </p>
          </div>
          {isSeniorAdmin && (
            <button
              onClick={() => setShowAddEmployee(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors duration-150 ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <button
                onClick={fetchUsers}
                disabled={fetching}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Credits</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Roles</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const userRoles = u.user_roles?.map((r) => r.role) || [];
                    const credits = u.credits?.[0];
                    const isOwnerUser = userRoles.includes("owner");
                    return (
                      <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{u.full_name || "Anonymous"}</p>
                            <p className="text-muted-foreground truncate max-w-[120px]">{u.user_id.slice(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isSeniorAdmin && !isOwnerUser ? (
                            <select
                              value={u.plan}
                              onChange={(e) => handleUpdatePlan(u.user_id, e.target.value)}
                              disabled={actionLoading === u.user_id + "_plan"}
                              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                            >
                              {PLAN_OPTIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="capitalize">{u.plan}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{credits?.balance ?? "—"}</span>
                            {isSeniorAdmin && !isOwnerUser && (
                              <button
                                onClick={() => setCreditModal({ userId: u.user_id, name: u.full_name || "User" })}
                                className="text-accent hover:text-accent/80"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isSeniorAdmin && !isOwnerUser ? (
                            <select
                              value={userRoles.filter((r) => r !== "user")[0] || "user"}
                              onChange={(e) => handleAssignRole(u.user_id, e.target.value)}
                              disabled={actionLoading === u.user_id + "_role"}
                              className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="capitalize">{userRoles.join(", ")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            u.is_suspended
                              ? "bg-destructive/10 text-destructive"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}>
                            {u.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isSeniorAdmin && !isOwnerUser && (
                            <button
                              onClick={() => handleSuspend(u.user_id, !u.is_suspended)}
                              disabled={actionLoading?.startsWith(u.user_id)}
                              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                                u.is_suspended
                                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                  : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              }`}
                            >
                              {u.is_suspended ? "Unsuspend" : "Suspend"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {fetching ? "Loading..." : "No users found"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMPLOYEES TAB */}
        {activeTab === "employees" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{employeeUsers.length} employees</p>
              {isSeniorAdmin && (
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Employee
                </button>
              )}
            </div>

            <div className="grid gap-3">
              {employeeUsers.map((u) => {
                const userRoles = u.user_roles?.map((r) => r.role).filter((r) => r !== "user") || [];
                return (
                  <div key={u.user_id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.department || "No department"}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {userRoles.map((r) => (
                            <span key={r} className="rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        u.is_suspended ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
                      }`}>
                        {u.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {employeeUsers.length === 0 && (
                <div className="rounded-lg border border-dashed border-border py-10 text-center">
                  <Shield className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No employees added yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Total Users", value: totalUsers },
                { label: "Generations", value: totalGenerations },
                { label: "Referrals", value: totalReferrals },
                { label: "Free Plan", value: planCounts.free || 0 },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Plan Distribution</h3>
                <div className="space-y-2">
                  {PLAN_OPTIONS.map((plan) => {
                    const count = planCounts[plan] || 0;
                    const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
                    return (
                      <div key={plan}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{plan}</span>
                          <span className="text-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Generation Status</h3>
                <div className="space-y-2">
                  {["completed", "pending", "failed"].map((status) => {
                    const count = stats?.logs?.filter((l: any) => l.status === status).length || 0;
                    const pct = totalGenerations ? Math.round((count / totalGenerations) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{status}</span>
                          <span className="text-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full ${
                              status === "completed" ? "bg-green-500" : status === "failed" ? "bg-destructive" : "bg-accent"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">{auditLogs.length} entries</p>
              <button
                onClick={fetchAuditLogs}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Details</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground capitalize">{log.action.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">No audit logs yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Add Employee</h2>
              <button onClick={() => setShowAddEmployee(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">User must already have an account</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Role</label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                >
                  {ROLE_OPTIONS.filter((r) => r !== "owner").map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Department</label>
                <select
                  value={empDept}
                  onChange={(e) => setEmpDept(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option value="">Select department...</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEmployee}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {addingEmployee ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Adjust Modal */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-xl border border-border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Adjust Credits</h2>
              <button onClick={() => setCreditModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Adjusting credits for: <strong>{creditModal.name}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Amount (+ to add, - to deduct)</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="+10 or -5"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Reason</label>
                <input
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Optional reason"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCreditModal(null)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustCredits}
                  disabled={!creditAmount}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

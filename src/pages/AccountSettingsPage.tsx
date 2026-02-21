import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, KeyRound, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setEditName(profile.full_name || "");
  }, [profile]);

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: editName.trim() }).eq("user_id", user.id);
    toast({ title: "Name updated" });
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    toast({ title: "Password reset email sent" });
  };

  return (
    <div className="mx-auto max-w-lg p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and security</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground text-lg font-bold">
          {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Name */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="h-4 w-4" /> Full Name
        </div>
        <div className="flex gap-2">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            onClick={handleSaveName}
            disabled={saving}
            className="rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
        </div>
      </div>

      {/* Email */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Mail className="h-4 w-4" /> Email Address
        </div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* Password */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <KeyRound className="h-4 w-4" /> Password
        </div>
        <button
          onClick={handleResetPassword}
          className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Send Password Reset Email
        </button>
      </div>

      {/* Plan */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Shield className="h-4 w-4" /> Subscription Plan
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-accent">
            {profile?.plan || "free"}
          </span>
          <button
            onClick={() => navigate("/plans")}
            className="text-xs text-accent hover:underline"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}

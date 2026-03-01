import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay updated with your account activity</p>
      </div>

      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No notifications</p>
        <p className="mt-1 text-xs text-muted-foreground">You're all caught up!</p>
      </div>
    </div>
  );
}

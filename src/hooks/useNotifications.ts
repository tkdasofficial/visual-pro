import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setUnreadCount(count || 0);
    };

    fetchCount();

    // Poll every 30s
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return { unreadCount };
}

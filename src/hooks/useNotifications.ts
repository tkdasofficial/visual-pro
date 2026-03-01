import { useState, useEffect } from "react";

export function useNotifications(_userId: string | undefined) {
  // Notifications feature - placeholder until notifications table is created
  const [unreadCount] = useState(0);
  return { unreadCount };
}

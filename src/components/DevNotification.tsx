import { toast } from "sonner";

/** Request notification permission (call once on mount). */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

/** Send a browser notification + sonner toast when dev completes. */
export const notifyDevComplete = (title: string) => {
  // In-app toast
  toast.success(`开发完成：${title}`, {
    description: "点击查看验收详情",
    duration: 8000,
  });

  // Browser notification (for background tabs)
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    const n = new Notification("DeepFlow · 开发完成", {
      body: title,
      icon: "/favicon.ico",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  }
};

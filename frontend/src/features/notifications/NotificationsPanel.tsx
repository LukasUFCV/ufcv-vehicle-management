import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

type Notification = {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ data: Notification[] }>("/notifications")
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      api(`/notifications/${notificationId}/read`, {
        method: "PATCH"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const unreadCount = data?.data.filter((notification) => !notification.readAt).length ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl border border-border bg-surface p-2 text-soft hover:text-app"
        aria-label="Afficher les notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <Card className="absolute right-0 z-30 mt-2 w-[22rem] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </div>
          <div className="space-y-3">
            {data?.data.length ? (
              data.data.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-app">{notification.title}</p>
                      <p className="mt-1 text-sm text-soft">{notification.body}</p>
                      <p className="mt-2 text-xs text-soft">{formatDateTime(notification.createdAt)}</p>
                    </div>
                    {!notification.readAt ? (
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        onClick={() => markReadMutation.mutate(notification.id)}
                      >
                        Lu
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-soft">Aucune notification.</p>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

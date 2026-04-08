import { Button, Card, CardContent, CardHeader, Chip } from "@heroui/react";

function NotificationGate({ message, onEnable, onDismiss }) {
  return (
    <div className="notification-gate">
      <div className="notification-arrow">
        <svg viewBox="0 0 184 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 120C58 67 100 35 169 13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M140 16L169 13L155 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>

      <Card className="notification-card">
        <CardHeader className="flex-col items-start gap-3">
          <Chip className="status-chip" color="secondary" variant="flat">
            first step
          </Chip>
          <div>
            <p className="eyebrow">real device alerts</p>
            <h2 className="text-3xl font-black tracking-tight text-white">
              Turn notifications on before you start.
            </h2>
          </div>
        </CardHeader>
        <CardContent className="gap-4 pt-0 text-white/78">
          <p>
            The prompt usually appears near the top-right. If you allow it, finished timers can
            show up in Windows, macOS, Linux, and supported mobile browsers.
          </p>
          <div className="rounded-2xl border border-white/12 bg-white/6 p-4 text-sm text-white/72">
            <div className="font-semibold text-white">Current status</div>
            <div>{message}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button color="secondary" radius="full" onPress={onEnable}>
              Enable notifications
            </Button>
            <Button radius="full" variant="bordered" onPress={onDismiss}>
              Continue with limited alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationGate;

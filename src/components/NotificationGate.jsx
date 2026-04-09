function NotificationGate({ message, onEnable, onDismiss }) {
  return (
    <div className="notification-gate">
      <div className="notification-arrow">
        <svg viewBox="0 0 184 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 120C58 67 100 35 169 13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M140 16L169 13L155 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>

      <div className="notification-dialog">
        <h2>Turn on notifications</h2>
        <p>
          The permission prompt usually shows up near the top-right. If you allow it, finished
          timers can show up in your device notification tray.
        </p>

        <div className="status-panel">
          <strong>Current status</strong>
          <span>{message}</span>
        </div>

        <div className="button-row">
          <button type="button" className="button button--primary" onClick={onEnable}>
            Enable notifications
          </button>
          <button type="button" className="button" onClick={onDismiss}>
            Continue without them
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationGate;

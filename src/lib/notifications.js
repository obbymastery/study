async function registerNotificationWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    return null;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  const workerUrl = new URL(`${baseUrl.replace(/\/?$/, "/")}sw.js`, window.location.origin);
  const registration = await navigator.serviceWorker.register(workerUrl, {
    scope: baseUrl,
  });
  await navigator.serviceWorker.ready;
  return registration;
}

function getNotificationState() {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  if (!window.isSecureContext) {
    return "insecure";
  }
  return Notification.permission;
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  if (!window.isSecureContext) {
    return "insecure";
  }
  return Notification.requestPermission();
}

async function showDeviceNotification(registration, options) {
  const state = getNotificationState();
  if (state !== "granted") {
    return false;
  }

  if (registration?.showNotification) {
    await registration.showNotification(options.title, {
      body: options.body,
      data: { url: window.location.href },
      tag: options.tag || "focus-studio-alert",
      renotify: true,
    });
    return true;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    tag: options.tag || "focus-studio-alert",
  });
  notification.onclick = () => window.focus();
  return true;
}

export {
  getNotificationState,
  registerNotificationWorker,
  requestNotificationPermission,
  showDeviceNotification,
};

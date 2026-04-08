import { DEFAULT_LYRICS_SONG, SONG_LIBRARY } from "../data/songCatalog";

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parseGoals(rawValue) {
  return rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function parseYouTubeInput(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    const playlistId = url.searchParams.get("list");
    const videoId =
      host === "youtu.be" ? url.pathname.replace(/\//g, "") : url.searchParams.get("v");

    if (playlistId) {
      return {
        id: "custom-playlist",
        name: "Your playlist",
        detail: "Loaded from pasted YouTube link",
        kind: "playlist",
        value: playlistId,
      };
    }

    if (videoId) {
      return {
        id: "custom-video",
        name: "Your video",
        detail: "Loaded from pasted YouTube link",
        kind: "video",
        value: videoId,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function buildEmbedUrl(track) {
  if (track.kind === "playlist") {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(track.value)}&autoplay=0&rel=0`;
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(track.value)}?autoplay=0&rel=0&modestbranding=1`;
}

function pickRandomSong(category) {
  const pool = SONG_LIBRARY.filter((song) => song.category === category);
  return pool[Math.floor(Math.random() * pool.length)] || DEFAULT_LYRICS_SONG;
}

function getRingMetrics(isWide, progressValue) {
  const radius = isWide ? 116 : 102;
  const circumference = radius * 2 * Math.PI;
  const dashOffset = circumference - (progressValue / 100) * circumference;
  return { radius, circumference, dashOffset };
}

function playCompletionTone() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) {
    return;
  }

  const context = new Context();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(680, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.35);

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.85);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => {
    context.close().catch(() => {});
  };
  oscillator.start();
  oscillator.stop(context.currentTime + 0.86);
}

function getNotificationMessage(state) {
  if (state === "granted") {
    return "Device notifications are ready. Timer endings should show up in your OS notification center.";
  }
  if (state === "denied") {
    return "Notifications are blocked in the browser, so timer alerts stay in the page only.";
  }
  if (state === "insecure") {
    return "Notifications need localhost or an HTTPS site. Raw files and non-secure hosts cannot show device alerts.";
  }
  if (state === "unsupported") {
    return "This browser does not expose the Notifications API here, so alerts are limited.";
  }
  return "Allow notifications so finished timers can alert your desktop or phone.";
}

export {
  buildEmbedUrl,
  formatTime,
  getNotificationMessage,
  getRingMetrics,
  parseGoals,
  parseYouTubeInput,
  pickRandomSong,
  playCompletionTone,
};

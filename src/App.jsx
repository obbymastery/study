import { useEffect, useRef, useState } from "react";
import { Button, Card, CardContent, Chip } from "@heroui/react";

import FocusDeck from "./components/FocusDeck";
import LyricsRoom from "./components/LyricsRoom";
import NotificationGate from "./components/NotificationGate";
import { DEFAULT_LYRICS_SONG, SONG_CATEGORIES, SONG_LIBRARY } from "./data/songCatalog";
import {
  fetchTrackPreview,
  getNotificationMessage,
  parseGoals,
  parseYouTubeInput,
  pickRandomSong,
  playCompletionTone,
} from "./lib/appUtils";
import { fetchLyrics } from "./lib/lyrics";
import {
  getNotificationState,
  registerNotificationWorker,
  requestNotificationPermission,
  showDeviceNotification,
} from "./lib/notifications";

const STORAGE_KEY = "focus-studio-v3";
const NOTIFICATION_GATE_KEY = "focus-studio-notification-gate-dismissed-v3";
const DEFAULT_STREAMS = [
  { id: "lofi-girl", name: "Lofi Girl stream", detail: "Classic study stream", kind: "video", value: "jfKfPfyJRdk" },
  { id: "sweet-girl", name: "Sweet Girl playlist", detail: "Lo-fi playlist", kind: "playlist", value: "PLqknkDPsDk3afCSylXnMIYRRb8UAAMO4F" },
  { id: "deep-zone", name: "Deep Zone Flow", detail: "Ambient focus playlist", kind: "playlist", value: "PLUrnxvhuvpSU0b2YvM4Gf1V3bHnLAcvBj" },
];

function readStoredState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
  } catch {
    return {};
  }
}

function pickStoredNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function pickStoredMode(value) {
  return value === "lyrics" ? "lyrics" : "focus";
}

function pickStoredCategory(value) {
  return SONG_CATEGORIES.some((category) => category.id === value) ? value : "lofi";
}

function pickStoredProvider(value) {
  return ["auto", "lrclib", "lyricsovh"].includes(value) ? value : "auto";
}

function pickStoredSong(value) {
  if (!value?.id) {
    return DEFAULT_LYRICS_SONG;
  }
  return SONG_LIBRARY.find((song) => song.id === value.id) || DEFAULT_LYRICS_SONG;
}

function pickStoredTrack(value, fallback) {
  if (!value || typeof value !== "object") {
    return fallback;
  }
  if (!["video", "playlist"].includes(value.kind) || typeof value.value !== "string") {
    return fallback;
  }
  return {
    id: typeof value.id === "string" ? value.id : fallback.id,
    name: typeof value.name === "string" ? value.name : fallback.name,
    detail: typeof value.detail === "string" ? value.detail : fallback.detail,
    kind: value.kind,
    value: value.value,
  };
}

function App() {
  const [stored] = useState(() => readStoredState());
  const initialSessionType = stored.sessionType === "break" ? "break" : "focus";
  const initialFocusMinutes = pickStoredNumber(stored.focusMinutes, 25);
  const initialBreakMinutes = pickStoredNumber(stored.breakMinutes, 5);
  const initialSessionSeconds =
    initialSessionType === "break" ? initialBreakMinutes * 60 : initialFocusMinutes * 60;

  const [mode, setMode] = useState(pickStoredMode(stored.mode));
  const [focusMinutes, setFocusMinutes] = useState(initialFocusMinutes);
  const [breakMinutes, setBreakMinutes] = useState(initialBreakMinutes);
  const [sessionType, setSessionType] = useState(initialSessionType);
  const [remaining, setRemaining] = useState(pickStoredNumber(stored.remaining, initialSessionSeconds));
  const [sessionTotal, setSessionTotal] = useState(pickStoredNumber(stored.sessionTotal, initialSessionSeconds));
  const [running, setRunning] = useState(false);
  const [goalText, setGoalText] = useState(stored.goalText || "Finish chapter notes\nReview formulas\nTake a five minute reset");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [streamTrack, setStreamTrack] = useState(pickStoredTrack(stored.streamTrack, DEFAULT_STREAMS[0]));
  const [notificationState, setNotificationState] = useState(getNotificationState());
  const [notificationGateDismissed, setNotificationGateDismissed] = useState(localStorage.getItem(NOTIFICATION_GATE_KEY) === "true");
  const [lyricsCategory, setLyricsCategory] = useState(pickStoredCategory(stored.lyricsCategory));
  const [currentSong, setCurrentSong] = useState(pickStoredSong(stored.currentSong));
  const [providerChoice, setProviderChoice] = useState(pickStoredProvider(stored.providerChoice));
  const [musicMessage, setMusicMessage] = useState(null);
  const [lyricsState, setLyricsState] = useState({ status: "idle", text: "", providerLabel: "", message: "Pick a song and the app will grab lyrics with provider fallback." });
  const [previewState, setPreviewState] = useState({ status: "idle", previewUrl: "", artwork: "", externalUrl: "", album: "", error: "" });

  const timerRef = useRef(null);
  const registrationRef = useRef(null);

  const goalItems = parseGoals(goalText);
  const isWideTimer = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`.length > 5;
  const shouldShowGate = notificationState === "default" && !notificationGateDismissed;
  const notificationMessage = getNotificationMessage(notificationState);
  const categoryCount = SONG_LIBRARY.filter((song) => song.category === lyricsCategory).length;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode,
        focusMinutes,
        breakMinutes,
        sessionType,
        remaining,
        sessionTotal,
        goalText,
        streamTrack,
        lyricsCategory,
        currentSong,
        providerChoice,
      }),
    );
  }, [breakMinutes, currentSong, focusMinutes, goalText, lyricsCategory, mode, providerChoice, remaining, sessionTotal, sessionType, streamTrack]);

  useEffect(() => {
    let cancelled = false;
    registerNotificationWorker()
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;
        setNotificationState(getNotificationState());
      })
      .catch(() => setNotificationState(getNotificationState()));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncNotificationState = () => {
      setNotificationState(getNotificationState());
    };

    window.addEventListener("focus", syncNotificationState);
    document.addEventListener("visibilitychange", syncNotificationState);

    return () => {
      window.removeEventListener("focus", syncNotificationState);
      document.removeEventListener("visibilitychange", syncNotificationState);
    };
  }, []);

  useEffect(() => {
    if (!running) {
      window.clearInterval(timerRef.current);
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timerRef.current);
          setRunning(false);
          const nextType = sessionType === "focus" ? "break" : "focus";
          const nextMinutes = nextType === "focus" ? focusMinutes : breakMinutes;
          const nextSeconds = nextMinutes * 60;
          setSessionType(nextType);
          setSessionTotal(nextSeconds);
          playCompletionTone();
          showDeviceNotification(registrationRef.current, {
            title: sessionType === "focus" ? "Focus block done" : "Break done",
            body: sessionType === "focus" ? "Time to stand up, stretch, or flip into your break." : "Break is over. Pull the next task back into view.",
            tag: "focus-studio-finish",
          }).catch(() => {});
          return nextSeconds;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerRef.current);
  }, [breakMinutes, focusMinutes, running, sessionType]);

  useEffect(() => {
    let cancelled = false;
    setLyricsState({ status: "loading", text: "", providerLabel: "", message: "Checking lyric providers..." });
    setPreviewState({ status: "loading", previewUrl: "", artwork: "", externalUrl: "", album: "", error: "" });

    fetchLyrics(currentSong, providerChoice)
      .then((result) => {
        if (cancelled) return;
        setLyricsState({
          status: result.isInstrumental ? "instrumental" : "success",
          text: result.text,
          providerLabel: result.providerLabel,
          message: result.isInstrumental ? result.text : "",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setLyricsState({ status: "error", text: "", providerLabel: "", message: error.message || "No lyric provider found this track." });
      });

    fetchTrackPreview(currentSong)
      .then((result) => {
        if (cancelled) return;
        setPreviewState({ status: "success", ...result, error: "" });
      })
      .catch((error) => {
        if (cancelled) return;
        setPreviewState({ status: "error", previewUrl: "", artwork: "", externalUrl: "", album: "", error: error.message || "No preview clip found for this song." });
      });

    return () => {
      cancelled = true;
    };
  }, [currentSong, providerChoice]);

  function setPresetSession(type) {
    const minutes = type === "focus" ? focusMinutes : breakMinutes;
    setSessionType(type);
    setRunning(false);
    setSessionTotal(minutes * 60);
    setRemaining(minutes * 60);
  }

  function adjustTimer(deltaMinutes) {
    setRemaining((current) => {
      const next = Math.max(60, current + deltaMinutes * 60);
      if (deltaMinutes > 0) {
        setSessionTotal((baseline) => Math.max(baseline, next));
      }
      return next;
    });
  }

  async function enableNotifications() {
    const state = await requestNotificationPermission();
    setNotificationState(state);
    if (state === "granted") {
      setNotificationGateDismissed(true);
      localStorage.setItem(NOTIFICATION_GATE_KEY, "true");
    }
  }

  function dismissNotificationGate() {
    setNotificationGateDismissed(true);
    localStorage.setItem(NOTIFICATION_GATE_KEY, "true");
    setNotificationState(getNotificationState());
  }

  function loadYouTubeTrack() {
    const parsed = parseYouTubeInput(youtubeInput);
    if (parsed) {
      setStreamTrack(parsed);
      setYoutubeInput("");
      setMusicMessage({ kind: "success", text: `${parsed.name} is ready in the player.` });
      return;
    }

    setMusicMessage({
      kind: "error",
      text: "Paste a full YouTube video or playlist URL. Short text searches will not load here.",
    });
  }

  return (
    <div className="min-h-screen bg-[#07050d] text-white">
      <div className="ambient-stage">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="grid-fade" />
      </div>

      {shouldShowGate ? <NotificationGate message={notificationMessage} onEnable={enableNotifications} onDismiss={dismissNotificationGate} /> : null}

      <main className={`mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 ${shouldShowGate ? "pointer-events-none blur-sm" : ""}`}>
        <header className="hero-shell">
          <div className="hero-copy">
            <Chip className="status-chip" radius="full" variant="flat">
              focus.studio
            </Chip>
            <h1 className="hero-title">Timer, tasks, YouTube beats, and a lyric room when you want an actual song.</h1>
            <p className="hero-body">
              No fake productivity copy. Set your block, trim it while it runs, keep your goals in
              view, and swap into lyrics mode when silence stops helping.
            </p>
            <div className="hero-actions">
              <Button className="hero-primary" radius="full" color="secondary" onPress={() => setRunning((value) => !value)}>
                {running ? "Pause timer" : "Start timer"}
              </Button>
              <Button className="hero-secondary" radius="full" variant="bordered" onPress={() => setMode(mode === "focus" ? "lyrics" : "focus")}>
                {mode === "focus" ? "Open lyrics mode" : "Back to focus mode"}
              </Button>
            </div>
          </div>

          <Card className="hero-stat-card">
            <CardContent className="gap-5">
              <div>
                <p className="metric-label">notification state</p>
                <p className="metric-value">{notificationState}</p>
                <p className="metric-copy">{notificationMessage}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="mini-metric"><span>{focusMinutes}m</span><small>focus default</small></div>
                <div className="mini-metric"><span>{breakMinutes}m</span><small>break default</small></div>
                <div className="mini-metric"><span>{goalItems.length}</span><small>goals visible</small></div>
                <div className="mini-metric"><span>{categoryCount}</span><small>{lyricsCategory} songs</small></div>
              </div>
            </CardContent>
          </Card>
        </header>

        {notificationState !== "granted" ? (
          <div className="notice-banner">
            <span>{notificationMessage}</span>
            {notificationState === "default" ? (
              <Button size="sm" radius="full" color="secondary" onPress={enableNotifications}>
                enable
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="mode-row">
          <Button radius="full" className={mode === "focus" ? "mode-chip active" : "mode-chip"} variant={mode === "focus" ? "solid" : "bordered"} color="secondary" onPress={() => setMode("focus")}>
            Focus deck
          </Button>
          <Button radius="full" className={mode === "lyrics" ? "mode-chip active" : "mode-chip"} variant={mode === "lyrics" ? "solid" : "bordered"} color="secondary" onPress={() => setMode("lyrics")}>
            Lyrics room
          </Button>
        </div>

        {mode === "focus" ? (
          <FocusDeck
            breakMinutes={breakMinutes}
            focusMinutes={focusMinutes}
            goalItems={goalItems}
            goalText={goalText}
            isWideTimer={isWideTimer}
            onAdjustTimer={adjustTimer}
            onLoadYouTubeTrack={loadYouTubeTrack}
            onSetBreakMinutes={(next) => {
              setBreakMinutes(next);
              if (!running && sessionType === "break") {
                setSessionTotal(next * 60);
                setRemaining(next * 60);
              }
            }}
            onSetFocusMinutes={(next) => {
              setFocusMinutes(next);
              if (!running && sessionType === "focus") {
                setSessionTotal(next * 60);
                setRemaining(next * 60);
              }
            }}
            onSetGoalText={setGoalText}
            onSetPresetSession={setPresetSession}
            onSetRunning={setRunning}
            onSetStreamTrack={setStreamTrack}
            onSetYoutubeInput={setYoutubeInput}
            musicMessage={musicMessage}
            remaining={remaining}
            running={running}
            sessionTotal={sessionTotal}
            sessionType={sessionType}
            streams={DEFAULT_STREAMS}
            streamTrack={streamTrack}
            youtubeInput={youtubeInput}
          />
        ) : (
          <LyricsRoom
            categoryCount={categoryCount}
            currentSong={currentSong}
            lyricsCategory={lyricsCategory}
            lyricsState={lyricsState}
            onSetCurrentSong={setCurrentSong}
            onSetLyricsCategory={setLyricsCategory}
            onSetProviderChoice={setProviderChoice}
            onShuffleSong={() => setCurrentSong(pickRandomSong(lyricsCategory))}
            previewState={previewState}
            providerChoice={providerChoice}
            randomSongForCategory={pickRandomSong}
          />
        )}
      </main>
    </div>
  );
}

export default App;

import { useEffect, useMemo, useRef, useState } from "react";

import FocusDeck from "./components/FocusDeck";
import LyricsRoom from "./components/LyricsRoom";
import NotificationGate from "./components/NotificationGate";
import { DEFAULT_LYRICS_SONG, SONG_CATEGORIES, SONG_LIBRARY } from "./data/songCatalog";
import {
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
import {
  buildYouTubeMusicSearchUrl,
  buildYouTubeSearchUrl,
  loadYouTubeIframeApi,
  resolveYouTubeCandidates,
} from "./lib/youtube";

const STORAGE_KEY = "focus-studio-v4";
const NOTIFICATION_GATE_KEY = "focus-studio-notification-gate-dismissed-v3";
const THEME_SCENES = [
  {
    id: "lofi-study",
    label: "Lofi Study",
    note: "Soft light, low contrast, easy focus.",
    kicker: "Late-night desk",
  },
  {
    id: "anime-night",
    label: "Anime Night",
    note: "City glow and a little more dreaminess.",
    kicker: "Window seat",
  },
  {
    id: "autumn-study",
    label: "Autumn Study",
    note: "Warm leaves, lamp light, slower energy.",
    kicker: "Autumn room",
  },
  {
    id: "rainy-window",
    label: "Rainy Window",
    note: "Cool glass, dim reflections, steady calm.",
    kicker: "Rain on glass",
  },
  {
    id: "dark-focus",
    label: "Dark Focus",
    note: "Minimal and quiet when you want less.",
    kicker: "After hours",
  },
];
const AMBIENT_PARTICLES = [
  { left: "5%", size: "8px", delay: "-2s", duration: "17s", drift: "22px" },
  { left: "12%", size: "12px", delay: "-7s", duration: "23s", drift: "30px" },
  { left: "19%", size: "10px", delay: "-11s", duration: "19s", drift: "18px" },
  { left: "28%", size: "14px", delay: "-1s", duration: "27s", drift: "26px" },
  { left: "37%", size: "9px", delay: "-14s", duration: "18s", drift: "24px" },
  { left: "45%", size: "16px", delay: "-5s", duration: "25s", drift: "35px" },
  { left: "56%", size: "11px", delay: "-9s", duration: "21s", drift: "16px" },
  { left: "63%", size: "7px", delay: "-6s", duration: "15s", drift: "14px" },
  { left: "71%", size: "13px", delay: "-15s", duration: "24s", drift: "28px" },
  { left: "79%", size: "9px", delay: "-3s", duration: "18s", drift: "20px" },
  { left: "87%", size: "15px", delay: "-13s", duration: "26s", drift: "34px" },
  { left: "94%", size: "8px", delay: "-4s", duration: "16s", drift: "18px" },
];
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

function pickStoredMusicSource(value) {
  return value === "ytmusic" ? "ytmusic" : "youtube";
}

function pickStoredTheme(value) {
  return THEME_SCENES.some((scene) => scene.id === value) ? value : "lofi-study";
}

function renderNotificationShortLabel(state) {
  if (state === "granted") {
    return "On";
  }
  if (state === "default") {
    return "Ask";
  }
  return "Limited";
}

function renderHeaderCopy(mode, currentSong) {
  if (mode === "lyrics") {
    return {
      title: currentSong.title,
      detail: `${currentSong.artist} with live lyrics, full playback, and a reading view meant to hold your attention for a while.`,
    };
  }

  return {
    title: "A calmer place to study with music still in reach.",
    detail: "Keep the timer in the middle, your tasks nearby, and a full lyrics room ready when the song starts pulling focus.",
  };
}

function formatLocalClock(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
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
  const [goalText, setGoalText] = useState(
    stored.goalText || "Finish chapter notes\nReview formulas\nTake a five minute reset",
  );
  const [youtubeInput, setYoutubeInput] = useState("");
  const [streamTrack, setStreamTrack] = useState(pickStoredTrack(stored.streamTrack, DEFAULT_STREAMS[0]));
  const [notificationState, setNotificationState] = useState(getNotificationState());
  const [notificationGateDismissed, setNotificationGateDismissed] = useState(
    localStorage.getItem(NOTIFICATION_GATE_KEY) === "true",
  );
  const [lyricsCategory, setLyricsCategory] = useState(pickStoredCategory(stored.lyricsCategory));
  const [currentSong, setCurrentSong] = useState(pickStoredSong(stored.currentSong));
  const [providerChoice, setProviderChoice] = useState(pickStoredProvider(stored.providerChoice));
  const [musicSource, setMusicSource] = useState(pickStoredMusicSource(stored.musicSource));
  const [theme, setTheme] = useState(pickStoredTheme(stored.theme));
  const [musicMessage, setMusicMessage] = useState(null);
  const [localClock, setLocalClock] = useState(() => new Date());
  const [youtubeDebug, setYoutubeDebug] = useState({
    status: "idle",
    configured: false,
    route: "/api/debug/youtube-status",
    host: "",
    protocol: "",
    source: "youtube",
    hint: "",
    advice: "",
    error: "",
  });
  const [routeCheck, setRouteCheck] = useState({
    status: "idle",
    summary: "",
    detail: "",
    candidateCount: 0,
  });
  const [lyricsState, setLyricsState] = useState({
    status: "idle",
    text: "",
    providerLabel: "",
    hasSyncedLyrics: false,
    syncedLines: [],
    message: "Pick a song and the app will grab lyrics with provider fallback.",
  });
  const [playbackState, setPlaybackState] = useState({
    status: "idle",
    candidates: [],
    candidateIndex: 0,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    error: "",
    resolvedTitle: "",
    resolvedChannel: "",
  });

  const timerRef = useRef(null);
  const registrationRef = useRef(null);
  const playerMountRef = useRef(null);
  const playerRef = useRef(null);
  const playerPollRef = useRef(null);

  const goalItems = parseGoals(goalText);
  const shouldShowGate = notificationState === "default" && !notificationGateDismissed;
  const notificationMessage = getNotificationMessage(notificationState);
  const categoryCount = SONG_LIBRARY.filter((song) => song.category === lyricsCategory).length;
  const playbackLabel = running
    ? `${sessionType === "focus" ? "Focus" : "Break"} running`
    : `${sessionType === "focus" ? "Focus" : "Break"} ready`;
  const headerCopy = renderHeaderCopy(mode, currentSong);
  const activeTheme = THEME_SCENES.find((scene) => scene.id === theme) || THEME_SCENES[0];

  const activeLyricIndex = useMemo(() => {
    if (!lyricsState.hasSyncedLyrics || !lyricsState.syncedLines.length) {
      return -1;
    }

    let activeIndex = -1;
    for (let index = 0; index < lyricsState.syncedLines.length; index += 1) {
      if (playbackState.currentTime >= lyricsState.syncedLines[index].time) {
        activeIndex = index;
      } else {
        break;
      }
    }
    return activeIndex;
  }, [lyricsState.hasSyncedLyrics, lyricsState.syncedLines, playbackState.currentTime]);

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
        musicSource,
        theme,
      }),
    );
  }, [
    breakMinutes,
    currentSong,
    focusMinutes,
    goalText,
    lyricsCategory,
    mode,
    musicSource,
    providerChoice,
    remaining,
    sessionTotal,
    sessionType,
    streamTrack,
    theme,
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setLocalClock(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    registerNotificationWorker()
      .then((registration) => {
        if (cancelled) {
          return;
        }
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
            body:
              sessionType === "focus"
                ? "Time to stand up, stretch, or flip into your break."
                : "Break is over. Pull the next task back into view.",
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

    setLyricsState({
      status: "loading",
      text: "",
      providerLabel: "",
      hasSyncedLyrics: false,
      syncedLines: [],
      message: "Checking lyric providers...",
    });

    fetchLyrics(currentSong, providerChoice)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setLyricsState({
          status: result.isInstrumental ? "instrumental" : "success",
          text: result.text,
          providerLabel: result.providerLabel,
          hasSyncedLyrics: result.hasSyncedLyrics,
          syncedLines: result.syncedLines,
          message: result.isInstrumental
            ? result.text
            : result.hasSyncedLyrics
              ? "Synced lines are following the song."
              : "This source only had plain lyrics.",
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setLyricsState({
          status: "error",
          text: "",
          providerLabel: "",
          hasSyncedLyrics: false,
          syncedLines: [],
          message: error.message || "No lyric provider found this track.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currentSong, providerChoice]);

  useEffect(() => {
    if (mode !== "lyrics") {
      window.clearInterval(playerPollRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return undefined;
    }

    let cancelled = false;

    setPlaybackState({
      status: "loading",
      candidates: [],
      candidateIndex: 0,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      error: "",
      resolvedTitle: "",
      resolvedChannel: "",
    });
    setRouteCheck({
      status: "loading",
      summary: "Checking the song lookup for this track.",
      detail: "",
      candidateCount: 0,
    });

    resolveYouTubeCandidates(currentSong, musicSource)
      .then(async (payload) => {
        if (cancelled) {
          return;
        }

        const firstCandidate = payload.candidates?.[0];
        setRouteCheck({
          status: "ready",
          summary: `${payload.candidates?.length || 0} playable result${
            payload.candidates?.length === 1 ? "" : "s"
          } found.`,
          detail: firstCandidate
            ? `Top match: ${firstCandidate.title}${
                firstCandidate.channelTitle ? ` by ${firstCandidate.channelTitle}` : ""
              }`
            : "The lookup returned no playable match.",
          candidateCount: payload.candidates?.length || 0,
        });
        await loadCandidate(payload.candidates, 0);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setRouteCheck({
          status: "error",
          summary: error.message?.includes("YOUTUBE_API_KEY")
            ? "The song route answered, but the runtime key is missing."
            : error.message?.includes("Failed to fetch")
              ? "The app could not reach the song route."
              : "The song route answered, but playback setup failed.",
          detail: error.message || "The song lookup failed before playback could start.",
          candidateCount: 0,
        });
        setPlaybackState({
          status: "error",
          candidates: [],
          candidateIndex: 0,
          currentTime: 0,
          duration: 0,
          isPlaying: false,
          error: error.message || "Could not resolve a YouTube result for this song.",
          resolvedTitle: "",
          resolvedChannel: "",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currentSong, mode, musicSource]);

  useEffect(() => {
    if (mode !== "lyrics") {
      return undefined;
    }

    let cancelled = false;

    setYoutubeDebug((previous) => ({
      ...previous,
      status: "loading",
      error: "",
      source: musicSource,
    }));

    fetch(`/api/debug/youtube-status?source=${encodeURIComponent(musicSource)}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setYoutubeDebug({
            status: "error",
            configured: false,
            route: "/api/debug/youtube-status",
            host: "",
            protocol: "",
            source: musicSource,
            hint: "",
            advice: "",
            error: payload.error || "The debug route failed.",
          });
          return;
        }

        setYoutubeDebug({
          status: "ready",
          configured: Boolean(payload.configured),
          route: payload.route || "/api/debug/youtube-status",
          host: payload.host || "",
          protocol: payload.protocol || "",
          source: payload.source || musicSource,
          hint: payload.hint || "",
          advice: payload.advice || "",
          error: "",
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setYoutubeDebug({
          status: "error",
          configured: false,
          route: "/api/debug/youtube-status",
          host: "",
          protocol: "",
          source: musicSource,
          hint: "",
          advice: "",
          error: error.message || "Could not reach the debug route.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, musicSource]);

  useEffect(() => {
    return () => {
      window.clearInterval(playerPollRef.current);
      window.clearInterval(timerRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  async function mountPlayer(videoId, candidates, candidateIndex) {
    const YT = await loadYouTubeIframeApi();
    if (!playerMountRef.current) {
      throw new Error("Player mount point is missing.");
    }

    const activeCandidate = candidates[candidateIndex];

    const beginPolling = () => {
      window.clearInterval(playerPollRef.current);
      playerPollRef.current = window.setInterval(() => {
        if (!playerRef.current?.getCurrentTime) {
          return;
        }

        const currentTime = playerRef.current.getCurrentTime() || 0;
        const duration = playerRef.current.getDuration() || 0;

        setPlaybackState((previous) => ({
          ...previous,
          currentTime,
          duration,
        }));
      }, 240);
    };

    const handlePlayerStateChange = (event) => {
      setPlaybackState((previous) => ({
        ...previous,
        isPlaying: event.data === YT.PlayerState.PLAYING,
      }));

      if (event.data === YT.PlayerState.PLAYING) {
        beginPolling();
      }

      if (event.data === YT.PlayerState.ENDED) {
        window.clearInterval(playerPollRef.current);
      }
    };

    const handlePlayerError = () => {
      loadCandidate(candidates, candidateIndex + 1).catch((error) => {
        setPlaybackState((previous) => ({
          ...previous,
          status: "error",
          isPlaying: false,
          error: error.message,
        }));
      });
    };

    if (!playerRef.current) {
      playerRef.current = new YT.Player(playerMountRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(65);
            event.target.playVideo();
            beginPolling();
          },
          onStateChange: handlePlayerStateChange,
          onError: handlePlayerError,
        },
      });
    } else {
      playerRef.current.loadVideoById(videoId);
      if (playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
      beginPolling();
    }

    setPlaybackState({
      status: "ready",
      candidates,
      candidateIndex,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
      error: "",
      resolvedTitle: activeCandidate?.title || currentSong.title,
      resolvedChannel: activeCandidate?.channelTitle || "",
    });
  }

  async function loadCandidate(candidates, candidateIndex) {
    if (!Array.isArray(candidates) || candidateIndex >= candidates.length) {
      throw new Error(
        "None of the YouTube results were embeddable. Add a Worker YouTube API key, or open the song in YouTube Music directly.",
      );
    }

    const candidate = candidates[candidateIndex];
    await mountPlayer(candidate.videoId, candidates, candidateIndex);
  }

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

  function toggleLyricPlayback() {
    if (!playerRef.current) {
      return;
    }

    if (playbackState.isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  function seekToLyric(time) {
    if (!playerRef.current?.seekTo) {
      return;
    }

    playerRef.current.seekTo(time, true);
    playerRef.current.playVideo();
  }

  return (
    <div className={`app ${mode === "lyrics" ? "app--lyrics" : ""}`} data-theme={theme}>
      <div className="app__backdrop" aria-hidden="true">
        <div className="app__backdrop-glow app__backdrop-glow--one" />
        <div className="app__backdrop-glow app__backdrop-glow--two" />
        <div className="app__ambient">
          {AMBIENT_PARTICLES.map((particle, index) => (
            <span
              key={`${particle.left}-${index}`}
              className="ambient-particle"
              style={{
                "--ambient-left": particle.left,
                "--ambient-size": particle.size,
                "--ambient-delay": particle.delay,
                "--ambient-duration": particle.duration,
                "--ambient-drift": particle.drift,
              }}
            />
          ))}
        </div>
      </div>

      {shouldShowGate ? (
        <NotificationGate
          message={notificationMessage}
          onEnable={enableNotifications}
          onDismiss={dismissNotificationGate}
        />
      ) : null}

      <div className={`app__frame ${shouldShowGate ? "app__frame--locked" : ""}`}>
        <header className="app-masthead">
          <div className="app-topbar">
            <div className="app-wordmark">focus.studio</div>
            <nav className="app-toolbar__nav" aria-label="Mode switch">
              <button
                type="button"
                className={mode === "focus" ? "tab-button is-active" : "tab-button"}
                onClick={() => setMode("focus")}
              >
                Timer
              </button>
              <button
                type="button"
                className={mode === "lyrics" ? "tab-button is-active" : "tab-button"}
                onClick={() => setMode("lyrics")}
              >
                Lyrics
              </button>
            </nav>
            <div className="app-status-chip">
              <span>{activeTheme.kicker}</span>
              <strong>{formatLocalClock(localClock)}</strong>
            </div>
          </div>

          <div className="app-headline">
            <div className="app-kicker">{activeTheme.label}</div>
            <h1 className="app-title">{headerCopy.title}</h1>
            <p className="app-subtitle">{headerCopy.detail}</p>
          </div>

          <div className="scene-strip" aria-label="Theme selection">
            {THEME_SCENES.map((scene) => (
              <button
                key={scene.id}
                type="button"
                className={theme === scene.id ? "scene-card is-active" : "scene-card"}
                onClick={() => setTheme(scene.id)}
              >
                <strong>{scene.label}</strong>
                <span>{scene.note}</span>
              </button>
            ))}
          </div>

          <div className="app-toolbar__summary">
            <div className="summary-block">
              <span>Scene</span>
              <strong>{activeTheme.label}</strong>
            </div>
            <div className="summary-block">
              <span>Session</span>
              <strong>{playbackLabel}</strong>
            </div>
            <div className="summary-block">
              <span>Alerts</span>
              <strong>{renderNotificationShortLabel(notificationState)}</strong>
            </div>
            <div className="summary-block">
              <span>Song library</span>
              <strong>{categoryCount} loaded</strong>
            </div>
          </div>
        </header>

        {notificationState !== "granted" ? (
          <div className="notice-banner">
            <div>
              <strong>Notifications are limited.</strong>
              <span>{notificationMessage}</span>
            </div>
            {notificationState === "default" ? (
              <button type="button" className="button button--primary" onClick={enableNotifications}>
                Enable
              </button>
            ) : null}
          </div>
        ) : null}

        {mode === "focus" ? (
          <FocusDeck
            breakMinutes={breakMinutes}
            currentSong={currentSong}
            focusMinutes={focusMinutes}
            goalItems={goalItems}
            goalText={goalText}
            onAdjustTimer={adjustTimer}
            onLoadYouTubeTrack={loadYouTubeTrack}
            onOpenLyrics={() => setMode("lyrics")}
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
            themeMeta={activeTheme}
            youtubeInput={youtubeInput}
          />
        ) : (
          <LyricsRoom
            activeLyricIndex={activeLyricIndex}
            categoryCount={categoryCount}
            currentSong={currentSong}
            lyricsCategory={lyricsCategory}
            lyricsState={lyricsState}
            musicSource={musicSource}
            routeCheck={routeCheck}
            youtubeDebug={youtubeDebug}
            onSeekToLyric={seekToLyric}
            onSetCurrentSong={setCurrentSong}
            onSetLyricsCategory={setLyricsCategory}
            onSetMusicSource={setMusicSource}
            onSetProviderChoice={setProviderChoice}
            onShuffleSong={() => setCurrentSong(pickRandomSong(lyricsCategory))}
            onTogglePlayback={toggleLyricPlayback}
            playbackState={playbackState}
            playerMountRef={playerMountRef}
            providerChoice={providerChoice}
            randomSongForCategory={pickRandomSong}
            themeMeta={activeTheme}
            youtubeMusicUrl={buildYouTubeMusicSearchUrl(currentSong)}
            youtubeSearchUrl={buildYouTubeSearchUrl(currentSong)}
          />
        )}
      </div>
    </div>
  );
}

export default App;

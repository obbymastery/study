import { Button, Card, CardContent, CardHeader, Chip, Slider } from "@heroui/react";

import { buildEmbedUrl, formatTime, getRingMetrics } from "../lib/appUtils";

function FocusDeck({
  breakMinutes,
  focusMinutes,
  goalItems,
  goalText,
  isWideTimer,
  onAdjustTimer,
  onLoadYouTubeTrack,
  onSetBreakMinutes,
  onSetFocusMinutes,
  onSetGoalText,
  onSetPresetSession,
  onSetRunning,
  onSetStreamTrack,
  onSetYoutubeInput,
  musicMessage,
  remaining,
  running,
  sessionTotal,
  sessionType,
  streams,
  streamTrack,
  youtubeInput,
}) {
  const progressValue = Math.min(100, Math.max(0, (remaining / Math.max(sessionTotal, 1)) * 100));
  const ring = getRingMetrics(isWideTimer, progressValue);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <Card className="panel panel-timer">
        <CardHeader className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">timer</p>
            <h2 className="panel-title">{sessionType === "focus" ? "Focus" : "Break"} block</h2>
          </div>
          <Chip className="rounded-full bg-white/10 text-white" variant="flat">
            live adjust works while running
          </Chip>
        </CardHeader>
        <CardContent className="gap-6">
          <div className={`timer-shell ${isWideTimer ? "wide" : ""}`}>
            <svg className="timer-ring" viewBox="0 0 280 280" aria-hidden="true">
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff62c0" />
                  <stop offset="100%" stopColor="#6f7cff" />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r={ring.radius} className="timer-track" />
              <circle
                cx="140"
                cy="140"
                r={ring.radius}
                className="timer-progress"
                strokeDasharray={ring.circumference}
                strokeDashoffset={ring.dashOffset}
              />
            </svg>
            <div className="timer-core">
              <span className="timer-kicker">{sessionType === "focus" ? "heads down" : "breathe"}</span>
              <span className="timer-value">{formatTime(remaining)}</span>
              <span className="timer-note">{running ? "clock is moving" : "clock is waiting"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button radius="full" color="secondary" onPress={() => onSetRunning((value) => !value)}>
              {running ? "Pause" : "Start"}
            </Button>
            <Button radius="full" variant="bordered" onPress={() => onSetPresetSession("focus")}>
              Focus preset
            </Button>
            <Button radius="full" variant="bordered" onPress={() => onSetPresetSession("break")}>
              Break preset
            </Button>
          </div>

          <div className="adjust-grid">
            {[-15, -5, 5, 10, 15].map((amount) => (
              <Button key={amount} radius="full" variant="bordered" className="adjust-chip" onPress={() => onAdjustTimer(amount)}>
                {amount > 0 ? `+${amount}` : amount} min
              </Button>
            ))}
          </div>

          <div className="slider-grid">
            <div className="slider-wrap">
              <div className="slider-label-row">
                <span>focus default</span>
                <strong>{focusMinutes} min</strong>
              </div>
              <Slider aria-label="Focus minutes" color="secondary" minValue={10} maxValue={180} step={5} value={focusMinutes} onChange={(value) => onSetFocusMinutes(Number(value))} />
            </div>

            <div className="slider-wrap">
              <div className="slider-label-row">
                <span>break default</span>
                <strong>{breakMinutes} min</strong>
              </div>
              <Slider aria-label="Break minutes" color="secondary" minValue={5} maxValue={45} step={5} value={breakMinutes} onChange={(value) => onSetBreakMinutes(Number(value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="panel panel-goals">
          <CardHeader className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">today&apos;s goals</p>
              <h2 className="panel-title">Keep the next few things visible.</h2>
            </div>
            <Chip className="rounded-full bg-black/20 text-white" variant="flat">
              {goalItems.length} pinned
            </Chip>
          </CardHeader>
          <CardContent className="gap-4">
            <label className="field-label" htmlFor="goalText">
              Goals
            </label>
            <textarea
              id="goalText"
              rows={5}
              value={goalText}
              onChange={(event) => onSetGoalText(event.target.value)}
              placeholder="One task per line"
              className="field-input field-input-area"
            />
            <div className="goal-list">
              {goalItems.map((goal, index) => (
                <div className="goal-pill" key={`${goal}-${index}`}>
                  <span className="goal-index">0{index + 1}</span>
                  <span>{goal}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel panel-music">
          <CardHeader className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">youtube focus</p>
              <h2 className="panel-title">Streams and playlists for the background layer.</h2>
            </div>
            <Chip className="rounded-full bg-white/10 text-white" variant="flat">
              direct YouTube
            </Chip>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="stream-list">
              {streams.map((stream) => (
                <button
                  key={stream.id}
                  type="button"
                  className={streamTrack.value === stream.value ? "stream-card active" : "stream-card"}
                  onClick={() => onSetStreamTrack(stream)}
                >
                  <strong>{stream.name}</strong>
                  <span>{stream.detail}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 max-sm:flex-col">
              <div className="field-wrap">
                <label className="field-label" htmlFor="youtubeInput">
                  Paste a YouTube link
                </label>
                <input
                  id="youtubeInput"
                  type="url"
                  inputMode="url"
                  value={youtubeInput}
                  onChange={(event) => onSetYoutubeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onLoadYouTubeTrack();
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="field-input"
                />
              </div>
              <Button className="mt-auto max-sm:w-full" color="secondary" radius="full" onPress={onLoadYouTubeTrack}>
                Load
              </Button>
            </div>
            {musicMessage ? (
              <p className={`tiny-note ${musicMessage.kind === "error" ? "text-[#ffd0de]" : "text-white/72"}`}>
                {musicMessage.text}
              </p>
            ) : null}

            <div className="player-shell">
              <iframe
                src={buildEmbedUrl(streamTrack)}
                title={streamTrack.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="tiny-note">
              Hosted HTTPS works best for both YouTube embeds and notification permission prompts.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default FocusDeck;

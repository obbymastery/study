import { buildEmbedUrl, formatTime } from "../lib/appUtils";

function FocusDeck({
  breakMinutes,
  currentSong,
  focusMinutes,
  goalItems,
  goalText,
  onAdjustTimer,
  onLoadYouTubeTrack,
  onOpenLyrics,
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

  return (
    <section className="focus-view">
      <section className="focus-hero surface surface--hero">
        <div className="focus-hero__top">
          <div className="focus-hero__intro">
            <span>{sessionType === "focus" ? "Focus session" : "Break session"}</span>
            <strong>The clock stays adjustable while it runs.</strong>
          </div>
          <div className="focus-hero__actions">
            <button type="button" className="button button--primary" onClick={() => onSetRunning((value) => !value)}>
              {running ? "Pause" : "Start"}
            </button>
            <button type="button" className="button" onClick={() => onSetPresetSession("focus")}>
              Focus preset
            </button>
            <button type="button" className="button" onClick={() => onSetPresetSession("break")}>
              Break preset
            </button>
          </div>
        </div>

        <div className="timer-panel timer-panel--hero">
          <div className="time-display">{formatTime(remaining)}</div>
          <div className="progress-rail" aria-hidden="true">
            <div style={{ width: `${progressValue}%` }} />
          </div>
          <div className="timer-panel__status">
            <span>{running ? "Running" : "Paused"}</span>
            <span>{sessionType === "focus" ? "Focus" : "Break"}</span>
          </div>
        </div>

        <div className="quick-adjust quick-adjust--centered">
          {[-15, -5, 5, 10, 15].map((amount) => (
            <button key={amount} type="button" className="button button--small" onClick={() => onAdjustTimer(amount)}>
              {amount > 0 ? `+${amount}` : amount} min
            </button>
          ))}
        </div>

        <div className="focus-hero__song">
          <div className="focus-hero__song-copy">
            <span>Current song</span>
            <strong>{currentSong.title}</strong>
            <small>{currentSong.artist}</small>
          </div>
          <button type="button" className="button" onClick={onOpenLyrics}>
            Open lyrics
          </button>
        </div>
      </section>

      <section className="focus-lower">
        <section className="surface">
          <header className="section-head">
            <div>
              <h2>Defaults</h2>
              <p>Set your usual focus and break lengths.</p>
            </div>
          </header>

          <div className="range-grid">
            <label className="range-field">
              <div className="range-field__head">
                <span>Focus length</span>
                <strong>{focusMinutes} min</strong>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={focusMinutes}
                onChange={(event) => onSetFocusMinutes(Number(event.target.value))}
              />
            </label>

            <label className="range-field">
              <div className="range-field__head">
                <span>Break length</span>
                <strong>{breakMinutes} min</strong>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={breakMinutes}
                onChange={(event) => onSetBreakMinutes(Number(event.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="surface">
          <header className="section-head">
            <div>
              <h2>Today</h2>
              <p>Keep the next few tasks in view.</p>
            </div>
            <div className="section-meta">{goalItems.length}/5 visible</div>
          </header>

          <label className="field">
            <span>Tasks</span>
            <textarea
              rows={5}
              value={goalText}
              onChange={(event) => onSetGoalText(event.target.value)}
              placeholder="One task per line"
            />
          </label>

          <div className="goal-list">
            {goalItems.map((goal, index) => (
              <div className="goal-row" key={`${goal}-${index}`}>
                <span className="goal-row__index">{index + 1}</span>
                <span>{goal}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface surface--player">
          <header className="section-head">
            <div>
              <h2>Player</h2>
              <p>Choose a preset or paste your own YouTube link.</p>
            </div>
            <div className="section-meta">YouTube</div>
          </header>

          <div className="stream-list">
            {streams.map((stream) => (
              <button
                key={stream.id}
                type="button"
                className={streamTrack.value === stream.value ? "stream-row is-active" : "stream-row"}
                onClick={() => onSetStreamTrack(stream)}
              >
                <strong>{stream.name}</strong>
                <span>{stream.detail}</span>
              </button>
            ))}
          </div>

          <div className="input-row">
            <label className="field field--compact">
              <span>YouTube link</span>
              <input
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
              />
            </label>
            <button type="button" className="button button--primary" onClick={onLoadYouTubeTrack}>
              Load
            </button>
          </div>

          {musicMessage ? (
            <div className={musicMessage.kind === "error" ? "message message--error" : "message"}>
              {musicMessage.text}
            </div>
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
        </section>
      </section>
    </section>
  );
}

export default FocusDeck;

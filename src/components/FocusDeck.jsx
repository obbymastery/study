import { useState } from "react";

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
  themeMeta,
  youtubeInput,
}) {
  const [showGoals, setShowGoals] = useState(false);
  const [showPlayer, setShowPlayer] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const progressValue = Math.min(100, Math.max(0, (remaining / Math.max(sessionTotal, 1)) * 100));
  const formattedTime = formatTime(remaining);
  const timeDisplayClass = formattedTime.length > 5 ? "time-display time-display--wide" : "time-display";
  const activeGoal = goalItems[0] || "Pick the one thing you want to finish next";

  return (
    <section className="focus-view">
      <section className="focus-room">
        <div className="focus-room__top">
          <button type="button" className="focus-room__task" onClick={() => setShowGoals(true)}>
            <span>Current task</span>
            <strong>{activeGoal}</strong>
          </button>

          <p className="focus-room__quote">{themeMeta.quote}</p>
        </div>

        <div className="focus-room__center">
          <div className="focus-mode-switch">
            <button
              type="button"
              className={sessionType === "focus" ? "mode-pill is-active" : "mode-pill"}
              onClick={() => onSetPresetSession("focus")}
            >
              Focus
            </button>
            <button
              type="button"
              className={sessionType === "break" ? "mode-pill is-active" : "mode-pill"}
              onClick={() => onSetPresetSession("break")}
            >
              Break
            </button>
            <button type="button" className="mode-pill" onClick={onOpenLyrics}>
              Lyrics room
            </button>
          </div>

          <div className="focus-timer">
            <div className={timeDisplayClass}>{formattedTime}</div>
            <div className="focus-timer__status">
              <span>{running ? "Running" : "Paused"}</span>
              <span>{sessionType === "focus" ? "Study block" : "Reset block"}</span>
            </div>
          </div>

          <div className="focus-timer__actions">
            <button type="button" className="button button--primary" onClick={() => onSetRunning((value) => !value)}>
              {running ? "Pause" : "Start"}
            </button>
            <button type="button" className="button" onClick={() => onSetPresetSession(sessionType)}>
              Reset
            </button>
            <button type="button" className="button" onClick={onOpenLyrics}>
              Open lyrics
            </button>
          </div>

          <div className="progress-rail progress-rail--stage" aria-hidden="true">
            <div style={{ width: `${progressValue}%` }} />
          </div>

          <div className="quick-adjust quick-adjust--centered">
            {[-15, -5, 5, 10, 15].map((amount) => (
              <button key={amount} type="button" className="button button--small" onClick={() => onAdjustTimer(amount)}>
                {amount > 0 ? `+${amount}` : amount} min
              </button>
            ))}
          </div>

          <div className="focus-now-playing">
            <span>Now playing</span>
            <strong>{currentSong.title}</strong>
            <small>{currentSong.artist}</small>
          </div>
        </div>

        <div className="focus-room__dock focus-room__dock--left">
          <button type="button" className={showGoals ? "dock-button is-active" : "dock-button"} onClick={() => setShowGoals((value) => !value)}>
            Priorities
          </button>
          <button type="button" className={showPlayer ? "dock-button is-active" : "dock-button"} onClick={() => setShowPlayer((value) => !value)}>
            Player
          </button>
        </div>

        <div className="focus-room__dock focus-room__dock--right">
          <button
            type="button"
            className={showSettings ? "dock-button is-active" : "dock-button"}
            onClick={() => setShowSettings((value) => !value)}
          >
            Timer settings
          </button>
          <div className="focus-room__scene-label">{themeMeta.label}</div>
        </div>

        {showGoals ? (
          <div className="floating-panel floating-panel--goals">
            <header className="panel-head">
              <div>
                <h2>Focus priorities</h2>
                <p>Keep only the tasks that matter tonight.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowGoals(false)} aria-label="Close priorities">
                ×
              </button>
            </header>

            <label className="field">
              <span>Tasks</span>
              <textarea
                rows={6}
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
          </div>
        ) : null}

        {showPlayer ? (
          <div className="floating-panel floating-panel--player">
            <header className="panel-head">
              <div>
                <h2>Ambient player</h2>
                <p>Keep a stream nearby or load a link.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowPlayer(false)} aria-label="Close player">
                ×
              </button>
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
          </div>
        ) : null}

        {showSettings ? (
          <div className="floating-panel floating-panel--settings">
            <header className="panel-head">
              <div>
                <h2>Timer settings</h2>
                <p>Change your usual study rhythm.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowSettings(false)}
                aria-label="Close timer settings"
              >
                ×
              </button>
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
          </div>
        ) : null}
      </section>
    </section>
  );
}

export default FocusDeck;

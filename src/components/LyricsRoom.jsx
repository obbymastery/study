import { useEffect, useRef, useState } from "react";

import { SONG_CATEGORIES } from "../data/songCatalog";
import { providerMeta } from "../lib/lyrics";

function formatClock(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function LyricsRoom({
  activeLyricIndex,
  categoryCount,
  currentSong,
  lyricsCategory,
  lyricsState,
  musicSource,
  routeCheck,
  youtubeDebug,
  onSeekToLyric,
  onSetCurrentSong,
  onSetLyricsCategory,
  onSetMusicSource,
  onSetProviderChoice,
  onShuffleSong,
  onTogglePlayback,
  playbackState,
  playerMountRef,
  providerChoice,
  randomSongForCategory,
  themeMeta,
  youtubeMusicUrl,
  youtubeSearchUrl,
}) {
  const [showLibrary, setShowLibrary] = useState(true);
  const lyricLineRefs = useRef([]);

  useEffect(() => {
    if (activeLyricIndex < 0 || !lyricLineRefs.current[activeLyricIndex]) {
      return;
    }

    lyricLineRefs.current[activeLyricIndex].scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [activeLyricIndex]);

  return (
    <section className="lyrics-view">
      <section className="lyrics-room">
        <div className="lyrics-room__top">
          <div className="lyrics-room__title">
            <span>Lyrics room</span>
            <h1>{currentSong.title}</h1>
            <p>
              {currentSong.artist}
              {lyricsState.providerLabel ? ` | ${lyricsState.providerLabel}` : ""}
              {lyricsState.providerLabel ? ` | ${lyricsState.hasSyncedLyrics ? "synced" : "plain"}` : ""}
            </p>
          </div>
          <p className="lyrics-room__quote">{themeMeta.quote}</p>
        </div>

        {showLibrary ? (
          <aside className="floating-panel floating-panel--library">
            <header className="panel-head">
              <div>
                <h2>Library</h2>
                <p>{categoryCount} songs in this scene.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowLibrary(false)} aria-label="Close library">
                ×
              </button>
            </header>

            <div className="category-list">
              {SONG_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={lyricsCategory === category.id ? "list-button is-active" : "list-button"}
                  onClick={() => {
                    onSetLyricsCategory(category.id);
                    onSetCurrentSong(randomSongForCategory(category.id));
                  }}
                >
                  <strong>{category.label}</strong>
                  <span>{category.blurb}</span>
                </button>
              ))}
            </div>

            <div className="button-row">
              <button type="button" className="button button--primary" onClick={onShuffleSong}>
                Shuffle
              </button>
              <button
                type="button"
                className="button"
                onClick={() => onSetCurrentSong(randomSongForCategory(lyricsCategory))}
              >
                Next
              </button>
            </div>
          </aside>
        ) : (
          <button type="button" className="drawer-tab drawer-tab--left" onClick={() => setShowLibrary(true)}>
            Library
          </button>
        )}

        <aside className="floating-panel floating-panel--playback">
          <header className="panel-head">
            <div>
              <h2>Playback</h2>
              <p>{playbackState.resolvedTitle || "Resolving song..."}</p>
            </div>
          </header>

          <div className="lyrics-player">
            <div ref={playerMountRef} className="lyrics-player__mount" />
          </div>

          <div className="button-row">
            <button type="button" className="button button--primary" onClick={onTogglePlayback}>
              {playbackState.isPlaying ? "Pause" : "Play"}
            </button>
            <a className="button" href={youtubeSearchUrl} target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a className="button" href={youtubeMusicUrl} target="_blank" rel="noreferrer">
              YT Music
            </a>
          </div>

          <div className="choice-group">
            <span>Lyrics source</span>
            <div className="segmented-control">
              {Object.entries(providerMeta).map(([id, data]) => (
                <button
                  key={id}
                  type="button"
                  className={providerChoice === id ? "segment-button is-active" : "segment-button"}
                  onClick={() => onSetProviderChoice(id)}
                >
                  {data.label}
                </button>
              ))}
            </div>
          </div>

          <div className="choice-group">
            <span>Music search</span>
            <div className="segmented-control">
              <button
                type="button"
                className={musicSource === "youtube" ? "segment-button is-active" : "segment-button"}
                onClick={() => onSetMusicSource("youtube")}
              >
                YouTube
              </button>
              <button
                type="button"
                className={musicSource === "ytmusic" ? "segment-button is-active" : "segment-button"}
                onClick={() => onSetMusicSource("ytmusic")}
              >
                YT Music
              </button>
            </div>
          </div>

          <details className="debug-drawer">
            <summary>Playback status</summary>
            <div className="debug-drawer__body">
              <div className="message-block">
                <strong>{routeCheck.summary || "Waiting for a track lookup."}</strong>
                <span>
                  {youtubeDebug.error ||
                    routeCheck.detail ||
                    youtubeDebug.advice ||
                    youtubeDebug.hint ||
                    "The current song check will show up here."}
                </span>
              </div>
              <dl className="data-list">
                <div>
                  <dt>Key</dt>
                  <dd>{youtubeDebug.configured ? "Detected" : "Missing"}</dd>
                </div>
                <div>
                  <dt>Route</dt>
                  <dd>{youtubeDebug.route}</dd>
                </div>
                <div>
                  <dt>Song lookup</dt>
                  <dd>{routeCheck.status}</dd>
                </div>
              </dl>
            </div>
          </details>
        </aside>

        <div className="lyrics-room__center">
          <div className="lyrics-room__meta">
            <div className="focus-now-playing">
              <span>Now playing</span>
              <strong>{currentSong.title}</strong>
              <small>{currentSong.artist}</small>
            </div>

            <div className="clock-panel">
              <div className="clock-wave" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="clock-panel__times">
                <div>
                  <span>Current</span>
                  <strong>{formatClock(playbackState.currentTime)}</strong>
                </div>
                <div>
                  <span>Length</span>
                  <strong>{formatClock(playbackState.duration)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="lyrics-stage">
            {lyricsState.status === "success" && lyricsState.hasSyncedLyrics ? (
              <div className="lyrics-copy lyrics-copy--live">
                {lyricsState.syncedLines.map((line, index) => (
                  <button
                    key={`${line.time}-${index}`}
                    type="button"
                    ref={(element) => {
                      lyricLineRefs.current[index] = element;
                    }}
                    className={index === activeLyricIndex ? "lyric-line is-active" : "lyric-line"}
                    onClick={() => onSeekToLyric(line.time)}
                  >
                    <span className="lyric-line__time">{formatClock(line.time)}</span>
                    <span className="lyric-line__text">{line.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="lyrics-copy lyrics-copy--plain">
                {lyricsState.status === "success" ? (
                  <pre>{lyricsState.text}</pre>
                ) : (
                  <div className="empty-state">{lyricsState.message}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

export default LyricsRoom;

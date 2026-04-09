import { useEffect, useRef } from "react";

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
      <div className="lyrics-shell">
        <aside className="lyrics-rail">
          <section className="rail-section">
            <h2>Now playing</h2>
            <div className="song-block">
              <strong>{currentSong.title}</strong>
              <span>{currentSong.artist}</span>
            </div>
            <p>{themeMeta.note}</p>

            <div className="button-row">
              <button type="button" className="button button--primary" onClick={onTogglePlayback}>
                {playbackState.isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                className="button"
                onClick={() => onSetCurrentSong(randomSongForCategory(lyricsCategory))}
              >
                Next
              </button>
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
          </section>

          <section className="rail-section">
            <h2>Library</h2>
            <p>{categoryCount} songs in the current category.</p>
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
                Shuffle song
              </button>
            </div>
          </section>

          <section className="rail-section rail-section--player">
            <h2>Player</h2>
            <div className="lyrics-player">
              <div ref={playerMountRef} className="lyrics-player__mount" />
            </div>
            <div className="song-block song-block--compact">
              <strong>{playbackState.resolvedTitle || "Resolving song..."}</strong>
              <span>
                {playbackState.resolvedChannel ||
                  playbackState.error ||
                  "If the player stays empty, check the playback section below."}
              </span>
            </div>
            <div className="button-row">
              <a className="button" href={youtubeSearchUrl} target="_blank" rel="noreferrer">
                Open YouTube
              </a>
              <a className="button" href={youtubeMusicUrl} target="_blank" rel="noreferrer">
                Open YT Music
              </a>
            </div>
          </section>

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

        <section className="lyrics-panel">
          <div className="lyrics-panel__head">
            <div className="lyrics-panel__intro">
              <span>Lyrics room</span>
              <h1>{currentSong.title}</h1>
              <p>
                {currentSong.artist}
                {lyricsState.providerLabel ? ` | ${lyricsState.providerLabel}` : ""}
                {lyricsState.providerLabel ? ` | ${lyricsState.hasSyncedLyrics ? "synced" : "plain"}` : ""}
              </p>
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
        </section>
      </div>
    </section>
  );
}

export default LyricsRoom;

import { useEffect, useRef } from "react";
import { Button, Chip } from "@heroui/react";

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
    <section className="lyrics-stage">
      <aside className="lyrics-sidebar">
        <div className="lyrics-sidebar__block lyrics-sidebar__block--intro">
          <div className="eyebrow">lyrics mode</div>
          <h2 className="lyrics-sidebar__title">Full song. Full screen. Live lines.</h2>
          <p className="lyrics-sidebar__copy">
            Hit play, let the song take over the page, and keep your eyes on one big lyric wall
            instead of tiny text and extra clutter.
          </p>
        </div>

        <div className="lyrics-sidebar__block">
          <div className="eyebrow">category crate</div>
          <div className="category-grid category-grid--lyrics">
            {SONG_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={lyricsCategory === category.id ? "category-card active" : "category-card"}
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
          <div className="lyrics-sidebar__row">
            <Button radius="full" color="secondary" onPress={onShuffleSong}>
              Shuffle song
            </Button>
            <Chip className="rounded-full bg-black/20 text-white" variant="flat">
              {categoryCount} songs
            </Chip>
          </div>
        </div>

        <div className="lyrics-sidebar__block">
          <div className="eyebrow">now playing</div>
          <h3 className="lyrics-sidebar__song">{currentSong.title}</h3>
          <p className="lyrics-sidebar__artist">{currentSong.artist}</p>

          <div className="lyrics-sidebar__row">
            <Button radius="full" color="secondary" onPress={onTogglePlayback}>
              {playbackState.isPlaying ? "Pause song" : "Play song"}
            </Button>
            <Button
              radius="full"
              variant="bordered"
              onPress={() => onSetCurrentSong(randomSongForCategory(lyricsCategory))}
            >
              Next pick
            </Button>
          </div>

          <div className="provider-row">
            {Object.entries(providerMeta).map(([id, data]) => (
              <Button
                key={id}
                radius="full"
                size="sm"
                color={providerChoice === id ? "secondary" : "default"}
                variant={providerChoice === id ? "solid" : "bordered"}
                onPress={() => onSetProviderChoice(id)}
              >
                {data.label}
              </Button>
            ))}
          </div>

          <div className="provider-row">
            <Button
              radius="full"
              size="sm"
              color={musicSource === "youtube" ? "secondary" : "default"}
              variant={musicSource === "youtube" ? "solid" : "bordered"}
              onPress={() => onSetMusicSource("youtube")}
            >
              YouTube search
            </Button>
            <Button
              radius="full"
              size="sm"
              color={musicSource === "ytmusic" ? "secondary" : "default"}
              variant={musicSource === "ytmusic" ? "solid" : "bordered"}
              onPress={() => onSetMusicSource("ytmusic")}
            >
              YT Music bias
            </Button>
          </div>
        </div>

        <div className="lyrics-sidebar__block lyrics-sidebar__block--debug">
          <div className="eyebrow">route check</div>
          <div className="debug-pills">
            <span className={youtubeDebug.configured ? "debug-pill debug-pill--ok" : "debug-pill debug-pill--warn"}>
              {youtubeDebug.configured ? "YouTube key detected" : "YouTube key missing"}
            </span>
            <span className="debug-pill">
              {youtubeDebug.source === "ytmusic" ? "YT Music search bias" : "YouTube search bias"}
            </span>
          </div>
          <p className="lyrics-sidebar__copy">
            {youtubeDebug.status === "loading"
              ? "Checking the playback route right now."
              : youtubeDebug.error
                ? youtubeDebug.error
                : youtubeDebug.advice || youtubeDebug.hint || "Playback route looks healthy."}
          </p>
          <div className="debug-grid">
            <div>
              <span>Route</span>
              <strong>{youtubeDebug.route}</strong>
            </div>
            <div>
              <span>Host</span>
              <strong>{youtubeDebug.host || "same origin"}</strong>
            </div>
            <div>
              <span>Song check</span>
              <strong>{routeCheck.status}</strong>
            </div>
            <div>
              <span>Player</span>
              <strong>{playbackState.status}</strong>
            </div>
          </div>
          <div className="debug-note">
            <strong>{routeCheck.summary || "Waiting to test the song route."}</strong>
            <span>{routeCheck.detail || "Pick a song to test lookup and playback."}</span>
          </div>
        </div>

        <div className="lyrics-sidebar__block lyrics-player-wrap">
          <div className="eyebrow">full playback</div>
          <div className="lyrics-player-frame">
            <div ref={playerMountRef} className="lyrics-player-frame__mount" />
          </div>
          <div className="lyrics-sidebar__meta">
            <span>{playbackState.resolvedTitle || "Resolving YouTube result..."}</span>
            <small>
              {playbackState.resolvedChannel ||
                playbackState.error ||
                "If the player stays empty, the route check above should tell you why."}
            </small>
          </div>
          <div className="lyrics-sidebar__row">
            <a className="link-pill" href={youtubeSearchUrl} target="_blank" rel="noreferrer">
              Open YouTube
            </a>
            <a className="link-pill" href={youtubeMusicUrl} target="_blank" rel="noreferrer">
              Open YT Music
            </a>
          </div>
        </div>
      </aside>

      <div className="lyrics-main" data-song={currentSong.title}>
        <div className="lyrics-main__hero">
          <div>
            <div className="eyebrow">live lyric reader</div>
            <h1 className="lyrics-main__title">{currentSong.title}</h1>
            <p className="lyrics-main__subtitle">
              {lyricsState.providerLabel
                ? `${lyricsState.providerLabel} | ${lyricsState.hasSyncedLyrics ? "synced" : "plain"}`
                : "waiting on provider"}
            </p>
          </div>

          <div className="lyrics-ticker">
            <div className="lyrics-wave" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <span>{formatClock(playbackState.currentTime)}</span>
            <small>current</small>
            <span>{formatClock(playbackState.duration)}</span>
            <small>length</small>
          </div>
        </div>

        {lyricsState.status === "success" && lyricsState.hasSyncedLyrics ? (
          <div className="lyrics-live-copy">
            {lyricsState.syncedLines.map((line, index) => (
              <button
                key={`${line.time}-${index}`}
                type="button"
                ref={(element) => {
                  lyricLineRefs.current[index] = element;
                }}
                className={[
                  "lyrics-line",
                  index === activeLyricIndex ? "lyrics-line--active" : "",
                  activeLyricIndex >= 0 && index < activeLyricIndex ? "lyrics-line--past" : "",
                ].join(" ")}
                onClick={() => onSeekToLyric(line.time)}
              >
                <span className="lyrics-line__time">{formatClock(line.time)}</span>
                <span className="lyrics-line__text">{line.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="lyrics-live-copy lyrics-live-copy--plain">
            {lyricsState.status === "success" ? (
              <pre>{lyricsState.text}</pre>
            ) : (
              <div className="lyrics-empty">{lyricsState.message}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default LyricsRoom;

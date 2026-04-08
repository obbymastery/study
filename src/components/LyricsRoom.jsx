import { Button, Card, CardContent, CardHeader, Chip } from "@heroui/react";

import { SONG_CATEGORIES } from "../data/songCatalog";
import { providerMeta } from "../lib/lyrics";

function LyricsRoom({
  categoryCount,
  currentSong,
  lyricsCategory,
  lyricsState,
  onSetCurrentSong,
  onSetLyricsCategory,
  onSetProviderChoice,
  onShuffleSong,
  previewState,
  providerChoice,
  randomSongForCategory,
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
      <Card className="panel panel-lyrics">
        <CardHeader className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">lyrics mode</p>
            <h2 className="panel-title">Pick a vibe, shuffle, and let the words land.</h2>
          </div>
          <Chip className="rounded-full bg-white/10 text-white" variant="flat">
            fallback providers
          </Chip>
        </CardHeader>
        <CardContent className="gap-5">
          <div className="category-grid">
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

          <div className="flex flex-wrap gap-3">
            <Button radius="full" color="secondary" onPress={onShuffleSong}>
              Shuffle {SONG_CATEGORIES.find((item) => item.id === lyricsCategory)?.label || "songs"}
            </Button>
            <Chip className="rounded-full bg-black/20 text-white" variant="flat">
              {categoryCount} songs in this crate
            </Chip>
          </div>

          <div className="current-song-card">
            <div>
              <p className="eyebrow">now lined up</p>
              <h3 className="text-3xl font-black tracking-tight text-white">{currentSong.title}</h3>
              <p className="text-white/70">{currentSong.artist}</p>
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
          </div>

          <div className="preview-panel">
            <div className="preview-art">
              {previewState.artwork ? <img src={previewState.artwork} alt={currentSong.title} /> : null}
            </div>
            <div className="preview-copy">
              <div className="eyebrow">song playback</div>
              <p className="text-lg font-semibold text-white">
                {previewState.album || "Preview search in progress"}
              </p>
              {previewState.previewUrl ? (
                <audio controls className="w-full" src={previewState.previewUrl}>
                  <track kind="captions" />
                </audio>
              ) : (
                <p className="text-sm text-white/68">
                  {previewState.status === "loading"
                    ? "Looking for a playable preview clip..."
                    : previewState.error || "No preview clip found for this song."}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {previewState.externalUrl ? (
                  <a className="link-pill" href={previewState.externalUrl} target="_blank" rel="noreferrer">
                    Open in Apple Music
                  </a>
                ) : null}
                <a
                  className="link-pill"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${currentSong.artist} ${currentSong.title}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Search on YouTube
                </a>
              </div>
            </div>
          </div>

          <p className="tiny-note">
            Preview clips come from Apple&apos;s Search API when available. Lyrics use LRCLIB first,
            then fall back to lyrics.ovh.
          </p>
        </CardContent>
      </Card>

      <Card className="panel panel-lyrics-reader">
        <CardHeader className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">lyric reader</p>
            <h2 className="panel-title">
              {lyricsState.providerLabel ? `Loaded from ${lyricsState.providerLabel}` : "Waiting on a provider"}
            </h2>
          </div>
          <Chip className="rounded-full bg-white/10 text-white" variant="flat">
            {lyricsState.status}
          </Chip>
        </CardHeader>
        <CardContent>
          <div className="lyrics-copy">
            {lyricsState.status === "success" ? (
              <pre>{lyricsState.text}</pre>
            ) : (
              <div className="lyrics-empty">{lyricsState.message}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default LyricsRoom;

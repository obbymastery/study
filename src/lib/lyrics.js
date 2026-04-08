const providerMeta = {
  auto: { label: "Auto" },
  lrclib: { label: "LRCLIB" },
  lyricsovh: { label: "lyrics.ovh" },
};

function cleanTitle(title) {
  return title
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*]/g, "")
    .replace(/\s+-\s+(remastered|live|acoustic|sped up|slowed).*/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanArtist(artist) {
  return artist.replace(/\s+(feat\.?|ft\.?|with)\s+.*/i, "").replace(/\s{2,}/g, " ").trim();
}

function stripTimecodes(text) {
  return text.replace(/\[[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

async function fetchFromLrclib(song) {
  const searchParams = new URLSearchParams({
    artist_name: cleanArtist(song.artist),
    track_name: cleanTitle(song.title),
  });

  let response = await fetch(`https://lrclib.net/api/get?${searchParams.toString()}`);
  if (!response.ok) {
    response = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`);
  }
  if (!response.ok) {
    throw new Error("LRCLIB did not return a track.");
  }

  const payload = await response.json();
  const track = Array.isArray(payload) ? payload[0] : payload;
  if (!track) {
    throw new Error("LRCLIB did not find lyrics for that song.");
  }
  if (track.instrumental) {
    return {
      provider: "lrclib",
      providerLabel: providerMeta.lrclib.label,
      isInstrumental: true,
      text: "This track looks instrumental, so there are no lyrics to show.",
    };
  }

  const text = stripTimecodes(track.syncedLyrics || track.plainLyrics || "");
  if (!text) {
    throw new Error("LRCLIB found the track but had no lyrics payload.");
  }

  return {
    provider: "lrclib",
    providerLabel: providerMeta.lrclib.label,
    isInstrumental: false,
    text,
  };
}

async function fetchFromLyricsOvh(song) {
  const artist = encodeURIComponent(cleanArtist(song.artist));
  const title = encodeURIComponent(cleanTitle(song.title));
  const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
  if (!response.ok) {
    throw new Error("lyrics.ovh did not find a lyric match.");
  }

  const payload = await response.json();
  const text = stripTimecodes(payload.lyrics || "");
  if (!text) {
    throw new Error("lyrics.ovh returned an empty lyrics response.");
  }

  return {
    provider: "lyricsovh",
    providerLabel: providerMeta.lyricsovh.label,
    isInstrumental: false,
    text,
  };
}

async function fetchLyrics(song, preferredProvider = "auto") {
  const order = preferredProvider === "auto" ? ["lrclib", "lyricsovh"] : [preferredProvider];
  const errors = [];

  for (const provider of order) {
    try {
      if (provider === "lrclib") {
        return await fetchFromLrclib(song);
      }
      if (provider === "lyricsovh") {
        return await fetchFromLyricsOvh(song);
      }
    } catch (error) {
      errors.push(`${providerMeta[provider]?.label || provider}: ${error.message}`);
    }
  }

  throw new Error(errors.join(" "));
}

export { fetchLyrics, providerMeta };

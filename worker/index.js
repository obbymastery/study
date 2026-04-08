function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function cleanQueryPart(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function buildSearchQueries(artist, title, source) {
  const base = `${artist} ${title}`.trim();

  if (source === "ytmusic") {
    return [
      `${base} topic`,
      `${base} official audio`,
      `${base} audio`,
      base,
    ];
  }

  return [
    `${base} official audio`,
    `${base} audio`,
    `${base} official video`,
    base,
  ];
}

async function searchYouTubeCandidates(request, env) {
  const url = new URL(request.url);
  const artist = cleanQueryPart(url.searchParams.get("artist") || "");
  const title = cleanQueryPart(url.searchParams.get("title") || "");
  const source = url.searchParams.get("source") === "ytmusic" ? "ytmusic" : "youtube";

  if (!artist || !title) {
    return json({ error: "Artist and title are required." }, { status: 400 });
  }

  if (!env.YOUTUBE_API_KEY) {
    return json(
      {
        error:
          "Missing YOUTUBE_API_KEY. Add it in your Worker environment so the app can resolve full-song YouTube playback.",
      },
      { status: 503 },
    );
  }

  const uniqueIds = new Set();
  const candidates = [];

  for (const query of buildSearchQueries(artist, title, source)) {
    const apiUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    apiUrl.search = new URLSearchParams({
      key: env.YOUTUBE_API_KEY,
      part: "snippet",
      type: "video",
      q: query,
      maxResults: "6",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      safeSearch: "none",
      topicId: "/m/04rlf",
    }).toString();

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const details = await response.text();
      return json({ error: `YouTube API search failed: ${details}` }, { status: 502 });
    }

    const payload = await response.json();
    for (const item of payload.items || []) {
      const videoId = item.id?.videoId;
      if (!videoId || uniqueIds.has(videoId)) {
        continue;
      }

      uniqueIds.add(videoId);
      candidates.push({
        videoId,
        title: item.snippet?.title || `${artist} - ${title}`,
        channelTitle: item.snippet?.channelTitle || "",
      });

      if (candidates.length >= 8) {
        break;
      }
    }

    if (candidates.length >= 8) {
      break;
    }
  }

  if (candidates.length === 0) {
    return json({ error: "No embeddable YouTube matches were found." }, { status: 404 });
  }

  return json({
    source,
    query: `${artist} ${title}`,
    candidates,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/youtube/search") {
      return searchYouTubeCandidates(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

let youtubeApiPromise;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API is only available in the browser."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-youtube-iframe-api="true"]');

    const handleReady = () => {
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube IFrame API loaded without a player object."));
      }
    };

    window.onYouTubeIframeAPIReady = handleReady;

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.youtubeIframeApi = "true";
      script.onerror = () => reject(new Error("Failed to load the YouTube IFrame API."));
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

async function resolveYouTubeCandidates(song, source = "youtube") {
  const searchParams = new URLSearchParams({
    artist: song.artist,
    title: song.title,
    source,
  });

  const response = await fetch(`/api/youtube/search?${searchParams.toString()}`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Could not resolve a YouTube result for this song.");
  }

  if (!Array.isArray(payload.candidates) || payload.candidates.length === 0) {
    throw new Error("No embeddable YouTube candidates were returned.");
  }

  return payload;
}

function buildYouTubeSearchUrl(song) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`;
}

function buildYouTubeMusicSearchUrl(song) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(`${song.artist} ${song.title}`)}`;
}

export {
  buildYouTubeMusicSearchUrl,
  buildYouTubeSearchUrl,
  loadYouTubeIframeApi,
  resolveYouTubeCandidates,
};

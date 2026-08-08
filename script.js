let songs = [];
let sections = [];
let songsById = new Map();

let currentTrackId = null;
let isPlaying = false;
let lyricsVisible = false;

let shuffle = false;
let repeatMode = "off";

let likedIds = new Set(getLikedIds());

let queue = [];
let playOrder = [];
let playOrderIndex = 0;

let ytPlayer = null;
let ytReady = false;
let progressPollTimer = null;
let prevVolume = 70;

const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const repeatBtn = document.getElementById("repeat-btn");
const progressBar = document.getElementById("progress-bar");
const currTimeEl = document.getElementById("curr-time");
const totTimeEl = document.getElementById("tot-time");
const albumCoverGradient = document.getElementById("album-cover-gradient");
const albumTitle = document.getElementById("album-title");
const albumArtist = document.getElementById("album-artist");
const nowPlayingTitle = document.getElementById("now-playing-title");
const nowPlayingArtist = document.getElementById("now-playing-artist");
const volumeBar = document.getElementById("volume-bar");
const volumeIcon = document.getElementById("volume-icon");
const playerHeart = document.getElementById("player-heart");
const lyricsBtn = document.getElementById("lyrics-btn");
const lyricsPanel = document.getElementById("lyrics-panel");
const lyricsTitle = document.getElementById("lyrics-title");
const lyricsArtist = document.getElementById("lyrics-artist");
const lyricsBody = document.getElementById("lyrics-body");
const closeLyricsBtn = document.getElementById("close-lyrics");

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const searchResultsGrid = document.getElementById("search-results-grid");
const searchEmpty = document.getElementById("search-empty");

const sidebar = document.querySelector(".sidebar");
const hamburgerBtn = document.getElementById("hamburger-btn");
const drawerOverlay = document.getElementById("drawer-overlay");

const likedContainer = document.getElementById("liked-songs");
const likedEmpty = document.getElementById("liked-empty");

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function shuffleArrayInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPlayOrder(source, firstId) {
  if (!shuffle) return [...source];
  const rest = source.filter((id) => id !== firstId);
  shuffleArrayInPlace(rest);
  return [firstId, ...rest];
}

function setQueue(ids) {
  queue = [...ids];
  playOrder = buildPlayOrder(queue, currentTrackId);
}

function getLikedIds() {
  try {
    return JSON.parse(localStorage.getItem("likedSongs")) || [];
  } catch {
    return [];
  }
}

function saveLikedIds() {
  localStorage.setItem("likedSongs", JSON.stringify([...likedIds]));
}

function toggleLike(id) {
  if (likedIds.has(id)) likedIds.delete(id);
  else likedIds.add(id);
  saveLikedIds();
  updateLikeUI(id);
  renderLikedSection();
}

function updateLikeUI(id) {
  const liked = likedIds.has(id);
  document
    .querySelectorAll(`.card-heart[data-track-id="${id}"]`)
    .forEach((h) => h.classList.toggle("liked", liked));
  if (currentTrackId === id) playerHeart.classList.toggle("active", liked);
}

function makeCard(track, contextIds) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.trackId = track.id;

  const imgWrapper = document.createElement("div");
  imgWrapper.className = "card-img-wrapper";

  const grad = document.createElement("div");
  grad.className = "gradient-card";
  grad.style.background = track.gradient || "#181818";
  grad.innerHTML = `<span class="gradient-initial">${track.title.charAt(0)}</span>`;
  imgWrapper.appendChild(grad);

  const heart = document.createElement("button");
  heart.className = "card-heart";
  heart.dataset.trackId = track.id;
  heart.setAttribute("aria-label", "Like");
  heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
  heart.classList.toggle("liked", likedIds.has(track.id));
  heart.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLike(track.id);
  });
  imgWrapper.appendChild(heart);

  const playBtnEl = document.createElement("div");
  playBtnEl.className = "card-play-btn";
  playBtnEl.innerHTML = '<i class="fa-solid fa-play"></i>';
  imgWrapper.appendChild(playBtnEl);

  const title = document.createElement("p");
  title.className = "card-title";
  title.textContent = track.title;
  const info = document.createElement("p");
  info.className = "card-info";
  info.textContent = `${track.artist} · ${track.album}`;

  card.appendChild(imgWrapper);
  card.appendChild(title);
  card.appendChild(info);

  card.addEventListener("click", () => handleCardClick(track.id, contextIds));
  return card;
}

function renderSections() {
  sections.forEach((section) => {
    const heading = document.querySelector(`[data-section="${section.id}"]`);
    if (heading) heading.textContent = section.title;

    const container = document.getElementById(section.id);
    if (!container) return;

    container.innerHTML = "";
    const contextIds = section.songIds;
    section.songIds.forEach((id) => {
      const track = songsById.get(id);
      if (track) container.appendChild(makeCard(track, contextIds));
    });
  });

  renderLikedSection();
}

function renderLikedSection() {
  if (!likedContainer) return;
  likedContainer.innerHTML = "";
  const ids = songs.filter((s) => likedIds.has(s.id)).map((s) => s.id);
  likedEmpty.classList.toggle("visible", ids.length === 0);

  ids.forEach((id) => {
    const track = songsById.get(id);
    if (track) likedContainer.appendChild(makeCard(track, ids));
  });
}

function handleCardClick(id, contextIds) {
  if (id === currentTrackId) {
    togglePlay();
    return;
  }
  setQueue(contextIds);
  playTrack(id);
}

function updateActiveCard() {
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.remove("playing");
    const playIcon = card.querySelector(".card-play-btn i");
    if (playIcon) playIcon.className = "fa-solid fa-play";
  });

  const activeCard = document.querySelector(
    `.card[data-track-id="${currentTrackId}"]`,
  );
  if (activeCard) {
    activeCard.classList.add("playing");
    const playIcon = activeCard.querySelector(".card-play-btn i");
    if (playIcon) {
      playIcon.className = isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
    }
  }
}

function renderLyrics(track) {
  lyricsTitle.textContent = track.title;
  lyricsArtist.textContent = `${track.artist} · ${track.album}`;

  if (!track.lyrics || track.lyrics.length === 0) {
    lyricsBody.innerHTML = `
      <div class="lyrics-unavailable">
        <i class="fa-solid fa-music"></i>
        <p>Lyrics aren't available for this track.</p>
      </div>`;
    return;
  }

  lyricsBody.innerHTML = track.lyrics
    .map(
      (line, i) => `
      <div class="lyric-line" data-index="${i}">
        <p class="lyric-hi">${line.hi}</p>
        <p class="lyric-en">${line.en}</p>
      </div>
    `,
    )
    .join("");
}

function getCurrentTime() {
  if (ytReady && ytPlayer && typeof ytPlayer.getCurrentTime === "function") {
    return ytPlayer.getCurrentTime() || 0;
  }
  return 0;
}

function updateActiveLyric() {
  const track = songsById.get(currentTrackId);
  if (!track || !track.lyrics || !track.lyrics.length) return;

  const currentTime = getCurrentTime();
  let activeIndex = 0;

  for (let i = track.lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= track.lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  document.querySelectorAll(".lyric-line").forEach((line) => {
    line.classList.toggle(
      "active",
      parseInt(line.dataset.index) === activeIndex,
    );
  });

  const activeLine = document.querySelector(".lyric-line.active");
  if (activeLine && lyricsVisible) {
    activeLine.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function toggleLyricsPanel() {
  lyricsVisible = !lyricsVisible;
  lyricsPanel.classList.toggle("visible", lyricsVisible);
  lyricsBtn.classList.toggle("active", lyricsVisible);
  document
    .querySelector(".main")
    .classList.toggle("lyrics-open", lyricsVisible);
}

function loadTrack(track) {
  if (!track) return;
  currentTrackId = track.id;

  albumTitle.textContent = track.title;
  albumArtist.textContent = track.artist;
  nowPlayingTitle.textContent = track.title;
  nowPlayingArtist.textContent = track.artist;

  albumCoverGradient.style.background = track.gradient || "#181818";
  albumCoverGradient.textContent = track.title.charAt(0);
  albumCoverGradient.style.display = "flex";

  if (ytReady && ytPlayer) {
    ytPlayer.cueVideoById(track.videoId);
  }

  progressBar.value = 0;
  currTimeEl.textContent = "0:00";
  totTimeEl.textContent = "0:00";
  renderLyrics(track);
  updateActiveCard();
  updateActiveLyric();
  updateLikeUI(track.id);
}

function playTrack(id) {
  const track = songsById.get(id);
  if (!track) return;

  if (!playOrder.includes(id)) playOrder = buildPlayOrder(queue, id);
  playOrderIndex = playOrder.indexOf(id);
  loadTrack(track);

  if (ytReady && ytPlayer) {
    ytPlayer.loadVideoById(track.videoId);
    ytPlayer.playVideo();
  }
  isPlaying = true;
  updatePlayButton();
}

function togglePlay() {
  if (currentTrackId == null) {
    playTrack(songs[0].id);
    return;
  }
  if (isPlaying) {
    if (ytReady && ytPlayer) ytPlayer.pauseVideo();
    isPlaying = false;
  } else {
    if (ytReady && ytPlayer) ytPlayer.playVideo();
    isPlaying = true;
  }
  updatePlayButton();
}

function playNext() {
  const next = (playOrderIndex + 1) % playOrder.length;

  if (next === 0 && repeatMode === "off") {
    isPlaying = false;
    updatePlayButton();
    return;
  }

  playOrderIndex = next;
  playTrack(playOrder[playOrderIndex]);
}

function playPrev() {
  if (getCurrentTime() > 3) {
    if (ytReady && ytPlayer) ytPlayer.seekTo(0, true);
  } else {
    playOrderIndex = (playOrderIndex - 1 + playOrder.length) % playOrder.length;
    playTrack(playOrder[playOrderIndex]);
  }
}

function handleEnded() {
  if (repeatMode === "one") {
    if (ytReady && ytPlayer) {
      ytPlayer.seekTo(0, true);
      ytPlayer.playVideo();
    }
    return;
  }
  const next = (playOrderIndex + 1) % playOrder.length;
  if (next === 0 && repeatMode === "off") {
    isPlaying = false;
    updatePlayButton();
    return;
  }
  playOrderIndex = next;
  playTrack(playOrder[playOrderIndex]);
}

function updatePlayButton() {
  playBtn.classList.toggle("playing", isPlaying);
  playBtn.classList.toggle("fa-circle-play", !isPlaying);
  playBtn.classList.toggle("fa-circle-pause", isPlaying);
  albumCoverGradient.classList.toggle("playing", isPlaying);
  updateActiveCard();
}

function toggleShuffle() {
  shuffle = !shuffle;
  shuffleBtn.classList.toggle("active", shuffle);
  playOrder = buildPlayOrder(queue, currentTrackId);
  playOrderIndex = playOrder.indexOf(currentTrackId);
}

function cycleRepeat() {
  repeatMode =
    repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  repeatBtn.classList.toggle("active", repeatMode !== "off");
  repeatBtn.classList.toggle("repeat-one", repeatMode === "one");
  repeatBtn.title =
    repeatMode === "off"
      ? "Repeat"
      : repeatMode === "all"
        ? "Repeat all"
        : "Repeat one";
}

function updateProgress() {
  if (!ytReady || !ytPlayer) return;
  const dur = ytPlayer.getDuration() || 0;
  const cur = ytPlayer.getCurrentTime() || 0;
  if (dur > 0) {
    progressBar.value = (cur / dur) * 100;
  }
  currTimeEl.textContent = formatTime(cur);
  totTimeEl.textContent = formatTime(dur);
  updateActiveLyric();
}

function startProgressPoll() {
  stopProgressPoll();
  updateProgress();
  progressPollTimer = setInterval(updateProgress, 250);
}

function stopProgressPoll() {
  if (progressPollTimer) {
    clearInterval(progressPollTimer);
    progressPollTimer = null;
  }
}

progressBar.addEventListener("input", () => {
  if (ytReady && ytPlayer) {
    const dur = ytPlayer.getDuration() || 0;
    if (dur > 0) ytPlayer.seekTo((progressBar.value / 100) * dur, true);
  }
});

let searchTimer = null;

function setBrowseVisible(visible) {
  const blocks = [
    ...document.querySelectorAll(".main-content > h2[data-section]"),
    ...document.querySelectorAll(".main-content > .cards-container"),
    document.querySelector(".main-content > .footer"),
  ].filter(Boolean);
  blocks.forEach((b) => b.classList.toggle("hidden", !visible));
}

async function handleSearch(q) {
  if (!q) {
    searchResults.classList.remove("visible");
    searchEmpty.classList.remove("visible");
    searchResultsGrid.innerHTML = "";
    setBrowseVisible(true);
    return;
  }

  let results = [];
  try {
    const res = await fetch(`/api/songs?search=${encodeURIComponent(q)}`);
    results = await res.json();
  } catch (err) {
    console.error("Search failed", err);
  }

  searchResultsGrid.innerHTML = "";
  const ids = results.map((s) => s.id);
  results.forEach((s) => searchResultsGrid.appendChild(makeCard(s, ids)));

  searchEmpty.classList.toggle("visible", results.length === 0);
  searchResults.classList.add("visible");
  setBrowseVisible(false);
}

function setupSearch() {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(searchInput.value.trim()), 250);
  });
}

function setupNav() {
  document.querySelectorAll(".nav-option").forEach((option) => {
    option.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-option")
        .forEach((o) => o.classList.remove("active"));
      option.classList.add("active");

      const view = option.dataset.view;
      if (view === "home") {
        searchInput.value = "";
        handleSearch("");
        document
          .querySelector(".main-content")
          .scrollTo({ top: 0, behavior: "smooth" });
      } else if (view === "search") {
        searchInput.focus();
      } else if (view === "liked") {
        searchInput.value = "";
        handleSearch("");
        const heading = document.getElementById("liked-heading");
        if (heading)
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      closeDrawer();
    });
  });
}

function openDrawer() {
  sidebar.classList.add("open");
  drawerOverlay.classList.add("visible");
}

function closeDrawer() {
  sidebar.classList.remove("open");
  drawerOverlay.classList.remove("visible");
}

function setupDrawer() {
  hamburgerBtn.addEventListener("click", openDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);
}

function setupVolume() {
  if (!volumeBar || !volumeIcon) return;

  volumeBar.addEventListener("input", () => {
    const vol = Number(volumeBar.value);
    prevVolume = vol > 0 ? vol : prevVolume;
    if (ytReady && ytPlayer) ytPlayer.setVolume(vol);
    updateVolumeIcon();
  });

  volumeIcon.addEventListener("click", () => {
    if (Number(volumeBar.value) > 0) {
      prevVolume = Number(volumeBar.value) || 70;
      volumeBar.value = 0;
      if (ytReady && ytPlayer) ytPlayer.setVolume(0);
    } else {
      volumeBar.value = prevVolume || 70;
      if (ytReady && ytPlayer) ytPlayer.setVolume(Number(volumeBar.value));
    }
    updateVolumeIcon();
  });
}

function updateVolumeIcon() {
  if (!volumeIcon) return;
  volumeIcon.classList.remove(
    "fa-volume-high",
    "fa-volume-low",
    "fa-volume-xmark",
  );
  const vol = Number(volumeBar.value);
  if (vol === 0) {
    volumeIcon.classList.add("fa-volume-xmark");
  } else if (vol < 50) {
    volumeIcon.classList.add("fa-volume-low");
  } else {
    volumeIcon.classList.add("fa-volume-high");
  }
}

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    setupYoutubePlayer();
    return;
  }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = setupYoutubePlayer;

function setupYoutubePlayer() {
  if (!document.getElementById("youtube-player")) return;
  ytPlayer = new YT.Player("youtube-player", {
    width: "0",
    height: "0",
    playerVars: {
      playsinline: 1,
      rel: 0,
      controls: 0,
      disablekb: 1,
    },
    events: {
      onReady: () => {
        ytReady = true;
        if (songs.length) loadTrack(songs[0]);
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          handleEnded();
        } else if (e.data === YT.PlayerState.PLAYING) {
          isPlaying = true;
          updatePlayButton();
          startProgressPoll();
        } else if (e.data === YT.PlayerState.PAUSED) {
          isPlaying = false;
          updatePlayButton();
          stopProgressPoll();
        }
      },
    },
  });
}

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", playPrev);
nextBtn.addEventListener("click", playNext);
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", cycleRepeat);
lyricsBtn.addEventListener("click", toggleLyricsPanel);
closeLyricsBtn.addEventListener("click", toggleLyricsPanel);
playerHeart.addEventListener("click", () => {
  if (currentTrackId != null) toggleLike(currentTrackId);
});

albumTitle.addEventListener("click", () => {
  if (!lyricsVisible) toggleLyricsPanel();
});

document.addEventListener("keydown", (e) => {
  const typing =
    e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
  if (typing) return;
  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  }
  if (e.code === "ArrowRight") playNext();
  if (e.code === "ArrowLeft") playPrev();
  if (e.code === "KeyL") toggleLyricsPanel();
});

document.addEventListener("DOMContentLoaded", async () => {
  loadYouTubeAPI();

  try {
    const [songsData, sectionsData] = await Promise.all([
      fetch("/api/songs").then((r) => r.json()),
      fetch("/api/sections").then((r) => r.json()),
    ]);

    songs = songsData;
    sections = sectionsData;
    songsById = new Map(songs.map((s) => [s.id, s]));
    queue = songs.map((s) => s.id);
    playOrder = [...queue];

    renderSections();
    renderLikedSection();

    if (songs.length) {
      loadTrack(songs[0]);
      playOrderIndex = 0;
      updateLikeUI(songs[0].id);
    }
  } catch (err) {
    console.error(
      "Failed to load music data from the API. Make sure the server is running: npm start",
      err,
    );
    lyricsBody.innerHTML = `
    <div class="lyrics-unavailable">
        <i class="fa-solid fa-wifi"></i>
        <p>Couldn't reach the server.<br />Run <strong>npm start</strong> and reload.</p>
      </div>`;
  }

  setupNav();
  setupVolume();
  setupSearch();
  setupDrawer();
  updatePlayButton();
});

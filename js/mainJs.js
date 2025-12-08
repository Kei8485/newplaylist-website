// ----------------------------
// 1. Variables & select elements
// ----------------------------

let playedHistory = []; // history of played songs
let isPlaying = false; // play/pause state

const body = document.querySelector("body");
const footerParent = document.querySelector("footer");
const footer = document.querySelector(".footer__container");
const main = document.querySelector("main");
const footerSongImg = document.querySelector(".footer__song-img");
const footerSongTitle = document.querySelector(".footer__song-name");
const footerSongArtist = document.querySelector(".footer__song-artist-name");
const footerAudio = document.querySelector(".footer__audio");

const footerBtnBack = document.querySelector('[data-action="backBtn"]');
const footerBtnPausePlay = document.querySelector('[data-action="playBtn"]');
const footerBtnForward = document.querySelector('[data-action="nextBtn"]');
const playIconPath = footerBtnPausePlay.querySelector("path");

const heartIcons = document.querySelectorAll(".footer__heart-icon");

const footerAudioProgress = document.querySelector(".footer__progress-fill");
const footerAudioProgWrap = document.querySelector(
  ".footer__audio-prog-wrapper"
);
const footerAudioProgCircle = document.querySelector(
  ".footer__progress-circle"
);
const footerAudioProgTimeDuration = document.querySelector(
  ".footer__audio-prog-time-duration"
);
const footerAudioProgDurationEnd = document.querySelector(
  ".footer__audio-prog-time-end"
);

const fullScreenBtn = document.querySelector(".footer__maximize-wrapper");

let allSongs = [];
let likedSongs = [];
let recentPlayed = []; // will hold unique, last 6 songs

let isFullscreen = false;
let currentlyPlaying = null; // song currently playing
let upNextQueue = [
  {
    title: "Killer Queen",
    audio: "../audios/queenSongs/Killer Queen (Remastered 2011).mp3",
    picture: "../img/songPicture/queenPicture/bohemianRhapsody.png",
    artistName: "Queen",
  },
];
// ----------------------------
// 2. Wait for DOM to load
// ----------------------------
document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------
  // Fetch JSON & initialize player
  // ----------------------------
  fetch("../json/SystemMusic.json")
    .then((response) => {
      if (!response.ok) throw new Error("JSON file not found");
      return response.json();
    })
    .then((data) => {
      // Load first song for footer
      displayGenresFromSongs(data.artists);

      if (data.artists.length > 0 && data.artists[0].songs.length > 0) {
        const artist = data.artists[0];
        const song = {
          ...artist.songs[0],
          artistName: artist.name,
          isFavorite: false,
        };

        currentlyPlaying = song;
        playedHistory.push(currentlyPlaying);
        updateFooter(currentlyPlaying);
        updateHeartIcon();
      } else {
        updateFooter(null);
      }

      // Populate allSongs for search
      allSongs = [];
      data.artists.forEach((artist) => {
        artist.songs.forEach((song) => {
          allSongs.push({
            title: song.title,
            genre: song.genre,
            audio: song.audio,
            picture: song.picture,
            artistName: artist.name,
            duration: song.duration || "0:00",
            isFavorite: false,
          });
        });
      });

      // Display all songs in search
      displaySongs(allSongs);
    })
    .catch((error) => {
      console.error("Error loading JSON:", error);
      updateFooter(null);
    });

  // ----------------------------
  // Footer / Play functions
  // ----------------------------
  footerBtnBack.addEventListener("click", () => {
    if (playedHistory.length > 1) {
      const lastSong = playedHistory.pop();
      const previousSong = playedHistory[playedHistory.length - 1];
      upNextQueue.unshift(lastSong);
      playSong(previousSong);
      updatePlayPauseIcon();
    }
  });

  footerBtnForward.addEventListener("click", () => {
    if (upNextQueue.length > 0) {
      const nextSong = upNextQueue.shift();
      playSong(nextSong);
      updatePlayPauseIcon();
    }
  });

  footerBtnPausePlay.addEventListener("click", () => {
    if (!currentlyPlaying) return;
    if (!isPlaying) {
      footerAudio.play();
      isPlaying = true;
    } else {
      footerAudio.pause();
      isPlaying = false;
    }
    updatePlayPauseIcon();
  });

  footerAudio.addEventListener("timeupdate", updateProgress);
  footerAudio.addEventListener("ended", autoPlayNext);

  footerAudioProgWrap.addEventListener("click", seekAudio);
  footerAudioProgWrap.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", dragProgress);
  document.addEventListener("mouseup", endDrag);

  heartIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      if (!currentlyPlaying) return;
      toggleLike(currentlyPlaying);
    });
  });

  fullScreenBtn.addEventListener("click", toggleFullscreen);

  // After allSongs is populated
  const searchInput = document.querySelector(".header__input");
  const searchButton = document.querySelector(".header__search-icon");

  const searchPartContainer = document.querySelector(".search-part-container");

  searchInput.addEventListener("input", () => {
    // If fullscreen, exit fullscreen first
    if (isFullscreen) toggleFullscreen();

    showMainSection(searchPartContainer);
    searchPartContainer.classList.add("active");

    searchPartContainer.style.display = "block"; // ensure block

    const searchDesc = document.querySelector(".search-desc");
    const query = searchInput.value.toLowerCase();

    const filteredSongs = allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artistName.toLowerCase().includes(query)
    );

    displaySongs(filteredSongs);

    searchDesc.textContent =
      filteredSongs.length === 0
        ? "No Songs are found..."
        : "Discover your favorite tracks by title, artist, album, or genre";
  });

  queueIcon.addEventListener("click", () => {
    if (isFullscreen) toggleFullscreen();
    showMainSection(queueContainer);
    renderQueue();
  });

  // nav part
  const menuIcon = document.getElementById("menuIcon");
  const navMenu = document.querySelector(".main__nav-menu-container");
  const searchIcon = document.getElementById("searchIcon");
  const views = document.querySelectorAll(".fade-in");
  const navItems = document.querySelectorAll(".main__list-item");

  menuIcon.addEventListener("click", (e) => {
    navMenu.classList.toggle("main__nav--active");
    navMenu.style.transitionDuration = "1s";
    e.stopPropagation();
  });

  navMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", () => {
    if (navMenu.classList.contains("main__nav--active")) {
      navMenu.classList.remove("main__nav--active");
    }
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;

      const selectedView = document.querySelector(`.main__${target}-container`);

      if (selectedView) {
        showMainSection(selectedView);
      }

      // close nav on mobile
      if (navMenu.classList.contains("main__nav--active")) {
        navMenu.classList.remove("main__nav--active");
        navMenu.style.transitionDuration = "2.5s";
      }
    });
  });

  const queueCloseBtn = document.querySelector(".queue-close-btn");

  queueCloseBtn.addEventListener("click", () => {
    const homeContainer = document.querySelector(".main__home-container");
    showMainSection(homeContainer);
  });
});

// ----------------------------
// Functions
// ----------------------------

function getUniqueGenres(artists) {
  const genresSet = new Set();

  artists.forEach((artist) => {
    artist.songs.forEach((song) => {
      genresSet.add(song.genre);
    });
  });

  return Array.from(genresSet);
}

function displayGenresFromSongs(artists) {
  const grid = document.querySelector(".main__genre-heading-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const genres = getUniqueGenres(artists);

  genres.forEach((genre) => {
    const card = document.createElement("div");
    card.classList.add("main__genre-card");

    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, ${
      Math.floor(Math.random() * 20) + 20
    }%)`;
    card.style.background = randomColor;

    card.innerHTML = `<h2 class="main__genre-name">${genre}</h2>`;

    card.addEventListener("click", () => {
      const filteredSongs = [];
      artists.forEach((artist) => {
        artist.songs.forEach((song) => {
          if (song.genre.toLowerCase() === genre.toLowerCase()) {
            filteredSongs.push({
              ...song,
              artistName: artist.name,
              isFavorite: false,
            });
          }
        });
      });

      const genreContainer = document.querySelector(".main__genre-container");
      const heading = genreContainer.querySelector(".main__genre-heading");
      const topPart = genreContainer.querySelector(".genre-top-part");
      const pickContainer = genreContainer.querySelector(".main__genre-pick");

      // Update heading
      heading.textContent = `${genre.toUpperCase()} GENRE`;

      // Hide genre grid
      grid.style.display = "none";

      // Show pick container
      pickContainer.classList.add("main__genre-pick--active");

      // Add back button dynamically if not already there
      let backBtn = topPart.querySelector(".back-btn");
      if (!backBtn) {
        backBtn = document.createElement("button");
        backBtn.classList.add("back-btn");
        backBtn.innerHTML = `
          <svg class="back-btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/>
          </svg>`;
        topPart.prepend(backBtn);

        // Add click handler to go back
        backBtn.addEventListener("click", () => {
          pickContainer.classList.remove("main__genre-pick--active");
          grid.style.display = "grid";
          heading.textContent = "Find the right genre for you!";
          backBtn.remove(); // remove back button after going back
        });
      }

      // Display songs inside pick container
      displaySongs(filteredSongs, genre, pickContainer);
    });

    grid.appendChild(card);
  });
}

function updateFooter(song) {
  if (!song) {
    footerSongImg.src = "";
    footerSongTitle.textContent = "No Song Playing";
    footerSongArtist.textContent = "No Artist Playing";
    footerAudio.src = "";
    footer.style.display = "none";
    return;
  }
  footerSongImg.src = song.picture;
  footerSongTitle.textContent = song.title;
  footerSongArtist.textContent = song.artistName;
  footerAudio.src = song.audio;
  footer.style.display = "block";
}

function playSong(song) {
  if (!song) return;
  currentlyPlaying = song;
  updateFooter(currentlyPlaying);
  footerAudio.play();
  isPlaying = true;

  if (
    playedHistory.length === 0 ||
    playedHistory[playedHistory.length - 1] !== song
  ) {
    playedHistory.push(song);
  }
  updateRecentPlayed(song);

  updateHeartIcon();
  updatePlayPauseIcon();
  renderQueue();
}

function updatePlayPauseIcon() {
  if (isPlaying) {
    playIconPath.setAttribute(
      "d",
      "M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z"
    );
  } else {
    playIconPath.setAttribute(
      "d",
      "M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"
    );
  }
}

function displaySongs(songs, genre = null, container = null) {
  const targetContainer =
    container || document.querySelector(".search-song-container");

  if (!targetContainer) return;
  targetContainer.innerHTML = "";

  if (genre) {
    const genreHeading = document.createElement("h2");
    genreHeading.classList.add("genre-heading");
    targetContainer.appendChild(genreHeading);
  }

  songs.forEach((song) => {
    const card = document.createElement("div");
    card.classList.add("song-card");

    card.innerHTML = `
      <img class="song-img" src="${song.picture}" alt="${song.title}" />
      
      <div class="play-song-btn" data-action="">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"/>
        </svg>
      </div>

      <div class="song-desc">
        <span class="song-title">${song.title}</span>
        <span class="song-artist-name">${song.artistName}</span>
      </div>

      <div class="song-desc-lower-part">
        <div class="song-duration-container">
          <span class="song-duration">0:00</span>
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/>
          </svg>

          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(179, 177, 177)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="add-to-queue-btn"> 
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
            <line x1="12" x2="12" y1="8" y2="16"/>
            <line x1="8" x2="16" y1="12" y2="12"/>
          </svg>
        </div>
      </div>
    `;

    // ----- Duration -----
    const durationSpan = card.querySelector(".song-duration");
    const audio = new Audio(song.audio);
    audio.addEventListener("loadedmetadata", () => {
      const min = Math.floor(audio.duration / 60);
      const sec = Math.floor(audio.duration % 60)
        .toString()
        .padStart(2, "0");
      durationSpan.textContent = `${min}:${sec}`;
    });

    // ----- Play Button -----
    const playBtn = card.querySelector(".play-song-btn");
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playSong(song);
      footerParent.style.display = "block";
    });

    // ----- Heart Icon -----
    const heartIcon = card.querySelector(".heart-icon");
    heartIcon.classList.toggle(
      "heart-icon--active",
      likedSongs.some(
        (s) => s.title === song.title && s.artistName === song.artistName
      )
    );
    heartIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = likedSongs.findIndex(
        (s) => s.title === song.title && s.artistName === song.artistName
      );
      if (index === -1) likedSongs.push(song);
      else likedSongs.splice(index, 1);

      updateHeartIcon();

      heartIcon.classList.toggle(
        "heart-icon--active",
        likedSongs.some(
          (s) => s.title === song.title && s.artistName === song.artistName
        )
      );
    });

    // ----- Add to Queue -----
    const addToQueueBtn = card.querySelector(".add-to-queue-btn");
    addToQueueBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      upNextQueue.push(song);
      renderQueue();

      const msg = document.createElement("div");
      msg.classList.add("queue-feedback");
      msg.textContent = `"${song.title}" added to queue`;
      document.body.appendChild(msg);

      setTimeout(() => {
        msg.remove();
      }, 1200);
    });

    targetContainer.appendChild(card);
  });
}

function updateHeartIcon() {
  if (!currentlyPlaying) return;
  heartIcons.forEach((icon) => {
    const isLiked = likedSongs.some(
      (song) =>
        song.title === currentlyPlaying.title &&
        song.artistName === currentlyPlaying.artistName
    );
    icon.classList.toggle("heart-icon--active", isLiked);
  });
}

// ----------------------------
// Progress bar
// ----------------------------
let isDragging = false;
let dragX = 0;

function updateProgress() {
  if (!footerAudio.duration) return;
  const percent = (footerAudio.currentTime / footerAudio.duration) * 100;
  const finalMin = Math.floor(footerAudio.duration / 60);
  const finalSec = Math.floor(footerAudio.duration % 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(footerAudio.currentTime / 60);
  const seconds = Math.floor(footerAudio.currentTime % 60)
    .toString()
    .padStart(2, "0");
  footerAudioProgress.style.width = `${percent}%`;
  footerAudioProgCircle.style.left = `${percent}%`;
  footerAudioProgTimeDuration.innerText = `${minutes}:${seconds}`;
  footerAudioProgDurationEnd.innerText = `${finalMin}:${finalSec}`;
}

function seekAudio(e) {
  const width = footerAudioProgWrap.clientWidth;
  footerAudio.currentTime = (e.offsetX / width) * footerAudio.duration;
}

function startDrag(e) {
  isDragging = true;
  const rect = footerAudioProgWrap.getBoundingClientRect();
  dragX = e.clientX - rect.left;
  updateProgressVisual(dragX);
}

function dragProgress(e) {
  if (!isDragging) return;
  const rect = footerAudioProgWrap.getBoundingClientRect();
  dragX = e.clientX - rect.left;
  updateProgressVisual(dragX);
}

function endDrag() {
  if (isDragging) {
    const width = footerAudioProgWrap.clientWidth;
    footerAudio.currentTime = (dragX / width) * footerAudio.duration;
  }
  isDragging = false;
}

function updateProgressVisual(x) {
  const width = footerAudioProgWrap.clientWidth;
  const percent = Math.min(Math.max((x / width) * 100, 0), 100);
  footerAudioProgress.style.width = percent + "%";
  footerAudioProgCircle.style.left = percent + "%";
}

// ----------------------------
// Auto-play next
// ----------------------------
function autoPlayNext() {
  if (upNextQueue.length > 0) {
    const nextSong = upNextQueue.shift();
    playSong(nextSong);
    renderQueue(); // 🔹 update queue UI immediately
  } else {
    isPlaying = false;
    updateFooter(null);
    renderQueue();
  }
}

// ----------------------------
// Fullscreen toggle
// ----------------------------
function toggleFullscreen() {
  document.querySelector("header").classList.toggle("hidden");
  document.querySelector("main").classList.toggle("hidden");
  const fullScreenIcon = document.querySelector(".footer__maximize-icon");
  const parentFooter = document.querySelector("footer");

  if (!isFullscreen) {
    footer.classList.add("footer--fullscreen");
    body.style.display = "flex";
    parentFooter.style.background = "none";
  } else {
    footer.classList.remove("footer--fullscreen");

    body.style.display = "block";
  }

  isFullscreen = !isFullscreen;
}

function getSongDuration(audioSrc, callback) {
  const audio = new Audio(audioSrc);
  audio.addEventListener("loadedmetadata", () => {
    const min = Math.floor(audio.duration / 60);
    const sec = Math.floor(audio.duration % 60)
      .toString()
      .padStart(2, "0");
    callback(`${min}:${sec}`);
  });
}

const queueIcon = document.querySelector(".queue-icon"); // your queue button
const queueContainer = document.querySelector(".queue-container");

// Function to populate queue
function renderQueue() {
  const queueCardsContainer = queueContainer.querySelector(
    ".queue-card-container"
  );

  // Clear existing cards
  queueCardsContainer.innerHTML = "";

  if (upNextQueue.length === 0) {
    // Show message if queue is empty
    const emptyMessage = document.createElement("div");
    emptyMessage.classList.add("queue-empty-text");
    emptyMessage.textContent = '"No songs in queue"';
    queueCardsContainer.appendChild(emptyMessage);
    return;
  }

  // Loop through upNextQueue
  upNextQueue.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("queue-card");

    card.innerHTML = `
      <div class="queue-number">${index + 1}</div>
      <div class="queue-song-container">
        <img class="queue-song-img" src="${song.picture}" alt="${song.title}" />
        <div class="queue-song-desc">
          <span class="queue-song-title">${song.title}</span>
          <span class="queue-song-artist">${song.artistName}</span>
        </div>
      </div>
      <svg class="x-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
        <path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z"/>
      </svg>
    `;

    // Add click event to x-icon to remove song from queue
    const xIcon = card.querySelector(".x-icon");
    xIcon.addEventListener("click", () => {
      // Remove the song from upNextQueue
      upNextQueue.splice(index, 1);

      // Re-render queue
      renderQueue();
    });

    queueCardsContainer.appendChild(card);
  });
}

function toggleLike() {
  if (!currentlyPlaying) return;
  const index = likedSongs.findIndex(
    (song) =>
      song.title === currentlyPlaying.title &&
      song.artistName === currentlyPlaying.artistName
  );
  if (index === -1) likedSongs.push(currentlyPlaying);
  else likedSongs.splice(index, 1);

  updateHeartIcon();
  updateSongCardsHeart();
}

function showMainSection(sectionToShow) {
  const allSections = document.querySelectorAll(
    ".main__home-container, .queue-container, .main__search-container, .search-part-container, .main__genre-container"
  );

  allSections.forEach((sec) => {
    sec.style.display = "none";
  });

  sectionToShow.style.display = "block";
}

function updateSongCardsHeart() {
  const cards = document.querySelectorAll(".song-card");
  cards.forEach((card) => {
    const title = card.querySelector(".song-title").textContent;
    const artist = card.querySelector(".song-artist-name").textContent;
    const heartIcon = card.querySelector(".heart-icon");

    const isLiked = likedSongs.some(
      (song) => song.title === title && song.artistName === artist
    );

    heartIcon.classList.toggle("heart-icon--active", isLiked);
  });
}

function updateRecentPlayed(song) {
  if (!song) return;

  // remove if already exists
  recentPlayed = recentPlayed.filter(
    (s) => !(s.title === song.title && s.artistName === song.artistName)
  );

  // add song to the top
  recentPlayed.unshift(song);

  if (recentPlayed.length > 12) {
    recentPlayed.pop();
  }

  renderRecentPlayed();
}

function renderRecentPlayed() {
  const container = document.querySelector(".main__recent-playlist-container");
  container.innerHTML = "";

  recentPlayed.forEach((song, index) => {
    // ✅ include index
    const card = document.createElement("div");
    card.classList.add("main__recent-card", "fade-in");
    card.style.animationDelay = `${index * 0.2}s`; // 0.2s gap between cards

    card.innerHTML = `
      <img
        src="${song.picture}"
        class="main__recent-img"
        alt="${song.title}"
      />
      <h5 class="main__artist-name">${song.title}</h5>

      <div class="play-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"></path>
        </svg>
      </div>
    `;

    card.addEventListener("click", () => {
      playSong(song);
    });

    container.appendChild(card);
  });
}

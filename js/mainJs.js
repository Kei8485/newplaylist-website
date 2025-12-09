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

let playlists = [];

let allSongs = [];
let likedSongs = [];
let recentPlayed = []; // will hold unique, last 6 songs
let isFullscreen = false;
let currentlyPlaying = null;
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
      displayArtists(data.artists);
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

      let playlistName = "My Favorites";
      let playlist = playlists.find((p) => p.name === playlistName);
      if (!playlist) {
        playlist = {
          id: Date.now(), // 🔹 Add unique ID
          name: playlistName,
          description: "My favorite songs",
          songs: [],
        };
        playlists.push(playlist);
      }

      let songToAdd = allSongs.find((s) => s.title === "Bohemian Rhapsody");
      if (songToAdd && !playlist.songs.includes(songToAdd)) {
        playlist.songs.push(songToAdd);
      }

      displayPlaylists(); // now it should show

      likedSongs = allSongs.filter(
        (song) => song.title === "Bohemian Rhapsody"
      );
      likedSongs[0].isFavorite = true;

      displaySongs(allSongs);
      displayLikedSongs();
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

  const createPlaylistBtn = document.querySelector(".main__playlist-btn");

  createPlaylistBtn.addEventListener("click", openModal);

  // Form submission
  document
    .getElementById("playlistForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const playlistName = document.getElementById("playlistName").value.trim();
      const playlistDesc = document.getElementById("playlistDesc").value.trim();
      const errorMsg = document.querySelector(".error-msg");

      if (!playlistName) {
        errorMsg.style.display = "block";
        return; // stop submission
      } else {
        errorMsg.style.display = "none";
      }

      // Optional: check description length or other rules

      console.log("Creating playlist:", {
        playlistName,
        playlistDesc,
      });

      closeModal();
    });

  // Close on outside click
  document
    .getElementById("playlistModal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal();
      }
    });

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  const playlistBackBtn = document.querySelector(
    ".playlist-song-header .back-btn-icon"
  );

  playlistBackBtn.addEventListener("click", () => {
    playlistSongsView.style.display = "none"; // hide playlist songs
    playlistGrid.style.display = "grid"; // show playlist main page
  });

  const backBtn = popup.querySelector(".playlist-popup-heading .back-btn-icon");
  backBtn.onclick = hidePlaylistPopup;

  backBtn.addEventListener("click", () => {
    playlistSongsView.style.display = "none";

    playlistGrid.style.display = "grid"; // show playlist grid again
    playListGridTopPart.querySelector(".main__playlist-heading").style.display =
      "block"; // show header
    playListGridTopPart.querySelector(".main__playlist-btn").style.display =
      "block"; // show create button
  });
});

// ----------------------------
// Functions
// ----------------------------

// Add this to your existing variables at the top

// Replace your existing openModal and closeModal functions with these:
function openModal() {
  const modal = document.getElementById("playlistModal");
  modal.classList.add("active");
  document.getElementById("playlistName").focus();
  // Clear any previous errors
  const errorMsg = document.querySelector(".error-msg");
  if (errorMsg) errorMsg.style.display = "none";
}

function closeModal() {
  const modal = document.getElementById("playlistModal");
  modal.classList.remove("active");
  document.getElementById("playlistForm").reset();
  document.getElementById("nameCounter").textContent = "0 / 50";
  document.getElementById("descCounter").textContent = "0 / 200";
  const errorMsg = document.querySelector(".error-msg");
  if (errorMsg) errorMsg.style.display = "none";
}

// Add this function to display playlists
const playlistGrid = document.querySelector(".main__playlist-heading-grid");
const playListGridTopPart = document.querySelector(".main__playlist-top-part");
const playlistSongsView = document.querySelector(
  ".show-playlist-songs-container"
);
const playlistSongsContainer = document.querySelector(
  ".playlist-song-card-container"
);
const playlistNameText = document.querySelector(".playlist-name");
const backBtn = document.querySelector(".back-btn-icon");

function displayPlaylists() {
  const grid = document.querySelector(".main__playlist-heading-grid");
  grid.innerHTML = "";

  if (playlists.length === 0) {
    grid.innerHTML = `
      <div style="
        grid-column: 1/-1; 
        text-align: center; 
        padding: 60px 20px;
        color: rgba(255, 255, 255, 0.6);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" 
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
        style="margin: 0 auto 20px; opacity: 0.5;">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
        <p style="font-size: 1.2rem; margin-bottom: 10px;">No playlists yet</p>
        <p style="font-size: 0.9rem; opacity: 0.7;">Create your first playlist to get started!</p>
      </div>
    `;
    return;
  }

  playlists.forEach((playlist, index) => {
    const card = document.createElement("div");
    card.classList.add("playlist-card");

    card.style.animation = "fadeIn 0.4s ease forwards";
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.opacity = "0";

    card.innerHTML = `
      <div class="playlist-card-inner">
        <div class="playlist-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
            fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
        <h3>${playlist.name}</h3>
        <p class="playlist-desc">${playlist.description || "No description"}</p>
        <div class="playlist-meta">
          <span class="song-count">${playlist.songs.length} songs</span>
        </div>
        <button class="playlist-delete-btn" data-id="${playlist.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6
            m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // CLICK — OPEN PLAYLIST
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".playlist-delete-btn")) {
        playlistSongsView.style.display = "block";
        playlistSongsView.classList.add("active");

        playlistGrid.style.display = "none"; // hide playlist grid
        // Hide header and create button
        playListGridTopPart.querySelector(
          ".main__playlist-heading"
        ).style.display = "none";
        playListGridTopPart.querySelector(".main__playlist-btn").style.display =
          "none";

        playlistNameText.textContent = playlist.name;
        displayPlaylistSongs(playlist);
      }
    });

    // DELETE BUTTON
    const deleteBtn = card.querySelector(".playlist-delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Delete playlist "${playlist.name}"?`)) {
        playlists = playlists.filter((p) => p.id !== playlist.id);
        displayPlaylists();
        showSuccessMessage(`Playlist "${playlist.name}" deleted`);
      }
    });

    grid.appendChild(card);
  });
}

// BACK BUTTON HANDLER
backBtn.addEventListener("click", () => {
  playlistSongsView.style.display = "none";

  playlistGrid.style.display = "grid"; // show playlist grid again
  playListGridTopPart.querySelector(".main__playlist-heading").style.display =
    "block"; // show header
  playListGridTopPart.querySelector(".main__playlist-btn").style.display =
    "block"; // show create button
});

// BACK BUTTON HANDLER (outside displayPlaylists)
backBtn.addEventListener("click", () => {
  playlistSongsView.style.display = "none";

  playlistGrid.style.display = "grid"; // show playlist grid again
  playListGridTopPart.querySelector(".main__playlist-heading").style.display =
    "block"; // show header
  playListGridTopPart.querySelector(".main__playlist-btn").style.display =
    "block"; // show create button
});

function displayPlaylistSongs(playlist) {
  playlistSongsContainer.innerHTML = "";

  if (playlist.songs.length === 0) {
    playlistSongsContainer.innerHTML = `
      <p style="text-align:center; opacity:0.7; padding:20px;">
        No songs in this playlist
      </p>
    `;
    return;
  }

  playlist.songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("main__favorites-card"); // same style as liked songs

    card.innerHTML = `
      <svg class="remove-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
           viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>

      <div class="main__fav-song-img-container">
        <img class="main__fav-song-img" src="${song.picture}" alt="${song.title}" />
        <h5 class="main__fav-song-title">${song.title}</h5>
      </div>

      <div class="main__fav-song-artist-container">
        <h5 class="main__fav-song-artist">${song.artistName}</h5>
      </div>

      <div class="play-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"/>
        </svg>
      </div>

      <div class="spinner">
        <div class="rect1"></div>
        <div class="rect2"></div>
        <div class="rect3"></div>
      </div>
    `;

    // ❌ REMOVE FROM PLAYLIST
    card.querySelector(".remove-icon").addEventListener("click", () => {
      playlist.songs.splice(index, 1); // remove song from playlist
      displayPlaylistSongs(playlist); // re-render songs view
      displayPlaylists(); // 🔹 refresh playlist grid to update count
      showSuccessMessage("Song removed from playlist");
    });

    // ▶ PLAY SONG
    card.querySelector(".play-btn").addEventListener("click", () => {
      playSong(song);
      updateActiveSpinners();
      if (footerParent) footerParent.style.display = "block";
    });

    playlistSongsContainer.appendChild(card);
  });

  updateActiveSpinners();
}

// Add success message function
function showSuccessMessage(message) {
  const msg = document.createElement("div");
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #7e1549, #a02245);
    color: #fff;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 2000;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    animation: slideInRight 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    opacity: 0.8;
  `;
  msg.textContent = message;
  document.body.appendChild(msg);

  setTimeout(() => {
    msg.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => msg.remove(), 300);
  }, 2500);
}

// Update the form submission handler inside DOMContentLoaded
// Replace the existing form submission code with this:
document
  .getElementById("playlistForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const playlistName = document.getElementById("playlistName").value.trim();
    const playlistDesc = document.getElementById("playlistDesc").value.trim();
    const errorMsg = document.querySelector(".error-msg");

    if (!playlistName) {
      errorMsg.style.display = "block";
      document.getElementById("playlistName").focus();
      return;
    } else {
      errorMsg.style.display = "none";
    }

    // Create playlist object
    const newPlaylist = {
      id: Date.now(), // 🔹 Add unique ID
      name: playlistName,
      description: playlistDesc,
      songs: [],
    };

    // Add to playlists array
    playlists.push(newPlaylist);

    // Display playlists
    displayPlaylists();

    // Show success message
    showSuccessMessage(`Playlist "${playlistName}" created successfully!`);

    // Close modal
    closeModal();
  });

// Add character counter event listeners inside DOMContentLoaded
const playlistNameInput = document.getElementById("playlistName");
const playlistDescInput = document.getElementById("playlistDesc");

playlistNameInput.addEventListener("input", () => {
  updateCharCounter("playlistName", "nameCounter", 50);
  // Clear error on input
  const errorMsg = document.querySelector(".error-msg");
  if (errorMsg && playlistNameInput.value.trim()) {
    errorMsg.style.display = "none";
  }
});

playlistDescInput.addEventListener("input", () => {
  updateCharCounter("playlistDesc", "descCounter", 200);
});

// Call displayPlaylists on page load to show empty state
displayPlaylists();

// Character counter
function updateCharCounter(inputId, counterId, maxLength) {
  const input = document.getElementById(inputId);
  const counter = document.getElementById(counterId);
  const length = input.value.length;

  counter.textContent = `${length} / ${maxLength}`;

  counter.classList.remove("warning", "error");
  if (length >= maxLength * 0.9) {
    counter.classList.add("warning");
  }
  if (length >= maxLength) {
    counter.classList.add("error");
  }
}

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

  // Stop and reset the audio before loading new song
  footerAudio.pause();
  footerAudio.currentTime = 0;

  // Update current song
  currentlyPlaying = song;

  // Update footer (this sets footerAudio.src)
  updateFooter(currentlyPlaying);

  // Load and play the new audio
  footerAudio.load();

  const playPromise = footerAudio.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isPlaying = true;
        updatePlayPauseIcon();
      })
      .catch((error) => {
        console.error("Error playing audio:", error);
        isPlaying = false;
        updatePlayPauseIcon();
      });
  }

  // Add to played history if not last
  if (
    playedHistory.length === 0 ||
    playedHistory[playedHistory.length - 1] !== song
  ) {
    playedHistory.push(song);
  }

  updateRecentPlayed(song);
  updateHeartIcon();
  renderQueue();
  updateActiveSpinners();

  // Show footer
  if (footerParent) footerParent.style.display = "block";
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
    genreHeading.textContent = genre;
    targetContainer.appendChild(genreHeading);
  }

  songs.forEach((song) => {
    const card = document.createElement("div");
    card.classList.add("song-card");

    card.innerHTML = `
      <img class="song-img" src="${song.picture}" alt="${song.title}" />
      <div class="play-song-btn">
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
          <span class="song-duration">${song.duration || "0:00"}</span>
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(179, 177, 177)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="add-to-queue-btn"> 
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
            <line x1="12" x2="12" y1="8" y2="16"/>
            <line x1="8" x2="16" y1="12" y2="12"/>
          </svg>
          <svg class="addToPlaylistIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"> 
            <path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/> 
          </svg>
          <div class="spinner">
            <div class="rect1"></div>
            <div class="rect2"></div>
            <div class="rect3"></div>
          </div>
        </div>
      </div>
    `;

    // ----- Play Button -----
    const playBtn = card.querySelector(".play-song-btn");
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playSong(song);
      if (footerParent) footerParent.style.display = "block";
    });

    // ----- Add to Playlist -----
    const addToPlaylistIcon = card.querySelector(".addToPlaylistIcon");
    addToPlaylistIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      showPlaylistPopup(song);
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
      const songInAll = allSongs.find(
        (s) => s.title === song.title && s.artistName === song.artistName
      );
      if (!songInAll) return;
      songInAll.isFavorite = !songInAll.isFavorite;
      likedSongs = allSongs.filter((s) => s.isFavorite);

      updateHeartIcon();
      updateSongCardsHeart();
      displayLikedSongs();
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
      setTimeout(() => msg.remove(), 1200);
    });

    // ----- Duration Fix -----
    const durationSpan = card.querySelector(".song-duration");
    if (!song.duration || song.duration === "0:00") {
      getSongDuration(song.audio, (realDuration) => {
        durationSpan.textContent = realDuration;
        song.duration = realDuration; // cache duration
      });
    } else {
      durationSpan.textContent = song.duration;
    }

    targetContainer.appendChild(card);
  });

  // Update spinner for currently playing song
  updateActiveSpinners();
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
    parentFooter.style.background = "rgba(12, 12, 12, 0.384)";
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

  const songInAll = allSongs.find(
    (song) =>
      song.title === currentlyPlaying.title &&
      song.artistName === currentlyPlaying.artistName
  );
  if (!songInAll) return;

  // Toggle favorite
  songInAll.isFavorite = !songInAll.isFavorite;

  // Update likedSongs array
  likedSongs = allSongs.filter((song) => song.isFavorite);

  updateHeartIcon(); // footer heart
  updateSongCardsHeart(); // main song list hearts
  displayLikedSongs(); // update favorites section dynamically
}

function showMainSection(sectionToShow) {
  const allSections = document.querySelectorAll(
    ".main__home-container, .queue-container, .main__search-container, .search-part-container, .main__genre-container, .main__artist-container, .main__favorites-container, .main__playlist-container"
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
    const card = document.createElement("div");
    card.classList.add("main__recent-card", "fade-in");
    card.style.animationDelay = `${index * 0.2}s`;

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
      if (footerParent) footerParent.style.display = "block";
    });

    container.appendChild(card);
  });
}

function displayArtists(artists) {
  const container = document.querySelector(".main__artist-container");
  const heading = container.querySelector(".main__artist-heading");
  const grid = container.querySelector(".main__genre-heading-grid");

  let pickContainer = container.querySelector(".main__artist-pick");
  if (!pickContainer) {
    pickContainer = document.createElement("div");
    pickContainer.classList.add("main__artist-pick");
    container.appendChild(pickContainer);
  }

  if (!grid) return;
  grid.innerHTML = "";

  artists.forEach((artist) => {
    const card = document.createElement("div");
    card.classList.add("main__artist-card");

    card.innerHTML = `
      <div class="main__artist-card-inner">
        <div class="main__artist-img">
          <img class="artist-img" src="${artist.songs[0].picture}" alt="${artist.name}" />
          <div class="play-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"/>
            </svg>
          </div>
        </div>
        <h2 class="main__artist-name">${artist.name}</h2>
      </div>
    `;

    card.addEventListener("click", () => {
      // Hide artist grid
      grid.style.display = "none";

      // Show artist songs container
      pickContainer.classList.add("main__genre-pick--active");

      // Update heading
      heading.textContent = `${artist.name.toUpperCase()} SONGS`;

      // Create top bar (back button container)
      let topPart = container.querySelector(".artist-top-part");
      if (!topPart) {
        topPart = document.createElement("div");
        topPart.classList.add("artist-top-part");
        heading.before(topPart);
      } else {
        topPart.innerHTML = ""; // clear previous buttons if any
      }

      // Create BACK BUTTON dynamically
      const backBtn = document.createElement("button");
      backBtn.classList.add("back-btn");
      backBtn.innerHTML = `
        <svg class="back-btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/>
        </svg>`;
      topPart.appendChild(backBtn);

      // Back button behavior
      backBtn.addEventListener("click", () => {
        pickContainer.classList.remove("main__genre-pick--active");
        grid.style.display = "grid";
        heading.textContent = "Listen to your favorite artist here!";
        pickContainer.innerHTML = "";
        topPart.innerHTML = ""; // remove back button
      });

      // DISPLAY SONGS OF THAT ARTIST
      displaySongs(
        artist.songs.map((song) => ({
          ...song,
          artistName: artist.name,
          isFavorite: likedSongs.some(
            (liked) =>
              liked.title === song.title && liked.artistName === artist.name
          ),
        })),
        artist.name,
        pickContainer
      );
    });

    grid.appendChild(card);
  });
}

function displayLikedSongs() {
  const container = document.getElementById("likedSongsContainer");
  container.innerHTML = "";

  if (likedSongs.length === 0) {
    container.innerHTML = "<p>No liked songs yet.</p>";
    return;
  }

  likedSongs.forEach((song) => {
    const card = document.createElement("div");
    card.classList.add("main__favorites-card");

    card.innerHTML = `
      <svg class="heart-icon ${
        song.isFavorite ? "heart-icon--active" : ""
      }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
        <path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/>
      </svg>
      <div class="main__fav-song-img-container">
        <img class="main__fav-song-img" src="${song.picture}" alt="${
      song.title
    }" />
        <h5 class="main__fav-song-title">${song.title}</h5>
      </div>
      <div class="main__fav-song-artist-container">
        <h5 class="main__fav-song-artist">${song.artistName}</h5>
      </div>
      <div class="play-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"/>
        </svg>
      </div>
      <div class="spinner">
        <div class="rect1"></div>
        <div class="rect2"></div>
        <div class="rect3"></div>
      </div>
    `;

    card.querySelector(".heart-icon").addEventListener("click", () => {
      const songInAll = allSongs.find(
        (s) => s.title === song.title && s.artistName === song.artistName
      );
      if (!songInAll) return;
      songInAll.isFavorite = !songInAll.isFavorite;

      likedSongs = allSongs.filter((s) => s.isFavorite);
      updateHeartIcon();
      updateSongCardsHeart();
      displayLikedSongs();
    });

    card.querySelector(".play-btn").addEventListener("click", () => {
      playSong(song);
      updateActiveSpinners();
      if (footerParent) footerParent.style.display = "block";
    });

    container.appendChild(card);
  });

  updateActiveSpinners();
}

function updateActiveSpinners() {
  // Remove active state from all spinners
  document.querySelectorAll(".spinner").forEach((spinner) => {
    spinner.classList.remove("active");
    spinner.style.filter = "grayscale(100%)";
  });

  // If no song is playing, return early
  if (!currentlyPlaying) return;

  // Find all song cards (search, genre, artist, favorites, recent)
  const allCards = document.querySelectorAll(
    ".song-card, .main__favorites-card"
  );

  allCards.forEach((card) => {
    const titleEl = card.querySelector(".song-title, .main__fav-song-title");
    const artistEl = card.querySelector(
      ".song-artist-name, .main__fav-song-artist"
    );

    if (!titleEl || !artistEl) return;

    const title = titleEl.textContent.trim();
    const artist = artistEl.textContent.trim();

    // Check if this card matches the currently playing song
    if (
      title === currentlyPlaying.title &&
      artist === currentlyPlaying.artistName
    ) {
      const spinner = card.querySelector(".spinner");
      if (spinner) {
        spinner.classList.add("active");
        spinner.style.filter = "none";
      }
    }
  });
}

function showPlaylistPopup(song) {
  const popup = document.querySelector(".add-to-playlist-popup-container");
  const songNameText = popup.querySelector(".pop-up-text");

  songNameText.textContent = `Add to playlist - "${song.title}"`;

  const playlistPopup = popup.querySelector(".playlist-popup");
  playlistPopup.innerHTML = "";

  playlists.forEach((playlist, index) => {
    const playlistCard = document.createElement("div");
    playlistCard.classList.add("popup-song-card");

    playlistCard.innerHTML = `
      <div class="popup-song-info">
        <span class="playlist-number">${index + 1}</span>
        <span class="popup-song-title">${playlist.name}</span>
        <svg class="addToPlaylistIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/>
        </svg>
      </div>
    `;

    playlistCard.addEventListener("click", () => {
      addSongToPlaylist(playlist, song);
      hidePlaylistPopup();
    });

    playlistPopup.appendChild(playlistCard);
  });

  // Show popup
  popup.style.display = "block";

  // Disable scroll
  document.body.style.overflow = "hidden";

  // FIX: Attach back button listener AFTER popup is visible
  const backBtn = popup.querySelector(".playlist-popup-heading .back-btn-icon");
  if (backBtn) {
    backBtn.onclick = hidePlaylistPopup;
  }
}

function hidePlaylistPopup() {
  const popup = document.querySelector(".add-to-playlist-popup-container");
  popup.style.display = "none";

  // Restore scrolling
  document.body.style.overflow = "";
}

function addSongToPlaylist(playlist, song) {
  // Check if song already exists
  const exists = playlist.songs.some(
    (s) => s.title === song.title && s.artistName === song.artistName
  );

  if (!exists) {
    playlist.songs.push(song);

    displayPlaylists(); // 🔹 refresh playlist grid to update count

    // Show feedback
    const msg = document.createElement("div");
    msg.classList.add("queue-feedback");
    msg.textContent = `"${song.title}" added to ${playlist.name}`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1200);
  } else {
    // Show already exists message
    const msg = document.createElement("div");
    msg.classList.add("queue-feedback");
    msg.textContent = `"${song.title}" is already in ${playlist.name}`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1200);
  }
}

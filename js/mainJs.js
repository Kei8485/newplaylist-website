// ----------------------------
// 1. Variables & select elements
// ----------------------------
let currentlyPlaying = null; // song currently playing
let upNextQueue = [
  {
    title: "Killer Queen",
    audio: "../audios/queenSongs/Killer Queen (Remastered 2011).mp3",
    picture: "../img/songPicture/queenPicture/bohemianRhapsody.png",
    artistName: "Queen",
  },
];
let playedHistory = []; // history of played songs
let isPlaying = false; // play/pause state

const footer = document.querySelector(".footer__container");
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

// ----------------------------
// 2. Update footer function
// ----------------------------
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

// ----------------------------
// 3. Fetch JSON and load first song
// ----------------------------
fetch("../json/SystemMusic.json")
  .then((response) => response.json())
  .then((data) => {
    if (data.artists.length > 0 && data.artists[0].songs.length > 0) {
      const artist = data.artists[0];
      const song = {
        ...artist.songs[0],
        artistName: artist.name,
        isFavorite: false,
      };

      currentlyPlaying = song;
      playedHistory.push(currentlyPlaying); // add first song to history
      updateFooter(currentlyPlaying);
    } else {
      updateFooter(null);
    }
  })
  .catch((error) => {
    console.error("Error loading JSON:", error);
    updateFooter(null);
  });

// ----------------------------
// 4. Play song function
// ----------------------------
function playSong(song) {
  if (!song) return;

  currentlyPlaying = song;
  updateFooter(currentlyPlaying);
  footerAudio.play();
  isPlaying = true;
  updatePlayPauseIcon();

  // Add to history if last song is not the same
  if (
    playedHistory.length === 0 ||
    playedHistory[playedHistory.length - 1] !== song
  ) {
    playedHistory.push(song);
  }
}

// ----------------------------
// 5. Back / Forward buttons
// ----------------------------
footerBtnBack.addEventListener("click", () => {
  if (playedHistory.length > 1) {
    const lastSong = playedHistory.pop(); // remove current
    const previousSong = playedHistory[playedHistory.length - 1];

    // Put the last song at the start of the queue
    upNextQueue.unshift(lastSong);

    playSong(previousSong);
    updatePlayPauseIcon();
  }
});

footerBtnForward.addEventListener("click", () => {
  if (upNextQueue.length > 0) {
    const nextSong = upNextQueue.shift(); // remove first from queue
    playSong(nextSong);
    updatePlayPauseIcon();
  }
});

// ----------------------------
// 6. Play/pause button
// ----------------------------
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

// ----------------------------
// 7. Footer heart/favorite toggle
// ----------------------------
let likedSongs = []; // array to store liked songs

function updateHeartIcon() {
  if (!currentlyPlaying) {
    return;
  }

  heartIcons.forEach((icon) => {
    const isLiked = likedSongs.some(
      (song) =>
        song.title === currentlyPlaying.title &&
        song.artistName === currentlyPlaying.artistName
    );

    if (isLiked) {
      icon.classList.add("heart-icon--active");
    } else {
      icon.classList.remove("heart-icon--active");
    }
  });
}

heartIcons.forEach((icon) => {
  icon.addEventListener("click", () => {
    if (!currentlyPlaying) return; // do nothing if no song is playing

    const index = likedSongs.findIndex(
      (song) =>
        song.title === currentlyPlaying.title &&
        song.artistName === currentlyPlaying.artistName
    );

    if (index === -1) {
      // not in likedSongs, add it
      likedSongs.push(currentlyPlaying);
      console.log("Liked song added:", currentlyPlaying.title);
    } else {
      // already in likedSongs, remove it
      likedSongs.splice(index, 1);
      console.log("Liked song removed:", currentlyPlaying.title);
    }

    // update the icon visual
    updateHeartIcon();
  });
});

// Call updateHeartIcon() every time you play a new song
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

  // Update heart icon for the new song
  updateHeartIcon();
}

// ----------------------------
// 8. Progress bar + drag
// ----------------------------
footerAudio.addEventListener("timeupdate", () => {
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
});

let isDragging = false;
let dragX = 0;

footerAudioProgWrap.addEventListener("click", (e) => {
  const widthOfProgCon = footerAudioProgWrap.clientWidth;
  footerAudio.currentTime = (e.offsetX / widthOfProgCon) * footerAudio.duration;
});

footerAudioProgWrap.addEventListener("mousedown", (e) => {
  isDragging = true;
  const rect = footerAudioProgWrap.getBoundingClientRect();
  dragX = e.clientX - rect.left;
  updateProgressVisual(dragX);
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const rect = footerAudioProgWrap.getBoundingClientRect();
  dragX = e.clientX - rect.left;
  updateProgressVisual(dragX);
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    const width = footerAudioProgWrap.clientWidth;
    footerAudio.currentTime = (dragX / width) * footerAudio.duration;
  }
  isDragging = false;
});

function updateProgressVisual(x) {
  const width = footerAudioProgWrap.clientWidth;
  const percent = Math.min(Math.max((x / width) * 100, 0), 100);
  footerAudioProgress.style.width = percent + "%";
  footerAudioProgCircle.style.left = percent + "%";
}

// ----------------------------
// 9. Auto-play next song when current ends
// ----------------------------
footerAudio.addEventListener("ended", () => {
  if (upNextQueue.length > 0) {
    const nextSong = upNextQueue.shift();
    playSong(nextSong);
  } else {
    isPlaying = false;
    updateFooter(null);
  }
});

// ----------------------------
// 10. Add song to queue function
// ----------------------------
function addToQueue(song) {
  if (!song) return;
  upNextQueue.push(song);
}

// ----------------------------
// 11. Full Screen onclick
// ----------------------------
let isFullscreen = false;

fullScreenBtn.addEventListener("click", () => {
  document.querySelector("header").classList.toggle("hidden");
  document.querySelector("main").classList.toggle("hidden");
  const footer = document.querySelector("footer");
  const fullScreenIcon = document.querySelector(".footer__maximize-icon");
  if (!isFullscreen) {
    fullScreenIcon.setAttribute(
      "d",
      "M520 288L376 288C362.7 288 352 277.3 352 264L352 120C352 110.3 357.8 101.5 366.8 97.8C375.8 94.1 386.1 96.2 393 103L433 143L506.4 69.6C510 66 514.9 64 520 64C525.1 64 530 66 533.7 69.7L570.4 106.4C574 110 576 114.9 576 120C576 125.1 574 130 570.3 133.7L497 207L537 247C543.9 253.9 545.9 264.2 542.2 273.2C538.5 282.2 529.7 288 520 288zM520 352C529.7 352 538.5 357.8 542.2 366.8C545.9 375.8 543.9 386.1 537 393L497 433L570.4 506.4C574 510 576.1 514.9 576.1 520.1C576.1 525.3 574.1 530.1 570.4 533.8L533.7 570.5C530 574 525.1 576 520 576C514.9 576 510 574 506.3 570.3L433 497L393 537C386.1 543.9 375.8 545.9 366.8 542.2C357.8 538.5 352 529.7 352 520L352 376C352 362.7 362.7 352 376 352L520 352zM264 352C277.3 352 288 362.7 288 376L288 520C288 529.7 282.2 538.5 273.2 542.2C264.2 545.9 253.9 543.9 247 537L207 497L133.6 570.4C130 574 125.1 576 120 576C114.9 576 110 574 106.3 570.3L69.7 533.7C66 530 64 525.1 64 520C64 514.9 66 510 69.7 506.3L143 433L103 393C96.1 386.1 94.1 375.8 97.8 366.8C101.5 357.8 110.3 352 120 352L264 352zM120 288C110.3 288 101.5 282.2 97.8 273.2C94.1 264.2 96.2 253.9 103 247L143 207L69.7 133.7C66 130 64 125.1 64 120C64 114.9 66 110 69.7 106.3L106.3 69.7C110 66 114.9 64 120 64C125.1 64 130 66 133.7 69.7L207 143L247 103C253.9 96.1 264.2 94.1 273.2 97.8C282.2 101.5 288 110.3 288 120L288 264C288 277.3 277.3 288 264 288L120 288z"
    );
    footer.classList.add("footer--fullscreen");
  } else {
    fullScreenIcon.setAttribute(
      "d",
      "M408 64L552 64C565.3 64 576 74.7 576 88L576 232C576 241.7 570.2 250.5 561.2 254.2C552.2 257.9 541.9 255.9 535 249L496 210L409 297C399.6 306.4 384.4 306.4 375.1 297L343.1 265C333.7 255.6 333.7 240.4 343.1 231.1L430.1 144.1L391.1 105.1C384.2 98.2 382.2 87.9 385.9 78.9C389.6 69.9 398.3 64 408 64zM232 576L88 576C74.7 576 64 565.3 64 552L64 408C64 398.3 69.8 389.5 78.8 385.8C87.8 382.1 98.1 384.2 105 391L144 430L231 343C240.4 333.6 255.6 333.6 264.9 343L296.9 375C306.3 384.4 306.3 399.6 296.9 408.9L209.9 495.9L248.9 534.9C255.8 541.8 257.8 552.1 254.1 561.1C250.4 570.1 241.7 576 232 576z" // example for fullscreen icon
    );
    console.log("else is working");
    footer.classList.remove("footer--fullscreen");
  }

  isFullscreen = !isFullscreen;
});

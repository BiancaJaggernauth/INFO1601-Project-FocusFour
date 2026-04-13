/*
FILE: session.js

PURPOSE:
Handles all functionality for the session logging page.

RESPONSIBILITIES:
- Search for books using Google Books API
- Display search results with fav and select buttons
- Save and retrieve favourite books from localStorage
- Study goal timer with start, pause and reset
- Auto-log session when timer ends
- Manually log session (logged in users only)
- Redirect guest users to login page when attempting to log session

LOCAL STORAGE KEYS:
- "isLoggedIn" (from auth.js) - checks if user is logged in
- "sessions" (from storage.js) - saves logged sessions
- "favourites" - saves user's favourite books

NOTES FOR TEAM:
- This file is linked only in session.html
- Uses Google Books API for book search
- Guest users can search books, use timer and favourite books
- Only logged in users can log sessions and view history
*/

const API_KEY = "AIzaSyAhkm6Xqp69bHjQCxhUwy9zlb5Mt8McFGk";
function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("session-date").valueAsDate = new Date();
  renderLogButton();
  renderFavourites();

  document.getElementById("searchBtn").addEventListener("click", searchBooks);
  document.getElementById("bookInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") searchBooks();
  });
});


function renderLogButton() {
  const wrap = document.getElementById("log-btn-wrap");
  if (isLoggedIn()) {
    wrap.innerHTML = `<button class="btn-log" onclick="logSession()">Log Session Manually</button>`;
  } else {
    wrap.innerHTML = `<a href="login.html" class="btn-log guest">Log in to log session</a>`;
  }
}


let selectedBook = null;

function searchBooks() {
  const query = document.getElementById("bookInput").value.trim();
  const resultsDiv = document.getElementById("search-results");

  if (!query) {
    resultsDiv.innerHTML = `<div class="results-placeholder">Please enter a search term</div>`;
    return;
  }

  resultsDiv.innerHTML = `<div class="results-placeholder">Searching...</div>`;

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${API_KEY}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      resultsDiv.innerHTML = "";

      if (!data.items || data.items.length === 0) {
        resultsDiv.innerHTML = `<div class="results-placeholder">No results found. Try a different search.</div>`;
        return;
      }

      data.items.slice(0, 5).forEach((book, i) => {
  const info        = book.volumeInfo;
  const title       = info.title || "Unknown Title";
  const author      = info.authors ? info.authors.join(", ") : "Unknown Author";
  const thumbnail   = info.imageLinks ? info.imageLinks.thumbnail : null;
  const description = info.description
    ? (info.description.length > 180 ? info.description.slice(0, 180) + "…" : info.description)
    : "No description available.";
  const favs        = getFavourites();
  const isFaved     = favs.some(f => f.title === title && f.author === author);

  const card = document.createElement("div");
  card.className = "book-card";
  card.id = `book-${i}`;
  card.innerHTML = `
    ${thumbnail
      ? `<img src="${thumbnail}" class="book-thumb" alt="${title}"/>`
      : `<div class="book-thumb-placeholder">📖</div>`}
    <div class="book-info">
      <div class="book-title">${title}</div>
      <div class="book-author">${author}</div>
      <div class="book-desc">${description}</div>
    </div>
    <div class="book-actions">
      <button class="btn-fav ${isFaved ? "active" : ""}"
        data-title="${title}" data-author="${author}" data-thumbnail="${thumbnail || ""}">
        ${isFaved ? "♥ Fav" : "♡ Fav"}
      </button>
      <button class="btn-select" id="select-${i}"
        data-title="${title}" data-author="${author}">
        Select
      </button>
    </div>
  `;

  card.querySelector(".btn-fav").addEventListener("click", function () {
    toggleFav(this, title, author, thumbnail || "");
  });
  card.querySelector(".btn-select").addEventListener("click", function () {
    selectBook(i, title, author);
  });

  resultsDiv.appendChild(card);
});
    })
    .catch(error => {
      console.error("Error:", error);
      resultsDiv.innerHTML = `<div class="results-placeholder">Error fetching results. Check your connection.</div>`;
    });
}


function selectBook(i, title, author) {
  const btn = document.getElementById(`select-${i}`);

  
  if (selectedBook && selectedBook.title === title && selectedBook.author === author) {
    selectedBook = null;
    btn.classList.remove("active");
    btn.textContent = "Select";
    return;
  }

  
  selectedBook = { title, author };
  document.querySelectorAll(".btn-select").forEach(b => {
    b.classList.remove("active");
    b.textContent = "Select";
  });
  btn.classList.add("active");
  btn.textContent = "Selected ";
}


function getFavourites() {
  return JSON.parse(localStorage.getItem("favourites") || "[]");
}

function saveFavourites(favs) {
  localStorage.setItem("favourites", JSON.stringify(favs));
}

function toggleFav(btn, title, author, thumbnail) {
  let favs = getFavourites();
  const exists = favs.some(f => f.title === title && f.author === author);

  if (exists) {
    favs = favs.filter(f => !(f.title === title && f.author === author));
    btn.classList.remove("active");
    btn.textContent = "♡ Fav";
  } else {
    favs.push({ title, author, thumbnail });
    btn.classList.add("active");
    btn.textContent = "♥ Fav";
  }

  saveFavourites(favs);
  renderFavourites();
}

function renderFavourites() {
  const favs = getFavourites();
  const list = document.getElementById("favourites-list");

  if (favs.length === 0) {
    list.innerHTML = `<p class="fav-empty">No favourites yet. Search for a book and click "Fav" to save it here.</p>`;
    return;
  }

  list.innerHTML = "";
  favs.forEach((fav, i) => {
    const item = document.createElement("div");
    item.className = "fav-item";
    item.innerHTML = `
      <div class="fav-item-info">
        <div class="fav-item-title">${fav.title}</div>
        <div class="fav-item-author">${fav.author}</div>
      </div>
      <button class="btn-unfav">Fav</button>
    `;
    item.querySelector(".btn-unfav").addEventListener("click", function () {
      removeFav(i);
    });
    list.appendChild(item);
  });
}

function removeFav(index) {
  let favs = getFavourites();
  favs.splice(index, 1);
  saveFavourites(favs);
  renderFavourites();
}


let timerInterval = null;
let secondsLeft = 0;
let timerRunning = false;

function getGoalSeconds() {
  const amount = parseInt(document.getElementById("goal-amount").value) || 0;
  const unit = document.getElementById("goal-unit").value;
  return unit === "hours" ? amount * 3600 : amount * 60;
}

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function startTimer() {
  if (timerRunning) return;
  if (secondsLeft === 0) {
    secondsLeft = getGoalSeconds();
    if (secondsLeft <= 0) {
      alert("Please enter a goal duration first.");
      return;
    }
  }
  timerRunning = true;
  document.getElementById("btn-start").textContent = "Running...";
  document.getElementById("timer-sub").textContent = "Timer is running — keep studying!";
  document.getElementById("timer-count").className = "timer-count running";

  timerInterval = setInterval(() => {
    secondsLeft--;
    document.getElementById("timer-count").textContent = formatTime(secondsLeft);
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById("timer-count").className = "timer-count done";
      document.getElementById("timer-count").textContent = "00:00";
      document.getElementById("timer-sub").textContent = "Time is up! Session has been logged.";
      document.getElementById("btn-start").textContent = "Start Timer";
      autoLog();
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById("btn-start").textContent = "Resume";
  document.getElementById("timer-sub").textContent = "Timer paused. Click Resume to continue.";
  document.getElementById("timer-count").className = "timer-count";
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  secondsLeft = 0;
  document.getElementById("timer-count").textContent = "00:00";
  document.getElementById("timer-count").className = "timer-count";
  document.getElementById("timer-sub").textContent = "Countdown appears here when started";
  document.getElementById("btn-start").textContent = "Start Timer";
}


function gatherSession() {
  return {
    book:     selectedBook ? `${selectedBook.title} — ${selectedBook.author}` : "No book selected",
    subject:  document.getElementById("subject").value || "",
    duration: document.getElementById("duration").value || "",
    date:     document.getElementById("session-date").value,
    goal:     document.getElementById("goal-amount").value
              ? `${document.getElementById("goal-amount").value} ${document.getElementById("goal-unit").value}`
              : "",
    notes:    document.getElementById("notes").value || "",
    loggedAt: new Date().toISOString()
  };
}

function saveSession(session) {
  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
  sessions.push(session);
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

function autoLog() {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    alert("Time is up! Please log in to save your session.");
    window.location.href = "login.html";
    return;
  }

  const session = gatherSession();
  saveSession(session);
  alert("Session logged automatically!");
  window.location.href = "dashboard.html"; 
}

function logSession() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  
  const session = gatherSession();
  saveSession(session);
  alert("Session logged successfully!");
  window.location.href = "dashboard.html";
}
  const moodMap = {
    lofi:      { label: 'Lo-fi Beats',     src: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&controls=1&rel=0' },
    classical: { label: 'Classical',       src: 'https://www.youtube.com/embed/mPZkdNFkNps?autoplay=0&controls=1&rel=0' },
    nature:    { label: 'Nature Sounds',   src: 'https://www.youtube.com/embed/eKFTSSKCzWA?autoplay=0&controls=1&rel=0' },
    ambient: { label  : 'Ambient',         src: 'https://www.youtube.com/embed/Ryst1CbI18E?autoplay=0&controls=1&rel=0' },
    jazz:      { label: 'Jazz Café',       src: 'https://www.youtube.com/embed/Dx5qFachd3A?autoplay=0&controls=1&rel=0' },
    binaural:  { label: 'Binaural Beats',  src: 'https://www.youtube.com/embed/WPni755-Krg?autoplay=0&controls=1&rel=0' },
  };

  function setMood(btn, key) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mood = moodMap[key];
    document.getElementById('mood-player-label').textContent = 'Now playing — ' + mood.label;
    document.getElementById('mood-iframe').src = mood.src;
  }
function toggleMood() {
  const body = document.getElementById('mood-body');
  const btn = document.getElementById('mood-toggle-btn');
  const isOpen = btn.classList.contains('open');
  if (isOpen) {
    btn.classList.remove('open');
    body.style.display = 'none';
  } else {
    btn.classList.add('open');
    body.style.display = 'block';
  }
}
  function loadSpotify() {
    const raw = document.getElementById('spotify-link-input').value.trim();
    if (!raw) return;
    const match = raw.match(/spotify\.com\/(playlist|album|track|artist)\/([A-Za-z0-9]+)/);
    if (!match) { alert('Please paste a valid Spotify link'); return; }
    const embedSrc = 'https://open.spotify.com/embed/' + match[1] + '/' + match[2] + '?utm_source=generator';
    document.getElementById('spotify-placeholder').style.display = 'none';
    document.getElementById('spotify-embed-container').innerHTML =
      '<iframe src="' + embedSrc + '" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:10px;"></iframe>';
  }
function loadYoutube() {
  const raw = document.getElementById('yt-link-input').value.trim();
  if (!raw) return;

  let embedSrc = '';

  const playlistMatch = raw.match(/[?&]list=([A-Za-z0-9_-]+)/);
  const videoMatch = raw.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);

  if (playlistMatch) {
    embedSrc = 'https://www.youtube.com/embed/videoseries?list=' + playlistMatch[1] + '&controls=1&rel=0';
  } else if (videoMatch) {
    embedSrc = 'https://www.youtube.com/embed/' + videoMatch[1] + '?controls=1&rel=0';
  } else {
    alert('Please paste a valid YouTube link');
    return;
  }

  document.getElementById('yt-placeholder').style.display = 'none';
  document.getElementById('yt-embed-container').innerHTML =
    '<iframe src="' + embedSrc + '" width="100%" height="200" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius:10px; display:block;"></iframe>';
}

function loadAppleMusic() {
  const raw = document.getElementById('apple-link-input').value.trim();
  if (!raw) return;

  const match = raw.match(/music\.apple\.com\/([a-z]{2})\/(playlist|album|song)\/([^/]+)\/([^?]+)/);
  if (!match) {
    alert('Please paste a valid Apple Music link');
    return;
  }

  const embedSrc = 'https://embed.music.apple.com/' + match[1] + '/' + match[2] + '/' + match[3] + '/' + match[4];

  document.getElementById('apple-placeholder').style.display = 'none';
  document.getElementById('apple-embed-container').innerHTML =
    '<iframe src="' + embedSrc + '" width="100%" height="200" frameborder="0" allow="autoplay *; encrypted-media *;" style="border-radius:10px; display:block;"></iframe>';
}
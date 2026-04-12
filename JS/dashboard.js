/*
FILE: dashboard.js

PURPOSE:
Handles dashboard functionality and data visualization.

RESPONSIBILITIES:
- Load study session data
- Process data for charts
- Render charts using Chart.js

NOTES FOR TEAM:
- This file connects to Chart.js (API requirement)
- Keep all chart related logic here
*/

let isLoggedIn = false;
let username   = "User";
let booksData  = [];

document.addEventListener("DOMContentLoaded", init);

function init() {
    isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    username   = localStorage.getItem("username") || "User";

    setupUI();
    bindEvents();
}

function setupUI() {
    let guestOverlay  = document.querySelector("#guest-view");
    let welcomeHeader = document.querySelector("#welcome-header");
    let navUserText   = document.querySelector("#nav-user");

    if (isLoggedIn) {
        guestOverlay.style.display = "none";
        navUserText.innerText   = `Hi, ${username}`;
        welcomeHeader.innerText = `Welcome Back, ${username}`;

        loadRealStats();
        loadSessionHistory();
        renderFavorites(); 
    } else {
        guestOverlay.style.display = "flex";
    }
}

function bindEvents() {
    let searchBtn = document.querySelector("#searchBtn");
    let logoutBtn = document.querySelector("#logoutBtn");

    searchBtn.addEventListener("click", searchBooks);
    document.querySelector("#bookInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchBooks();
    });
    
    logoutBtn.addEventListener("click", logoutUser);
}

async function searchBooks() {
    let query = document.querySelector("#bookInput").value;
    let resultArea = document.querySelector("#searchResults");

    if (query.trim() === "") {
        alert("Please enter a book name or subject.");
        return;
    }

    resultArea.innerHTML = "<p style='text-align:center;'>Searching Google Books...</p>";

    try {
      let response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&key=AIzaSyAhkm6Xqp69bHjQCxhUwy9zlb5Mt8McFGk`);
        let result = await response.json();

        booksData = result.items || [];
        drawBooks();
    } catch (e) {
        console.error("Search Error:", e);
        resultArea.innerHTML = "<p>Error connecting to API. Check your connection.</p>";
    }
}

function drawBooks() {
    let resultArea = document.querySelector("#searchResults");
    resultArea.innerHTML = "";

    if (booksData.length === 0) {
        resultArea.innerHTML = "<p class='empty-state'>No results found.</p>";
        return;
    }

    booksData.forEach(book => {
        let info = book.volumeInfo;
        let title = info.title || "Untitled";
        let authors = info.authors ? info.authors.join(", ") : "Unknown Author";

        let bookDiv = document.createElement("div");
        bookDiv.className = "book-item";

        bookDiv.innerHTML = `
            <div>
                <strong>${title}</strong><br>
                <small>${authors}</small>
            </div>
            <button class="action-btn">Fav</button>
        `;

        bookDiv.querySelector("button").addEventListener("click", () => addToFavs(title));
        resultArea.appendChild(bookDiv);
    });
}


function addToFavs(title) {
    let favs = JSON.parse(localStorage.getItem("favourites") || "[]");

    const exists = favs.some(f => f.title === title);
    if (exists) {
        alert("This book is already in your favorites!");
        return;
    }

    favs.push({ title: title });
    localStorage.setItem("favourites", JSON.stringify(favs));
    renderFavorites();
}

function renderFavorites() {
    const favList = document.querySelector("#favoritesList");
    const favs = JSON.parse(localStorage.getItem("favourites") || "[]");

    if (favs.length === 0) {
        favList.innerHTML = `<div class="empty-state">No books saved yet.</div>`;
        return;
    }

    favList.innerHTML = "";
    favs.forEach((fav, index) => {
        let favItem = document.createElement("div");
        favItem.className = "book-item";
        favItem.style.borderLeft = "5px solid #C08552";

        favItem.innerHTML = `
            <span>${fav.title}</span>
            <button class="delete-btn">Remove</button>
        `;

        favItem.querySelector(".delete-btn").addEventListener("click", () => {
            removeFromFavs(index);
        });

        favList.appendChild(favItem);
    });
}

function removeFromFavs(index) {
    let favs = JSON.parse(localStorage.getItem("favourites") || "[]");
    favs.splice(index, 1);
    localStorage.setItem("favourites", JSON.stringify(favs));
    renderFavorites();
}

function getSessions() {
    return JSON.parse(localStorage.getItem("sessions") || "[]");
}

function loadRealStats() {
    const sessions = getSessions();
    document.querySelector("#stat-sessions").innerText = sessions.length;

    let totalMins = sessions.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);
    document.querySelector("#stat-hours").innerText = (totalMins / 60).toFixed(1);

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0,0,0,0);
    const thisWeek = sessions.filter(s => new Date(s.date) >= startOfWeek);
    document.querySelector("#stat-week").innerText = thisWeek.length;

    if (sessions.length > 0) {
        let longest = sessions.reduce((max, s) => (parseInt(s.duration) || 0) > (parseInt(max.duration) || 0) ? s : max);
        document.querySelector("#stat-longest").innerText = `${longest.duration} min`;
    } else {
        document.querySelector("#stat-longest").innerText = "--";
    }
}

function loadSessionHistory() {
    const sessions = getSessions();
    const historyList = document.querySelector("#historyList");

    if (sessions.length === 0) {
        historyList.innerHTML = `<div class="empty-state">No sessions logged yet.</div>`;
        return;
    }

    historyList.innerHTML = "";
    [...sessions].reverse().forEach((session, i) => {
        const realIndex = sessions.length - 1 - i;
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="history-item-info">
                <div class="history-item-title">${session.book || "No book selected"}</div>
                <div class="history-item-meta">Subject: ${session.subject || "N/A"} | Duration: ${session.duration}m</div>
                <div class="history-item-meta">Date: ${session.date}</div>
            </div>
            <button class="delete-btn">Delete</button>
        `;
        item.querySelector(".delete-btn").addEventListener("click", () => deleteSession(realIndex));
        historyList.appendChild(item);
    });
}

function deleteSession(index) {
    let sessions = getSessions();
    sessions.splice(index, 1);
    localStorage.setItem("sessions", JSON.stringify(sessions));
    loadRealStats();
    loadSessionHistory();
}

function logoutUser() {
    localStorage.setItem("isLoggedIn", "false");
    localStorage.removeItem("username");
    window.location.href = "login.html";
}
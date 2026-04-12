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

document.addEventListener("DOMContentLoaded", init);

function init() {
    isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    username   = localStorage.getItem("username") || "User";

    setupUI();
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

    document.querySelector("#logoutBtn").addEventListener("click", logoutUser);
}

function calculateStreak() {
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    if (sessions.length === 0) return 0;

    const dates = [...new Set(sessions.map(s => new Date(s.date).toDateString()))]
                  .map(d => new Date(d))
                  .sort((a, b) => b - a);

    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastSessionDate = new Date(dates[0]);
    lastSessionDate.setHours(0, 0, 0, 0);

    // If the gap between today and the last session is > 1 day, streak is 0
    const diffInDays = (today - lastSessionDate) / (1000 * 60 * 60 * 24);
    if (diffInDays > 1) return 0;

    for (let i = 0; i < dates.length - 1; i++) {
        let diff = (dates[i] - dates[i+1]) / (1000 * 60 * 60 * 24);
        if (diff === 1) streak++;
        else break;
    }
    return streak + 1;
}

function loadRealStats() {
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    document.querySelector("#stat-sessions").innerText = sessions.length;
    
    // Update the Streak
    const streakElement = document.querySelector("#stat-streak");
    if(streakElement) streakElement.innerText = calculateStreak();

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
        favItem.querySelector(".delete-btn").addEventListener("click", () => removeFromFavs(index));
        favList.appendChild(favItem);
    });
}

function removeFromFavs(index) {
    let favs = JSON.parse(localStorage.getItem("favourites") || "[]");
    favs.splice(index, 1);
    localStorage.setItem("favourites", JSON.stringify(favs));
    renderFavorites();
}

function loadSessionHistory() {
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
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
    let sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
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
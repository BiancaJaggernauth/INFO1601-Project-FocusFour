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

document.addEventListener("DOMContentLoaded", function () {
    checkAuth();
    renderDashboard();

    // Logout Functionality
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.setItem("isLoggedIn", "false");
            window.location.href = "login.html";
        });
    }
});

function checkAuth() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const guestOverlay = document.getElementById("guest-view");
    const welcomeHeader = document.getElementById("welcome-header");
    const navUser = document.getElementById("nav-user");

    if (isLoggedIn) {
        if (guestOverlay) guestOverlay.style.display = "none";
        welcomeHeader.textContent = "Welcome Back, Student";
        navUser.textContent = "Hi, Student";
    } else {
        if (guestOverlay) guestOverlay.style.display = "flex";
        welcomeHeader.textContent = "Welcome Back, Guest";
        navUser.textContent = "Hi, Guest";
    }
}

function renderDashboard() {
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    const historyList = document.getElementById("historyList");
    
    // Stats Elements
    const statSessions = document.getElementById("stat-sessions");
    const statHours = document.getElementById("stat-hours");
    const statLongest = document.getElementById("stat-longest");
    const statStreak = document.getElementById("stat-streak");

    if (sessions.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No sessions logged yet.</div>';
        return;
    }

    // Logic for Stats
    let totalMinutes = 0;
    let maxMinutes = 0;
    const sessionDates = [];

    historyList.innerHTML = "";

    // Render list (Newest First)
    sessions.slice().reverse().forEach((session, index) => {
        const duration = parseInt(session.duration) || 0;
        totalMinutes += duration;
        if (duration > maxMinutes) maxMinutes = duration;
        if (session.date) sessionDates.push(session.date);

        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="history-item-info">
                <div class="history-item-title">${session.subject || "Study Session"}</div>
                <div class="history-item-meta">${session.date} • ${duration} mins</div>
                <div class="history-item-meta" style="font-style: italic; opacity: 0.8;">
                    Reading: ${session.book}
                </div>
            </div>
            <button class="delete-btn" onclick="deleteSession(${sessions.length - 1 - index})">Delete</button>
        `;
        historyList.appendChild(item);
    });

    // Final Stats Updates
    statSessions.textContent = sessions.length;
    statHours.textContent = (totalMinutes / 60).toFixed(1);
    statLongest.textContent = maxMinutes;
    statStreak.textContent = calculateStreak(sessionDates);

    renderFavoritesOnDashboard();
    renderSubjectBreakdown();
}

function calculateStreak(dates) {
    if (dates.length === 0) return 0;
    
    // Get unique dates and sort them
    const uniqueDates = [...new Set(dates)].sort().reverse();
    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
        const sessionDate = new Date(uniqueDates[i]);
        sessionDate.setHours(0, 0, 0, 0);
        
        const diffInDays = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === streak) {
            streak++;
        } else if (diffInDays > streak) {
            break; // Streak broken
        }
    }
    return streak;
}

function deleteSession(index) {
    let sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    sessions.splice(index, 1);
    localStorage.setItem("sessions", JSON.stringify(sessions));
    renderDashboard();
}

function renderFavoritesOnDashboard() {
    const favList = document.getElementById("favoritesList");
    const favs = JSON.parse(localStorage.getItem("favourites") || "[]");

    if (favs.length === 0) {
        favList.innerHTML = '<div class="empty-state">No books saved yet.</div>';
        return;
    }

    favList.innerHTML = "";
    favs.forEach(fav => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="history-item-info">
                <div class="history-item-title">${fav.title}</div>
                <div class="history-item-meta">by ${fav.author}</div>
            </div>
        `;
        favList.appendChild(item);
    });
}

function renderSubjectBreakdown() {
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    const subjectList = document.getElementById("subjectList");
    
    if (!subjectList) return;
    subjectList.innerHTML = ""; 
    
    if (sessions.length === 0) {
        subjectList.innerHTML = '<div class="empty-state">No sessions logged yet.</div>';
        return;
    }

    const subjectTotals = {};

    sessions.forEach(session => {
        const name = session.subject || "Other";
        const mins = parseInt(session.duration) || 0;
        subjectTotals[name] = (subjectTotals[name] || 0) + mins;
    });

    for (const [subject, totalMins] of Object.entries(subjectTotals)) {
        const hours = (totalMins / 60).toFixed(1);
        
        const card = document.createElement("div");
        card.className = "subject-card";
        
        card.innerHTML = `
            <div class="subject-card-name">${subject}</div>
            <div class="subject-card-hours">${hours} <span style="font-size: 0.7rem;">hrs</span></div>
        `;
        subjectList.appendChild(card);
    }
}
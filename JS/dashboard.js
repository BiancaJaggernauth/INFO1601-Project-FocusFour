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

function init(){
  isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  username   = localStorage.getItem("username") || "User";

  setupUI();
  bindEvents();
}

function setupUI(){
  let guestOverlay  = document.querySelector("#guest-view");
  let welcomeHeader = document.querySelector("#welcome-header");
  let navUserText   = document.querySelector("#nav-user");

  if(isLoggedIn){
    guestOverlay.style.display = "none";

    navUserText.innerText   = `Hi, ${username}`;
    welcomeHeader.innerText = `Welcome Back, ${username}`;

    loadMockStats();
  }else{
    guestOverlay.style.display = "flex";
  }
}

function bindEvents(){
  let searchBtn = document.querySelector("#searchBtn");
  let logoutBtn = document.querySelector("#logoutBtn");

  searchBtn.addEventListener("click", searchBooks);
  logoutBtn.addEventListener("click", logoutUser);
}

async function searchBooks(){
  let query = document.querySelector("#bookInput").value;
  let resultArea = document.querySelector("#searchResults");

  if(query.trim() === ""){
    alert("Please enter a book name or subject.");
    return;
  }

  resultArea.innerHTML = "<p style='text-align:center;'>Searching Google Books...</p>";

    try{
    let response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5`);
    let result = await response.json();

    booksData = result.items || [];

    drawBooks();
    }
  
  catch(e){
    console.log(e);
    resultArea.innerHTML = "<p>Error connecting to API.</p>";
  }
}

function drawBooks(){
  let resultArea = document.querySelector("#searchResults");

  resultArea.innerHTML = "";

  if(booksData.length === 0){
    resultArea.innerHTML = "<p class='empty-state'>No results found.</p>";
    return;
  }

  let html = "";

  for(let book of booksData){
    let info = book.volumeInfo;

    html += `<div class="book-item">
      <div>
        <strong>${info.title}</strong><br>
        <small>${info.authors ? info.authors.join(", ") : "Various Authors"}</small>
      </div>
      <button class="action-btn"
        onclick="addToFavs('${info.title.replace(/'/g, "\\'")}')">
        Fav
      </button>
    </div>`;
  }

  resultArea.innerHTML = html;
}

function addToFavs(title){
  let favList  = document.querySelector("#favoritesList");
  let emptyMsg = favList.querySelector(".empty-state");

  if(emptyMsg){
    favList.removeChild(emptyMsg);
  }

  let html = `<div class="book-item" style="border-left: 5px solid #C08552;">
    <span>${title}</span>
    <span class="fav-indicator">★ Saved</span>
  </div>`;

  favList.innerHTML += html;
}

function logoutUser(){
  // reset login state
  localStorage.setItem("isLoggedIn", "false");
  localStorage.removeItem("username");

  window.location.href = "login.html";
}

function loadMockStats(){
  loadRealStats();
  loadSessionHistory();
}

function getSessions(){
  return JSON.parse(localStorage.getItem("sessions") || "[]");
}

function saveSessions(sessions){
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

function loadRealStats(){
  const sessions = getSessions();

  // total sessions
  document.querySelector("#stat-sessions").innerText = sessions.length;

  // total hours — add up all durations
  let totalMins = 0;
  sessions.forEach(s => {
    totalMins += parseInt(s.duration) || 0;
  });
  const totalHours = (totalMins / 60).toFixed(1);
  document.querySelector("#stat-hours").innerText = totalHours;

  // sessions this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeek = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= startOfWeek;
  });
  document.querySelector("#stat-week").innerText = thisWeek.length;

  // longest session
  if(sessions.length === 0){
    document.querySelector("#stat-longest").innerText = "--";
    return;
  }

  let longest = sessions.reduce((max, s) => {
    return (parseInt(s.duration) || 0) > (parseInt(max.duration) || 0) ? s : max;
  }, sessions[0]);

  document.querySelector("#stat-longest").innerText = longest.duration
    ? `${longest.duration} min`
    : "--";
}

function loadSessionHistory(){
  const sessions = getSessions();
  const historyList = document.querySelector("#historyList");

  if(sessions.length === 0){
    historyList.innerHTML = `<div class="empty-state">No sessions logged yet.</div>`;
    return;
  }

  historyList.innerHTML = "";

  // show newest sessions first
  const reversed = [...sessions].reverse();

  reversed.forEach((session, i) => {
    // real index in original array for deletion
    const realIndex = sessions.length - 1 - i;

    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-item-info">
        <div class="history-item-title">${session.book || "No book selected"}</div>
        <div class="history-item-meta">Subject: ${session.subject || "N/A"}</div>
        <div class="history-item-meta">Duration: ${session.duration ? session.duration + " min" : "N/A"}</div>
        <div class="history-item-meta">Date: ${session.date || "N/A"}</div>
        <div class="history-item-meta">Goal: ${session.goal || "N/A"}</div>
        ${session.notes ? `<div class="history-item-meta">Notes: ${session.notes}</div>` : ""}
      </div>
      <button class="delete-btn">Delete</button>
    `;

    item.querySelector(".delete-btn").addEventListener("click", function(){
      deleteSession(realIndex);
    });

    historyList.appendChild(item);
  });
}

function deleteSession(index){
  let sessions = getSessions();
  sessions.splice(index, 1);
  saveSessions(sessions);
  loadRealStats();
  loadSessionHistory();
}
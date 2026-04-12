/*
FILE: auth.js

PURPOSE:
Handles authentication logic.

RESPONSIBILITIES:
- Login function
- Logout function
- Check if user is logged in
- Redirect unauthorized users

LOCAL STORAGE KEYS:
- "isLoggedIn"

NOTES FOR TEAM:
- This file is used across multiple pages
- Keep all authentication logic here
*/
//login 
  function togglePass() {
      var input = document.getElementById('password');
      var btn = document.querySelector('.eye-btn');
      var isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? '🙈' : '👁';
    }
 
    function openBook() {
      document.getElementById('bookFront').classList.add('open');
    }
 
    function goRegister() {
      window.location.href = 'register.html';
    }
 
    function login() {
      var username = document.querySelector("#username").value;
      var password = document.querySelector("#password").value;
      var storedUser = JSON.parse(localStorage.getItem("user"));
 
      var validUsername = (username === "bob" || username === "bob@mail.com");
      var validPassword = (password === "bobpass");
 
      var storedMatch = false;
      if (storedUser) {
        storedMatch = (username === storedUser.username || username === storedUser.email) && password === storedUser.password;
      }
 
      if ((validUsername && validPassword) || storedMatch) {
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "dashboard.html";
      } else {
        document.querySelector("#errorMsg").innerHTML = "Invalid username or password.";
      }
    }
    //register
     function togglePass() {
    var input = document.getElementById('password');
    var btn = document.querySelector('.eye-btn');
    var isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁';
  }

  function register() {
    var fullname = document.getElementById("fullname").value;
    var username = document.getElementById("username").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    var errorMsg = document.getElementById("errorMsg");
    var successMsg = document.getElementById("successMsg");

    errorMsg.innerHTML = "";
    successMsg.innerHTML = "";

    if (!fullname || !username || !email || !password || !confirmPassword) {
      errorMsg.innerHTML = "Please fill in all fields.";
      return;
    }

    if (password !== confirmPassword) {
      errorMsg.innerHTML = "Passwords do not match.";
      return;
    }

  var user = {
    fullname,
    username,
    email,
    password
  };

  localStorage.setItem("user", JSON.stringify(user));

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("username", username); 
  
  successMsg.innerHTML = "Account created successfully! Redirecting...";

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1500);
}
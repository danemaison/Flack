$(document).ready(init);

function init() {
  $(".form").on("submit", function(e) {
    e.preventDefault();
    const username = document.querySelector(".username").value;
    if (username.length === 0) {
      displayError("Please enter a username");
    } else if (username.match(/[!@#$%^&*(),.?":{}|<>\s]/)) {
      displayError("Please do not use spaces or symbols in your username");
    } else if (username.length > 12) {
      displayError("Please shorten your username to under 12 characters");
    } else {
      localStorage.setItem("username", `${username}`);
      window.location = "/chatroom";
    }
  });
}

function displayError(err) {
  $(".error-display")
    .removeClass("hidden")
    .text(err);
}

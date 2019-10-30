const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

$(document).ready(init)

const username = localStorage.getItem('username');
let currentChannel = localStorage.getItem('channel');

if (!currentChannel) {
  currentChannel = 'general';
}

function init() {
  if (!username) {
    window.location = "/";
  }
  applyClickHandlers();
  fetchChannels();
  scrollToTop();
}

function applyClickHandlers() {
  $('#send-message').on('submit', sendMessage);
  $('#channels').on('click', '.channelContainer', changeChannel);
  $('#open-channel-overlay').on('click', toggleChannelOverlay);
  $('#create-channel').on('submit', createChannel);
  $('.channel-overlay-container > .cancel').on('click', toggleChannelOverlay);
  $(document).on('keydown', function (event) {
    if (event.keyCode === 27) {
      $('#channel-overlay').removeClass('visible');
    }
  });
}

function sendMessage(event) {
  event.preventDefault();
  const message = $('#user-message').val();
  $('#user-message').val("");

  const channel = $('.channelContainer.active > .channel').text();

  socket.emit('sendMessage', {
    channel: channel,
    username: username,
    message: message,
  });
}

function createChannel(event) {
  const channelName = $('#channel-name').val();
  const channelDescription = $('#channel-description').val();
  event.preventDefault();
  socket.emit('createChannel', {
    channelName: channelName,
    description: channelDescription
  });
  toggleChannelOverlay();
}

function changeChannel(event) {
  socket.emit('leaveChannel', {
    channelName: currentChannel,
    username: username,
  });


  currentChannel = $(event.currentTarget).find('.channel').text();
  currentChannel = currentChannel.toLowerCase()
  localStorage.setItem('channel', currentChannel);

  loadChannel(currentChannel);
}

function loadChannel(channel) {
  // swap active class
  $('.channelContainer.active').removeClass('active');
  const allChannels = $('.channel');

  for (let i = 0; i < allChannels.length; i++) {
    if (allChannels[i].innerText.toLowerCase() === channel) {
      $(allChannels[i]).parent().addClass('active');
    }
  }

  const url = '/chatroom/' + channel.toLowerCase();

  fetch(url)
    .then(response=>response.json())
    .then(data =>{
      displayMessages(data);
      socket.emit('joinChannel', {
        channelName: currentChannel,
        username: username,
      })
    })
    .catch(error=>console.error('Error: ', error));
}

function renderAllChannels(channels) {
  $('.channel').remove();
  for(let channel of channels){
      const channelContainer = $('<div>').addClass('channelContainer');
      const channelHeading = $('<div>').addClass('channel')
        .text(channel.channelName);
      const channelDescription = $('<div>').addClass('description')
        .text(channel.description);
      channelContainer.append(channelHeading, channelDescription);
      $('#channels').append(channelContainer);
  }

  loadChannel(currentChannel);
}

function fetchChannels() {
  fetch('/channels')
    .then(response => response.json())
    .then(data => renderAllChannels(data))
    .catch(error => console.error('Error: ', error));
}

function displayMessages(messages) {
  const display = $('#messages');
  if (Array.isArray(messages)) {
    display.empty();
    for (let messageData of messages) {
      renderMessage(messageData.username, messageData.time, messageData.message);
    }
  }
  else {
    renderMessage(messages.username, messages.time, messages.message);
  }
}

function renderMessage(username, time, message) {
  const display = $('#messages');
  const lastDiv = $('#messages > div:last-child');
  const lastUser = lastDiv.find('.username').text();
  let messageElement, usernameElement, timeElement;
  const div = $('<div>');
  if (lastUser === username) {
    messageElement = $('<div>', {
      class: 'message',
      text: message,
    })
    lastDiv.append(messageElement);
    const messages = document.querySelector('#messages');
    messages.scrollTop = messages.scrollHeight;
    return;
  }
  else if (username && time) {
    usernameElement = $('<div>', {
      class: 'username',
      text: username,
    });
    timeElement = $('<div>', {
      class: 'time',
      html: '&nbsp; - ' + time,
    });
    messageElement = $('<div>', {
      class: 'message',
      text: message,
    });
  }
  else {
    messageElement = $('<div>', {
      class: 'message mod',
      text: message,
    });
  }
  div.addClass('invisible');
  div.append(usernameElement, timeElement, messageElement);
  display.append(div);
  requestAnimationFrame(() => div.removeClass('invisible').addClass('visible'));
  scrollToTop();
}

function renderChannel(data) {
  const channel = data.channelName;
  const description = data.description;

  const channelContainer = $('<div>').addClass('channelContainer');
  const channelHeading = $('<div>').addClass('channel')
    .text(channel);
  const channelDescription = $('<div>').addClass('description')
    .text(description);
  channelContainer.append(channelHeading, channelDescription);
  $('#channels').append(channelContainer);
}

function toggleChannelOverlay() {
  $('#channel-overlay').toggleClass('visible');
}

function scrollToTop() {
  const messages = document.querySelector('#messages');
  messages.scrollTop = messages.scrollHeight;
}

/* *** socket responses *** */

socket.on('message', displayMessages);
socket.on('channelCreated', renderChannel);

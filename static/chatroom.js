var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

$(document).ready(init)

var username = localStorage.getItem('username');
var currentChannel = localStorage.getItem('channel');

if(!currentChannel){
  currentChannel = 'general';
}

function init(){
  if(!username){
    window.location = "/";
  }
  applyClickHandlers();
  fetchChannels();
}

function applyClickHandlers(){
  $('#send-message').on('submit', sendMessage);
  $('.channel').on('click', changeChannel);
  $('#open-channel-overlay').on('click', toggleChannelOverlay);
  $('#create-channel').on('submit', createChannel);
  $('.channel-overlay-container > .cancel').on('click', toggleChannelOverlay);
  $(document).on('keydown', function(event){
    if(event.keyCode === 27){
      $('#channel-overlay').removeClass('visible');
    }
  });
}

function sendMessage(event){
  event.preventDefault();

  var message = $('#user-message').val();
  $('#user-message').val("");

  var channel = $('.active').text();

  socket.emit('sendMessage', {
    channel: channel,
    username: username,
    message: message,
     });
}

function createChannel(event){
  event.preventDefault();
  socket.emit('createChannel', {
    channel: event.currentTarget[0].value,
  });
  toggleChannelOverlay();
}

function changeChannel(event){
  socket.emit('leaveChannel', {
    channel: currentChannel,
    username: username,
  });


  currentChannel = event.currentTarget.innerText
  currentChannel = currentChannel.toLowerCase()
  localStorage.setItem('channel', currentChannel);

  loadChannel(currentChannel);
}

function loadChannel(channel){
  // swap active class
  $('.channel.active').removeClass('active');
  var allChannels = $('.channel');

  for(var i = 0; i < allChannels.length; i++){
    if(allChannels[i].innerText.toLowerCase() === channel){
      $(allChannels[i]).addClass('active');
    }
  }

  var url = '/chatroom/' + channel.toLowerCase();

  fetch(url).then(function(response){
    return response.json();
  }).then(function(data){
    displayMessages(data);
    socket.emit('joinChannel', {
      channel: currentChannel,
      username: username,
    })
  }).catch(function(error){
    console.error('Error: ', error);
  })
}

function renderAllChannels(channels){
  $('.channel').remove();
  for(var channel of channels){
    $('#channels')
      .append(
          $('<div>')
            .addClass('channel')
            .text(channel)
            .on('click', changeChannel)
      );
  }
  loadChannel(currentChannel);
}

function fetchChannels(){
  fetch('/channels')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      renderAllChannels(data)
    })
    .catch(function (error) {
      console.error('Error: ', error);
    });
}

function displayMessages(messages){
  var display = $('#messages');
  if(Array.isArray(messages)){
    display.empty();
    for (var messageData of messages) {
      renderMessage(messageData.username, messageData.time, messageData.message);
    }
  }
  else{
    renderMessage(messages.username, messages.time, messages.message);
  }

}

function renderMessage(username, time, message){
  var display = $('#messages');
  var lastDiv = $('#messages > div:last-child');
  var lastUser = lastDiv.find('.username').text();

  var div = $('<div>');
  if (lastUser === username) {
    var messageElement = $('<div>', {
      class: 'message',
      text: message,
    })
    lastDiv.append(messageElement);
    var messages = document.querySelector('#messages');
    messages.scrollTop = messages.scrollHeight;
    return;
  }
  else if(username && time ) {
    var usernameElement = $('<div>', {
      class: 'username',
      text: username,
    });
    var timeElement = $('<div>', {
      class: 'time',
      html: '&nbsp; - ' + time,
    });
    var messageElement = $('<div>', {
      class: 'message',
      text: message,
    });
  }
  else{
    var messageElement = $('<div>', {
      class: 'message mod',
      text: message,
    });
  }

  div.append(usernameElement, timeElement, messageElement);
  display.append(div);
  var messages = document.querySelector('#messages');
  messages.scrollTop = messages.scrollHeight;
}

function renderChannel(data){
  console.log(data);
  var channelElement = $('<div>')
                          .addClass('channel')
                          .text(data.channel)
                          .on('click', changeChannel);
  $('#channels').append(channelElement);
}

function toggleChannelOverlay() {
  $('#channel-overlay').toggleClass('visible');
}

/* *** socket responses *** */

socket.on('message', displayMessages);
socket.on('channelCreated', renderChannel);

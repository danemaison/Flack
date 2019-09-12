document.addEventListener('DOMContentLoaded', function () {
  // Anti spam
  var messageCounter = 0;
  setInterval(function () {
    messageCounter = 0;
  }, 7000);

  // Send user back to login page if they didn't sign in
  const username = localStorage.getItem('username');
  if (username == null) {
    window.location = "/";
  }

  // Connect to socket.io
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // Load clicked channel and change active button
  document.addEventListener('click', function (event) {
    var button = event.target;
    if (hasClass(button, 'active')) {
      return false;
    } else if (hasClass(button, 'list-group-item')) {
      var active = document.querySelector('.active');
      active.classList.remove('active');
      button.className += " active";
      var currentChannel = localStorage.getItem('channel');
      socket.emit('leave', { 'channel': currentChannel, 'username': username });
      socket.emit('join', { 'channel': button.innerHTML, 'username': username });
      load_channel(button.innerHTML);
      currentChannel = localStorage.setItem('channel', `${button.innerHTML}`)

    }
  }, false);

  socket.on('connect', function () {

    var currentChannel = localStorage.getItem('channel');
    if (currentChannel == null) {

      // Automatically connect to general channel
      socket.emit('join', { 'channel': 'General', 'username': username });
      currentChannel = localStorage.setItem('channel', 'General');
      load_channel('General')
    }
    else {

      // Connect to channel in local memory, set active button to that channel
      socket.emit('join', { 'channel': currentChannel, 'username': username });
      load_channel(currentChannel)
      document.querySelectorAll('.list-group-item').forEach(function (button) {
        if (hasClass(button, 'active'))
          if (button.innerHTML != currentChannel) {
            var active = document.querySelector('.active');
            active.classList.remove('active');
          }
        if (button.innerHTML == currentChannel) {
          button.className += " active";
        }
      });
    }

  });

  // Callback functions for socket.io
  socket.on('joined', function (message) {
    const li = document.createElement('li');
    li.innerHTML = `${message.message}`;
    document.querySelector('#messages').append(li);
  });
  socket.on('left', function (message) {
    const li = document.createElement('li');
    li.innerHTML = `${message.message}`;
    document.querySelector('#messages').append(li);
  });

  socket.on('send', function (message) {
    console.log("MESSAGE FROM SERVER: ", message);
    const li = document.createElement('li');
    li.innerHTML = `${message.time} - ${message.username}: ${message.message}`;
    li.setAttribute("style", "animation-name:show;animation-duration:.5s;animation-fill-mode:forwards;");

    const messages = document.querySelector('#messages')
    messages.append(li);
    var shouldScroll = messages.scrollTop + messages.clientHeight === messages.scrollHeight;
    if (!shouldScroll) {
      scrollToBottom()
    }
  });

  socket.on('channel_created', function (channel) {
    const button = document.createElement('button');
    button.innerHTML = `${channel.channel}`;
    button.className = "list-group-item list-group-item-action";
    button.setAttribute("style", "animation-name:show;animation-duration:2s;animation-fill-mode:forwards;");
    document.querySelector('.list-group').append(button);
  });

  // When a message is sent call 'send message' function from server
  document.querySelector('#send-message').onsubmit = function (event) {
    event.preventDefault();
    var message = document.querySelector('#user-message').value;
    var channel = document.querySelector('.active').innerHTML;

    //  message = sanitizeHTML(message);
    messageCounter += 1;
    if (messageCounter > 4) {
      window.alert("Please don't spam the chat.");
      return false;
    }
    else if (message.length > 200) {
      window.alert("Your message is too long");
      return false;
    }
    else if (message == "") {
      return false;
    }
    else if (message.charAt(0) == " ") {
      window.alert("Your message can't begin with a space!");
      return false;
    }

    console.log('Message ', message);
    console.log('channel', channel);
    socket.emit('send message', { 'channel': channel, 'message': message, 'username': username });
    document.querySelector('#user-message').value = "";
    return false;
  };

  // Form submission
  document.querySelector('.button-create-channel').onsubmit = function () {
    var channelCount = localStorage.getItem("channelCount");
    if (channelCount == 1) {
      allowed = false;
      window.alert("Users may only create one channel.");
      return false;
    }

    var channel = document.querySelector('#u').value;

    var allowed = true;
    if (channel.match(/^[0-9a-zA-Z]{1,16}$/)) {
      allowed = true;
    }
    else if (channel.match(/\s/)) {
      allowed = true;
    }
    else {
      allowed = false;
    }
    document.querySelectorAll('.list-group-item').forEach(function (button) {
      if (channel == button.innerHTML) {
        allowed = false;
        window.alert("Channel already exists.");
        return false;
      }
    });
    if (channel == '') {
      allowed = false;
      window.alert("Please input a channel name.");
      return false;
    }
    else if (channel.charAt(0) == ' ') {
      allowed = false;
      window.alert("Your channel name can't begin with a space");
      return false;
    }
    if (channel.length > 25) {
      allowed = false;
      window.alert("Please keep your channel under 25 characters");
      return false;
    }

    channel = sanitizeHTML(channel);
    console.log(channel);

    if (allowed == true) {
      // Create a channel
      socket.emit('create_c', { 'channel': channel });
      localStorage.setItem('channelCount', '1');
      localStorage.setItem('myChannel', `${channel}`);
    }
    else {
      window.alert("Please provide a valid input");
    }

    document.querySelector('#c').value = "";
    return false;
  };
});

function load_channel(channel) {
  channel = channel.toLowerCase();
  const request = new XMLHttpRequest();
  request.open('GET', `/chatroom/${channel}`);
  request.onload = function () {
    const response = JSON.parse(request.responseText);

    // Find the length of the JSON object
    var count = Object.keys(response).length;
    for (var i = 0; i < count; i++) {
      const message = document.createElement('li');
      message.innerHTML = `${response[i].time} - ${response[i].username}: ${response[i].message}`;
      document.querySelector('#messages').append(message);
    }
  }
  document.querySelector("#messages").innerHTML = "";
  request.send();
  scrollToBottom();
}

function scrollToBottom() {
  const messages = document.querySelector('#messages');
  messages.scrollTop = messages.scrollHeight;
}

function hasClass(elem, className) {
  return elem.classList.contains(className);
}

function sanitizeHTML(str) {
  var temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

import os

from flask import Flask, render_template, url_for, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from collections import defaultdict
import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

time = datetime.datetime.now()
time = time.strftime('%d:%%M %%p' % (time.hour % 12 if time.hour % 12 else 12))

messages = defaultdict(list)
messages['general'].append({"time":time, "username":"Moderator", "message":"Welcome to the Wave chatroom."})
channels = ["General", "Programming"]

@app.route('/channels')
def renderChannels():
    return jsonify(channels)

@app.route("/chatroom/<string:channel>")
def channel(channel):
    return jsonify(messages[channel])

@app.route("/")
def index():
    return render_template("login.html")

@app.route("/chatroom/")
def chatroom():
    return render_template("chatroom.html", channels=channels, messages=messages['general'])

@socketio.on("sendMessage")
def sendMessage(message):
    time = datetime.datetime.now()
    time = time.strftime('%d:%%M %%p' % (time.hour % 12 if time.hour % 12 else 12))
    channel = message["channel"]
    channel = channel.lower()

    username = message["username"]
    message = message["message"]

    messages.setdefault(channel, []).append({"time":time,"username":username, "message":message})

    if len(messages[channel]) >= 100:
        messages[channel].pop(0)

    emit('message',
        {'time':time,'username':username, 'message': message},
        room=channel,
        broadcast=True)


@socketio.on('joinChannel')
def joinChannel(data):
    username = data['username']
    channel = data['channel']
    join_room(channel)
    emit('message',
        {'message': username + ' has entered the room ' + channel + '.'},
        broadcast=True,
        room=channel)

@socketio.on('leaveChannel')
def leaveChannel(data):
    username = data['username']
    channel = data['channel']
    leave_room(channel)
    emit('message',
        {'message': username + ' has left the room ' + channel + '.'},
        broadcast=True,
        room=channel)

@socketio.on('createChannel')
def createChannel(data):
    channel = data['channel']
    channels.append(channel)
    emit('channelCreated',
        {'channel': channel},
        broadcast=True)

if __name__ == '__main__':
    socketio.run(app)

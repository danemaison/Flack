import os

from flask import Flask, render_template, url_for, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from collections import defaultdict
import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

time = datetime.datetime.now()
time = str(time.hour) + ":" + str(time.minute) + ":" + str(time.second)
messages = defaultdict(list)
messages['general'].append({"time":time, "username":"Dane", "message":"Hey everyone! Welcome to my chat app."})
channels = ["Programming"]

@app.route("/chatroom/<string:channel>")
def channel(channel):
    return jsonify(messages[channel])


@app.route("/")
def index():
    return render_template("login.html")

@app.route("/chatroom/")
def chatroom():
    return render_template("chatroom.html", channels=channels, messages=messages['general'])

@socketio.on("send message")
def message(message):
    time = datetime.datetime.now()
    time = str(time.hour) + ":" + str(time.minute) + ":" + str(time.second)
    room = message["channel"]
    channel = room.lower()
    username = message["username"]
    message = message["message"]
    messages.setdefault(channel, []).append({"time":time,"username":username, "message":message})
    if len(messages[channel]) == 100:
        messages[channel].pop(0)
    emit('send', {'time':time,'username':username, 'message': message}, room=room, broadcast=True)


@socketio.on("my_event")
def test_message(message):
    emit('my_response', {'data':message['data']})


@socketio.on('join')
def on_join(data):
    username = data['username']
    channel = data['channel']
    join_room(channel)
    emit('joined', {'message': username + ' has entered the room ' + channel + '.'}, broadcast=True, room=channel)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    channel = data['channel']
    leave_room(channel)
    emit('left', {'message': username + ' has left the room ' + channel + '.'}, broadcast=True, room=channel)

@socketio.on('create_c')
def create_channel(data):
    channel = data['channel']
    channels.append(channel)
    emit('channel_created', {'channel': channel}, broadcast=True)

if __name__ == '__main__':
    socketio.run(app)

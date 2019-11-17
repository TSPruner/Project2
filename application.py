import os
import requests

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit
from collections import deque
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

class channelMessages:
    def __init__(self, chan, msgList):
        self.chan = chan
        self.msgList = deque(maxlen = 200)

    def isChannel(self, chan):
        return self.chan == chan

    def addMessage(self, message):
        self.msgList.append(message)
        return self.msgList

    def getAllMessages(self):
        return list(self.msgList)

    def getChan(self):
        return self.chan
        
    def removeUserMessages(self, index):
        del self.msgList[index]

    def isEmpty(self):
        return (len(self.msgList) <= 0)


channels = []
channel_msgs = []


@app.route("/")
def displayName():
    return render_template("index.html")

@socketio.on("display all")
def index(data):
    chan_selection = data

    new_message = []
    info = {"chan": chan_selection}
    new_message.append(info)
    info = {"text": channels}
    new_message.append(info)

    emit('show data', new_message, broadcast=True)

@socketio.on("create channel")
def channel(data):
    new_chan_msg = channelMessages(data, [])
    found = False
    i = 0

    if (len(channels) > 0):
        while (i < len(channels)) and (not bool(found)):
            chan = channels[i]
            if (data.lower() == chan.lower()):
                msg = None
                found = True
                emit("channel names", msg, broadcast=False)
            else:
                i =  i + 1

    if (not bool(found)):
        channels.append(data)
        channel_msgs.append(new_chan_msg)
        emit("channel names", channels, broadcast=True)

@socketio.on("create message")
def message(data):
    user_name = data[1]
    user = user_name["name"]
    message_text = data[2]
    message = message_text["text"]
    channel = data[0]
    selection = channel["chan"]
      
    msg_list = None
    found = False
    num_msgs = len(channel_msgs)
    
    if (num_msgs > 0):
        for obj in channel_msgs:
            if (obj.isChannel(selection)):
                # current date and time
                now = datetime.now()
                timestamp = now.strftime("%m/%d/%Y %I:%M")
                ap = now.strftime("%p")
                usermsg = user + ":  " + timestamp + " " + ap
                obj.addMessage(usermsg)
                msg_list = list(obj.addMessage(message))
                found = True

    new_message = []
    info = channel
    new_message.append(info)
    info = {"text": msg_list}
    new_message.append(info)

    if (not bool(found)):
        emit("channel messages", new_message, broadcast=False)
    else:
        emit("channel messages", new_message, broadcast=True)

@socketio.on("delete messages")
def delete_msgs(data):
    user_name = data[1]
    user = user_name["name"]
    channel = data[0]
    selection = channel["chan"]
    
    msg_list = None
    new_msg_list = None
    num_msgs = len(channel_msgs)
    count = 0
    empty = False
    
    if (num_msgs > 0):
        for obj in channel_msgs:
            if (obj.isChannel(selection)):
                # find messages for given user
                msg_list = obj.getAllMessages()
                index = 0
                for msg in msg_list:
                    if (msg.find(user)) != -1:
                        obj.removeUserMessages(index)
                        obj.removeUserMessages(index)
                        count = count + 1
                    else:
                        if (count % 2 != 0):
                            count = count + 1
                        else:
                            index = index + 1
                new_msg_list = obj.getAllMessages()
                if obj.isEmpty():
                    empty = True

    count = int(count / 2)
    alert_message = "Deleted " + str(count) + " messages for user = " + user + "."
    if (bool(empty)):
        alert_message = alert_message + "  ***No messages left for this channel.***"

    new_message = []
    info = channel
    new_message.append(info)
    info = {"msg": alert_message}
    new_message.append(info)
    info = {"text": new_msg_list}
    new_message.append(info)

    emit("deleted messages", new_message, broadcast=True)

@socketio.on("show channels")
def show_chans():
    emit("channel names", channels, broadcast=False)

@socketio.on("show messages")
def show_msgs(data):
    msg_list = []
    
    if (len(channel_msgs) > 0):
        for obj in channel_msgs:
            if (obj.isChannel(data)):
                msg_list = list(obj.getAllMessages())

    new_message = []
    info = {"chan": data}
    new_message.append(info)
    info = {"text": msg_list}
    new_message.append(info)

    emit("channel messages", new_message, broadcast=False)

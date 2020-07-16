var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = 3000;

http.listen(port, function() {
    console.log('Started WebSocket on port ' + port);
})

app.use(express.static('./public'));

var allUsers = [];
var typing = [];

io.on('connection', (socket) => {
    var clientId = socket.id;

    socket.on('new-user', (data) => {
        var userExists = false;
        for (let i = 0; i < allUsers.length; i++) {
            if (allUsers[i].name == data.name) {
                userExists = true;
                socket.emit('username-taken', data.name)
            }
        }
        if (!userExists) {
            console.log('A new user joined - ' + data.name);
            allUsers.push({
                name: data.name,
                status: data.status,
                id: clientId
            });
            io.emit('new-user-online', allUsers);
        }
    })

    socket.on('user-typing', data => {
        var alreadyTyping = false;
        for (let i = 0; i < typing.length; i++) {
            if (typing[i] == data.userTyping) {
                alreadyTyping = true;
            }
        }
        if (alreadyTyping == false) {
            typing.push(data.userTyping);
        }
        io.emit('users-typing', typing);
    })

    socket.on('user-not-typing', data => {
        for (let i = 0; i < typing.length; i++) {
            if (typing[i] == data.userNotTyping) {
                typing.splice(i, 1);
            }
        }
        io.emit('users-typing', typing);
    })

    socket.on('private-chat-message', (data) => {
        for (let i = 0; i < allUsers.length; i++) {
            if (allUsers[i].name == data.privateTo) {
                io.to(allUsers[i].id).emit('private-message-received', {
                    messageFrom: data.privateFrom,
                    messageBody: data.privateWhat
                });
                console.log('PRIVATE', data.privateFrom, data.privateTo, data.privateWhat);
            }
        }
    })

    socket.on('chat-message', (data) => {
        console.log(data);
        io.emit('send-message-all', data);
    })

    socket.on('disconnect', (socket) => {
        var leftUser = null;
        for (let i = 0; i < allUsers.length; i++) {
            if (allUsers[i].id == clientId) {
                leftUser = allUsers[i].name;
                allUsers.splice(i, 1);
                io.emit('new-user-online', allUsers);
            }
        }
        for (let i = 0; i < typing.length; i++) {
            if (typing[i] == leftUser) {
                typing.splice(i, 1);
                io.emit('users-typing', typing);
            }
        }

    })
});
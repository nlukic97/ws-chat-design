var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = 3000;

//konekcija ka data bazi
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'ws_chat'
  });

  connection.connect();

  connection.query('SELECT username FROM users ',(error, results)=>{
    console.log(results)
  })
  

http.listen(port, function() {
    console.log('Started WebSocket on port ' + port);
})

app.use(express.static('./public'));

var allUsers = []; //online korisnici
var typing = [];
var DbUsers; //korisnici iz databaze

io.on('connection', (socket) => {
    var clientId = socket.id;

    socket.on('new-user', (data) => {
        var userExists = false;
        connection.query('SELECT * FROM users AS users', (error, results)=>{
            DbUsers = results;
            console.log(DbUsers)
            for (let i = 0; i < DbUsers.length; i++) {
            if (DbUsers[i].username == data.username) {
                userExists = true;
                socket.emit('username-exists', data.username)
            }
        }
        if (!userExists) {
            console.log('A new user joined - ' + data.name);
            allUsers.push({
                name: data.name,
                id: clientId
            });
            io.emit('new-user-online', allUsers);
        }
        })
        socket.on('entered-password',(password)=>{ //ovo sad treba unutra da bude da se vidi data
            for (let i = 0; i < DbUsers.length; i++) {
                if(DbUsers[i].userName == data.username && DbUsers[i].password == password){
                    allUsers.push('')
                }
                
            }
        
        })
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
                socket.emit('sent-private-message',{
                    messageTo: data.privateTo,
                    messageBody: data.privateWhat
                })
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
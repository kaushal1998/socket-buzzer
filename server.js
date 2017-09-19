var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "csi"
});

connections = [];
app.use(express.static(__dirname + '/public'));
server.listen(process.env.PORT || 3000);
console.log('Server Running');

app.get('/host', function(req, res) {
    res.sendFile(__dirname + '/host.html');
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/buzz.mp3', function(req, res) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(__dirname + '/buzz.mp3');
});

io.sockets.on('connection', function(socket) {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    socket.on('disconnect', function(data) {
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    socket.on('send message', function(data) {
        io.sockets.emit('new message', { msg: data });
        console.log(data);
    });

    socket.on('updateSQL', function(data) {
        con.query('SELECT points from scores where team_no = ' + data.team_no, function(error, result) {
            if (error) throw error;
            points = parseInt(data.points) + parseInt(result[0].points);
            con.query('UPDATE scores SET points = ' + points + ' WHERE team_no = ' + data.team_no, function(err, res) {
                if (err) throw err;
                io.sockets.emit('refresh page', { msg: 'none' });
            });
        });
    });
});
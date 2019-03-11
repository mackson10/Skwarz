var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
const skwarzGame = require("./skwarz");
const serverPort = process.env.PORT || 8000;

server.listen(serverPort);
app.serverPort = serverPort;

skwarzGame(app, io);

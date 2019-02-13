var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
const tennisGame = require("./tennis");
const serverPort = process.env.PORT || 8000;

server.listen(serverPort);
app.serverPort = serverPort;

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

tennisGame(app, io);

io.on("connection", function(socket) {
  socket.emit("news", { hello: "world" });
  socket.on("confirm", function(data) {});
});

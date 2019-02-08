var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
const tennisGame = require("./tennis");

server.listen(8000 || process.env.PORT);
// WARNING: app.listen(80) will NOT work here!

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});
tennisGame(app, io);

io.on("connection", function(socket) {
  socket.emit("news", { hello: "world" });
  socket.on("confirm", function(data) {});
});

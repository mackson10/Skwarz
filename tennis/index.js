const TennisQueue = require("./TennisQueue");
const TennisGame = require("./TennisGame");
module.exports = (app, io, options = { path: "/tennis" }) => {
  new GameManager(app, io, options);
};

class GameManager {
  constructor(app, io, options) {
    this.rootPath = options.path;
    this.io = io;
    this.app = app;
    const queueOptions = {
      path: this.rootPath
    };
    this.queueIo = io.of(this.rootPath + "/queue");
    this.queue = new TennisQueue(app, this.queueIo, queueOptions, room =>
      this.initGame(room)
    );

    this.currentGames = new Map();
    this.setRoutes();
  }

  setRoutes() {
    this.app.get(this.rootPath, (req, res) =>
      res.sendFile(__dirname + "/index.html")
    );
    this.app.get(this.rootPath + "/tennisClient.js", (req, res) =>
      res.sendFile(__dirname + "/tennisClient.js")
    );
  }

  initGame(room) {
    const newGameId = this.currentGames.size;
    const newGamePath = `${this.rootPath}/${newGameId}`;
    this.queueIo.to(room.id).emit("start", { path: newGamePath });
    this.currentGames.set(
      newGameId,
      new TennisGame(newGamePath, this.io.of(newGamePath), room)
    );
  }
}

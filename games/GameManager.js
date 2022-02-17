const express = require("express");
const GameQueue = require("./GameQueue");

class GameManager {
  constructor(app, io, options) {
    this.path = options.path;
    this.io = io;
    this.app = app;
    this.options = options;
    const queueOptions = {
      path: this.path,
      room: options.room,
      waitingDelayedTime: options.queueDelayedTime
    };
    this.Game = options.gameClass;
    this.queueIo = io.of(this.path + "/queue");

    const initGameFunction = tickets => this.initGame(tickets);

    this.queue = new GameQueue(
      app,
      this.queueIo,
      queueOptions,
      initGameFunction
    );

    this.currentGames = new Map();
    this.gamesCount = 0;
    this.setRoutes();
  }

  setRoutes() {
    this.options.files.forEach(({ path, fileName }) => {
      this.app.get(this.path + path, (req, res) => res.sendFile(fileName));
    });

    this.app.use("/assets", express.static('assets'));
  }

  initGame(tickets) {
    const newGameId = ++this.gamesCount;
    const newGamePath = `${this.path}/${newGameId}`;
    this.queueIo.to(tickets.roomId).emit("start", { path: newGamePath });
    this.currentGames.set(
      newGameId,
      new this.Game(this.io.of(newGamePath), tickets.array)
    );
  }
}

module.exports = GameManager;

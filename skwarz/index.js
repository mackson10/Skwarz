const SkwarzGame = require("./SkwarzGame");
const GameManager = require("../games/GameManager");

module.exports = (app, io) => {
  const options = {
    path: "/skwarz",
    room: { minPlayers: 2, maxPlayers: 10 },
    files: [
      { path: "/", fileName: __dirname + "/index.html" },
      { path: "/skwarzClient.js", fileName: __dirname + "/skwarzClient.js" },
      { path: "/blocks.js", fileName: __dirname + "/blocks.js" },
      { path: "/Player.js", fileName: __dirname + "/Player.js" },
      { path: "/Ring.js", fileName: __dirname + "/Ring.js" }
    ],
    gameClass: SkwarzGame
  };

  new GameManager(app, io, options);
};

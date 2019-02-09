GameRoom = require("./GameRoom");

class TennisGame {
  constructor(path, gameIo, queueRoom) {
    this.path = path;
    this.gameIo = gameIo;
    this.queueRoom = queueRoom;
    this.connectedPlayers = new GameRoom({ minPlayers: 2, maxPlayers: 2 });
    this.minPlayers = 2;
    this.balls = new Map();
    this.width = 500;
    this.height = 500;
    this.setIo();
    this.status = "waiting players";
    this.ballsCounter = 0;
  }

  setStatus(status) {
    this.status = status;
    switch (status) {
      case "":
        break;
    }
  }

  setIo() {
    this.gameIo.on("connection", socket => {
      socket.on("enterGame", ticket => this.enterGame(socket, ticket));
    });
  }

  setSocket(socket) {
    socket.on("disconnect", reason => {
      if (socket.player) {
        this.leaveGame(socket.player);
      }
    });
    socket.on("position", newPosition =>
      this.movePlayer(socket.player, newPosition)
    );
  }

  leaveGame(player) {
    this.connectedPlayers.leave(player);
    this.checkConnected();
  }

  endGame(winner) {
    this.setStatus("end game");
    clearInterval(this.timer);
    clearInterval(this.ballTimer);
    setTimeout(
      () => this.gameIo.emit("endGame", { winner, ...this.state }),
      1000
    );
  }

  movePlayer(player, newPosition) {
    if (!player || (player.role != "P2" && player.role != "P1")) return false;

    const movingPlayerRole = player.role;

    //validation...

    this[movingPlayerRole].state.x = newPosition.x;
  }

  enterGame(socket, ticket) {
    let player = this.queueRoom.search(ticket.id);
    if (player && player.secret === ticket.secret) {
      const player = { id: ticket.id, secret: ticket.secret, socket };
      socket.player = player;
      this.connectedPlayers.join(player);
      this.queueRoom.leave(player);
      socket.emit("waiting players");
      this.setSocket(socket);
      this.checkConnected();
    } else {
      socket.emit("not confirmed");
    }
  }

  sendPlayersCount() {
    this.gameIo.emit("players", { connectedPlayers: this.connectedPlayers });
  }

  checkConnected() {
    this.sendPlayersCount();
    if (
      this.connectedPlayers.size() >= this.minPlayers &&
      this.status === "waiting players"
    ) {
      this.setupGame();
    } else if (
      this.connectedPlayers.size() < this.minPlayers &&
      this.status !== "waiting players" &&
      this.status !== "end game"
    ) {
      const winner = this.connectedPlayers.array()[0];
      this.endGame(this[winner.role]);
    }
  }

  startGame() {
    this.setStatus("starting");
    this.gameIo.emit("start");
    this.ballTimer = setInterval(() => this.createBall(), 20000);
    this.timer = setInterval(() => this.loopFunction(), 30);
    this.setStatus("running");
  }

  setupGame() {
    this.setStatus("setting up");
    const players = this.connectedPlayers.array();
    this.P1 = {
      role: "P1",
      pid: players[0].id,
      state: { width: 180, height: 45, x: 160, y: -30 },
      gameInfo: { points: 0, color: "blue", lifes: 10 }
    };
    this.P2 = {
      role: "P2",
      pid: players[1].id,
      state: { width: 180, height: 45, x: 160, y: 485 },
      gameInfo: { points: 0, color: "yellow", lifes: 10 }
    };

    players[0].role = "P1";
    players[1].role = "P2";

    this.createBall();

    this.gameIo.emit("setup", this.setupObject());
    setTimeout(() => {
      this.setStatus("start");
      this.startGame();
    }, 3000);
  }

  loopFunction() {
    this.interactions();
    this.sendState();
  }

  interactions() {
    this.ballsInteractions();
    this.entitiesInteractions();
  }

  ballsInteractions() {
    Array.from(this.balls).forEach(([id, ball]) => {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x + ball.size > this.width) {
        ball.x = this.width - ball.size;
        ball.vx *= -1;
      } else if (ball.x - ball.size < 0) {
        ball.x = ball.size;
        ball.vx *= -1;
      }

      if (ball.y - ball.size > this.height) {
        this.losingBall(this.P2, ball);
      } else if (ball.y + ball.size < 0) {
        this.losingBall(this.P1, ball);
      }

      if (this.checkBallCollision(ball, this.P1)) {
        this.touchingBall(ball, this.P1);
      }
      if (this.checkBallCollision(ball, this.P2)) {
        this.touchingBall(ball, this.P2);
      }
    });
  }

  checkBallCollision(ball, player) {
    const objState = player.state;
    return (
      ball.x + ball.size * 2 >= objState.x &&
      ball.x - ball.size * 2 <= objState.x + objState.width &&
      ball.y + ball.size * 2 >= objState.y &&
      ball.y - ball.size * 2 <= objState.y + objState.height
    );
  }

  entitiesInteractions() {}

  losingBall(player, ball) {
    player.gameInfo.lifes--;
    player.state.width += 10;
    this.balls.delete(ball.id);
    if (player.gameInfo.lifes < 1) {
      if (player.role === "P2") {
        this.endGame(this.P1);
      }
      if (player.role === "P1") {
        this.endGame(this.P2);
      }
    }
    if (this.balls.size < 2) this.createBall();
  }

  touchingBall(ball, player) {
    const objState = player.state;
    let touchX =
      (ball.x + ball.size / 2 - (objState.x + objState.width / 2)) /
      (objState.width / 2);
    touchX = touchX > 1 ? 1 : touchX;
    touchX = touchX < -1 ? -1 : touchX;

    let bonus = 1;
    if (Math.abs(touchX) < 0.2) {
      bonus = 2;
    }

    ball.vx = touchX * ball.speed;
    ball.vy =
      (0.75 - Math.abs(touchX) * 0.75 + 0.25) *
      ball.speed *
      (ball.vy >= 0 ? -1 : 1) *
      bonus;
    ball.x += ball.vx * 2;
    ball.y += ball.vy * 2;
    ball.speed *= 1 + 1 / ball.speed / 10;
    ball.color = player.gameInfo.color;
    player.state.width > 15 ? (player.state.width -= 5) : null;
    player.gameInfo.points += 1;
  }

  createBall() {
    const rvx = Math.random() * 10 - 5;
    const rvy = (Math.random() * 3 + 2) * (Math.random() > 0.5 ? -1 : 1);
    const rsize = Math.random() * 10 + 3;
    const newBall = {
      id: this.ballsCounter++,
      size: rsize,
      x: 250,
      y: 250,
      vx: rvx,
      vy: rvy,
      speed: 5,
      color: "black"
    };
    this.balls.set(newBall.id, newBall);
  }

  setupObject() {
    return this.stateObject();
  }

  stateObject() {
    return {
      players: {
        [this.P1.pid]: {
          id: this.P1.pid,
          role: "P1",
          state: this.P1.state,
          gameInfo: this.P1.gameInfo
        },
        [this.P2.pid]: {
          id: this.P2.pid,
          role: "P2",
          state: this.P2.state,
          gameInfo: this.P2.gameInfo
        }
      },
      balls: Array.from(this.balls).map(([_, ball]) => ball),
      time: new Date().getTime()
    };
  }
  sendState() {
    this.gameIo.emit("state", this.stateObject());
  }
}

module.exports = TennisGame;

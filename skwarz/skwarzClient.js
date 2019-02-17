class Tennis {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.status = "not_on_queue";
    canvas.onclick = e => this.canvasClick(e);
    this.drawUI(null, "Click to enter the queue");
    this.initInputHandler();
    this.keysdown = [];
    this.ping = 0;
    this.gridSide = 20;
  }

  setStatus(status) {
    this.status = status;
    switch (status) {
      case "queue_requested":
        this.drawUI(null, "Requesting Queue");
        break;
      case "on_queue":
        this.drawUI(null, "Waiting on queue");
        break;
      case "connected":
        this.drawUI(null, "Connected, waiting players");
        break;
      case "starting":
        this.drawUI(null, "Starting Game");
        break;
      case "running":
        break;
    }
  }

  canvasClick(e) {
    switch (this.status) {
      case "not_on_queue":
        this.requestQueue();
        break;
      case "showing_score":
        this.reinit();
      case "running":
        const deltaX = e.layerX - this.canvas.width / 2;
        const deltaY = e.layerY - this.canvas.height / 2;
        const hypot = Math.hypot(deltaX, deltaY);
        const x = deltaX / hypot;
        const y = deltaY / hypot;

        this.shoot({ x, y });
        break;
    }
  }

  requestQueue() {
    axios.get("/skwarz/queue").then(resp => {
      this.queueIo = io.connect(window.location.origin + resp.data.path);
      this.ticket = resp.data;
      this.queueIo.emit("confirm", resp.data);
      this.setQueueIo();
    });
    this.setStatus("queue_requested");
  }

  setQueueIo() {
    this.setStatus("on_queue");
    this.queueIo.on("start", data => {
      this.gameIo = io.connect(window.location.origin + data.path);
      this.setGameIo();
      this.queueIo.disconnect();
    });
    this.queueIo.on("players", data => console.log(data));
  }

  setGameIo() {
    this.setStatus("connected");
    this.gameIo.emit("enterGame", this.ticket);
    this.gameIo.on("players", data => console.log(data));
    this.gameIo.on("setup", data => this.setupGame(data));
    this.gameIo.on("state", data => this.updateState(data));
    this.gameIo.on("endGame", data => this.endGame(data));
  }

  endGame(endState) {
    const winner = endState.winner;
    this.setStatus("end_game");
    let endMessage = "";
    if (winner.pid === this[this.myRole].id) {
      endMessage = "You won! Congrats!";
    } else {
      endMessage = "You lost, keep training!";
    }

    this.gameIo.disconnect();
    this.drawUI(null, "Starting Game");
    this.drawUI(null, endMessage);
    this.scoreTimer = setTimeout(() => {
      this.setStatus("showing_score");
      this.drawUI("endScreen", endState);
    }, 3000);
  }

  reinit() {
    game = new Tennis(this.canvas);
  }

  setupGame(data) {
    this.setStatus("starting");
    this.seed = data.seed;
    this.state = data;
  }

  updateState(data) {
    if (this.status !== "running") this.setStatus("running");
    this.state = data;
    this.drawGame();
  }

  drawGame() {
    const ctx = this.ctx;
    const state = this.state;

    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.fillStyle = "black";

    const gridSide = this.gridSide;

    const gridWidth = cWidth / gridSide + 1;
    const gridHeight = cHeight / gridSide + 1;

    const player = state.you;
    const center = {
      x: player.position.x + gridSide / 2,
      y: player.position.y + gridSide / 2
    };

    let firstGridX = 0;
    if (player.position.x >= 0) {
      firstGridX = -(player.position.x % gridSide);
    } else {
      firstGridX =
        -(gridSide - (Math.abs(player.position.x) % gridSide)) % gridSide;
    }

    let firstGridY = 0;
    if (player.position.y >= 0) {
      firstGridY = -(player.position.y % gridSide);
    } else {
      firstGridY =
        -(gridSide - (Math.abs(player.position.y) % gridSide)) % gridSide;
    }
    for (let x = 0; x <= gridWidth; x++) {
      for (let y = 0; y <= gridHeight; y++) {
        const Ax = center.x - cWidth / 2 + x * gridSide;
        const Ay = center.y - cHeight / 2 + y * gridSide;

        const block = this.calculateTerrain(Ax, Ay);
        ctx.lineWidth = 0.7;
        ctx.fillStyle = block.color;
        ctx.fillRect(
          firstGridX + x * gridSide,
          firstGridY + y * gridSide,
          gridSide,
          gridSide
        );
      }
    }

    state.players.forEach(player => {
      const { position } = player;
      ctx.fillStyle = "black";
      ctx.fillRect(
        Math.trunc(position.x - center.x + cWidth / 2),
        Math.trunc(position.y - center.y + cHeight / 2),
        position.width + 1,
        position.height + 1
      );
    });

    state.projectiles.forEach(projectile => {
      const { position } = projectile;
      ctx.fillStyle = "black";
      ctx.fillRect(
        Math.trunc(position.x - center.x + cWidth / 2),
        Math.trunc(position.y - center.y + cHeight / 2),
        position.width + 1,
        position.height + 1
      );
    });
  }

  drawPlayer(player) {
    const ctx = this.ctx;
  }

  drawUI(action, data) {
    const ctx = this.ctx;

    ctx.font = "30px Arial";
    ctx.textAlign = "center";

    switch (action) {
      case "RunningGame":
        ctx.fillStyle = "black";

        ctx.fillText(this.myRole === "P1" ? "You" : "P1", 440, 40);
        ctx.fillText(
          this.state.players[this.P1.id].gameInfo.points + " Pts",
          440,
          70
        );
        ctx.fillText(
          this.state.players[this.P1.id].gameInfo.lifes + " lifes",
          440,
          100
        );

        ctx.fillText(this.myRole === "P2" ? "You" : "P2", 440, 410);
        ctx.fillText(
          this.state.players[this.P2.id].gameInfo.points + " Pts",
          440,
          440
        );

        ctx.fillText(
          this.state.players[this.P2.id].gameInfo.lifes + " lifes",
          440,
          470
        );
        break;
      case "endScreen":
        ctx.fillStyle = "yellow";
        ctx.fillRect(0, 0, 500, 500);
        ctx.fillStyle = "black";
        let startX = 150;
        let startY = 240;

        ctx.fillText("Score", 250, startY - 70);

        ctx.fillText(this.myRole === "P1" ? "You" : "P1", startX, startY);
        ctx.fillText(
          this.state.players[this.P1.id].gameInfo.points + " Pts",
          startX,
          startY + 70
        );
        ctx.fillText(
          this.state.players[this.P1.id].gameInfo.lifes + " lifes",
          startX,
          startY + 30
        );
        ctx.fillStyle = "black";
        startX += 200;
        startY += 0;

        ctx.fillText(this.myRole === "P2" ? "You" : "P2", startX, startY);
        ctx.fillText(
          this.state.players[this.P2.id].gameInfo.points + " Pts",
          startX,
          startY + 70
        );
        ctx.fillText(
          this.state.players[this.P2.id].gameInfo.lifes + " lifes",
          startX,
          startY + 30
        );
        ctx.fillText("Click to continue ", 250, startY + 130);
        break;
      default:
        ctx.clearRect(0, 0, 500, 500);
        ctx.fillStyle = "yellow";
        ctx.fillRect(20, 200, 460, 90);
        ctx.lineWidth = 2;
        ctx.strokeWidth = "brown";
        ctx.strokeRect(20, 200, 460, 90);

        ctx.fillStyle = "black";
        ctx.fillText(data, 250, 250);
        break;
    }
  }

  validPosition(x, y) {
    return !this.calculateTerrain(x, y).solid;
  }

  calculateTerrain(x, y) {
    const gridX = Math.floor(x / this.gridSide);
    const gridY = Math.floor(y / this.gridSide);
    const terrainValue =
      Math.abs(Math.cos(gridX ** 1 / 2 + gridY ** 3 + this.seed ** 2)) * 100000;

    if (
      Math.abs(gridX) % ((this.seed % 50) + 25) < 5 &&
      Math.abs(gridY) % ((this.seed % 50) + 25) < 2
    ) {
      return blocks.wall;
    }

    if (terrainValue > 4000) {
      return blocks.dirt;
    } else if (terrainValue > 2000) {
      return blocks.bush;
    } else {
      return blocks.wall;
    }
  }

  shoot() {
    this.gameIo.emit("shoot");
  }

  inputHandler() {
    if (this.keysdown.length < 1) return;
    const isDown = key => this.keysdown.includes(key.toLowerCase());

    if (isDown("w")) {
      this.movePlayer("y", -5);
    }
    if (isDown("s")) {
      this.movePlayer("y", 5);
    }
    if (isDown(" ")) {
      this.shoot();
    }
    if (isDown("a")) {
      if (this.status === "running") {
        this.movePlayer("x", -5);
      }
    }
    if (isDown("d")) {
      if (this.status === "running") {
        this.movePlayer("x", 5);
      }
    }
    if (isDown(" ")) {
      //this.shoot();
    }
  }

  movePlayer(axis, delta) {
    this.gameIo.emit("movement", { axis, delta });
  }

  shoot(direction) {
    this.gameIo.emit("shoot", direction);
  }

  initInputHandler() {
    document.onkeydown = e => {
      if (this.keysdown.indexOf(e.key.toLowerCase()) < 0) {
        this.keysdown.push(e.key.toLowerCase());
      }
    };
    document.onkeyup = e => {
      this.keysdown = this.keysdown.filter(k => k != e.key.toLowerCase());
    };
    setInterval(e => this.inputHandler(e), 50);
  }
}

canvas = document.querySelector("canvas");
//canvasWrapper = document.querySelector("#canvas_wrapper");

let game = new Tennis(canvas);

const blocks = {
  dirt: {
    name: "dirt",
    solid: false,
    color: "#fc9935"
  },
  wall: {
    name: "wall",
    solid: true,
    color: "#3a1f1f"
  },
  bush: {
    name: "bush",
    solid: false,
    color: "#428c24"
  }
};

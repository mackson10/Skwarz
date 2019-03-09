class Skwarz {
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
    this.maxGridRadius = 300;
    this.maxRadius = this.maxGridRadius * this.gridSide;
    this.ring;
    this.deaths = [];
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
    this.name = localStorage.skw_name;
    if (!this.name) {
      this.name = prompt("choose a name") || "nameless";
    }
    axios.get("/skwarz/queue").then(resp => {
      this.queueIo = io.connect(window.location.origin + resp.data.path);
      this.ticket = { ...resp.data, name: this.name };
      this.queueIo.emit("confirm", this.ticket);
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
    this.gameIo.on("death", data => this.deaths.push(data));
  }

  endGame(endState) {
    this.state = endState;
    const winner = endState.winner;
    this.setStatus("end_game");
    let endMessage = "";
    if (winner.id === this.ticket.id) {
      endMessage = "You are the winner!";
    } else {
      endMessage = winner.name + " is the winner.";
    }

    this.gameIo.disconnect();
    this.drawUI(null, endMessage);
    this.scoreTimer = setTimeout(() => {
      this.setStatus("showing_score");
      this.drawUI("endScreen", endState);
    }, 3000);
  }

  reinit() {
    game = new Skwarz(this.canvas);
  }

  setupGame(data) {
    this.setStatus("starting");
    this.seed = data.seed;
    this.ring = new Ring(this);
    this.ring.interaction();
    this.state = data;
    this.ping = 0;
  }

  updateState(data) {
    if (this.status !== "running") this.setStatus("running");
    this.state = data;
    this.ping = new Date().getTime() - data.time;
    console.log(this.ping);
    this.ring.lastMovement = data.ringLastMovement;
    this.ring.interaction();
    this.drawGame();
  }

  validPosition(x, y) {
    return !this.calculateTerrain(x, y).solid;
  }

  calculateTerrain(x, y) {
    const gridX = Math.floor(x / this.gridSide);
    const gridY = Math.floor(y / this.gridSide);

    if (this.ring.reached(gridX, gridY)) {
      return blocks.fire;
    }

    if (
      Math.abs(gridX) % ((this.seed % 50) + 25) < 5 &&
      Math.abs(gridY) % ((this.seed % 50) + 25) < 2
    ) {
      return blocks.wall;
    }

    const terrainValue =
      Math.abs(Math.cos(gridX ** 1 / 2 + gridY ** 3 + this.seed ** 2)) * 100000;

    if (terrainValue > 3000) {
      return blocks.dirt;
    } else if (terrainValue > 500) {
      return blocks.bush;
    } else if (terrainValue > 300) {
      return blocks.wall;
    } else if (terrainValue > 200) {
      return mapObjects.weapons.shotgun;
    } else if (terrainValue > 150) {
      return mapObjects.weapons.pistol;
    } else if (terrainValue > 100) {
      return mapObjects.weapons.smg;
    } else if (terrainValue > 50) {
      return mapObjects.weapons.grenade;
    } else {
      return mapObjects.weapons.smoke;
    }
  }

  shoot() {
    this.gameIo.emit("shoot");
  }

  inputHandler() {
    if (this.keysdown.length < 1) return;
    const isDown = key => this.keysdown.includes(key.toLowerCase());

    if (isDown("w")) {
      this.movePlayer("y", -3);
    }
    if (isDown("s")) {
      this.movePlayer("y", 3);
    }
    if (isDown("a")) {
      if (this.status === "running") {
        this.movePlayer("x", -3);
      }
    }
    if (isDown("d")) {
      if (this.status === "running") {
        this.movePlayer("x", 3);
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
    this.canvas.onblur = e => {
      this.keysdown = [];
    };

    this.canvas.onkeydown = e => {
      if (this.keysdown.indexOf(e.key.toLowerCase()) < 0) {
        this.keysdown.push(e.key.toLowerCase());
      }
    };
    this.canvas.onkeyup = e => {
      this.keysdown = this.keysdown.filter(k => k != e.key.toLowerCase());
    };
    setInterval(e => this.inputHandler(e), 20);
  }

  drawGame() {
    const ctx = this.ctx;
    const state = this.state;
    const me = state.you;
    const gridSide = this.gridSide;
    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;

    this.drawMap();

    state.players.forEach(player => {
      this.drawPlayer(player);
    });
    state.entities.smokes.forEach(smoke => {
      const { x, y, width, height } = smoke;
      ctx.fillStyle = "grey";
      const drawValues = [
        Math.trunc(x - me.position.x - gridSide / 2 + cWidth / 2),
        Math.trunc(y - me.position.y - gridSide / 2 + cHeight / 2),
        width + 1,
        height + 1
      ];
      ctx.fillRect(...drawValues);
    });
    state.entities.projectiles.forEach(projectile => {
      const { position } = projectile;
      ctx.fillStyle = projectile.color;
      const drawValues = [
        Math.trunc(position.x - me.position.x - gridSide / 2 + cWidth / 2),
        Math.trunc(position.y - me.position.y - gridSide / 2 + cHeight / 2),
        position.width + 1,
        position.height + 1
      ];
      ctx.fillRect(...drawValues);
      ctx.strokeRect(...drawValues);
    });

    this.drawPlayer(me);

    this.drawUI("running_interface");
  }

  drawMap() {
    const ctx = this.ctx;
    const state = this.state;
    const player = state.you;
    const gridSide = this.gridSide;
    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.fillStyle = "black";

    const gridWidth = cWidth / gridSide + 1;
    const gridHeight = cHeight / gridSide + 1;

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

        const terrain = this.calculateTerrain(Ax, Ay);
        this.drawTerrain(
          terrain,
          firstGridX + x * gridSide,
          firstGridY + y * gridSide
        );
      }
    }
  }

  drawTerrain(terrain, x, y) {
    const ctx = this.ctx;
    const gridSide = this.gridSide;
    const drawValues = [x, y, gridSide, gridSide];

    if (terrain.type === "block") {
      ctx.fillStyle = terrain.color;
      ctx.fillRect(...drawValues);
    } else if (terrain.type === "object") {
      ctx.fillStyle = blocks.dirt.color;
      ctx.fillRect(...drawValues);
      ctx.drawImage(terrain.image, ...drawValues);
    }

    if (terrain.stroke) {
      ctx.lineWidth = 1;
      ctx.strokeRect(...drawValues);
    }
  }

  drawPlayer(player) {
    const gridSide = this.gridSide;
    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;
    const me = this.state.you;
    const ctx = this.ctx;
    const { position } = player;
    const x = Math.trunc(
      position.x - me.position.x - gridSide / 2 + cWidth / 2
    );
    const y = Math.trunc(
      position.y - me.position.y - gridSide / 2 + cHeight / 2
    );

    const drawValues = [x, y, position.width + 1, position.height + 1];
    ctx.fillStyle = player.color;
    if (player.visible === true) ctx.fillRect(...drawValues);
    ctx.strokeRect(...drawValues);
  }

  drawUI(action, data) {
    const ctx = this.ctx;
    const state = this.state;
    const me = state && state.you;
    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;

    switch (action) {
      case "running_interface":
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.font = "20px monospace";
        if (me.status === "alive") {
          ctx.fillText(
            `${me.weapon.name}  ${me.weapon.bullets}/${me.weapon.capacity}   ${
              me.weapon.status
            }`,
            cWidth - 320,
            cHeight - 40
          );
          ctx.fillStyle = "green";
          ctx.fillRect(cWidth - 330, cHeight - 30, state.you.life * 3, 20);
          ctx.fillStyle = "black";
          ctx.fillText("life", cWidth - 330, cHeight - 12);
          ctx.lineWidth = 2;
          ctx.strokeRect(cWidth - 330, cHeight - 30, 300, 20);
        } else if (me.status === "expectating") {
          ctx.fillText("expectating", cWidth - 220, cHeight - 30);
        }

        ctx.fillText(`players: ${state.remainingPlayers}`, cWidth - 170, 40);
        ctx.fillText(`your kills: ${me.kills}`, cWidth - 170, 60);

        ctx.font = "20px monospace";
        this.deaths.slice(-3).forEach((death, i) => {
          const pos = { x: 30, y: (i + 1) * 22 + 30 };
          if (death.reason === "fire") {
            ctx.fillStyle = "yellow";
            ctx.fillText("🔥", pos.x, pos.y);
            ctx.fillStyle = death.victim.color;
            ctx.fillText(death.victim.name, (pos.x += 25), pos.y);
          } else if (death.reason === "player") {
            ctx.fillStyle = death.murder.color;
            ctx.fillText(death.murder.name, pos.x, pos.y);

            ctx.drawImage(
              mapObjects.weapons[death.weapon].image,
              (pos.x += ctx.measureText(death.murder.name).width + 5),
              pos.y - 20,
              20,
              20
            );

            ctx.fillStyle = death.victim.color;
            ctx.fillText(death.victim.name, (pos.x += 25), pos.y);
          }
        });

        break;
      case "endScreen":
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "lightblue";

        const pos = { x: cWidth / 2, y: 0.3 * cHeight };

        ctx.fillRect(0, 0, cWidth, cHeight);
        ctx.fillStyle = "black";
        ctx.fillText("You placed #" + state.you.place, pos.x, pos.y);
        ctx.fillText("Stats", cWidth / 2, (pos.y += 80));
        ctx.fillText("Kills: " + state.you.kills, pos.x, (pos.y += 40));
        ctx.fillText(
          "Damage dealt: " + Math.trunc(state.you.damageDealt),
          pos.x,
          (pos.y += 40)
        );
        ctx.fillText(
          "Damage suffered: " + Math.trunc(state.you.damageSuffered),
          pos.x,
          (pos.y += 40)
        );

        ctx.fillText("Click to continue ", pos.x, (pos.y += 100));

        break;
      default:
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.clearRect(0, 0, cWidth, cHeight);
        ctx.fillStyle = "black";
        ctx.fillText(data, cWidth / 2, cHeight / 2);
        break;
    }
  }
}

canvas = document.querySelector("canvas");
let game = new Skwarz(canvas);

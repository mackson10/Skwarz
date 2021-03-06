GameRoom = require("../games/GameRoom");
Player = require("./Player");
Ring = require("./Ring");
Projectile = require("./Projectile");
mapObjects = require("./mapObjectsS");

blocks = require("./blocks");

class SkwarzGame {
  constructor(gameIo, ticketsArray) {
    this.gameIo = gameIo;
    this.tickets = ticketsArray;
    this.waitingDelayedTime = 1000;
    this.connectedPlayers = new GameRoom({
      minPlayers: 2,
      maxPlayers: ticketsArray.length
    });
    this.loopTime = 25;
    this.status = "waiting players";
    this.seed = Math.floor(Math.random() * 100000) + 1;
    this.gridSide = 20;
    this.maxGridRadius = 300;
    this.spawnGridRadius = 250;
    this.spawnRadius = this.spawnGridRadius * this.gridSide;
    this.maxRadius = this.maxGridRadius * this.gridSide;
    this.entities = {
      projectiles: new Map(),
      smokes: new Map()
    };
    this.projectilesCount = 0;
    this.smokesCount = 0;
    this.deaths = [];
    this.ring = new Ring(this);
    this.setIo();
  }

  setStatus(status) {
    this.status = status;
    console.log(status);
    switch (status) {
      case "waiting delayed":
        this.waitingDelayed = new Date().getTime();
        setTimeout(() => this.checkConnected(), this.waitingDelayedTime);
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

    socket.on("movement", movement => {
      if (socket.player && this.status === "running") {
        socket.player.move(movement, socket.player.status === "alive");
      }
    });
    socket.on("shoot", direction => {
      if (
        socket.player &&
        this.status === "running" &&
        socket.player.status === "alive"
      ) {
        socket.player.shoot(direction);
      }
    });
  }

  enterGame(socket, playerTicket) {
    let validTicket = this.tickets.find(
      ticket =>
        ticket.id === playerTicket.id &&
        ticket.secret === playerTicket.secret &&
        !ticket.taken
    );

    if (validTicket) {
      const newPlayer = new Player(
        this,
        validTicket.id,
        validTicket.secret,
        playerTicket.name,
        socket
      );
      validTicket.taken = true;
      socket.player = newPlayer;
      this.connectedPlayers.join(newPlayer);
      socket.emit("waiting players");
      this.setSocket(socket);
      this.checkConnected();
    } else {
      socket.emit("not confirmed");
    }
  }

  leaveGame(player) {
    if (player.status === "alive") {
      this.remainingPlayers--;
    }
    this.connectedPlayers.leave(player);
    this.checkConnected();
  }

  checkConnected() {
    if (this.status === "waiting players") {
      if (this.connectedPlayers.playersEnough())
        this.setStatus("waiting delayed");
    } else if (this.status === "waiting delayed") {
      if (
        this.connectedPlayers.isFull() ||
        new Date().getTime() - this.waitingDelayed >= this.waitingDelayedTime
      ) {
        this.setupGame();
      }
    } else {
      this.checkAlive();
    }
  }

  checkAlive() {
    if (this.remainingPlayers < 2) {
      const alivePlayers = this.connectedPlayers.array(
        player => player.status === "alive"
      );
      this.endGame(alivePlayers[0]);
    }
  }

  endGame(winner) {
    clearInterval(this.loopTimer);

    const formatedPlayers = Player.sendFormatArray(
      this.connectedPlayers.players
    );
    const endGameObject = {
      winner: winner && winner.sendFormat(),
      formatedPlayers
    };

    this.connectedPlayers.players.forEach(player => {
      endGameObject.you = {
        ...player.sendFormat(),
        weapon: player.weapon.sendFormat()
      };

      const socket = player.socket;
      socket.emit("endGame", endGameObject);
    });
  }

  setupGame() {
    this.setStatus("setting up");
    this.remainingPlayers = this.connectedPlayers.size();
    this.initializePositions();
    this.sendSetup();
    setTimeout(() => this.startGame(), 3000);
  }

  sendSetup() {
    const formatedPlayers = Player.sendFormatArray(
      this.connectedPlayers.players
    );

    const setupObject = {
      players: formatedPlayers,
      seed: this.seed
    };

    this.connectedPlayers.players.forEach(player => {
      setupObject.you = player.sendFormat();
      const socket = player.socket;
      socket.emit("setup", setupObject);
    });
  }

  startGame() {
    this.setStatus("starting");
    this.loopTimer = setInterval(() => this.loopFunction(), this.loopTime);
  }

  loopFunction() {
    if (this.status === "starting") this.setStatus("running");
    this.interactions();
    this.sendState();
  }
  interactions() {
    Projectile.interactions(this.entities.projectiles, this);
    Player.interactions(
      this.connectedPlayers.array(player => player.status === "alive")
    );
    this.ring.interaction();
    this.checkAlive();
  }

  sendState() {
    const formatedPlayers = Player.sendFormatArray(
      this.connectedPlayers.players,
      player => player.visible && player.status === "alive"
    );

    const formatedProjectiles = Projectile.sendFormatArray(
      this.entities.projectiles
    );

    const smokes = [];
    Array.from(this.entities.smokes).map(([_, smoke]) => {
      smokes.push(smoke);
    });

    const stateObject = {
      players: formatedPlayers,
      remainingPlayers: this.remainingPlayers,
      entities: {
        projectiles: formatedProjectiles,
        smokes
      },
      ringLastMovement: this.ring.lastMovement,
      time: new Date().getTime()
    };

    this.connectedPlayers.players.forEach(player => {
      stateObject.you = {
        ...player.sendFormat(),
        weapon: player.weapon.sendFormat()
      };

      const socket = player.socket;
      socket.emit("state", stateObject);
    });
  }

  death(reason, victim, murder) {
    const deathObj = {
      reason: reason,
      victim: { color: victim.color, name: victim.name }
    };

    victim.die(reason, murder);
    this.remainingPlayers--;

    if (reason === "player") {
      murder.kills++;
      deathObj.murder = { color: murder.color, name: murder.name };
      deathObj.weapon = murder.weapon.name;
      this.gameIo.emit("death", deathObj);
    } else if (reason === "fire") {
      this.gameIo.emit("death", deathObj);
    }
    this.deaths.push(deathObj);
    this.checkAlive();
  }

  createProjectile(player, origin, options) {
    const {
      direction,
      width,
      height,
      speed,
      range,
      damage,
      weaponName,
      hasStopFunction,
      friendlyFire,
      color
    } = options;
    const firstPosition = {
      x: origin.x + origin.width / 2 - width / 2,
      y: origin.y + origin.height / 2 - height / 2,
      width,
      height
    };

    const projectileOptions = {
      direction,
      position: firstPosition,
      speed,
      range,
      damage,
      weaponName,
      hasStopFunction,
      friendlyFire,
      color
    };

    const newProjectile = new Projectile(player, projectileOptions);
    this.entities.projectiles.set(newProjectile.id, newProjectile);
  }

  initializePositions() {
    let x = -this.spawnRadius;
    let y = 0;
    let xInc = Math.trunc(this.spawnRadius / 10);
    let yInc = -Math.trunc(this.spawnRadius / 10);

    for (let player of this.connectedPlayers.array()) {
      player.position.width = this.gridSide - 4;
      player.position.height = this.gridSide - 4;

      while (!this.validPosition({ ...player.position, x, y })) {
        x += xInc >= 0 ? 1 : -1;
        y += yInc >= 0 ? 1 : -1;
      }

      player.position.x = x + 2;
      player.position.y = y + 2;

      x += xInc;
      y += yInc;

      if (Math.abs(x) >= this.spawnRadius) {
        xInc *= -1;
      }
      if (Math.abs(y) >= this.spawnRadius) {
        yInc *= -1;
      }
    }
  }

  validPosition(position) {
    let p1, p2, p3, p4;

    p1 = { x: position.x, y: position.y };
    p2 = {
      x: position.x + position.width,
      y: position.y + position.height
    };
    p3 = { x: position.x, y: position.y + position.height };
    p4 = { x: position.x + position.width, y: position.y };

    return (
      !this.calculateTerrain(p1.x, p1.y).solid &&
      !this.calculateTerrain(p2.x, p2.y).solid &&
      !this.calculateTerrain(p3.x, p3.y).solid &&
      !this.calculateTerrain(p4.x, p4.y).solid
    );
  }

  calculateTerrain(x, y) {
    const gridX = Math.floor(x / this.gridSide);
    const gridY = Math.floor(y / this.gridSide);

    Array.from(this.entities.smokes).map(([_, smoke]) => {
      if (
        smoke =>
          Math.trunc(smoke.x / this.gridSide) === gridX &&
          Math.trunc(smoke.y / this.gridSide) === gridY
      )
        return blocks.smoke;
    });

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

    if (terrainValue > 2000) {
      return blocks.dirt;
    } else if (terrainValue > 800) {
      return blocks.wall;
    } else if (terrainValue > 100) {
      return blocks.bush;
    } else if (terrainValue > 75) {
      return mapObjects.weapons.shotgun;
    } else if (terrainValue > 50) {
      return mapObjects.weapons.pistol;
    } else if (terrainValue > 25) {
      return mapObjects.weapons.smg;
    } else if (terrainValue > 10) {
      return mapObjects.weapons.grenade;
    } else {
      return mapObjects.weapons.smoke;
    }
  }

  smoke({ x, y }) {
    const gridX = Math.floor(x / this.gridSide);
    const gridY = Math.floor(y / this.gridSide);

    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const smokePosition = {
          x: (gridX + i) * this.gridSide,
          y: (gridY + j) * this.gridSide,
          width: this.gridSide,
          height: this.gridSide
        };
        const smokeTerrain = this.calculateTerrain(
          smokePosition.x,
          smokePosition.y
        );
        if (!smokeTerrain.solid) {
          const smoke = {
            id: ++this.smokesCount,
            ...smokePosition
          };

          const deltaX = Math.abs(i);
          const deltaY = Math.abs(j);

          setTimeout(() => {
            this.entities.smokes.set(smoke.id, smoke);
          }, (deltaX + deltaY) * 200);

          setTimeout(() => {
            this.entities.smokes.delete(smoke.id);
          }, (deltaX + deltaY) * 200 + 10000);
        }
      }
    }
  }
}

module.exports = SkwarzGame;

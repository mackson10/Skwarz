const Weapon = require("./Weapon");
const weapons = require("./weapons");

class Player {
  constructor(game, id, secret, name, socket) {
    this.game = game;
    this.id = id;
    this.name = name;
    this.secret = secret;
    this.socket = socket;
    this.color = "#" + (Math.trunc(Math.random() * 16 ** 6) - 1).toString(16);
    this.kills = 0;
    this.life = 100;
    this.visible = true;
    this.position = {
      x: undefined,
      y: undefined,
      width: undefined,
      height: undefined
    };
    this.weapon = new Weapon(weapons.pistol);
    this.lastDamage = 0;
    this.status = "alive";
    this.place = 1;
    this.damageDealt = 0;
    this.damageSuffered = 0;
  }

  static sendFormatArray(mapOfPlayers, conditionFunction = () => true) {
    const output = [];
    Array.from(mapOfPlayers).forEach(([_, player]) => {
      if (conditionFunction(player)) output.push(player.sendFormat());
    });
    return output;
  }

  static interactions(players) {
    const now = new Date().getTime();

    players.forEach(player => {
      player.standingOn();
      if (now - player.lastDamage >= 10000) {
        player.increaseLife(0.1);
      }
    });
  }

  sendFormat() {
    const {
      id,
      name,
      color,
      kills,
      life,
      position,
      visible,
      status,
      place,
      damageDealt,
      damageSuffered
    } = this;
    return {
      id,
      status,
      name,
      color,
      kills,
      life,
      position,
      visible,
      place,
      damageDealt,
      damageSuffered
    };
  }

  move(movement, validate = true) {
    const newPosition = { ...this.position };
    newPosition[movement.axis] += movement.delta;
    const steppingOn = this.steppingOn(newPosition);

    if (
      !steppingOn.find(block => block.solid) ||
      this.status !== "alive" ||
      !validate
    ) {
      this.position = newPosition;
    }
  }

  steppingOn(position) {
    let p1, p2, p3, p4;

    p1 = { x: position.x, y: position.y };
    p2 = { x: position.x + position.width, y: position.y };
    p3 = { x: position.x, y: position.y + position.height };
    p4 = {
      x: position.x + position.width,
      y: position.y + position.height
    };

    const terrainArray = [
      this.game.calculateTerrain(p1.x, p1.y),
      this.game.calculateTerrain(p2.x, p2.y),
      this.game.calculateTerrain(p3.x, p3.y),
      this.game.calculateTerrain(p4.x, p4.y)
    ];
    return terrainArray;
  }

  standingOn(terrain = this.steppingOn(this.position)) {
    let visible = true;
    let burning = false;
    let gettingWeapon = null;

    terrain.forEach(terrain => {
      visible = visible && !terrain.hide;
      burning = burning || terrain.name === "fire";
      if (terrain.type === "weapon" && this.weapon.name !== terrain.name) {
        gettingWeapon = terrain.name;
      }
    });

    if (burning) this.burn();
    if (gettingWeapon) this.getWeapon(gettingWeapon);
    this.visible = visible;
  }

  increaseLife(delta) {
    this.life += delta;

    if (this.life > 100) {
      this.life = 100;
    }
    if (this.life < 0) {
      this.life = 0;
    }

    if (delta < 0) {
      this.lastDamage = new Date().getTime();
    }
  }

  getWeapon(weaponName) {
    this.weapon = new Weapon(weapons[weaponName]);
  }

  burn() {
    this.damageSuffered += 0.1;
    this.increaseLife(-0.1);
    if (this.life <= 0) this.game.death("fire", this);
  }

  hit(projectile) {
    this.damageSuffered += projectile.damage;
    projectile.owner.damageDealt += projectile.damage;
    this.increaseLife(-projectile.damage);
    if (this.life <= 0) {
      this.game.death("player", this, projectile.owner);
    }
  }

  die(reason, murder) {
    let endGameObj = {
      reason
    };
    if (murder) {
      endGameObj.murder = { name: murder.name, color: murder.color };
    }
    this.place = this.game.remainingPlayers;
    this.socket.emit("gameOver", endGameObj);
    this.color = "white";
    this.status = "expectating";
  }

  shoot(direction) {
    this.weapon.shoot(this, direction);
  }

  reload() {
    this.weapon.reload();
  }
}

module.exports = Player;

const weapons = require("./weapons");

class Projectile {
  constructor(
    player,
    {
      position,
      direction,
      speed,
      range,
      damage,
      weaponName,
      hasStopFunction,
      friendlyFire,
      color
    }
  ) {
    this.weaponName = weaponName;
    this.owner = player;
    this.id = ++this.owner.game.projectilesCount;
    this.position = position;
    this.direction = direction;
    this.speed = speed;
    this.range = range;
    this.damage = damage;
    this.displacement = 0;
    this.hasStopFunction = hasStopFunction;
    this.friendlyFire = friendlyFire;
    this.color = color;
  }

  static sendFormatArray(mapOfProjectiles) {
    return Array.from(mapOfProjectiles).map(
      ([_, { position, id, direction, color }]) => {
        return { position, id, direction, color };
      }
    );
  }

  static interactions(mapOfProjectiles, game) {
    Array.from(mapOfProjectiles).forEach(([_, projectile]) => {
      const { position, direction, speed } = projectile;

      const newPosition = { ...position };
      newPosition.x += direction.x * speed;
      newPosition.y += direction.y * speed;

      if (!game.validPosition(newPosition)) {
        if (projectile.speed > 1)
          projectile.speed = Math.trunc(projectile.speed / 2);
        else projectile.stop();
      } else {
        projectile.position = newPosition;
        projectile.displacement += speed;
      }

      game.connectedPlayers
        .array(player => player.status === "alive")
        .forEach(player => {
          if (
            (player !== projectile.owner || projectile.friendlyFire) &&
            projectile.checkCollision(player.position)
          ) {
            projectile.stop(player);
          }
        });

      if (projectile.displacement >= projectile.range) {
        projectile.stop();
      }
    });
  }

  stop(player) {
    if (this.speed === 0) return;

    let stopFunction = (projectile, player) => {
      if (player) player.hit(projectile);
      this.destroy();
    };

    if (this.hasStopFunction) {
      stopFunction = weapons[this.weaponName].stopProjectileFunction;
    }

    stopFunction(this, player);
  }

  destroy() {
    this.owner.game.entities.projectiles.delete(this.id);
  }

  checkCollision(objPosition) {
    return (
      this.position.x + this.position.width >= objPosition.x &&
      this.position.x <= objPosition.x + objPosition.width &&
      this.position.y + this.position.height >= objPosition.y &&
      this.position.y <= objPosition.y + objPosition.height
    );
  }
}

module.exports = Projectile;

class Projectile {
  constructor(player, { position, direction, speed, range, damage }) {
    this.owner = player;
    this.id = ++this.owner.game.projectilesCount;
    this.position = position;
    this.direction = direction;
    this.speed = speed;
    this.range = range;
    this.damage = damage;
    this.displacement = 0;
  }

  static sendFormatArray(mapOfProjectiles) {
    return Array.from(mapOfProjectiles).map(
      ([_, { position, id, direction }]) => {
        return { position, id, direction };
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
        projectile.destroy();
      } else {
        projectile.position = newPosition;
        projectile.displacement += speed;
      }

      game.connectedPlayers.array().forEach(player => {
        if (
          player !== projectile.owner &&
          projectile.checkCollision(player.position)
        ) {
          player.hit(projectile);
          projectile.destroy();
        }
      });

      if (projectile.displacement >= projectile.range) {
        projectile.destroy();
      }
    });
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

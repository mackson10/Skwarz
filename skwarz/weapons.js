module.exports = {
  pistol: {
    name: "pistol",
    capacity: 9,
    shootCooldown: 200,
    reloadTime: 2000,
    projectile: { speed: 10, width: 10, height: 10, range: 300 },
    shootFunction: (player, direction) => {
      player.game.createProjectile(player, {
        direction,
        ...player.weapon.projectile
      });
      player.weapon.bullets--;
    }
  },
  shotgun: {
    name: "shotgun",
    capacity: 5,
    shootCooldown: 400,
    reloadTime: 3000,
    projectile: { speed: 11, width: 15, height: 15, range: 200 },
    shootFunction: (player, direction) => {
      const rad = (15 * Math.PI) / 180;

      sideDirection1 = {};
      sideDirection1.y =
        direction.y * Math.cos(rad) + Math.sin(rad) * direction.x;
      sideDirection1.x =
        direction.x * Math.cos(rad) - Math.sin(rad) * direction.y;

      sideDirection2 = {};
      sideDirection2.y =
        direction.y * Math.cos(-rad) + Math.sin(-rad) * direction.x;
      sideDirection2.x =
        direction.x * Math.cos(-rad) - Math.sin(-rad) * direction.y;

      player.game.createProjectile(player, {
        direction,
        ...player.weapon.projectile
      });
      player.game.createProjectile(player, {
        direction: sideDirection1,
        ...player.weapon.projectile
      });
      player.game.createProjectile(player, {
        direction: sideDirection2,
        ...player.weapon.projectile
      });

      player.weapon.bullets--;
    }
  }
};

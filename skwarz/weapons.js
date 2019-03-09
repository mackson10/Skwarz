const weapons = {
  pistol: {
    name: "pistol",
    capacity: 9,
    shootCooldown: 200,
    reloadTime: 2000,
    projectile: {
      speed: 10,
      width: 10,
      height: 10,
      range: 330,
      damage: 40,
      color: "grey"
    },
    shootFunction: (player, direction) => {
      player.game.createProjectile(player, player.position, {
        direction,
        ...player.weapon.projectile
      });
      player.weapon.bullets--;
    }
  },
  smg: {
    name: "smg",
    capacity: 25,
    shootCooldown: 80,
    reloadTime: 2000,
    projectile: {
      speed: 12,
      width: 6,
      height: 6,
      range: 300,
      damage: 25,
      color: "maroon"
    },
    shootFunction: (player, direction) => {
      player.game.createProjectile(player, player.position, {
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
    projectile: {
      speed: 11,
      width: 15,
      height: 15,
      range: 150,
      damage: 30,
      color: "black"
    },
    shootFunction: (player, direction) => {
      const projectiles = [
        { deltAng: 15, ...player.weapon.projectile },
        { deltAng: -15, ...player.weapon.projectile }
      ];

      for (let projectile of projectiles) {
        let rad = (projectile.deltAng * Math.PI) / 180;
        projectile.direction = {};
        projectile.direction.y =
          direction.y * Math.cos(rad) + Math.sin(rad) * direction.x;
        projectile.direction.x =
          direction.x * Math.cos(rad) - Math.sin(rad) * direction.y;
        player.game.createProjectile(player, player.position, {
          direction: projectile.direction,
          ...projectile
        });
      }
      player.game.createProjectile(player, player.position, {
        direction,
        ...player.weapon.projectile
      });

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          player.move({ axis: "x", delta: -Math.round(direction.x) * 3 });
          player.move({ axis: "y", delta: -Math.round(direction.y) * 3 });
        }, 20 * i);
      }
      player.weapon.bullets--;
    }
  },
  grenade: {
    name: "grenade",
    capacity: 5,
    shootCooldown: 500,
    reloadTime: 3500,
    projectile: {
      speed: 10,
      width: 14,
      height: 14,
      range: 150,
      damage: 0,
      color: "darkgreen"
    },
    shootFunction: (player, direction) => {
      player.game.createProjectile(player, player.position, {
        direction,
        ...player.weapon.projectile,
        weaponName: player.weapon.name,
        hasStopFunction: true
      });
      player.weapon.bullets--;
    },
    stopProjectileFunction: projectile => {
      projectile.speed = 0;
      const player = projectile.owner;
      setTimeout(() => {
        const fragmentProjectile = {
          speed: 13,
          width: 12,
          height: 12,
          range: 150,
          damage: 40,
          color: "black"
        };
        const newProjectiles = [
          {
            direction: { x: 1, y: 0 },
            ...fragmentProjectile,
            friendlyFire: true
          },
          {
            direction: { x: 0, y: 1 },
            ...fragmentProjectile,
            weaponName: "grenade",
            friendlyFire: true
          },
          {
            direction: { x: -1, y: 0 },
            ...fragmentProjectile,
            weaponName: "grenade",
            friendlyFire: true
          },
          {
            direction: { x: 0, y: -1 },
            ...fragmentProjectile,
            weaponName: "grenade",
            friendlyFire: true
          },
          {
            direction: { x: -0.6, y: 0.6 },
            ...fragmentProjectile,
            weaponName: "grenade",
            friendlyFire: true
          },
          {
            direction: { x: 0.6, y: -0.6 },
            ...fragmentProjectile,
            weaponName: "grenade",
            friendlyFire: true
          },
          {
            direction: { x: -0.6, y: -0.6 },
            ...fragmentProjectile,
            weaponName: "grenade",
            friendlyFire: true
          },
          {
            direction: { x: 0.6, y: 0.6 },
            ...fragmentProjectile,
            weaponName: "grenade",
            friendlyFire: true
          }
        ];

        for (let newProjectile of newProjectiles) {
          player.game.createProjectile(player, projectile.position, {
            ...newProjectile
          });
        }
        projectile.destroy();
      }, 2000);
    }
  },
  smoke: {
    name: "smoke",
    capacity: 5,
    shootCooldown: 500,
    reloadTime: 3500,
    projectile: {
      speed: 10,
      width: 14,
      height: 14,
      range: 150,
      damage: 0,
      color: "grey"
    },
    shootFunction: (player, direction) => {
      player.game.createProjectile(player, player.position, {
        direction,
        ...player.weapon.projectile,
        weaponName: player.weapon.name,
        hasStopFunction: true
      });
      player.weapon.bullets--;
    },
    stopProjectileFunction: projectile => {
      projectile.speed = 0;
      const player = projectile.owner;
      setTimeout(() => {
        player.game.smoke(projectile.position);
        projectile.destroy();
      }, 2000);
    }
  }
};

module.exports = weapons;

class Weapon {
  constructor(options) {
    this.name = options.name;
    this.capacity = options.capacity;
    this.shootCooldown = options.shootCooldown;
    this.reloadTime = options.reloadTime;
    this.damage = 50;

    this.bullets = this.capacity;
    this.lastShot = 0;
    this.reloadStarted = 0;
    this.status = "full";

    this.projectile = options.projectile;
    this.shootFunction = options.shootFunction;
  }

  shoot(player, direction) {
    if (this.status === "full" || this.status === "ready") {
      this.shootFunction(player, direction);
      if (this.bullets === 0) this.status = "empty";
      else {
        this.status = "cooldown";
        this.cooldownTimer = setTimeout(() => {
          this.status = "ready";
        }, this.shootCooldown);
      }
    } else if (this.status === "empty") {
      clearTimeout(this.cooldownTimer);
      this.reload();
    }
  }

  reload() {
    if (this.bullets >= this.capacity) return;
    this.status = "reloading";
    setTimeout(() => {
      this.status = "full";
      this.bullets = this.capacity;
    }, this.reloadTime);
  }
}
module.exports = Weapon;

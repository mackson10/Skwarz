class Ring {
  constructor(game) {
    this.game = game;
    this.cx = 0;
    this.cy = 0;
    this.radius = game.maxGridRadius;
    this.nextStage = undefined;
    this.status = "stopped";
    this.lastMovement = new Date().getTime();
    this.minimumRadius = 10;
    this.speed = 0.02;
  }

  setStatus(status) {
    this.status = status;
    switch (status) {
      case "moving":
        this.newStage();
        break;
    }
  }

  newStage() {
    const nextRadius = Math.trunc(this.radius / 2);
    const nextCx = this.cx - nextRadius + (this.game.seed % this.radius);
    const nextCy = this.cy - nextRadius + (this.game.seed ** 2 % this.radius);
    this.nextStage = {
      radius: nextRadius,
      cx: nextCx,
      cy: nextCy
    };
  }

  interaction() {
    if (this.status === "minimum size") {
      return;
    } else if (this.status === "moving") {
      this.move();
    } else if (new Date().getTime() - this.lastMovement >= 20000) {
      this.setStatus("moving");
    }
  }

  move() {
    this.moveCounter++;
    if (this.moveCounter <= 1 / this.speed && this.status === "moving") return;
    const nextStage = this.nextStage;
    const cxInc = Math.sign(nextStage.cx - this.cx);
    const cyInc = Math.sign(nextStage.cy - this.cy);
    const radiusInc = Math.sign(nextStage.radius - this.radius);

    if (cxInc === 0 && cyInc === 0 && radiusInc === 0) {
      this.setStatus("stopped");
    } else {
      this.lastMovement = new Date().getTime();
      this.cx += cxInc;
      this.cy += cyInc;
      this.radius += radiusInc;
      if (this.radius <= this.minimumRadius) {
        this.setStatus("minimum size");
      }
    }
    this.moveCounter = 0;
  }

  reached(gridX, gridY) {
    return Math.hypot(gridX - this.cx, gridY - this.cy) > this.radius;
  }
}

module.exports = Ring;

class Player {
  constructor(game, id, secret, socket) {
    this.game = game;
    this.id = id;
    this.secret = secret;
    this.socket = socket;
    this.name = "";
    this.color = "";
    this.kills = 0;
    this.life = 100;
    this.lastShot = 0;
    this.visible = true;
    this.position = {
      x: undefined,
      y: undefined,
      width: undefined,
      height: undefined
    };
  }

  static sendFormatArray(mapOfPlayers, conditionFunction = () => true) {
    const output = [];
    Array.from(mapOfPlayers).forEach(([_, player]) => {
      if (conditionFunction(player)) output.push(player.sendFormat());
    });
    return output;
  }

  sendFormat() {
    const { id, name, color, kills, life, position } = this;
    return {
      id,
      name,
      color,
      kills,
      life,
      position
    };
  }

  move(movement) {
    const newPosition = { ...this.position };
    newPosition[movement.axis] += movement.delta;
    const steppingOn = this.steppingOn(newPosition);

    if (!steppingOn.find(block => block.solid)) {
      this.position = newPosition;
      this.standingOn(steppingOn);
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

  standingOn(blocks) {
    let visible = true;
    blocks.forEach(block => {
      visible = visible && block.name !== "bush";
    });

    this.visible = visible;
  }

  shoot(direction) {
    const speed = 10;
    const width = 10;
    const height = 10;
    this.game.createProjectile(this, { direction, speed, width, height });
    this.lastShot = new Date().getTime();
  }
}

module.exports = Player;

class Room {
  static available(mapOfRooms) {
    const result = Array.from(mapOfRooms).find(([_, room]) => {
      return !room.isFull();
    });
    return result && result[1];
  }

  constructor(options) {
    this.status = "waiting";
    this.maxPlayers = options.maxPlayers;
    this.minPlayers = options.minPlayers;
    this.id = options.id;
    this.players = new Map();
  }
  setStatus(status) {
    this.status = status;
  }
  search(playerId) {
    return this.players.get(playerId);
  }
  set(playerId, player) {
    this.players.set(playerId, player);
  }
  join(player) {
    if (!this.isFull()) return this.players.set(player.id, player);
  }
  leave(player) {
    return this.players.delete(player.id);
  }
  isFull() {
    return this.players.size >= this.maxPlayers;
  }
  playersEnough() {
    return this.players.size >= this.minPlayers;
  }
  size() {
    return this.players.size;
  }
  array(conditionFunction = () => true) {
    const output = [];
    Array.from(this.players).forEach(([_, player]) => {
      if (conditionFunction(player)) output.push(player);
    });
    return output;
  }
}
module.exports = Room;

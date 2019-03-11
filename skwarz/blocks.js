const blocks = {
  dirt: {
    type: "block",
    name: "dirt",
    solid: false,
    color: "#e1c64b"
  },
  wall: {
    type: "block",
    name: "wall",
    solid: true,
    color: "#222",
    stroke: true
  },
  bush: {
    type: "block",
    hide: true,
    name: "bush",
    solid: false,
    color: "green",
    stroke: true
  },
  fire: {
    type: "block",
    name: "fire",
    solid: false,
    color: "#d15b31"
  },
  smoke: {
    hide: true,
    type: "block",
    name: "smoke",
    solid: false,
    color: "#68797a"
  }
};

if (typeof window === "undefined") {
  module.exports = blocks;
}

const blocks = {
  dirt: {
    type: "block",
    name: "dirt",
    solid: false,
    color: "#f7ba51"
  },
  wall: {
    type: "block",
    name: "wall",
    solid: true,
    color: "#110b1c",
    stroke: true
  },
  bush: {
    type: "block",
    hide: true,
    name: "bush",
    solid: false,
    color: "#4ca01e",
    stroke: true
  },
  fire: {
    type: "block",
    name: "fire",
    solid: false,
    color: "orangered"
  },
  smoke: {
    hide: true,
    type: "block",
    name: "smoke",
    solid: false,
    color: "grey"
  }
};

module.exports = blocks;

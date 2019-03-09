const shotgunImg = new Image();
shotgunImg.src = "https://image.flaticon.com/icons/svg/486/486872.svg";

const pistolImg = new Image();
pistolImg.src = "https://image.flaticon.com/icons/svg/31/31502.svg";

const smgImg = new Image();
smgImg.src = "https://image.flaticon.com/icons/svg/942/942595.svg";

const grenadeImg = new Image();
grenadeImg.src = "https://image.flaticon.com/icons/svg/2/2034.svg";

const smokeImg = new Image();
smokeImg.src = "https://image.flaticon.com/icons/svg/473/473518.svg";

const mapObjects = {
  weapons: {
    shotgun: {
      name: "shotgun",
      type: "object",
      image: shotgunImg,
      stroke: true
    },
    pistol: {
      name: "pistol",
      type: "object",
      image: pistolImg,
      stroke: true
    },
    smg: {
      name: "smg",
      type: "object",
      image: smgImg,
      stroke: true
    },
    grenade: {
      name: "grenade",
      type: "object",
      image: grenadeImg,
      stroke: true
    },
    smoke: {
      name: "smoke",
      type: "object",
      image: smokeImg,
      stroke: true
    }
  }
};

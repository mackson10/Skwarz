const shotgunImg = new Image();
shotgunImg.src = "assets/shotgun-svgrepo-com.svg";

const pistolImg = new Image();
pistolImg.src = "assets/gun-svgrepo-com.svg";

const smgImg = new Image();
smgImg.src = "assets/shotgun-gun-svgrepo-com.svg";

const grenadeImg = new Image();
grenadeImg.src = "assets/grenade-svgrepo-com.svg";

const smokeImg = new Image();
smokeImg.src = "assets/stun-grenade-svgrepo-com.svg";

const mapObjects = {
  weapons: {
    shotgun: {
      name: "shotgun",
      type: "weapon",
      image: shotgunImg,
      stroke: true
    },
    pistol: {
      name: "pistol",
      type: "weapon",
      image: pistolImg,
      stroke: true
    },
    smg: {
      name: "smg",
      type: "weapon",
      image: smgImg,
      stroke: true
    },
    grenade: {
      name: "grenade",
      type: "weapon",
      image: grenadeImg,
      stroke: true
    },
    smoke: {
      name: "smoke",
      type: "weapon",
      image: smokeImg,
      stroke: true
    }
  }
};

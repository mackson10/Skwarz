GameRoom = require("./GameRoom");

class TennisQueue {
  constructor(app, io, options, initGame) {
    this.gamePath = options.path || "/tennis";
    this.app = app;
    this.games = [];
    this.gameRooms = new Map(); // SALAS ESPERANDO PLAYERS?
    this.gameRoomsCount = 0;
    this.players = new Map(); // PLAYERS NA FILA
    this.tickets = {}; // IDENTIFICACAO UNICA
    this.ticketsCount = 0; // IDS GERADOS
    this.roomOptions = { maxPlayers: 2, minPlayers: 2 }; //OPCOES DA SALA tamanho,... (particularizavel)
    this.io = io;
    this.initGame = initGame;
    this.setRoutes();
    this.setIo();
  }

  setRoutes() {
    const { app, gamePath } = this;
    //app.get(gamePath, (req, res) => {});
    app.get(gamePath + "/queue", (req, res) => this.queueRequest(req, res));
  }

  queueRequest(req, res) {
    const ticket = {
      id: ++this.ticketsCount,
      secret: "tennisQueueSecret#" + Math.random() * 1000000000000000000,
      path: this.io.name
    };
    this.tickets[ticket.id] = ticket;
    res.send(ticket);
  }

  setIo() {
    this.io.on("connection", socket => {
      socket.on("confirm", ticket => {
        const confirmed = this.confirmQueue(ticket, socket);
        if (confirmed) {
          const room = confirmed.room;
          socket.emit("waiting on queue", {
            playersCount: room.size()
          });
          socket.join(room.id);
          socket.ticket = confirmed;
          this.checkRoom(room);
        } else {
          socket.emit("not confirmed");
        }

        socket.on("disconnect", reason => {
          if (socket.ticket) {
            this.leaveQueue(socket.ticket);
          }
        });
      });
    });
  }

  leaveQueue(player) {
    const playerRoom = player.room;
    if (playerRoom.status === "queue") playerRoom.leave(player);
    this.players.delete(player.id);
  }

  checkRoom(room) {
    if (room.playersEnough()) {
      room.setStatus("game");
      this.initGame(room);
    }
    this.io.to(room.id).emit("players", room.size());
  }

  confirmQueue(ticket, socket) {
    const theTicket = this.tickets[ticket.id];
    if (theTicket && theTicket.secret === ticket.secret) {
      let newRoom = GameRoom.available(this.gameRooms);
      if (!newRoom) {
        const newRoomId = ++this.gameRoomsCount;
        newRoom = new GameRoom({
          ...this.roomOptions,
          id: newRoomId
        });
        this.gameRooms.set(newRoomId, newRoom);
      }

      const newPlayer = { ...ticket, socket, room: newRoom };
      newRoom.join(newPlayer);
      this.players.set(newPlayer.id, newPlayer);
      return newPlayer;
    } else return false;
  }
}

module.exports = TennisQueue;

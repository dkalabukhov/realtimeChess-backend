import _ from 'lodash';
import Express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 8080;

const app = new Express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Express

app.use(Express.static(`${__dirname}/static/js/`));
app.use(Express.static(`${__dirname}/static/css`));
app.use(Express.static(`${__dirname}/static/img/chesspieces/wikipedia`));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/full', (req, res) => {
  res.sendFile(__dirname + '/full.html');
});

let players;

const games = Array(100);
for (let i = 0; i < 100; i++) {
  games[i] = { players: 0, pid: [0, 0] };
}

io.on('connection', function (socket) {
  // console.log(players);
  let color;
  const playerId = _.uniqueId();

  console.log(playerId + ' connected');

  socket.on('joined', (roomId) => {
    // games[roomId] = {}
    if (games[roomId].players < 2) {
      games[roomId].players++;
      games[roomId].pid[games[roomId].players - 1] = playerId;
    } else {
      socket.emit('full', roomId);
      return;
    }

    console.log(games[roomId]);
    players = games[roomId].players;

    if (players % 2 == 0) color = 'black';
    else color = 'white';

    socket.emit('player', { playerId, players, color, roomId });
    // players--;
  });

  socket.on('move', (msg) => {
    socket.broadcast.emit('move', msg);
    // console.log(msg);
  });

  socket.on('play',  (msg) => {
    socket.broadcast.emit('play', msg);
    console.log('ready ' + msg);
  });

  socket.on('disconnect', function () {
    for (let i = 0; i < 100; i++) {
      if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
        games[i].players--;
    }
    console.log(playerId + ' disconnected');
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

const game = new Chess();
const socket = io();

let color = "white";
let players;
let roomId;
let play = true;

const room = document.getElementById("room")
const roomNumber = document.getElementById("roomNumbers")
const button = document.getElementById("button")
const state = document.getElementById('state')

const connect = () => {
    roomId = room.value;
    if (roomId !== "" && parseInt(roomId) <= 100) {
        room.remove();
        roomNumber.innerHTML = "Room Number " + roomId;
        button.remove();
        socket.emit('joined', roomId);
    }
};

socket.on('full', function (msg) {
    if(roomId == msg)
        window.location.assign(window.location.href + 'full');
});

socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Game in progress"
    }
});

socket.on('move', function (msg) {
    if (msg.room == roomId) {
        game.move(msg.move);
        board.position(game.fen());
    }
});

const removeGreySquares = () => {
    $('#board .square-55d63').css('background', '');
};

const greySquare = (square) => {
    const squareEl = $('#board .square-' + square);

    let background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

const onDragStart = (source, piece) => {
    if (game.game_over() === true || play ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
            return false;
    }
};

const onDrop = (source, target) => {
    removeGreySquares();

    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    if (game.game_over()) {
        state.innerHTML = 'GAME OVER';
        socket.emit('gameOver', roomId)
    }

    if (move === null) return 'snapback';
    else
        socket.emit('move', { move: move, board: game.fen(), room: roomId });

};

const onMouseoverSquare = (square, piece) => {
    const moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

const onMouseoutSquare = (square, piece) => {
    removeGreySquares();
};

const onSnapEnd = () => {
    board.position(game.fen());
};


socket.on('player', (msg) => {
    const plno = document.getElementById('player')
    color = msg.color;

    plno.innerHTML = 'Player ' + msg.players + " : " + color;
    players = msg.players;

    if(players == 2){
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Game in Progress"
    }
    else
        state.innerHTML = "Waiting for Second player";


    const cfg = {
        orientation: color,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    board = ChessBoard('board', cfg);
});

var board;

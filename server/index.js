const express = require("express");
const app = express();
const http = require("http");
const { Server } = require('socket.io');
const cors = require("cors");

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://192.168.1.113:3001",
        methods: ["GET", "POST"],
    }
});
let whitePlayerSocket = null;
let gameRooms = {};
io.on("connection", (socket) => {
    // if (!whitePlayerSocket) {
    //     // Nếu chưa có người chơi white, gán socket hiện tại là người chơi white
    //     whitePlayerSocket = socket;
    //     socket.color = 'white';
    // } else {
    //     // Ngược lại, socket hiện tại là người chơi black
    //     socket.color = 'black';
    // }

    // // Gửi màu của người chơi tới client
    // socket.emit('assign-color', socket.color);

    // // Nghe các sự kiện khác từ client
    // // ...

    // Xử lý sự kiện khi người chơi ngắt kết nối
    // socket.on('disconnect', () => {
    //     console.log('A user disconnected');
    //     // Nếu người chơi disconnect là người chơi white, reset biến whitePlayerSocket
    //     if (socket === whitePlayerSocket) {
    //         whitePlayerSocket = null;
    //     }
    // });
    socket.on('createGame', (roomId) => {
        console.log("roomId", roomId)
        socket.join(roomId);
        gameRooms[roomId] = { playerA: socket.id, playerB: null };

        io.to(socket.id).emit('waitingOpponent');
        io.to(socket.id).emit('assign-color', { 'color': 'white' });
        console.log("gameRooms 1:", gameRooms)
    });
    socket.on('joinGame', (data) => {
        console.log("data join game : ", data)
        console.log("data join game room: ", typeof (data.roomId))
        if (gameRooms[data.roomId] && !gameRooms[data.roomId].playerB) {
            socket.join(data.roomId);
            gameRooms[data.roomId].playerB = socket.id;

            io.to(data.roomId).emit('gameStart',);

            // Truyền roomId cho cả hai người chơi
            io.to(data.roomId).emit('gameRoomId', { "roomId": data.roomId, "color": 'white' });
            io.to(gameRooms[data.roomId].playerB).emit('assign-color', 'black');
            console.log("gameRooms 2:", gameRooms)
        }
    });
    socket.on("new_game", (data) => {
        if (data.isReceiveNewGame) {
            io.to(gameRooms[data.roomId].playerB).emit("receive_new_game", data)
        } else {
            io.to(gameRooms[data.roomId].playerA).emit("receive_new_game", data)
        }
    })
    socket.on("answer_new_game", (data) => {
        console.log("data ng: ", data)
        if (data.isAccept) {
            console.log("new ng: ")
            io.to(data.roomId).emit("has_answer_new_game", data)
        } else {
            if (data.isReceiveAnswerNewGame) {
                io.to(gameRooms[data.roomId].playerB).emit("has_answer_new_game", data)
            } else {
                io.to(gameRooms[data.roomId].playerA).emit("has_answer_new_game", data)
            }
        }
    })
    socket.on("move", (data) => {
        console.log("data.romID:", data?.roomId)
        console.log("data.romID:", typeof (data?.roomId))
        io.to(gameRooms[data.roomId].playerA).emit("has_move", { ...data, 'onTurnAction': data.onTurnAction })
        io.to(gameRooms[data.roomId].playerB).emit("has_move", { ...data, 'onTurnAction': !data.onTurnAction })
        // if(data.onTurnAction){
        //     io.to(gameRooms[data.roomId].playerA).emit("has_move", {...data,'onTurnAction':data.onTurnAction})
        //     io.to(gameRooms[data.roomId].playerB).emit("has_move", {...data,'onTurnAction':!data.onTurnAction})
        // }else{
        //     io.to(gameRooms[data.roomId].playerA).emit("has_move", {...data,'onTurnAction':!data.onTurnAction})
        //     io.to(gameRooms[data.roomId].playerB).emit("has_move", {...data,'onTurnAction':!data.onTurnAction})
        // }
    })
    socket.on("move_promotion", (data) => {
        io.to(gameRooms[data.roomId].playerA).emit("has_move_promotion", { ...data, 'onTurnAction': data.onTurnAction })
        io.to(gameRooms[data.roomId].playerB).emit("has_move_promotion", { ...data, 'onTurnAction': !data.onTurnAction })
    })
    io.of("/").adapter.on("create-room", (room) => {
        console.log(`room ${room} was created`);
    });

    io.of("/").adapter.on("join-room", (room, id) => {
        console.log(`socket ${id} has joined room ${room}`);
    });
})

server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
});
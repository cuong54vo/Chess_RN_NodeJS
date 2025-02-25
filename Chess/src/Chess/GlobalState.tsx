import { io } from 'socket.io-client'
const socket = io.connect("http://192.168.1.113:3001");
const ROOTGlobal = {
    count: 0,
    isRender: false,
    socket: socket,
    color: '',
    roomId: '-1',
}

export { ROOTGlobal }
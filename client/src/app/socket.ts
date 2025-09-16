import { io, Socket } from "socket.io-client";

const socket: Socket = io(import.meta.env.SOCKET_IO_URI, {
    autoConnect: false,
});

export default socket;
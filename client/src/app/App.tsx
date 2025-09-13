
import "./App.css"

import {useLocation} from "react-router";

import {io} from "socket.io-client";
import {Socket} from "socket.io-client";
import {useNavigate} from "react-router";

let socket: Socket|null = null;

function App() {
    const location = useLocation();
    const {userId, token, errorMessage = null} = location.state || {};

    if (userId === undefined || token === undefined) {
        useNavigate()("/login");
        return (<p>redirecting to login page</p>)
    }

    socket = io(import.meta.env.SOCKET_IO_URI, {
        "auth": {
            "token": token
        }
    });
    console.log("aaa")

    socket.on("connect", () => {
        console.log(`サーバとの接続確認：`);
        console.log(socket?.connect());
    });

    socket.on("error", (error) => {
        console.log(error);
    });

    return (
        <div>
            <p>ようこそ {userId} さん！</p>
            {errorMessage && <p>{errorMessage}</p>}
        </div>

    );

}

export default App

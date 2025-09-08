
import "./App.css"

import {useLocation} from "react-router";

import React, {useEffect, useState} from "react";
import {io} from "socket.io-client";
import {Socket} from "socket.io-client";

let socket: Socket|null = null;

function App() {
    const location = useLocation();
    const {username} = location.state || {};

    return <div>ようこそ {username} さん</div>;

    socket = io("http://localhost:3000");

    socket.on("connect", () => {
        console.log(`サーバとの接続確認：`);
        console.log(socket.connect());
    });


}

export default App

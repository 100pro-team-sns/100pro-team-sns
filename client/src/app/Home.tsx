
import "./App.css"

import {useLocation} from "react-router";

import {useNavigate} from "react-router";
import socket from "./socket.ts";
import {useState} from "react";

function Home() {
    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState(location.state?.errorMessage ?? null);
    const navigate = useNavigate();
    const userId: string|null = localStorage.getItem("userId");
    const token: string|null  = localStorage.getItem("token");

    function onNewButtonClicked(): void {
        navigate("/app/new");
    }

    function onChatButtonClicked(): void {
        const roomId: string|null = localStorage.getItem("enabledRoomId");
        if (roomId === null) {
            setErrorMessage("既存の会話がありません。「新しい会話を始める」ボタンで同じ電車に乗っている人とつながってみましょう！")
            return;
        }
        navigate("/app/chat/" + roomId);
    }

    if (!socket || userId === null || token === null) {
        navigate("/login");
        return (<p>redirecting to login page</p>)
    }

    return (
        <div>
            <p>ようこそ {userId} さん！</p>
            {errorMessage && <p>{errorMessage}</p>}
            <button onClick={onNewButtonClicked}>新しい会話を始める</button>
            <button onClick={onChatButtonClicked}>既存の会話を続ける</button>
        </div>

    );

}

export default Home

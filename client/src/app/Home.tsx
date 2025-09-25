
import "./Home.css"
import "./NotificationContainer.css";

import {useLocation} from "react-router";

import {useNavigate} from "react-router";
import socket from "./socket.ts";
import {useEffect, useState} from "react";
import Notification from "./entity/Notification.tsx";
import {fetchEnabledRoomId} from "./api.ts";

type NotificationItem = {
    id: number;
    message: string;
    navigateTo: string|null;
};

function Home() {
    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState(location.state?.errorMessage ?? null);
    const navigate = useNavigate();
    const userIdString: string|null = localStorage.getItem("userId");
    const userId: number|null = userIdString !== null ? Number(userIdString) : null;
    const token: string|null  = localStorage.getItem("token");
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const addNotification = (message: string, navigateTo: string|null) => {
        const id = Date.now(); // 一意なID
        setNotifications((prev) => [...prev, {id, message, navigateTo}]);
    };

    const removeNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    useEffect(() => {
        const onMatchCreated = function (args: {
            roomId: number,
            user1: {id: number},
            user2: {id: number}
            expiredAt: Date
        }) {
            if (args.user1.id !== userId && args.user2.id !== userId) {
                //todo: 当該ユーザー以外にはemitしない
                return;
            }
            addNotification("マッチングに成功しました！タップしてチャットを始めましょう", "/app/chat/" + args.roomId);
        };

        const onSocketDisconnected = () => {
            addNotification("サーバーとの通信が失われました。3秒後に再試行し、それでも不通の場合はログアウトします", null);
            setTimeout(() => {
                socket.connect();
            }, 3000);
        }

        const onSocketCollapsed = function() {
            addNotification("ログアウトしました", "/login");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        };

        (async () => {
            const enabledRoomId = await fetchEnabledRoomId(token);
            if (enabledRoomId !== null) {
                localStorage.setItem("enabledRoomId", String(enabledRoomId));
            } else {
                localStorage.removeItem("enabledRoomId")
            }
        })();

        socket.on("match_created", onMatchCreated);
        socket.on("disconnect", onSocketDisconnected);
        socket.on("connect_error", onSocketCollapsed);
        socket.on("connect_timeout", onSocketCollapsed);

        return () => {
            socket.off("match_created", onMatchCreated);
            socket.off("disconnect", onSocketDisconnected);
            socket.off("connect_error", onSocketCollapsed);
            socket.off("connect_timeout", onSocketCollapsed);
        };
    }, []);


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

    function onChatsButtonClicked(): void {
        navigate("/app/chats");
    }

    if (!socket || userId === null || token === null) {
        navigate("/login");
        return (<p>redirecting to login page</p>)
    }

    return (
        <div>
            <div className="notification-container">
                {notifications.map((n) => (
                    <Notification
                        key={n.id}
                        id={n.id}
                        message={n.message}
                        onClose={removeNotification}
                        navigateTo={n.navigateTo}
                    />
                ))}
            </div>
            <p>ようこそ {userIdString} さん！</p>
            {errorMessage && <p>{errorMessage}</p>}
            <div className="button-container">
                <button onClick={onNewButtonClicked}>新しい会話を始める</button>
                <button onClick={onChatButtonClicked}>既存の会話を続ける</button>
                <button onClick={onChatsButtonClicked}>過去のチャットを見る</button>
            </div>
        </div>
    );

}

export default Home

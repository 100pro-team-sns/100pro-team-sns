import socket from "./socket";
import {Link, useNavigate} from "react-router";

import "./Chats.css";
import Notification from "./entity/Notification.tsx";

type NotificationItem = {
    id: number;
    message: string;
    navigateTo: string|null;
};

export type Room = {
    roomId: number;
    otherUserId: number;
    isExpired: boolean;
    lastMessage: null|{
        context: string,
        createdAt: string
    };
};

function Chats() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const userIdString: string|null = localStorage.getItem("userId");
    const userId: number|null = userIdString !== null ? Number(userIdString) : null;
    const navigate = useNavigate();

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
            user1: {id: number, email: string},
            user2: {id: number, email: string}
            expiredAt: Date
        }) {
            if (args.user1.id !== userId && args.user2.id !== userId) {
                //todo: 当該ユーザー以外にはemitしない
                return;
            }
            addNotification("マッチングに成功しました！タップして新しいチャットを始めましょう", "/app/chat/" + args.roomId);
        };

        (async () => {
            const token: string | null = localStorage.getItem("token");
            if (token === null || userId === null) {
                navigate("/login");
                return () => {};
            }

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(import.meta.env.VITE_SOCKET_IO_URI + "/api/chats", {
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json",
                    },
                });

                if (res.status === 401 || res.status === 403) {
                    navigate("/login");
                    return () => {};
                }

                if (!res.ok) {
                    console.error("チャット一覧取得失敗");
                    return;
                }

                const data: Room[] = await res.json();
                setRooms(data);
            } catch (err) {
                console.error("エラー:", err);
            }

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
            }

            if (!socket.connected) {
                onSocketDisconnected();
            }

            socket.on("disconnect", onSocketDisconnected);
            socket.on("connect_error", onSocketCollapsed);
            socket.on("connect_timeout", onSocketCollapsed);
            socket.on("match_created", onMatchCreated);
            socket.on("error", (error: any) => {
                console.error(error);
            });

            return () => {
                socket.emit("leave_room");

                socket.off("disconnect", onSocketDisconnected);
                socket.off("connect_error", onSocketCollapsed);
                socket.off("connect_timeout", onSocketCollapsed);
                socket.off("match_created", onMatchCreated);
                socket.off("error");
            };
        })()}, []);

    if (userId === null) {
        navigate("/login");
        return (<p>redirecting to login page</p>)
    }

    return (
        <>
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
            <div className="return-button">
                <Link to="/app/home">
                    <p>戻る</p>
                </Link>
            </div>
            <div className="chats-container">
                <h2 className="chats-title">チャット一覧</h2>
                <ul className="chats-list">
                    {rooms.map((room) => (
                        <li
                            key={room.roomId}
                            className="chat-item"
                            onClick={() => navigate(`/app/chat/${room.roomId}`)}
                        >
                            <div className="chat-name">{room.roomId}</div>
                            <div className="chat-last-message">{room.lastMessage?.context ?? ""}</div>
                            <div className="chat-time">
                                {room.lastMessage === null ? "メッセージなし" : new Date(room.lastMessage.createdAt).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

export default Chats

import {useState, useEffect} from "react";
import socket from "./socket";
import {useParams} from "react-router";
import {useNavigate} from "react-router";

import "./Chat.css";
import Notification from "./entity/Notification.tsx";

type NotificationItem = {
    id: number;
    message: string;
    navigateTo: string|null;
};

function Chat() {
    const [messages, setMessages] = useState<{text: string; from: "me"|"other"|"system"|"error"}[]>([]);
    const [input, setInput] = useState<string>("");
    const userIdString: string|null = localStorage.getItem("userId");
    const userId: number|null = userIdString !== null ? Number(userIdString) : null;
    const roomIdString: string|undefined = useParams<{roomId: string}>().roomId;
    const roomId: number = Number(roomIdString);
    const navigate = useNavigate();
    const addMessage = function (text: string, from: "me"|"other"|"system"|"error") {
        const previousMessages = [...messages];
        console.log(previousMessages)
        setMessages([...previousMessages, {text, from}]);
    }

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

        const onUserJoined = function (args: {
            userId: number,
            //todo: userEmailの送信が匿名性を失う可能性がある
            userEmail: string,
            message: string
        }) {
            addMessage("相手方がオンラインになりました: " + args.message, "system");
        };

        const onUserLeft = function (args: {
            userId: number,
            //todo: userEmailの送信が匿名性を失う可能性がある
            userEmail: string,
            message: string
        }) {
            addMessage("相手方がオフラインになりました: " + args.message, "system");
        };

        (async () => {
            const token: string | null = localStorage.getItem("token");
            const userId: number | null = Number(localStorage.getItem("userId"));
            if (token === null || userId === null) {
                navigate("/login");
                return () => {};
            }
            try {
                const chatHistoryResponse = await fetch(import.meta.env.VITE_SOCKET_IO_URI + "/api/rooms/" + roomId + "/chats", {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json",
                    },
                });
                if (chatHistoryResponse.status === 401 || chatHistoryResponse.status === 403) {
                    navigate("/login");
                    return () => {};
                }
                if (chatHistoryResponse.status === 404) {
                    navigate("/app/home", {
                        state: {
                            errorMessage: "この部屋を閲覧する権限がありません"
                        }
                    });
                    return () => {};
                }
                const chats: {
                    id: number,
                    room_id: number,
                    user_id: number,
                    created_at: string,
                    context: string,
                    link: string|null
                }[] = (await chatHistoryResponse.json()).chats;
                setMessages(chats.map((chat) => ({
                    text: chat.context,
                    from: chat.user_id === userId ? "me" : "other"
                })));
            } catch (err) {
                navigate("/app/home", {
                    state: {
                        errorMessage: "サーバーサイドと通信できませんでした"
                    }
                });
                return () => {};
            }

            const onMessagePosted = function (args: {
                id: number,
                roomId: number,
                userId: number,
                message: string,
                link: string | null,
                createdAt: string,
                user: any
            }) {
                addMessage(args.message, args.userId === userId ? "me" : "other");
            }

            const onMatchStopped = function (args: {
                roomId: number,
                stoppedBy: number,
                message: string
            }) {
                navigate("/app/home", {
                    state: {
                        errorMessage: "相手方によりマッチングが中止されました"
                    }
                });
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

            socket.emit("join_room", roomId);

            socket.on("disconnect", onSocketDisconnected);
            socket.on("connect_error", onSocketCollapsed);
            socket.on("connect_timeout", onSocketCollapsed);
            socket.on("new_message", onMessagePosted);
            socket.on("match_stopped ", onMatchStopped);
            socket.on("match_created", onMatchCreated);
            socket.on("user_joined", onUserJoined);
            socket.on("user_left", onUserLeft);
            socket.on("error", (error: any) => {
                console.error(error);
            });

            return () => {
                socket.emit("leave_room");

                socket.off("disconnect", onSocketDisconnected);
                socket.off("connect_error", onSocketCollapsed);
                socket.off("connect_timeout", onSocketCollapsed);
                socket.off("new_message", onMessagePosted);
                socket.off("match_stopped", onMatchStopped);
                socket.off("match_created", onMatchCreated);
                socket.off("user_joined", onUserJoined);
                socket.off("user_left", onUserLeft);
                socket.off("error");
            };
        })()}, [roomIdString]);

    if (userId === null) {
        navigate("/login");
        return (<p>redirecting to login page</p>)
    }

    const sendMessage = () => {
        if (!input.trim()) return;
        setMessages((prev) => [...prev, { text: input, from: "me" }]);
        setInput("");
        socket.emit("send_message", {roomId: roomId, message: input, link: null});
    };

    const inputEnabled = localStorage.getItem("enabledRoomId") === roomIdString;

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
            <div className="chat-container">
                {/* チャット表示部分 */}
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.from}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>

                {/* 入力欄 */}
                <div className="chat-input">
                    <input
                        type="text"
                        value={input}
                        disabled={!inputEnabled}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={inputEnabled ? "メッセージを入力..." : "このチャットではメッセージの送信ができません"}
                    />
                    <button onClick={sendMessage}>送信</button>
                </div>
            </div>
        </>
    );
}

export default Chat

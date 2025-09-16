import {useState, useEffect} from "react";
import socket from "./socket";
import {useParams} from "react-router";
import {useNavigate} from "react-router";

import "./Chat.css";

function Chat() {
    const [messages, setMessages] = useState<{text: string; from: "me"|"other"|"system"}[]>([]);
    const [input, setInput] = useState<string>("");
    const roomId: number = Number(useParams<{roomId: string}>().roomId);
    const navigate = useNavigate();
    const addMessage = function (text: string, from: "me"|"other"|"system") {
        const previousMessages = [...messages];
        setMessages([...previousMessages, {text, from}]);
    }

    useEffect(() => {
        (async () => {
            const token: string | null = localStorage.getItem("token");
            const userId: number | null = Number(localStorage.getItem("userId"));
            if (token === null || userId === null) {
                navigate("/login");
                return () => {};
            }
            try {
                const chatHistoryResponse = await fetch(import.meta.env.SOCKET_IO_URI + "/api/rooms/" + roomId + "/chats", {
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


            const handleMessage = function (args: {
                id: number,
                roomId: number,
                userId: number,
                message: string,
                link: string | null,
                createdAt: string,
                user: any
            }) {
                addMessage(args.message, "other");
                console.log(args.user);
            }

            socket.on("new_message", handleMessage);

            return () => {
                socket.off("new_message", handleMessage);
            };
        })()}, []);

    const sendMessage = () => {
        if (!input.trim()) return;
        setMessages((prev) => [...prev, { text: input, from: "me" }]);
        setInput("");
        socket.emit("send_message", {roomId: roomId, message: input, link: null});
    };

    return (
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
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="メッセージを入力..."
                />
                <button onClick={sendMessage}>送信</button>
            </div>
        </div>
    );
}

export default Chat


import "./Home.css"

import socket from "./socket.ts";

import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import Notification from "./entity/Notification.tsx";
import {fetchEnabledRoomId} from "./api.ts";

type NotificationItem = {
    id: number;
    message: string;
    navigateTo: string|null;
};

function New() {
    const [stateMessage, setStateMessage] = useState<string>("位置情報を取得中...");
    const [tipMessage, setTipMessage] = useState<string>("");
    const [retryCount, setRetryCount] = useState<number>(0);
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
            user1: {id: number, email: string},
            user2: {id: number, email: string}
            expiredAt: Date
        }) {
            if (args.user1.id !== userId && args.user2.id !== userId) {
                return;
            }
            setStateMessage("マッチングしました！");
            setTipMessage("まもなくチャットへと移動します...");
            localStorage.setItem("enabledRoomId", String(args.roomId));
            setTimeout(() => {
                navigate("/app/chat/" + args.roomId)
            }, 3000);
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
                const enabledRoomIdString = String(enabledRoomId);
                localStorage.setItem("enabledRoomId", String(enabledRoomIdString));
                navigate("/app/chat/" + enabledRoomIdString);
                return;
            } else {
                localStorage.removeItem("enabledRoomId")
            }
        })();

        if (!socket.connected) {
            onSocketDisconnected();
        }

        if (retryCount > 3) {
            navigate("/app/home", {state: {
                userId: userId,
                token: token,
                errorMessage: "位置情報の取得に複数回失敗しました\n - 電波のよい位置に電車が移動してから再度お試しください\n - 位置情報の利用を許可しているか確認してください"
            }});
            return;
        }

        const usingTestData = import.meta.env.VITE_IS_DEVELOPMENT == "true";

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const locRes = await fetch(import.meta.env.VITE_POSITION_SEND_TO_URI + "/api/set-location", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            token: token,
                            /* テストデータでは御堂筋線中津-梅田間のデータを使用 */
                            latitude: usingTestData ? 34.707973 : pos.coords.latitude,
                            longitude: usingTestData ? 135.496555 : pos.coords.longitude,
                        }),
                    });

                    const locData = await locRes.json();
                    if (locData.line === null) {
                        setTipMessage("電車への乗車が確認できませんでしたので、10秒後に再試行します");
                        setTimeout(() => {
                            setRetryCount(retryCount + 1);
                        }, 10000);
                        return;
                    }
                    setStateMessage(locData.description);
                    setTipMessage("マッチング先を検索中です 時間を要する場合があります");
                } catch (err) {
                    setTipMessage("エラーが発生したため、再試行中です: " + (err as Error).message);
                    setRetryCount(retryCount + 1);
                }
            },
            (err) => {
                setStateMessage("位置情報の取得に失敗したため、再試行中です: " + err.message);
                setRetryCount(retryCount + 1);
            }
        );
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
    }, [retryCount]);

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
            <h2>{stateMessage}</h2>
            <p>{tipMessage}</p>
        </div>
    );
}

export default New

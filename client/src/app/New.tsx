
import "./Home.css"

import {useLocation} from "react-router";
import socket from "./socket.ts";

import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import NotificationContainer from "./NotificationContainer.tsx";

function New() {
    const [stateMessage, setStateMessage] = useState<string>("位置情報を取得中...");
    const [tipMessage, setTipMessage] = useState<string>("");
    const [retryCount, setRetryCount] = useState<number>(0);
    const navigate = useNavigate();
    const userIdString: string|null = localStorage.getItem("userId");
    const userId: number|null = userIdString !== null ? Number(userIdString) : null;
    const token: string|null  = localStorage.getItem("token");

    //todo: 既存のチャットがある場合はマッチングを作成しない
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
            setStateMessage("マッチングしました！");
            setTipMessage("まもなくチャットへと移動します...");
            localStorage.setItem("enabledRoomId", String(args.roomId));
            setTimeout(() => {
                navigate("/app/chat/" + args.roomId)
            }, 3000);
        };

        if (retryCount > 3) {
            navigate("/app/home", {state: {
                userId: userId,
                token: token,
                errorMessage: "位置情報の取得に複数回失敗しました\n - 電波のよい位置に電車が移動してから再度お試しください\n - 位置情報の利用を許可しているか確認してください"
            }});
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const locRes = await fetch(import.meta.env.VITE_POSITION_SEND_TO_URI + "/api/set-location", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                        }),
                    });

                    const data = await locRes.json();
                    if (data.line === null) {
                        setTipMessage("電車への乗車が確認できませんでしたので、再試行中です");
                        setRetryCount(retryCount + 1);
                        return;
                    }
                    const queueRes = await fetch(import.meta.env.VITE_SOCKET_IO_URI + "/api/queue/add", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                        }),
                    });
                    //todo queueのレスポンスに対するエラー表示
                    setStateMessage("マッチング先を検索中です");
                    setTipMessage("時間を要する場合があります");
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

        return () => {
            socket.off("match_created", onMatchCreated);
        };
    }, [retryCount]);

    return (
        <div>
            <NotificationContainer></NotificationContainer>
            <h2>{stateMessage}</h2>
            <p>{tipMessage}</p>
        </div>
    );
}

export default New

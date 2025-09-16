
import "./Home.css"

import {useLocation} from "react-router";

import {useEffect, useState} from "react";
import {useNavigate} from "react-router";

function New() {
    const [stateMessage, setStateMessage] = useState<string>("位置情報を取得中...");
    const [tipMessage, setTipMessage] = useState<string>("");
    const [retryCount, setRetryCount] = useState<number>(0);
    const location = useLocation();
    const {userId, token} = location.state || {};
    const navigate = useNavigate();

    //todo: 既存のチャットがある場合はマッチングを作成しない
    useEffect(() => {
        if (retryCount > 5) {
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
                    const locRes = await fetch(import.meta.env.POSITION_SEND_TO_URI + "/api/set-location", {
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
                    const queueRes = await fetch(import.meta.env.SOCKET_IO_URI + "/api/queue/add", {
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
    }, [retryCount]);

    return (
        <div>
            <h2>{stateMessage}</h2>
            <p>{tipMessage}</p>
        </div>
    );
}

export default New


import "./App.css"

import {useLocation} from "react-router";

import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router";

function New() {
    const [stateMessage, setStateMessage] = useState<string>("位置情報を取得中...");
    const [tipMessage, tipMessage] = useState<string>("");
    const [retryCount, setRetryCount] = useState<number>(0);
    const location = useLocation();
    const {userId, token} = location.state || {};

    useEffect(() => {
        if (retryCount > 5) {
            useNavigate()("/app/app", {state: {
                userId: userId,
                token: token,
                errorMessage: "位置情報の取得に複数回失敗しました"
            }});
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const res = await fetch("http://example.com/api/set-location", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                        }),
                    });

                    const data = await res.json();
                    setStateMessage(data);
                } catch (err) {
                    setStateMessage("エラーが発生しました: " + (err as Error).message);
                    setRetryCount(retryCount + 1);
                }
            },
            (err) => {
                setStateMessage("位置情報の取得に失敗しました: " + err.message);
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

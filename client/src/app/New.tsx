
import "./App.css"

import {useEffect, useState} from "react";

function New() {
    const [response, setResponse] = useState<string>("位置情報を取得中…");
    const [retryCount, setRetryCount] = useState<number>(0);

    useEffect(() => {
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
                    setResponse(data);
                } catch (err) {
                    setResponse("エラーが発生しました: " + (err as Error).message);
                }
            },
            (err) => {
                setResponse("位置情報の取得に失敗しました: " + err.message);
            }
        );
    }, []);

    return (
        <div>
            <h2>/app/new ページ</h2>
            <p>{response}</p>
        </div>
    );
}

export default New

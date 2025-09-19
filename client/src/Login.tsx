import React, {useState} from "react";
import {useNavigate} from "react-router";
import socket from "./app/socket.ts";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch(import.meta.env.VITE_SOCKET_IO_URI + "/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email, password}),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
                return;
            }

            const token = data.token;
            const userId = data.user.id;

            localStorage.setItem("token", token);
            localStorage.setItem("userId", userId);

            if (socket)  {
                socket.removeAllListeners();
                socket.disconnect();
            }

            socket.auth = {token}
            socket.connect()

            const handleConnect = () => {
                console.log("サーバとの接続確認：", socket?.id);
            };
            const handleError = (error: any) => {
                console.error(error);
            };

            socket.on("connect", handleConnect);
            socket.on("error", handleError);

            navigate("/app/home");
        } catch (err: unknown) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
            />
            <button type="submit">ログイン</button>

            {error && <p style={{color: "red"}}>{error}</p>}
        </form>
    );
}

export default Login

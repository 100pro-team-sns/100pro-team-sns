import { useNavigate } from "react-router";
import { useState } from "react";
import * as React from "react";
import './App.css'

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate("/app", { state: { username, password } });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
            />
            <button type="submit">ログイン</button>
        </form>
    );
}

export default Login

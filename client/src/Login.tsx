import React, {useState} from "react";
import {useNavigate} from "react-router";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch("http://localhost/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({username, password}),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data);
            }

            const token = data.token;

            localStorage.setItem("token", token);

            navigate("/app");
        } catch (err: unknown) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
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

            {error && <p style={{color: "red"}}>{error}</p>}
        </form>
    );
}

export default Login

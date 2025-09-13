import React, {useState} from "react";
import {useNavigate} from "react-router";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch("http://localhost:3000/api/login", {
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

            navigate("/app/app", {state: {userId, token}});
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

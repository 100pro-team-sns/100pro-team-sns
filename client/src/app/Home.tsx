
import "./App.css"

import {useLocation} from "react-router";

import {useNavigate} from "react-router";
import socket from "./socket.ts";

function Home() {
    const location = useLocation();
    const {errorMessage = null} = location.state || {};
    const navigate = useNavigate();
    const userId: string|null = localStorage.getItem("userId");
    const token: string|null  = localStorage.getItem("token");

    if (!socket || userId === null || token === null) {
        navigate("/login");
        return (<p>redirecting to login page</p>)
    }

    return (
        <div>
            <p>ようこそ {userId} さん！</p>
            {errorMessage && <p>{errorMessage}</p>}

        </div>

    );

}

export default Home

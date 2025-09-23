import {createBrowserRouter, RouterProvider} from "react-router";
import Introduction from "./Introduction.tsx";
import Login from "./Login.tsx";
import Home from "./app/Home.tsx";
import New from "./app/New.tsx";
import Chat from "./app/Chat.tsx";
import Register from "./Register.tsx";
import Chats from "./app/Chats.tsx";

const router = createBrowserRouter([
    { path: "/", Component: Introduction },
    { path: "/login", Component: Login },
    { path: "/register", Component: Register },
    { path: "/app/home", Component: Home },
    { path: "/app/new", Component: New },
    { path: "/app/chat/:roomId", Component: Chat },
    { path: "/app/chats", Component: Chats },
]);

function App() {
    return (
        <div>
            <RouterProvider router={router} />
        </div>
    );
}

export default App;

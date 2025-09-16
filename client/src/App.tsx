import {Routes, Route} from "react-router";
import {useState} from "react";
import {createBrowserRouter, RouterProvider} from "react-router";
import Introduction from "./Introduction.tsx";
import Login from "./Login.tsx";
import Home from "./app/Home.tsx";
import New from "./app/New.tsx";
import Chat from "./app/Chat.tsx";

const router = createBrowserRouter([
    { path: "/", Component: Introduction },
    { path: "/login", Component: Login },
    { path: "/app/home", Component: Home },
    { path: "/app/new", Component: New },
    { path: "/app/chat/:chatId", Component: Chat },
]);

function App() {
    return (
        <div>
            <RouterProvider router={router} />
        </div>
    );
}

export default App;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Introduction from "./Introduction.tsx";
import Login from "./Login.tsx";
import App from "./app/App.tsx";
import New from "./app/New.tsx";

const router = createBrowserRouter([
    { path: "/", Component: Introduction },
    { path: "/login", Component: Login },
    { path: "/app/app", Component: App },
    { path: "/app/new", Component: New },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
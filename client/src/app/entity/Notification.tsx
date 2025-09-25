import { useEffect } from "react";
import "./Notification.css";

import {useNavigate} from "react-router";

type NotificationProps = {
    id: number;
    message: string;
    onClose: (id: number) => void;
    duration?: number; // 表示時間（ms）
    navigateTo: string|null;
};

function Notification({id, message, onClose, duration = 3000, navigateTo = null}: NotificationProps) {
    const navigate = useNavigate();

    const navigateClicker = (navigateTo: string|null) => {
        if (navigateTo === null) {
            return;
        }
        navigate(navigateTo);
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
        <div className="notification" onClick={() => navigateClicker(navigateTo)}>
            <p>{message}</p>
        </div>
    );
}

export default Notification;

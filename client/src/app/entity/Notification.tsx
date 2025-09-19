import { useEffect } from "react";
import "./Notification.css";

type NotificationProps = {
    id: number;
    message: string;
    onClose: (id: number) => void;
    duration?: number; // 表示時間（ms）
};

function Notification({ id, message, onClose, duration = 3000 }: NotificationProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
        <div className="notification">
            <p>{message}</p>
        </div>
    );
}

export default Notification;

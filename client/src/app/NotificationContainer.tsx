import { useState } from "react";
import Notification from "./entity/Notification";
import "./NotificationContainer.css";

type NotificationItem = {
    id: number;
    message: string;
};

function NotificationContainer() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const addNotification = (message: string) => {
        const id = Date.now(); // 一意なID
        setNotifications((prev) => [...prev, { id, message }]);
    };

    const removeNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <>
            <button onClick={() => addNotification("新しい通知です！")}>
                通知を追加
            </button>

            <div className="notification-container">
                {notifications.map((n) => (
                    <Notification
                        key={n.id}
                        id={n.id}
                        message={n.message}
                        onClose={removeNotification}
                    />
                ))}
            </div>
        </>
    );
}

export default NotificationContainer;

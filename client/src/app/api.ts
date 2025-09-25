import type {Room} from "./Chats.tsx";

export function getEnabledRoomId(rooms: Room[]):null|number {
    for (const room of rooms) {
        if (!room.isExpired) {
            return room.roomId;
        }
    }
    return null;
}

/**
 * @return Promise<number|null> 有効な部屋番号。有効な部屋がない場合にnull
 */
export async function fetchEnabledRoomId(token: string|null): Promise<number|null> {
    if (token === null) {
        token = localStorage.getItem("token");
        if (token === null) {
            throw new Error("invalid token was not saved in local storage");
        }
    }

    const res = await fetch(import.meta.env.VITE_SOCKET_IO_URI + "/api/chats", {
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
        },
    });

    if (res.status === 401 || res.status === 403) {
        throw new Error("invalid token passed");
    }

    if (!res.ok) {
        throw new Error("failed fetching chats");
    }
    return getEnabledRoomId(await res.json());
}
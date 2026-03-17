/**
 * useStudyRooms — Real-time Study Room engine
 *
 * How "real-time" works without a backend:
 *   • Rooms are stored in localStorage ('ytlearn_rooms')
 *   • BroadcastChannel ('ytlearn_rooms') broadcasts events to ALL open tabs
 *   • Each tab listens and updates its local React state immediately
 *   • Result: create/join/leave/close rooms is instant across every tab
 *
 * Shape of a room object:
 * {
 *   id: string,           // "room_<timestamp>"
 *   name: string,
 *   subject: string,
 *   maxMembers: number,
 *   members: Member[],    // [{ id, name, isHost, joinedAt }]
 *   status: 'waiting'|'live',
 *   host: string,         // host display name
 *   hostId: string,       // host member id
 *   createdAt: number,    // Date.now()
 *   videoId: string|null, // currently playing video
 *   inviteCode: string,   // 6-char code
 *   messages: Msg[],      // [{ id, author, text, ts }]
 * }
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const LS_KEY = 'ytlearn_rooms';
const CHAN_NAME = 'ytlearn_rooms';

// ── Persistence helpers ───────────────────────────────────────────────────────
function loadRooms() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch { return []; }
}

function saveRooms(rooms) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(rooms)); } catch { /* quota */ }
}

// Generate a random 6-char invite code
function makeCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate a unique member id for this browser session
let _myId = sessionStorage.getItem('ytlearn_uid');
if (!_myId) {
    _myId = 'u_' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('ytlearn_uid', _myId);
}

export const MY_ID = _myId;

// ── Main hook ────────────────────────────────────────────────────────────────
export function useStudyRooms(userName = 'You') {
    const [rooms, setRooms] = useState(loadRooms);
    const [joinedId, setJoinedId] = useState(null);
    const channelRef = useRef(null);

    // Broadcast an event to all tabs
    function broadcast(type, payload) {
        try { channelRef.current?.postMessage({ type, payload }); } catch { /* ignore */ }
    }

    // Re-read rooms from localStorage and update state
    function syncFromStorage() {
        setRooms(loadRooms());
    }

    // ── BroadcastChannel listener ────────────────────────────────────────────
    useEffect(() => {
        // BroadcastChannel is supported in all modern browsers
        const chan = new BroadcastChannel(CHAN_NAME);
        channelRef.current = chan;

        chan.onmessage = () => {
            // Any event → re-read localStorage (the sender already wrote the new state)
            syncFromStorage();
        };

        // Also listen to localStorage changes from other tabs (fallback)
        const onStorage = (e) => {
            if (e.key === LS_KEY) syncFromStorage();
        };
        window.addEventListener('storage', onStorage);

        // Cleanup on unmount
        return () => {
            chan.close();
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    // ── Mutators ────────────────────────────────────────────────────────────

    /** Create a new room and join it as host */
    const createRoom = useCallback(({ name, subject, maxMembers = 8, videoId = null }) => {
        const roomId = 'room_' + Date.now();
        const hostMember = { id: MY_ID, name: userName, isHost: true, joinedAt: Date.now() };
        const newRoom = {
            id: roomId,
            name: name.trim(),
            subject,
            maxMembers,
            members: [hostMember],
            status: 'waiting',
            host: userName,
            hostId: MY_ID,
            createdAt: Date.now(),
            videoId,
            inviteCode: makeCode(),
            messages: [
                { id: 'm0', author: 'System', text: `Room "${name}" created. Share the invite code to invite friends!`, ts: Date.now() },
            ],
        };

        const updated = [newRoom, ...loadRooms()];
        saveRooms(updated);
        setRooms(updated);
        broadcast('room_created', { roomId });
        setJoinedId(roomId);
        return roomId;
    }, [userName]);

    /** Join an existing room */
    const joinRoom = useCallback((roomId) => {
        const current = loadRooms();
        const idx = current.findIndex(r => r.id === roomId);
        if (idx === -1) return false;

        const room = current[idx];
        if (room.members.length >= room.maxMembers) return false;
        if (room.members.some(m => m.id === MY_ID)) {
            // Already in room — just set joined
            setJoinedId(roomId);
            return true;
        }

        const updated = [...current];
        updated[idx] = {
            ...room,
            members: [...room.members, { id: MY_ID, name: userName, isHost: false, joinedAt: Date.now() }],
            status: room.members.length >= 1 ? 'live' : 'waiting',
            messages: [...room.messages, { id: 'm_' + Date.now(), author: 'System', text: `${userName} joined the room.`, ts: Date.now() }],
        };
        saveRooms(updated);
        setRooms(updated);
        broadcast('room_joined', { roomId });
        setJoinedId(roomId);
        return true;
    }, [userName]);

    /** Leave the current room */
    const leaveRoom = useCallback((roomId) => {
        const current = loadRooms();
        const idx = current.findIndex(r => r.id === roomId);
        if (idx === -1) { setJoinedId(null); return; }

        const room = current[idx];
        const newMembers = room.members.filter(m => m.id !== MY_ID);

        let updated;
        if (newMembers.length === 0 || room.hostId === MY_ID) {
            // Host left → close room
            updated = current.filter(r => r.id !== roomId);
        } else {
            updated = [...current];
            updated[idx] = {
                ...room,
                members: newMembers,
                messages: [...room.messages, { id: 'm_' + Date.now(), author: 'System', text: `${userName} left the room.`, ts: Date.now() }],
            };
        }
        saveRooms(updated);
        setRooms(updated);
        broadcast('room_left', { roomId });
        setJoinedId(null);
    }, [userName]);

    /** Host closes the room entirely */
    const closeRoom = useCallback((roomId) => {
        const updated = loadRooms().filter(r => r.id !== roomId);
        saveRooms(updated);
        setRooms(updated);
        broadcast('room_closed', { roomId });
        setJoinedId(null);
    }, []);

    /** Send a chat message in a room */
    const sendMessage = useCallback((roomId, text) => {
        if (!text.trim()) return;
        const current = loadRooms();
        const idx = current.findIndex(r => r.id === roomId);
        if (idx === -1) return;

        const msg = { id: 'm_' + Date.now(), author: userName, text: text.trim(), ts: Date.now() };
        const updated = [...current];
        updated[idx] = { ...current[idx], messages: [...current[idx].messages, msg] };
        saveRooms(updated);
        setRooms(updated);
        broadcast('message_sent', { roomId });
    }, [userName]);

    /** Join by invite code */
    const joinByCode = useCallback((code) => {
        const room = loadRooms().find(r => r.inviteCode === code.toUpperCase().trim());
        if (!room) return null;
        joinRoom(room.id);
        return room.id;
    }, [joinRoom]);

    // Derive the room the user is currently in
    const activeRoom = joinedId ? rooms.find(r => r.id === joinedId) ?? null : null;
    const amHost = activeRoom?.hostId === MY_ID;

    return {
        rooms,
        activeRoom,
        joinedId,
        amHost,
        MY_ID,
        createRoom,
        joinRoom,
        leaveRoom,
        closeRoom,
        sendMessage,
        joinByCode,
    };
}

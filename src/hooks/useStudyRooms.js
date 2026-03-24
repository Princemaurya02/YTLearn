/**
 * useStudyRooms — Real-time Study Rooms via server API
 *
 * Rooms are persisted on the Express server (in-memory).
 * Polling every 3 seconds keeps all clients in sync across
 * different devices and browsers — fixing the cross-device join bug.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const BASE_URL  = import.meta.env.VITE_API_URL || '';
const ROOMS_API = `${BASE_URL}/api/rooms`;
const POLL_MS   = 3000;

// ── Stable per-browser user ID ────────────────────────────────────────────────
let _myId = sessionStorage.getItem('ytlearn_uid');
if (!_myId) {
    _myId = 'u_' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('ytlearn_uid', _myId);
}
export const MY_ID = _myId;

// ── Helper: POST wrapper ──────────────────────────────────────────────────────
async function post(path, body) {
    const res  = await fetch(`${ROOMS_API}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ success: false }));
    return data;
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useStudyRooms(userName = 'You') {
    const [rooms,    setRooms]    = useState([]);
    const [joinedId, setJoinedId] = useState(null);
    const [loading,  setLoading]  = useState(true);
    const pollRef   = useRef(null);
    const mountedRef = useRef(true);

    // ── Poll server for current room list ────────────────────────────────────
    const fetchRooms = useCallback(async () => {
        try {
            const res  = await fetch(ROOMS_API);
            const data = await res.json();
            if (data.success && mountedRef.current) {
                setRooms(data.rooms || []);
                setLoading(false);
            }
        } catch { /* silently ignore network blips */ }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        fetchRooms();
        pollRef.current = setInterval(fetchRooms, POLL_MS);
        return () => {
            mountedRef.current = false;
            clearInterval(pollRef.current);
        };
    }, [fetchRooms]);

    // ── Refresh and return single room ───────────────────────────────────────
    const refreshRoom = useCallback(async (roomId) => {
        try {
            const res  = await fetch(`${ROOMS_API}/${roomId}`);
            const data = await res.json();
            if (data.success && mountedRef.current) {
                setRooms(prev => prev.map(r => r.id === roomId ? data.room : r));
                return data.room;
            }
        } catch {}
        return null;
    }, []);

    // ── Create room ──────────────────────────────────────────────────────────
    const createRoom = useCallback(async ({ name, subject, maxMembers = 8 }) => {
        const data = await post('/create', { name, subject, maxMembers, userId: MY_ID, userName });
        if (!data.success) { alert(data.message || 'Failed to create room.'); return null; }
        await fetchRooms();
        setJoinedId(data.room.id);
        return data.room.id;
    }, [userName, fetchRooms]);

    // ── Join room ────────────────────────────────────────────────────────────
    const joinRoom = useCallback(async (roomId) => {
        const data = await post('/join', { roomId, userId: MY_ID, userName });
        if (!data.success) { alert(data.message || 'Could not join room.'); return false; }
        await fetchRooms();
        setJoinedId(data.room.id);
        return true;
    }, [userName, fetchRooms]);

    // ── Join by invite code ──────────────────────────────────────────────────
    const joinByCode = useCallback(async (code) => {
        const data = await post('/join-code', { code, userId: MY_ID, userName });
        if (!data.success) return null;
        await fetchRooms();
        setJoinedId(data.room.id);
        return data.room.id;
    }, [userName, fetchRooms]);

    // ── Leave room ───────────────────────────────────────────────────────────
    const leaveRoom = useCallback(async (roomId) => {
        await post('/leave', { roomId, userId: MY_ID, userName });
        setJoinedId(null);
        await fetchRooms();
    }, [userName, fetchRooms]);

    // ── Close room (host only) ───────────────────────────────────────────────
    const closeRoom = useCallback(async (roomId) => {
        await post('/close', { roomId, userId: MY_ID });
        setJoinedId(null);
        await fetchRooms();
    }, [fetchRooms]);

    // ── Send message ─────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (roomId, text) => {
        if (!text.trim()) return;
        await post('/message', { roomId, userId: MY_ID, userName, text });
        await refreshRoom(roomId);
    }, [userName, refreshRoom]);

    // Derive current active room (always from freshest rooms array)
    const activeRoom = joinedId ? rooms.find(r => r.id === joinedId) ?? null : null;
    const amHost     = activeRoom?.hostId === MY_ID;

    return {
        rooms,
        activeRoom,
        joinedId,
        amHost,
        loading,
        MY_ID,
        createRoom,
        joinRoom,
        leaveRoom,
        closeRoom,
        sendMessage,
        joinByCode,
    };
}

/**
 * /api/rooms — Server-side Study Room state (in-memory, fast)
 *
 * Endpoints
 *   GET  /api/rooms           → list all active rooms
 *   POST /api/rooms/create    → create a new room
 *   POST /api/rooms/join      → join by roomId
 *   POST /api/rooms/join-code → join by invite code
 *   POST /api/rooms/leave     → leave a room
 *   POST /api/rooms/close     → host closes the room
 *   POST /api/rooms/message   → send a chat message
 *   GET  /api/rooms/:id       → get a single room
 */

import express from 'express';

const router = express.Router();

// ── In-memory store ─────────────────────────────────────────────────────────
// Rooms survive for as long as the server process is alive.
// If you need persistence, migrate this to MongoDB.
const rooms = new Map();   // roomId → Room

function makeCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function sanitise(room) {
    // Never expose internal host socket IDs etc.
    return {
        id:          room.id,
        name:        room.name,
        subject:     room.subject,
        maxMembers:  room.maxMembers,
        members:     room.members,
        status:      room.status,
        host:        room.host,
        hostId:      room.hostId,
        createdAt:   room.createdAt,
        inviteCode:  room.inviteCode,
        messages:    room.messages.slice(-80), // send last 80 messages
    };
}

// ── GET /api/rooms ──────────────────────────────────────────────────────────
router.get('/', (_req, res) => {
    const list = [...rooms.values()].map(sanitise);
    res.json({ success: true, rooms: list });
});

// ── GET /api/rooms/:id ──────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
    const room = rooms.get(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, room: sanitise(room) });
});

// ── POST /api/rooms/create ──────────────────────────────────────────────────
router.post('/create', (req, res) => {
    const { name, subject, maxMembers = 8, userId, userName } = req.body;
    if (!name?.trim() || !userId || !userName)
        return res.status(400).json({ success: false, message: 'name, userId, userName required.' });

    const roomId     = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const inviteCode = makeCode();
    const hostMember = { id: userId, name: userName.trim(), isHost: true, joinedAt: Date.now() };

    const room = {
        id:         roomId,
        name:       name.trim(),
        subject:    subject || 'General',
        maxMembers: Math.max(2, Math.min(20, Number(maxMembers))),
        members:    [hostMember],
        status:     'waiting',
        host:       userName.trim(),
        hostId:     userId,
        createdAt:  Date.now(),
        inviteCode,
        messages:   [
            { id: 'm0', author: 'System', text: `Room "${name}" created — share the invite code to invite friends!`, ts: Date.now() },
        ],
    };

    rooms.set(roomId, room);

    // Auto-cleanup after 4 hours of inactivity
    room._cleanup = setTimeout(() => rooms.delete(roomId), 4 * 60 * 60 * 1000);

    return res.status(201).json({ success: true, room: sanitise(room) });
});

// ── POST /api/rooms/join ────────────────────────────────────────────────────
router.post('/join', (req, res) => {
    const { roomId, userId, userName } = req.body;
    if (!roomId || !userId || !userName)
        return res.status(400).json({ success: false, message: 'roomId, userId, userName required.' });

    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    if (room.members.length >= room.maxMembers && !room.members.some(m => m.id === userId))
        return res.status(409).json({ success: false, message: 'Room is full.' });

    // Already in room — idempotent
    if (room.members.some(m => m.id === userId)) {
        room.status = room.members.length >= 2 ? 'live' : 'waiting';
        return res.json({ success: true, room: sanitise(room) });
    }

    room.members.push({ id: userId, name: userName.trim(), isHost: false, joinedAt: Date.now() });
    room.status = room.members.length >= 2 ? 'live' : 'waiting';
    room.messages.push({ id: 'm_' + Date.now(), author: 'System', text: `${userName} joined the room.`, ts: Date.now() });

    // Reset auto-cleanup timer
    clearTimeout(room._cleanup);
    room._cleanup = setTimeout(() => rooms.delete(roomId), 4 * 60 * 60 * 1000);

    return res.json({ success: true, room: sanitise(room) });
});

// ── POST /api/rooms/join-code ───────────────────────────────────────────────
router.post('/join-code', (req, res) => {
    const { code, userId, userName } = req.body;
    if (!code || !userId || !userName)
        return res.status(400).json({ success: false, message: 'code, userId, userName required.' });

    const room = [...rooms.values()].find(r => r.inviteCode === code.toUpperCase().trim());
    if (!room) return res.status(404).json({ success: false, message: 'No room found with that code.' });

    // Delegate to join logic
    if (room.members.length >= room.maxMembers && !room.members.some(m => m.id === userId))
        return res.status(409).json({ success: false, message: 'Room is full.' });

    if (!room.members.some(m => m.id === userId)) {
        room.members.push({ id: userId, name: userName.trim(), isHost: false, joinedAt: Date.now() });
        room.status = room.members.length >= 2 ? 'live' : 'waiting';
        room.messages.push({ id: 'm_' + Date.now(), author: 'System', text: `${userName} joined the room.`, ts: Date.now() });
    }

    return res.json({ success: true, room: sanitise(room) });
});

// ── POST /api/rooms/leave ───────────────────────────────────────────────────
router.post('/leave', (req, res) => {
    const { roomId, userId, userName } = req.body;
    if (!roomId || !userId) return res.status(400).json({ success: false });

    const room = rooms.get(roomId);
    if (!room) return res.json({ success: true }); // already gone

    if (room.hostId === userId) {
        // Host left → close room
        clearTimeout(room._cleanup);
        rooms.delete(roomId);
        return res.json({ success: true, closed: true });
    }

    room.members = room.members.filter(m => m.id !== userId);
    room.status  = room.members.length >= 2 ? 'live' : 'waiting';
    if (userName) room.messages.push({ id: 'm_' + Date.now(), author: 'System', text: `${userName} left the room.`, ts: Date.now() });

    return res.json({ success: true, room: sanitise(room) });
});

// ── POST /api/rooms/close ───────────────────────────────────────────────────
router.post('/close', (req, res) => {
    const { roomId, userId } = req.body;
    if (!roomId || !userId) return res.status(400).json({ success: false });

    const room = rooms.get(roomId);
    if (!room) return res.json({ success: true });
    if (room.hostId !== userId) return res.status(403).json({ success: false, message: 'Only host can close the room.' });

    clearTimeout(room._cleanup);
    rooms.delete(roomId);
    return res.json({ success: true, closed: true });
});

// ── POST /api/rooms/message ─────────────────────────────────────────────────
router.post('/message', (req, res) => {
    const { roomId, userId, userName, text } = req.body;
    if (!roomId || !userId || !text?.trim()) return res.status(400).json({ success: false });

    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    if (!room.members.some(m => m.id === userId)) return res.status(403).json({ success: false, message: 'Not a member.' });

    const msg = { id: 'm_' + Date.now(), author: userName || 'User', text: text.trim(), ts: Date.now() };
    room.messages.push(msg);
    if (room.messages.length > 200) room.messages = room.messages.slice(-200);

    return res.json({ success: true, message: msg });
});

export default router;

/**
 * useNotifications — localStorage-backed real-time-simulated notification system.
 * Dispatches a custom DOM event ('ytlearn:notif') so any mounted component
 * that calls this hook receives updates without a page refresh.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const KEY        = 'ytlearn_social_notifs';
const SEEDED_KEY = 'ytlearn_notifs_seeded';
const EVENT_NAME = 'ytlearn:notif';
const MAX        = 50;

// ─── Type → emoji map ─────────────────────────────────────────────────────────
const TYPE_ICON = { follow: '👤', like: '❤️', comment: '💬', post: '📢', default: '🔔' };

// ─── Seeded demo notifications (shown on first load) ──────────────────────────
const SEED = [
    { id: 'sn1', type: 'follow',  from: 'Rahul Sharma',  fromColor: '#7c6eff', message: 'Rahul started following you.', read: false, createdAt: new Date(Date.now() - 5  * 60_000).toISOString() },
    { id: 'sn2', type: 'like',    from: 'Priya Verma',   fromColor: '#00d4ff', message: 'Priya liked your post.',         read: false, createdAt: new Date(Date.now() - 18 * 60_000).toISOString() },
    { id: 'sn3', type: 'comment', from: 'Arjun Singh',   fromColor: '#00ff88', message: 'Arjun commented: "Great work!"', read: false, createdAt: new Date(Date.now() - 35 * 60_000).toISOString() },
    { id: 'sn4', type: 'post',    from: 'Ananya Patel',  fromColor: '#ff6b9d', message: 'Ananya shared a new learning update.', read: true,  createdAt: new Date(Date.now() - 2  * 3600_000).toISOString() },
    { id: 'sn5', type: 'like',    from: 'Rahul Sharma',  fromColor: '#7c6eff', message: 'Rahul liked your post.',         read: true,  createdAt: new Date(Date.now() - 5  * 3600_000).toISOString() },
];

// ─── Delayed "live" notifications (simulate real-time) ────────────────────────
const LIVE_QUEUE = [
    { delay: 45_000,  type: 'like',    from: 'Priya Verma',   fromColor: '#00d4ff', message: 'Priya liked your recent post.' },
    { delay: 120_000, type: 'comment', from: 'Arjun Singh',   fromColor: '#00ff88', message: 'Arjun commented: "Keep it up! 🔥"' },
    { delay: 200_000, type: 'follow',  from: 'Ananya Patel',  fromColor: '#ff6b9d', message: 'Ananya started following you.' },
    { delay: 300_000, type: 'post',    from: 'Rahul Sharma',  fromColor: '#7c6eff', message: 'Rahul shared a new DSA update.' },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
function readNotifs() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') ?? []; }
    catch { return []; }
}

function writeNotifs(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); }
    catch {}
}

function dispatch() {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

// ─── Public API (can be called outside the hook) ──────────────────────────────
export function pushNotification({ type = 'default', from = '', fromColor = '#7c6eff', message }) {
    const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type, from, fromColor, message,
        read: false,
        createdAt: new Date().toISOString(),
    };
    const next = [notif, ...readNotifs()].slice(0, MAX);
    writeNotifs(next);
    dispatch();
    return notif;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNotifications() {
    const [notifs, setNotifs] = useState(readNotifs);
    const timerRefs = useRef([]);

    // Seed on first ever load
    useEffect(() => {
        if (!localStorage.getItem(SEEDED_KEY)) {
            writeNotifs(SEED);
            localStorage.setItem(SEEDED_KEY, '1');
            setNotifs(SEED);
        }
    }, []);

    // Listen for cross-component updates
    useEffect(() => {
        const handler = () => setNotifs(readNotifs());
        window.addEventListener(EVENT_NAME, handler);
        return () => window.removeEventListener(EVENT_NAME, handler);
    }, []);

    // Schedule "live" queued notifications (once per session)
    useEffect(() => {
        if (sessionStorage.getItem('ytlearn_live_notifs_started')) return;
        sessionStorage.setItem('ytlearn_live_notifs_started', '1');
        LIVE_QUEUE.forEach(({ delay, ...data }) => {
            const t = setTimeout(() => {
                pushNotification(data);
            }, delay);
            timerRefs.current.push(t);
        });
        return () => timerRefs.current.forEach(clearTimeout);
    }, []);

    const markRead = useCallback((id) => {
        const next = readNotifs().map(n => n.id === id ? { ...n, read: true } : n);
        writeNotifs(next);
        setNotifs(next);
    }, []);

    const markAllRead = useCallback(() => {
        const next = readNotifs().map(n => ({ ...n, read: true }));
        writeNotifs(next);
        setNotifs(next);
    }, []);

    const clearAll = useCallback(() => {
        writeNotifs([]);
        setNotifs([]);
    }, []);

    const unreadCount = notifs.filter(n => !n.read).length;

    return { notifs, unreadCount, markRead, markAllRead, clearAll, TYPE_ICON };
}

export { TYPE_ICON };

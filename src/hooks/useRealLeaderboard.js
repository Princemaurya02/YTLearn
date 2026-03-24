/**
 * useRealLeaderboard — fetches real users from MongoDB API,
 * ranked by XP.  Syncs the current user's XP/hours to the
 * server every time it changes.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const BASE_URL  = import.meta.env.VITE_API_URL || '';
const LB_API    = `${BASE_URL}/api/leaderboard`;
const SYNC_API  = `${BASE_URL}/api/leaderboard/sync`;

const BADGES = ['👑', '🥈', '🥉', '⭐', '🎖️', '🎗️'];

/** Push current user stats to MongoDB */
export async function syncUserToLeaderboard({ email, name, xp, totalHours, avatarColor, currentStreak }) {
    if (!email) return;
    try {
        await fetch(SYNC_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, name, xp, totalHours, avatarColor, currentStreak }),
        });
    } catch { /* silently fail — leaderboard sync is non-critical */ }
}

/**
 * useRealLeaderboard(currentUser)
 *
 * currentUser: { email, name, xp, totalHours, avatarColor }
 *
 * Returns { entries, loading, myRank }
 *   entries: [ { id, name, xp, level, levelName, totalHours, rank, badge, isMe } ]
 */
export function useRealLeaderboard(currentUser) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const syncedRef = useRef(false);

    /** Fetch fresh leaderboard from server */
    const fetchLB = useCallback(async () => {
        try {
            const res  = await fetch(LB_API);
            const data = await res.json();
            if (!data.success) return;

            // Mark the current user's entry with isMe = true
            const marked = data.entries.map((e, i) => ({
                ...e,
                badge: BADGES[i] || '',
                rank:  i + 1,
                isMe:  currentUser?.email
                    ? e.email === currentUser.email
                    : false,
            }));

            setEntries(marked);
        } catch { /* ignore network errors */ } finally {
            setLoading(false);
        }
    }, [currentUser?.email]);

    /** Sync user stats to DB whenever XP or hours change */
    useEffect(() => {
        if (!currentUser?.email) return;
        const timer = setTimeout(() => {
            syncUserToLeaderboard({
                email:         currentUser.email,
                name:          currentUser.name,
                xp:            currentUser.xp,
                totalHours:    currentUser.totalHours,
                avatarColor:   currentUser.avatarColor,
                currentStreak: currentUser.streak,
            }).then(() => fetchLB());
        }, 800); // debounce 800ms
        return () => clearTimeout(timer);
    }, [currentUser?.email, currentUser?.xp, currentUser?.totalHours, currentUser?.name, fetchLB]);

    /** Poll every 30 seconds for updates from other users */
    useEffect(() => {
        fetchLB();
        const t = setInterval(fetchLB, 30_000);
        return () => clearInterval(t);
    }, [fetchLB]);

    const myRank = entries.find(e => e.isMe)?.rank ?? null;

    return { entries, loading, myRank };
}
